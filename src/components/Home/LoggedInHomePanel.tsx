import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PresenceAlertsBanner } from './PresenceAlertsBanner';
import { LayoutGrid, ChevronRight, Wallet } from 'lucide-react';
import type { Transaction } from '../../types';
import { useNexusEvents } from '../../hooks/useNexusEvents';
import { useDebts } from '../../services/debt/debt.hooks';
import { useGoals } from '../../hooks/useGoals';
import { buildUserContext, getPrioritizedInsight } from '../../services/nexusInsightEngine';
import DailyStatus from './DailyStatus';
import RecentTransactions from './RecentTransactions';
import PlanIndicator from './PlanIndicator';
import NexusInsightCard from './NexusInsightCard';
import QuickActionCard from './QuickActionCard';
import QuickCategoryShortcuts from './QuickCategoryShortcuts';
import ActiveReservesCard from './ActiveReservesCard';

interface LoggedInHomePanelProps {
  transactions: Transaction[];
  isPrivacyMode: boolean;
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
  const { data: debts = [] } = useDebts(userId || undefined);
  const { goals = [] } = useGoals(userId || undefined);

  const nexusReserves = useMemo(() => goals.filter(g => g.type === 'nexus_reserve' && g.ativa), [goals]);

  const contextualEvent = useMemo(() => {
    // 1. Prepara o contexto para o motor de insights
    const todayStr = new Date().toISOString().split('T')[0];
    const txToday = safeTx.filter(t => t.date === todayStr).length;

    // Calcula dias desde o último lançamento
    let daysSince = 999;
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

    const ctx = buildUserContext({
      hasFinancialProfile: !!userMeta?.financialProfile,
      hasPaidAccess: hasPaidAccess,
      isPremium: !!userMeta?.isPremium,
      transactionsToday: txToday,
      daysSinceLastTransaction: daysSince,
      launchCount: safeTx.length,
      launchLimit: userMeta?.launchLimit || 30,
      monthBalance: balance,
      hasFirstInvestment: safeTx.some(t => t.category?.toLowerCase().includes('investimento')),
      debts
    });

    // 2. Obtém insight priorizado do motor local
    const localInsight = getPrioritizedInsight(ctx);

    // 3. Retorna o insight local ou o evento do servidor como fallback
    return localInsight || serverEvent;
  }, [serverEvent, safeTx, userMeta, hasPaidAccess, debts]);

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
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Home</h1>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
          <span className="w-8 h-[1px] bg-slate-200"></span>
          {monthLabel} · Painel de Rotina
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Coluna Principal - Esquerda (8 colunas em desktop) */}
        <div className="lg:col-span-8 space-y-8">


          <DailyStatus lancamentos={transactions} />

          <ActiveReservesCard goals={nexusReserves} />

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
            userId={userId || ''}
            userPlan={userMeta?.isPremium ? 'premium' : hasPaidAccess ? 'pro' : 'free'}
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
              className="flex items-center justify-between w-full rounded-[2rem] border border-slate-200 bg-white px-6 py-4 text-left hover:bg-slate-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <Wallet size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700 tracking-tight">Dashboard e Histórico</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Visão detalhada do mês</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('central')}
              className="flex items-center justify-between w-full rounded-[2rem] border border-slate-200 bg-white px-6 py-4 text-left hover:bg-slate-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500 group-hover:bg-sky-500 group-hover:text-white transition-all">
                  <LayoutGrid size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700 tracking-tight">Central de Estratégia</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Visão de longo prazo</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-sky-500 transition-all" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoggedInHomePanel;
