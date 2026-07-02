import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createNexusReserve } from '../services/goalService';
import { payInvoice } from '../services/payInvoiceService';
import { convertToDebt } from '../services/rotativoService';
import type { NexusInsightAction } from '../services/nexusInsightEngine';
import { NotificationService } from '../services/NotificationService';
import { trackActionCompleted, trackActionFailed } from '../services/nexusAnalyticsService';

export const useNexusActions = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const queryClient = useQueryClient();

  const executeAction = async (userId: string, insightId: string, action: NexusInsightAction, priority?: string) => {
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    setIsExecuting(true);
    try {
      console.log(`[NexusAction] Intenção registrada: ${action.type} para o insight ${insightId}`);
      
      if (action.type === 'reserve' && action.payload) {
        await createNexusReserve(
          userId,
          action.payload.title || 'Reserva Nexus',
          action.payload.value || 0,
          action.payload.targetDate || new Date().toISOString().split('T')[0]
        );

        // Feedback de notificação contextual
        try {
          await NotificationService.dispatch({
            category: 'wealth_goal',
            title: 'Reserva Confirmada',
            body: `Guardamos a intenção de R$ ${(action.payload.value || 0).toFixed(2).replace('.', ',')} para sua fatura.`,
          });
        } catch (e) {
          console.warn('[NexusAction] Falha ao despachar notificação (ambiente web?):', e);
        }

        setIsExecuting(false);
        trackActionCompleted(insightId, priority || 'media', action.type);
        return { success: true, amount: action.payload.value };
      }

      if (action.type === 'convert_rotativo' && action.payload?.cardId) {
        const result = await convertToDebt(userId, action.payload);

        setIsExecuting(false);
        if (result.success) {
          await queryClient.invalidateQueries({ queryKey: ['debts', userId] });
          await queryClient.invalidateQueries({ queryKey: ['invoices', userId] });
          trackActionCompleted(insightId, priority || 'alta', action.type);
          return { success: true, debtId: result.debtId };
        }
        throw new Error(result.error);
      }

      if (action.type === 'pay_invoice' && action.payload?.cardId) {
        const result = await payInvoice({
          userId,
          cardId: action.payload.cardId,
          cardName: action.payload.cardName || 'Cartão',
          amount: action.payload.amount || 0,
          invoiceId: action.payload.invoiceId,
          periodEnd: action.payload.periodEnd,
          queryClient,
        });

        setIsExecuting(false);
        if (result.success) {
          trackActionCompleted(insightId, priority || 'media', action.type);
          return { success: true };
        }
        throw new Error(result.error);
      }

      if (action.type === 'attack_debt') {
        setIsExecuting(false);
        trackActionCompleted(insightId, priority || 'alta', action.type);
        return { success: true, debtId: action.payload?.debtId };
      }

      // Simula latência para outros tipos de ação placeholders
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setIsExecuting(false);
      trackActionCompleted(insightId, priority || 'media', action.type);
      return { success: true };
    } catch (error) {
      console.error('[NexusAction] Erro ao executar ação:', error);
      setIsExecuting(false);
      const errMsg = error instanceof Error ? error.message : String(error);
      trackActionFailed(insightId, priority || 'media', action.type, errMsg);
      return { success: false, error };
    }
  };

  return { executeAction, isExecuting };
};
