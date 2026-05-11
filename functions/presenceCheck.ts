import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import {
  sendWeeklySummary,
  sendInactivityAlert,
  sendMonthlyClose,
  sendDebtDueAlert,
  sendGoalAportAlert,
} from './mailService';

const URGENCY_SCORE: Record<string, number> = { high: 3, medium: 2, low: 1 };

// ─── Helpers de cooldown e deduplicação ───────────────────────────

async function cooldownOk(
  db: ReturnType<typeof getFirestore>,
  uid: string,
  eventType: string,
  resourceId: string | null,
  cooldownHours: number,
  nowMs: number
): Promise<boolean> {
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const histRef = db.collection('users').doc(uid).collection('notificationHistory');
  const q = resourceId
    ? histRef.where('eventType', '==', eventType).where('resourceId', '==', resourceId).orderBy('sentAt', 'desc').limit(1)
    : histRef.where('eventType', '==', eventType).orderBy('sentAt', 'desc').limit(1);
  const snap = await q.get();
  if (snap.empty) return true;
  const lastSent = snap.docs[0].data().sentAt?.toMillis?.() ?? 0;
  return nowMs - lastSent >= cooldownMs;
}

async function pendingExists(
  db: ReturnType<typeof getFirestore>,
  uid: string,
  eventType: string,
  resourceId: string | null
): Promise<boolean> {
  let q = db.collection('users').doc(uid).collection('presenceEvents')
    .where('eventType', '==', eventType)
    .where('status', '==', 'pending') as FirebaseFirestore.Query;
  if (resourceId) q = q.where('resourceId', '==', resourceId);
  const snap = await q.limit(1).get();
  return !snap.empty;
}

async function createEvent(
  db: ReturnType<typeof getFirestore>,
  uid: string,
  nowMs: number,
  params: {
    eventType: string;
    persona: 'debts' | 'wealth' | 'cashflow';
    urgency: 'high' | 'medium' | 'low';
    message: { title: string; body: string; ctaLabel: string };
    deepLink: string;
    channel: 'push' | 'in_app' | 'email';
    cooldownHours: number;
    expiresInHours: number;
    resourceId?: string;
    payload?: Record<string, unknown>;
  }
): Promise<void> {
  const { eventType, persona, urgency, message, deepLink, channel,
          cooldownHours, expiresInHours, resourceId, payload } = params;
  const resourceIdResolved = resourceId ?? null;

  if (await pendingExists(db, uid, eventType, resourceIdResolved)) return;
  if (!(await cooldownOk(db, uid, eventType, resourceIdResolved, cooldownHours, nowMs))) return;

  const expiresAt = new Date(nowMs + expiresInHours * 60 * 60 * 1000);
  const batch = db.batch();

  const eventRef = db.collection('users').doc(uid).collection('presenceEvents').doc();
  batch.set(eventRef, {
    eventType, persona, urgency,
    urgencyScore: URGENCY_SCORE[urgency],
    status: 'pending', channel, message, deepLink,
    payload: payload ?? {}, resourceId: resourceIdResolved,
    createdAt: new Date(), expiresAt, seenAt: null, actionedAt: null,
  });

  const histRef = db.collection('users').doc(uid).collection('notificationHistory').doc();
  batch.set(histRef, {
    eventType, channel, sentAt: new Date(),
    resourceId: resourceIdResolved, opened: false, actioned: false,
  });

  await batch.commit();
}

// ─── Processamento por usuário ─────────────────────────────────────

