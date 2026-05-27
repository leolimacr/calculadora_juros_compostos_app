import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PresenceAlertsBanner } from './PresenceAlertsBanner';
import { LayoutGrid, ChevronRight, Wallet } from 'lucide-react';
import type { Transaction } from '../../types';
import { useNexusEvents } from '../../hooks/useNexusEvents';
import { getPrioritizedInsight, UserContext } from '../../services/nexusInsightEngine';
import DailyStatus from './DailyStatus';
import RecentTransactions from './RecentTransactions';
import PlanIndicator from './PlanIndicator';
import NexusInsightCard from './NexusInsightCard';
import QuickActionCard from './QuickActionCard';
import QuickCategoryShortcuts from './QuickCategoryShortcuts';

interface LoggedInHomePanelProps {
  transactions: Transaction[];
  isPrivacyMode: boolean;
  onTogglePrivacy: () => void;
  onOpenForm: (initialData?: Partial<Transaction>) => void;
  onNavigate: (tool: string) => void;
  isLimitReached: boolean;
  hasPaidAccess: boolean;
  onShowPaywall: () => void;
  userMeta?: any;
}

const LoggedInHomePanel: React.FC<LoggedInHomePanelProps> = ({
  transactions,
  isPrivacyMode,
  onTogglePrivacy: _onTogglePrivacy,
  onOpenForm,
  onNavigate,
  isLimitReached,
  hasPaidAccess,
  onShowPaywall,
  userMeta,
}) => {
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);
  const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const safeTx = Array.isArray(transactions) ? transactions : [];
  const userId = safeTx.length > 0 ? safeTx[0]?.userId : null;

  const { event: serverEvent, dismiss } = useNexusEvents();

  const contextualEvent = useMemo(() => {
    // 1. Prepara o contexto para o motor de insights
    const todayStr = new Date().toISOString().split('T')[0];
    const txToday = safeTx.filter(t => t.date === todayStr).length;

    // Calcula dias desde o último lançamento
    let daysSince = 0;
    if (safeTx.length > 0) {
      const lastDate = new Date([...safeTx].sort((a, b) => b.date.localeCompare(a.date))[0].date);
      daysSince = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    }

    // Calcula saldo do mês atual
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthTx = safeTx.filter(t => {
      const [y, m] = t.date.split('-').map(Number);
      return y === currentYear && m === currentMonth;
    });
    const balance = monthTx.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);

    const ctx: UserContext = {
      hasFinancialProfile: !!userMeta?.financialProfile,
      hasPaidAccess: hasPaidAccess,
      isPremium: !!userMeta?.isPremium,
      transactionsToday: txToday,
      daysSinceLastTransaction: daysSince,
      launchCount: safeTx.length,
      launchLimit: userMeta?.launchLimit || 30,
      monthBalance: balance,
      hasFirstInvestment: safeTx.some(t => t.category?.toLowerCase().includes('investimento'))
    };

    // 2. Obtém insight priorizado do motor local
    const localInsight = getPrioritizedInsight(ctx);

    // 3. Retorna o insight local ou o evento do servidor como fallback
    return localInsight || serverEvent;
  }, [serverEvent, safeTx, userMeta, hasPaidAccess]);

  const handleAdd = () => {
    if (isLimitReached && !hasPaidAccess) {
      onShowPaywall();
      return;
    }
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
    <div className="max-w-7xl w-full mx-auto px-4 pt-6 pb-28 animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Home</h1>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
          {monthLabel} · Painel de Rotina
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Principal - Esquerda (8 colunas em desktop) */}
        <div className="lg:col-span-8 space-y-6">


          <DailyStatus lancamentos={transactions} />

          <QuickCategoryShortcuts 
            transactions={transactions}
            onQuickAdd={handleQuickAdd}
          />

          <QuickActionCard
            onAction={handleAdd}
            isLimitReached={isLimitReached}
            hasPaidAccess={hasPaidAccess}
          />

          <NexusInsightCard
            event={contextualEvent as any}
            onDismiss={dismiss}
            onNavigate={handleInsightNavigate}
          />

          <PresenceAlertsBanner userId={userId} />
        </div>

        {/* Coluna Lateral - Direita (4 colunas em desktop) */}
        <div className="lg:col-span-4 space-y-6">
          <PlanIndicator
            isPro={!!hasPaidAccess}
            launchCount={safeTx.length}
            launchLimit={userMeta?.launchLimit || 30}
          />

          <RecentTransactions
            transactions={safeTx}
            isPrivacyMode={isPrivacyMode}
            onNavigate={onNavigate}
          />

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate('/app/controla')}
              className="flex items-center justify-between w-full rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-4 text-left hover:bg-emerald-100 transition-all shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-sm shadow-emerald-200 group-hover:scale-110 transition-transform">
                  <Wallet size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-emerald-900">Abrir Controla</span>
                  <span className="text-[10px] text-emerald-700 font-medium uppercase tracking-wide">Território operacional</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-emerald-400 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('central')}
              className="flex items-center justify-between w-full rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-4 text-left hover:bg-sky-100 transition-all shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-sky-500 p-2 rounded-xl text-white shadow-sm shadow-sky-200 group-hover:scale-110 transition-transform">
                  <LayoutGrid size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-sky-900">Acessar Central</span>
                  <span className="text-[10px] text-sky-700 font-medium uppercase tracking-wide">Visão estratégica</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-sky-400 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoggedInHomePanel;
