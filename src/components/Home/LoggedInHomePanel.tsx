import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PresenceAlertsBanner } from './PresenceAlertsBanner';
import { LayoutGrid, ChevronRight, Wallet, Compass } from 'lucide-react';
import type { Transaction } from '../../types';
import { useNexusEvents } from '../../hooks/useNexusEvents';
import { useDebts } from '../../services/debt/debt.hooks';
import { useGoals } from '../../hooks/useGoals';
import { useWealthData } from '../../hooks/useWealthData';
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

  // Estado para controlar a transparência do título no scroll
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const safeTx = Array.isArray(transactions) ? transactions : [];
  const userId = safeTx.length > 0 ? safeTx[0]?.userId : null;

  const { event: serverEvent, dismiss } = useNexusEvents();
  const { data: debts = [] } = useDebts(userId || undefined);
  const { goals = [] } = useGoals(userId || undefined);
  const { assets = [], passives = [] } = useWealthData(); // [NEXUS MULTIMODULAR]

  const nexusReserves = useMemo(() => goals.filter(g => g.type === 'nexus_reserve' && g.ativa), [goals]);

  const contextualEvent = useMemo(() => {
    // ... (logic for txToday, daysSince, balance)
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
      debts,
      assets,
      passives
    });

    // 2. Obtém insight priorizado do motor local
    const localInsight = getPrioritizedInsight(ctx);

    // 3. Retorna o insight local ou o evento do servidor como fallback
    return localInsight || serverEvent;
  }, [serverEvent, safeTx, userMeta, hasPaidAccess, debts, assets, passives]);

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
    <>
      {/* Barra Fixa Invisível para Título HOME (Mobile Only) */}
      <div className={`fixed top-16 left-0 z-[100] md:hidden h-14 w-full px-4 flex items-center bg-transparent pointer-events-none transition-all duration-300 ${isScrolled ? 'opacity-5' : 'opacity-100'}`}>
        <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] pointer-events-auto">
          Home
        </h1>
      </div>

      <div className="max-w-7xl w-full mx-auto px-4 pt-14 md:pt-6 pb-28 animate-in fade-in duration-300">
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="hidden md:block text-3xl font-black text-slate-900 tracking-tight">Home</h1>
            <button
              onClick={() => onNavigate('test-explorar')}
              className="md:hidden flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase transition-all bg-white border-slate-200 text-slate-600 shadow-sm active:scale-95 pointer-events-auto"
            >
              <Compass size={14} className="text-sky-500" /> Explorar
            </button>
          </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-8 h-[1px] bg-slate-200"></span>
              {monthLabel} · Painel de Rotina
            </p>
          </div>
          
          <button
            onClick={() => onNavigate('test-explorar')}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase transition-all bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm active:scale-95"
          >
            <Compass size={14} className="text-sky-500" /> Explorar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Coluna Principal - Esquerda (8 colunas em desktop) */}
        <div className="lg:col-span-8 space-y-8">

          {/* Desktop Only Status */}
          <div className="hidden lg:block">
            <DailyStatus lancamentos={transactions} />
          </div>

          {/* Mobile Only Quick Access - Replaces DailyStatus */}
          <button
            type="button"
            onClick={() => navigate('/app/controla')}
            className="lg:hidden w-full group relative overflow-hidden rounded-[2rem] bg-white border border-slate-200 p-5 text-left transition-all active:scale-[0.98] shadow-sm flex items-center gap-4"
          >
            <div className="shrink-0 relative">
              <img 
                src="/icon-512.webp" 
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
          {/* Card Nobre de Análise - Topo (Desktop Only) */}
          <button
            type="button"
            onClick={() => navigate('/app/controla')}
            className="hidden lg:block group relative overflow-hidden rounded-[2rem] bg-white border border-slate-200 p-6 text-left transition-all hover:border-emerald-200 hover:shadow-xl hover:-translate-y-1 shadow-sm w-full"
          >
            {/* Elemento de Imagem Preview */}
            <div className="absolute top-4 right-4 w-24 h-24 overflow-hidden rounded-2xl border border-emerald-100/50 shadow-2xl shadow-emerald-500/10 transition-all group-hover:rotate-3 group-hover:scale-110 pointer-events-none hidden sm:block">
              <img 
                src="/controla-icon.png" 
                alt="Preview do Controla" 
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="flex flex-col h-full relative z-10">
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl w-fit mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                <Wallet size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Controla (Completo)</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">Visão detalhada do seu mês e evolução dos gastos.</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Acessar Painel</span>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-all group-hover:translate-x-1" />
              </div>
            </div>
          </button>

          <PlanIndicator
            isPro={!!hasPaidAccess}
            launchCount={safeTx.length}
            launchLimit={userMeta?.launchLimit || 30}
          />

          {/* Card de Navegação Secundária - Estratégia */}
          <button
            type="button"
            onClick={() => onNavigate('central')}
            className="group relative overflow-hidden rounded-[2rem] bg-white border border-slate-200 p-6 text-left transition-all hover:border-sky-200 hover:shadow-xl hover:-translate-y-1 shadow-sm w-full"
          >
            <div className="flex flex-col h-full">
              <div className="bg-sky-50 text-sky-600 p-3 rounded-2xl w-fit mb-4 group-hover:bg-sky-500 group-hover:text-white transition-all shadow-sm">
                <LayoutGrid size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight leading-tight">Central</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">Visão de longo prazo e futuro.</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-sky-600">Ver Estratégia</span>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-sky-500 transition-all group-hover:translate-x-1" />
              </div>
            </div>
          </button>

          <RecentTransactions
            transactions={safeTx}
            isPrivacyMode={isPrivacyMode}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
    </>
  );
};

export default LoggedInHomePanel;
