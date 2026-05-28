import { useState } from 'react';
import { createNexusReserve } from '../services/goalService';
import { NexusInsightAction } from '../services/nexusInsightEngine';
import { NotificationService } from '../services/NotificationService';

export const useNexusActions = () => {
  const [isExecuting, setIsExecuting] = useState(false);

  const executeAction = async (userId: string, insightId: string, action: NexusInsightAction) => {
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    setIsExecuting(true);
    try {
      console.log(`[NexusAction] Intenção registrada: ${action.type} para o insight ${insightId}`);
      
      if (action.type === 'reserve' && action.payload) {
        await createNexusReserve(
          userId,
          action.payload.title,
          action.payload.value,
          action.payload.targetDate
        );

        // Feedback de notificação contextual
        try {
          await NotificationService.dispatch({
            category: 'wealth_goal',
            title: 'Reserva Confirmada',
            body: `Guardamos a intenção de R$ ${action.payload.value.toFixed(2).replace('.', ',')} para sua fatura.`,
          });
        } catch (e) {
          console.warn('[NexusAction] Falha ao despachar notificação (ambiente web?):', e);
        }

        setIsExecuting(false);
        return { success: true, amount: action.payload.value };
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
