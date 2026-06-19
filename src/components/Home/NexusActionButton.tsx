import React, { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import type { NexusInsight } from '../../services/nexusInsightEngine';
import { useNexusActions } from '../../hooks/useNexusActions';
import PaywallModal from '../PaywallModal';

interface NexusActionButtonProps {
  insight: NexusInsight;
  userId: string;
  userPlan: 'free' | 'pro' | 'premium';
  onActionExecuted?: () => void;
  onNavigate?: (route: string) => void;
}

const NexusActionButton: React.FC<NexusActionButtonProps> = ({
  insight,
  userId,
  userPlan,
  onActionExecuted,
  onNavigate,
}) => {
  const { action } = insight;
  const { executeAction, isExecuting } = useNexusActions();
  const [showPaywall, setShowPaywall] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [reservedAmount, setReservedAmount] = useState<number | null>(null);

  if (!action) return null;

  const handleAction = async () => {
    // Verificação de plano
    if (action.requiresPlan) {
      const planHierarchy = { free: 0, pro: 1, premium: 2 };
      if (planHierarchy[userPlan] < planHierarchy[action.requiresPlan]) {
        setShowPaywall(true);
        return;
      }
    }

    // Se for tipo adjust e houver onNavigate, navega direto
    if (action.type === 'adjust' && onNavigate && insight.deepLink) {
      onNavigate(insight.deepLink);
      return;
    }

    const result = await executeAction(userId, insight.id, action);
    if (result.success) {
      setIsSuccess(true);
      if (result.amount) {
        setReservedAmount(result.amount);
      }
      onActionExecuted?.();
      // Reseta o estado de sucesso após 4 segundos (mais tempo para ler a msg longa)
      setTimeout(() => {
        setIsSuccess(false);
        setReservedAmount(null);
      }, 4000);
    }
  };

  const successMessage = reservedAmount 
    ? `Reserva criada! R$ ${reservedAmount.toFixed(2).replace('.', ',')} guardados.`
    : 'Intenção registrada';

  return (
    <>
      <button
        onClick={handleAction}
        disabled={isExecuting || isSuccess}
        className={`mt-3 w-full sm:w-auto px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm ${
          isSuccess
            ? 'bg-emerald-500 text-white'
            : 'bg-sky-600 hover:bg-sky-700 text-white active:scale-95'
        } disabled:opacity-80`}
      >
        {isExecuting ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isSuccess ? (
          <Check size={14} />
        ) : null}
        {isSuccess ? successMessage : action.label}
      </button>

      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature={`Nexus Action: ${action.label}`}
      />
    </>
  );
};

export default NexusActionButton;
