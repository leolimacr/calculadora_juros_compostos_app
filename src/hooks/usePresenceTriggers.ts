import { useEffect, useRef } from 'react';
import { DebtItem } from './useDebts';
import { PresenceEventService } from '../services/PresenceEventService';

const DAYS_MS = 24 * 60 * 60 * 1000;

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / DAYS_MS);
}

interface UsePresenceTriggersParams {
  userId: string | undefined;
  debts: DebtItem[];
  debtsLoading: boolean;
}

export const usePresenceTriggers = ({
  userId,
  debts,
  debtsLoading,
}: UsePresenceTriggersParams) => {
  // Ref para evitar re-disparos no mesmo ciclo de vida
  const evaluatedRef = useRef(false);

  useEffect(() => {
    if (!userId || debtsLoading || evaluatedRef.current) return;
    evaluatedRef.current = true;

    const evaluate = async () => {
      for (const debt of debts) {
        const debtId = debt.id;
        if (!debtId) continue;

        // --- debt.due_soon_3d e debt.due_soon_7d ---
        const dateStr = debt.dataProximoPagamento ?? debt.dataVencimento;
        if (dateStr) {
          const days = daysUntil(dateStr);

          if (days >= 0 && days <= 3) {
            await PresenceEventService.create({
              uid: userId,
              eventType: 'debt.due_soon_3d',
              persona: 'debts',
              urgency: 'high',
              message: {
                title: `Vencimento em ${days === 0 ? 'hoje' : `${days} dia${days > 1 ? 's' : ''}`}`,
                body: `${debt.nome} vence ${days === 0 ? 'hoje' : `em ${days} dia${days > 1 ? 's' : ''}`}. Vale revisar a prioridade de pagamento.`,
                ctaLabel: 'Revisar dívidas',
              },
              deepLink: `minhas-dividas`,
              cooldownHours: 24,
              expiresInHours: days <= 0 ? 24 : days * 24,
              resourceId: debtId,
              payload: { debtName: debt.nome, dueDate: dateStr, amount: debt.valorParcela },
            });
          } else if (days > 3 && days <= 7) {
            await PresenceEventService.create({
              uid: userId,
              eventType: 'debt.due_soon_7d',
              persona: 'debts',
              urgency: 'medium',
              message: {
                title: 'Vencimento em breve',
                body: `${debt.nome} vence em ${days} dias.`,
                ctaLabel: 'Ver dívidas próximas',
              },
              deepLink: 'minhas-dividas',
              cooldownHours: 72,
              expiresInHours: days * 24,
              resourceId: debtId,
              payload: { debtName: debt.nome, dueDate: dateStr },
            });
          }
        }

        // debt.missing_data é disparado pelo DebtManager no momento do save — não repetir aqui
      }

      // --- debt.inactive_7d (sem dívidas carregadas ou lista vazia após onboarding) ---
      if (debts.length === 0) {
        await PresenceEventService.create({
          uid: userId,
          eventType: 'debt.inactive_7d',
          persona: 'debts',
          urgency: 'low',
          message: {
            title: 'Tudo bem com o plano?',
            body: 'Você ainda não tem dívidas cadastradas. Cadastre para acompanhar com mais contexto.',
            ctaLabel: 'Cadastrar dívidas',
          },
          deepLink: 'minhas-dividas',
          cooldownHours: 168,
          expiresInHours: 14 * 24,
        });
      }
    };

    evaluate();
  }, [userId, debts, debtsLoading]);
};