async function processUserPresence(
  db: ReturnType<typeof getFirestore>,
  uid: string,
  nowMs: number
): Promise<void> {
  const now = new Date(nowMs);
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.data() ?? {};
  const userEmail: string | null = userData.email ?? null;
  const userName: string = (userData.displayName ?? userData.nickname ?? 'você').split(' ')[0];

  // ── G1: Vencimento de dívidas (3d e 7d) ────────────────────────
  const dividasSnap = await db.collection('users').doc(uid).collection('dividas').get();

  if (!dividasSnap.empty) {
    for (const debtDoc of dividasSnap.docs) {
      const debt = debtDoc.data();
      const debtId = debtDoc.id;
      if (!debt.dataVencimento) continue;

      const vencimento = new Date(debt.dataVencimento);
      const diffDays = Math.ceil((vencimento.getTime() - nowMs) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) continue;

      if (diffDays <= 3) {
        await createEvent(db, uid, nowMs, {
          eventType: 'debt.due_soon_3d',
          persona: 'debts',
          urgency: 'high',
          message: {
            title: `Vencimento em ${diffDays} dia${diffDays > 1 ? 's' : ''}`,
            body: `${debt.nome} vence em ${vencimento.toLocaleDateString('pt-BR')}. Vale revisar a prioridade de pagamento.`,
            ctaLabel: 'Revisar dívidas',
          },
          deepLink: `/minhas-dividas?highlight=${debtId}`,
          channel: 'push',
          cooldownHours: 24,
          expiresInHours: 72,
          resourceId: debtId,
          payload: { debtId, debtName: debt.nome, dueDate: debt.dataVencimento, amount: debt.valorParcela ?? debt.saldoDevedor },
        });

        if (userEmail) {
          await sendDebtDueAlert({
            to: userEmail, name: userName,
            debtName: debt.nome,
            dueDate: vencimento.toLocaleDateString('pt-BR'),
            amount: debt.valorParcela ?? debt.saldoDevedor ?? 0,
            diffDays,
          });
        }
      } else if (diffDays <= 7) {
        await createEvent(db, uid, nowMs, {
          eventType: 'debt.due_soon_7d',
          persona: 'debts',
          urgency: 'medium',
          message: {
            title: 'Vencimento na próxima semana',
            body: `${debt.nome} vence em ${diffDays} dias. Verifique se o pagamento está garantido.`,
            ctaLabel: 'Ver dívidas próximas',
          },
          deepLink: '/minhas-dividas',
          channel: 'in_app',
          cooldownHours: 72,
          expiresInHours: 168,
          resourceId: debtId,
          payload: { debtId, debtName: debt.nome, dueDate: debt.dataVencimento },
        });
      }
    }
  }

  // ── H2: Inatividade 3 dias ──────────────────────────────────────
  const stateSnap = await db.collection('users').doc(uid).collection('presenceState').doc('current').get();

  if (stateSnap.exists) {
    const state = stateSnap.data()!;
    const lastActiveMs: number = state.lastActiveAt?.toMillis?.() ?? 0;
    const daysSinceActive = (nowMs - lastActiveMs) / (1000 * 60 * 60 * 24);

    if (daysSinceActive >= 3 && daysSinceActive < 7) {
      await createEvent(db, uid, nowMs, {
        eventType: 'user.inactive_3d',
        persona: 'cashflow',
        urgency: 'low',
        message: {
          title: 'Seus dados podem estar desatualizados',
          body: `Faz ${Math.floor(daysSinceActive)} dias sem registros. Uma atualização rápida mantém seu acompanhamento preciso.`,
          ctaLabel: 'Registrar agora',
        },
        deepLink: '/manager',
        channel: 'push',
        cooldownHours: 72,
        expiresInHours: 168,
        payload: { daysSinceActive: Math.floor(daysSinceActive) },
      });

      if (userEmail) {
        await sendInactivityAlert({ to: userEmail, name: userName, diasSemRegistro: Math.floor(daysSinceActive) });
      }
    }

    // ── D1: Inatividade 7 dias ──────────────────────────────────
    if (daysSinceActive >= 7 && !dividasSnap.empty) {
      await createEvent(db, uid, nowMs, {
        eventType: 'debt.inactive_7d',
        persona: 'debts',
        urgency: 'low',
        message: {
          title: 'Tudo bem com o plano?',
          body: `Faz ${Math.floor(daysSinceActive)} dias sem revisar suas dívidas. Seu contexto pode ter mudado.`,
          ctaLabel: 'Ver situação atual',
        },
        deepLink: '/minhas-dividas',
        channel: 'push',
        cooldownHours: 168,
        expiresInHours: 336,
        payload: { daysSinceActive: Math.floor(daysSinceActive) },
      });
    }
  }

  // ── F1: Lembrete de aporte de meta (amanhã) ────────────────────
  const metasSnap = await db.collection('users').doc(uid).collection('metas').get();

  if (!metasSnap.empty) {
    for (const metaDoc of metasSnap.docs) {
      const meta = metaDoc.data();
      if (!meta.ativa || !meta.dataInicio) continue;

      const proximoAporte = calcularProximoAporte(meta);
      if (!proximoAporte) continue;

      const diffDays = Math.ceil((proximoAporte.getTime() - nowMs) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        await createEvent(db, uid, nowMs, {
          eventType: 'goal.aport_tomorrow',
          persona: 'wealth',
          urgency: 'medium',
          message: {
            title: 'Lembrete de aporte amanhã',
            body: `Seu aporte na meta "${meta.nome}" está previsto para amanhã: R$ ${meta.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
            ctaLabel: 'Ver metas',
          },
          deepLink: '/metas',
          channel: 'push',
          cooldownHours: 20,
          expiresInHours: 36,
          resourceId: metaDoc.id,
          payload: { metaId: metaDoc.id, metaNome: meta.nome, valor: meta.valor },
        });

        if (userEmail) {
          await sendGoalAportAlert({ to: userEmail, name: userName, goalName: meta.nome, amount: meta.valor ?? 0 });
        }
      }
    }
  }

  // ── E4 + I1: Resumo semanal (toda segunda-feira) ───────────────
  const diaSemana = now.getDay(); // 0=dom, 1=seg
  if (diaSemana === 1 && userEmail) {
    const seteDiasAtras = new Date(nowMs - 7 * 24 * 60 * 60 * 1000);
    const seteDiasAtrasStr = seteDiasAtras.toISOString().slice(0, 10);

    const { getDatabase } = await import('firebase-admin/database');
    const rtdb = getDatabase();
    const txSnap = await rtdb.ref(`transactions/${uid}`).orderByChild('date').startAt(seteDiasAtrasStr).get();

    if (txSnap.exists()) {
      const txs: any[] = [];
      txSnap.forEach(child => { txs.push(child.val()); });

      const receitas = txs.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount ?? 0), 0);
      const despesas = txs.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount ?? 0), 0);

      const byCategory: Record<string, number> = {};
      txs.filter(t => t.type === 'expense').forEach(t => {
        const cat = t.category ?? 'Outros';
        byCategory[cat] = (byCategory[cat] ?? 0) + (t.amount ?? 0);
      });
      const topCategorias = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([nome, valor]) => ({ nome, valor }));

      // Buscar semana anterior para comparação
      const quatorze = new Date(nowMs - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const txSnapAnterior = await rtdb.ref(`transactions/${uid}`).orderByChild('date').startAt(quatorze).endAt(seteDiasAtrasStr).get();
      let despesasAnterior = 0;
      if (txSnapAnterior.exists()) {
        txSnapAnterior.forEach(child => {
          const t = child.val();
          if (t.type === 'expense') despesasAnterior += t.amount ?? 0;
        });
      }

      if (despesas > 0) {
        await sendWeeklySummary({
          to: userEmail, name: userName,
          totalGasto: despesas,
          totalAnterior: despesasAnterior,
          topCategorias,
          saldo: receitas - despesas,
        });
      }
    }
  }

  // ── E5: Fechamento mensal (dia 1 do mês) ───────────────────────
  if (now.getDate() === 1 && userEmail) {
    const mesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const inicioMes = mesAnterior.toISOString().slice(0, 10);
    const fimMes = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
    const nomeMes = mesAnterior.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    const { getDatabase } = await import('firebase-admin/database');
    const rtdb = getDatabase();
    const txSnap = await rtdb.ref(`transactions/${uid}`).orderByChild('date').startAt(inicioMes).endAt(fimMes).get();

    if (txSnap.exists()) {
      const txs: any[] = [];
      txSnap.forEach(child => { txs.push(child.val()); });

      const receitas = txs.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount ?? 0), 0);
      const despesas = txs.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount ?? 0), 0);

      const byCategory: Record<string, number> = {};
      txs.filter(t => t.type === 'expense').forEach(t => {
        const cat = t.category ?? 'Outros';
        byCategory[cat] = (byCategory[cat] ?? 0) + (t.amount ?? 0);
      });
      const maiorCategoria = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

      if (receitas > 0 || despesas > 0) {
        await sendMonthlyClose({
          to: userEmail, name: userName,
          mes: nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1),
          saldo: receitas - despesas,
          totalReceitas: receitas,
          totalDespesas: despesas,
          maiorCategoria,
        });
      }
    }
  }
}

// ─── Helper de próximo aporte ──────────────────────────────────────

function calcularProximoAporte(meta: any): Date | null {
  try {
    const inicio = new Date(meta.dataInicio);
    const hoje = new Date();
    const freq: string = meta.frequencia ?? 'mensal';
    const diasCustom: number = meta.diasPersonalizado ?? 30;

    let candidato = new Date(inicio);
    const diasFreq = freq === 'semanal' ? 7 : freq === 'quinzenal' ? 15 : freq === 'personalizado' ? diasCustom : 30;

    while (candidato <= hoje) {
      candidato = new Date(candidato.getTime() + diasFreq * 24 * 60 * 60 * 1000);
    }
    return candidato;
  } catch {
    return null;
  }
}

// ─── Export da function agendada ──────────────────────────────────

export const dailyPresenceCheck = onSchedule(
  {
    schedule: '0 6 * * *',
    timeZone: 'America/Sao_Paulo',
    timeoutSeconds: 300,
    memory: '256MiB',
  },
  async () => {
    const db = getFirestore();
    const now = new Date();
    const nowMs = now.getTime();

    const usersSnap = await db.collection('users').get();

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      try {
        await processUserPresence(db, uid, nowMs);
      } catch (err: any) {
        logger.error(`[PresenceCheck] Erro no uid=${uid}: ${err.message}`);
      }
    }

    logger.info(`[PresenceCheck] Ciclo concluído para ${usersSnap.size} usuários.`);
  }
);