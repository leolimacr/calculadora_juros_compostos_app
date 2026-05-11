import { firestore } from '../firebase';
import {
  collection, addDoc, doc, getDoc, setDoc, updateDoc,
  query, where, getDocs, Timestamp, increment,
} from 'firebase/firestore';
import { NotificationService, PresenceNotificationPayload } from './NotificationService';

// Mapeamento de urgência para score numérico (usado no orderBy do Firestore)
export const URGENCY_SCORE: Record<'high' | 'medium' | 'low', number> = {
  high: 3,
  medium: 2,
  low: 1,
};

// Mapeamento de categoria para canal principal
const CATEGORY_CHANNEL: Record<string, 'push' | 'in_app' | 'email'> = {
  'debt.due_soon_3d': 'push',
  'debt.due_soon_7d': 'in_app',
  'debt.missing_data': 'in_app',
  'debt.inactive_7d': 'push',
  'debt.context_changed': 'in_app',
  'debt.plan_stale_30d': 'email',
  'wealth.review_overdue_14d': 'in_app',
  'wealth.aport_upcoming': 'push',
  'wealth.goal_near': 'in_app',
  'wealth.liabilities_stale': 'email',
  'nexus.insight_ready': 'push',
  'reengagement.inactive_14d': 'push',
};

export interface CreatePresenceEventParams {
  uid: string;
  eventType: string;
  persona: 'debts' | 'wealth';
  urgency: 'high' | 'medium' | 'low';
  message: { title: string; body: string; ctaLabel: string };
  deepLink: string;
  cooldownHours: number;
  expiresInHours: number;
  resourceId?: string; // ID da dívida, meta ou ativo relacionado
  payload?: Record<string, unknown>;
}

export const PresenceEventService = {
  // Cria um evento de presença respeitando cooldown, frequency cap e preferências do usuário
  async create(params: CreatePresenceEventParams): Promise<boolean> {
    const {
      uid, eventType, persona, urgency, message,
      deepLink, cooldownHours, expiresInHours, resourceId, payload,
    } = params;

    const now = Timestamp.now();
    const cooldownMs = cooldownHours * 60 * 60 * 1000;

    // --- Verificar preferências do usuário ---
    const prefsSnap = await getDoc(doc(firestore, 'users', uid, 'presencePreferences', 'config'));
    const prefs = prefsSnap.exists() ? prefsSnap.data() : null;

    if (prefs) {
      // Intensidade: 'essential' só passa urgência high
      if (prefs.intensity === 'essential' && urgency !== 'high') return false;

      // Tópico desativado
      const topicMap: Record<string, string> = {
        debts: 'debts',
        wealth: 'wealth',
      };
      const topic = topicMap[persona];
      if (topic && prefs.topics?.[topic] === false) return false;

      // Push desativado
      const channel = CATEGORY_CHANNEL[eventType] ?? 'in_app';
      if (channel === 'push' && prefs.pushEnabled === false) return false;

      // Email desativado
      if (channel === 'email' && prefs.emailEnabled === false) return false;
    }

    const stateRef = doc(firestore, 'users', uid, 'presenceState', 'current');
    const stateSnap = await getDoc(stateRef);
    const state = stateSnap.exists() ? stateSnap.data() : {};

    // Verificar frequency cap diário (máx 1 push não urgente por dia)
    const channel = CATEGORY_CHANNEL[eventType] ?? 'in_app';
    if (channel === 'push' && urgency !== 'high') {
      const lastPush = state.lastPushSentAt as Timestamp | undefined;
      const lastPushDate = lastPush ? new Date(lastPush.toMillis()) : null;
      const today = new Date();
      const isNewDay = !lastPushDate ||
        lastPushDate.getDate() !== today.getDate() ||
        lastPushDate.getMonth() !== today.getMonth() ||
        lastPushDate.getFullYear() !== today.getFullYear();
      const pushCountToday = isNewDay ? 0 : (state.pushCountToday ?? 0);
      if (pushCountToday >= 1) return false;
      if (isNewDay) {
        await setDoc(stateRef, { pushCountToday: 0 }, { merge: true });
      }
    }

    // Verificar cooldown por categoria
    const categoryKey = eventType.replace('.', '_');
    const lastCategoryPush = state.lastCategoryPush?.[categoryKey];
    if (lastCategoryPush) {
      const elapsed = now.toMillis() - lastCategoryPush.toMillis();
      if (elapsed < cooldownMs) return false;
    }

    // Verificar se já existe evento pendente do mesmo tipo para o mesmo recurso
    if (resourceId) {
      const existingQ = query(
        collection(firestore, 'users', uid, 'presenceEvents'),
        where('eventType', '==', eventType),
        where('resourceId', '==', resourceId),
        where('status', '==', 'pending'),
      );
      const existingSnap = await getDocs(existingQ);
      if (!existingSnap.empty) return false;
    }

    const expiresAt = Timestamp.fromMillis(now.toMillis() + expiresInHours * 60 * 60 * 1000);

    // Gravar evento
    await addDoc(collection(firestore, 'users', uid, 'presenceEvents'), {
      eventType,
      persona,
      urgency,
      urgencyScore: URGENCY_SCORE[urgency],
      status: 'pending',
      channel,
      message,
      deepLink,
      payload: payload ?? {},
      resourceId: resourceId ?? null,
      createdAt: now,
      expiresAt,
      seenAt: null,
      actionedAt: null,
    });

    // Atualizar presenceState
    const stateUpdate: Record<string, unknown> = {
      [`lastCategoryPush.${categoryKey}`]: now,
    };
    if (channel === 'push') {
      stateUpdate.lastPushSentAt = now;
      stateUpdate.pushCountToday = increment(1);
    }
    await setDoc(stateRef, stateUpdate, { merge: true });

    // Despachar push local se canal for push
    const capacitorAvailable = typeof (window as any).Capacitor !== 'undefined';
    if (channel === 'push' && capacitorAvailable) {
      const notifPayload: PresenceNotificationPayload = {
        category: eventType.replace('.', '_') as never,
        title: message.title,
        body: message.body,
        deepLink,
      };
      await NotificationService.dispatch(notifPayload);
    }

    return true;
  },

  // Marcar evento como visto (chamado pelo HomePresenceFeed ao navegar)
  async markActioned(uid: string, eventId: string): Promise<void> {
    try {
      const ref = doc(firestore, 'users', uid, 'presenceEvents', eventId);
      await updateDoc(ref, { status: 'actioned', actionedAt: Timestamp.now() });
    } catch {
      // Silencioso — não bloqueia navegação
    }
  },
};