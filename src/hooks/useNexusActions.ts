import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ref, push } from 'firebase/database';
import { db } from '../firebase';
import { createNexusReserve } from '../services/goalService';
import type { NexusInsightAction } from '../services/nexusInsightEngine';
import { NotificationService } from '../services/NotificationService';
import { queryKeys } from '../core/query/queryKeys';

export const useNexusActions = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const queryClient = useQueryClient();

  const executeAction = async (userId: string, insightId: string, action: NexusInsightAction) => {
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
        return { success: true, amount: action.payload.value };
      }

      if (action.type === 'pay_invoice' && action.payload) {
        const transactionsRef = ref(db, `transactions/${userId}`);
        const today = new Date().toISOString().split('T')[0];
        
        await push(transactionsRef, {
          userId,
          type: 'expense',
          category: 'Pagamento de Fatura',
          amount: action.payload.amount || 0,
          description: `Fatura ${action.payload.cardName || 'Cartão'}`,
          date: today,
          paymentMethod: 'money' // Sai do saldo disponível
        });

        // Invalida cache para o Dashboard atualizar
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.byUser(userId) });

        setIsExecuting(false);
        return { success: true };
      }

      // Simula latência para outros tipos de ação placeholders
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setIsExecuting(false);
      return { success: true };
    } catch (error) {
      console.error('[NexusAction] Erro ao executar ação:', error);
      setIsExecuting(false);
      return { success: false, error };
    }
  };

  return { executeAction, isExecuting };
};
