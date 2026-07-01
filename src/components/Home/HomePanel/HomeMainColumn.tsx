import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useEntitlement } from '../../../hooks/useEntitlement';
import DailyStatus from '../DailyStatus';
import ActiveReservesCard from '../ActiveReservesCard';
import QuickCategoryShortcuts from '../QuickCategoryShortcuts';
import QuickActionCard from '../QuickActionCard';
import NexusInsightCard from '../NexusInsightCard';
import { PresenceAlertsBanner } from '../PresenceAlertsBanner';
import type { Transaction } from '../../../types';

interface HomeMainColumnProps {
  transactions: Transaction[];
  nexusReserves: any[];
  contextualEvent: any;
  userId: string | null;
  userMeta: any;
  hasPaidAccess: boolean;
  onNavigate: (tool: string) => void;
  onOpenForm: (initialData?: Partial<Transaction>) => void;
  onDismissInsight: (id: string) => void;
}

const HomeMainColumn: React.FC<HomeMainColumnProps> = ({
  transactions,
  nexusReserves,
  contextualEvent,
  userId,
  hasPaidAccess,
  onNavigate,
  onOpenForm,
  onDismissInsight,
}) => {
  const { isPremium } = useEntitlement();

  const handleAdd = () => {
    onOpenForm();
  };

  const handleQuickAdd = (category: string, type: 'income' | 'expense') => {
    onOpenForm({ category, type });
  };

  const handleInsightNavigate = (link: string) => {
    if (link === 'transaction-form') {
      handleAdd();
    } else {
      onNavigate(link);
    }
  };

  return (
    <div className="lg:col-span-8 space-y-8">
      <div className="hidden lg:block">
        <DailyStatus lancamentos={transactions} />
      </div>

      <button
        type="button"
        onClick={() => onNavigate('manager')}
        className="lg:hidden w-full group relative overflow-hidden rounded-[2rem] bg-white border border-slate-200 p-5 text-left transition-all active:scale-[0.98] shadow-sm flex items-center gap-4"
      >
        <div className="shrink-0 relative">
          <img 
            src="/assets/images/brand/icon-512.webp" 
            alt="Controla" 
            className="w-12 h-12 rounded-2xl shadow-lg border border-slate-100"
          />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
             <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-black text-slate-900 tracking-tight leading-none">Controla (Completo)</h3>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1.5">Acessar Dashboard e Histórico</p>
        </div>
        <ChevronRight size={18} className="text-slate-300" />
      </button>

      <ActiveReservesCard goals={nexusReserves} />

      <QuickCategoryShortcuts 
        transactions={transactions}
        onQuickAdd={handleQuickAdd}
      />

      <QuickActionCard onAction={handleAdd} />

      <NexusInsightCard
        event={contextualEvent as any}
        userId={userId || ''}
        userPlan={isPremium ? 'premium' : hasPaidAccess ? 'pro' : 'free'}
        onDismiss={onDismissInsight}
        onNavigate={handleInsightNavigate}
      />

      <PresenceAlertsBanner userId={userId} />
    </div>
  );
};

export default HomeMainColumn;
