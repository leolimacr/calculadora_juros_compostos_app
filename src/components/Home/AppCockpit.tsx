import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { Transaction, UserMeta } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useCockpitData } from './Cockpit/useCockpitData';
import { useEntitlement } from '../../hooks/useEntitlement';
import { useDebts } from '../../services/debt/debt.hooks';
import { useWealthData } from '../../hooks/useWealthData';
import { buildUserContext, getCentralInsights } from '../../services/nexusInsightEngine';
import { isCommandMode } from '../../services/personaCalibrationService';
import { getCentralJourneyStage, INSTITUTIONAL_TERM } from '../../theme/fpiVoiceGuide';
import { getConsecutiveDays } from '../../utils/streakUtils';
import { getLocalDateString } from '../../utils/dateHelpers';
import CockpitHero from './Cockpit/CockpitHero';
import CockpitInventory from './Cockpit/CockpitInventory';
import CockpitAnalytics from './Cockpit/CockpitAnalytics';
import CommandRitual from './CommandRitual';
import SovereignMapCard from './SovereignMapCard';
import FirstTransactionCTA from './FirstTransactionCTA';
import UrgentBillsSheet from './UrgentBillsSheet';
import ProtectionBar from '../tools/finance/dashboard/ProtectionBar';
import JornadaMetrics from './JornadaMetrics';
import { RefreshCw, ChevronDown, Brain, Sparkles, ChevronRight, Lock, Crown, X, Target } from 'lucide-react';
import NexusActionButton from './NexusActionButton';

interface AppCockpitProps {
  transactions: Transaction[];
  isPrivacyMode: boolean;
  onNavigate: (tool: string, state?: any) => void;
  onOpenForm: (initialData?: any) => void;
  userMeta?: UserMeta | null;
  isSyncing?: boolean;
}

const AppCockpit: React.FC<AppCockpitProps> = ({
  transactions,
  isPrivacyMode,
  onNavigate,
  onOpenForm,
  userMeta,
  isSyncing
}) => {
  const { user } = useAuth();
  const { effectiveTier } = useEntitlement();
  const cockpit = useCockpitData(user, transactions, userMeta);
  const [showUrgentBills, setShowUrgentBills] = useState(false);
  const [showEvolucao, setShowEvolucao] = useState(false);
  const [lockedModule, setLockedModule] = useState<string | null>(null);
  const LS_RESERVA = 'fpi-dash-excluir-reserva';
  const LS_COLCHAO = 'fpi-dash-excluir-colchao';
  const [excludeReserva, setExcludeReserva] = useState(() => localStorage.getItem(LS_RESERVA) === 'true');
  const [excludeColchao, setExcludeColchao] = useState(() => localStorage.getItem(LS_COLCHAO) === 'true');
  const toggleReserva = () => setExcludeReserva((p) => !p);
  const toggleColchao = () => {
    const next = !excludeColchao;
    if (next) setExcludeReserva(true);
    setExcludeColchao(next);
  };
  useEffect(() => { localStorage.setItem(LS_RESERVA, String(excludeReserva)); }, [excludeReserva]);
  useEffect(() => { localStorage.setItem(LS_COLCHAO, String(excludeColchao)); }, [excludeColchao]);
  const location = useLocation();

  // Scroll-to-section via location state (deep links from Nexus, push, etc.)
  useEffect(() => {
    const state = location.state as Record<string, unknown> | null;
    if (!state?.focusSection) return;

    const timer = setTimeout(() => {
      if (state.focusSection === 'base-protecao') {
        const el = document.getElementById('base-protecao');
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);

    window.history.replaceState({}, '');
    return () => clearTimeout(timer);
  }, [location.state]);

  const { data: debts = [] } = useDebts(user?.uid || undefined);
  const { assets = [], passives = [], patrimonioLiquido = 0 } = useWealthData();

  const showSyncBanner = !!isSyncing;
  const hasTransactions = transactions.length > 0;
  const hasPremiumAccess = effectiveTier === 'premium';
  const hasProAccess = effectiveTier === 'pro' || effectiveTier === 'premium';

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const activeDebtsCount = debts.filter((d) => (d.saldoDevedor ?? 0) > 0).length;
  const hasFinancialProfile = Boolean(userMeta?.financialProfile);
  const colchaoInicialTarget = userMeta?.financialProfile?.colchaoInicialTarget || 0;
  const reserveTarget = userMeta?.financialProfile?.emergencyReserveTarget;

  const userId = user?.uid || null;

  const now = useMemo(() => new Date(), []);

  const validTransactionDates = useMemo(
    () => transactions
      .map((t) => new Date(t.date))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime()),
    [transactions]
  );

  const lastTransactionDate = validTransactionDates[0] ?? null;
  const daysSinceLastTransaction = lastTransactionDate
    ? Math.floor((now.getTime() - lastTransactionDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const streak = useMemo(() => getConsecutiveDays(transactions), [transactions]);

  // Central insights + recommendation
  const nexusInsights = useMemo(() => {
    const todayStr = getLocalDateString();
    const txToday = transactions.filter((t) => t.date === todayStr).length;
    const hasRealEstate = passives.some((p) => p.category === 'Imóveis');
    const hasVehicles = passives.some((p) => p.category === 'Veículos');
    const debtJustPaidOff = debts.some((d) => d.saldoDevedor === 0);

    const ctx = buildUserContext({
      hasFinancialProfile,
      financialProfile: userMeta?.financialProfile,
      hasPaidAccess: hasProAccess,
      isPremium: hasPremiumAccess,
      transactionsToday: txToday,
      daysSinceLastTransaction: daysSinceLastTransaction ?? 999,
      launchCount: transactions.length,
      launchLimit: userMeta?.launchLimit || 30,
      monthBalance: cockpit.sovereign.monthBalance,
      monthIncome: cockpit.sovereign.income,
      monthExpenses: cockpit.sovereign.expenses,
      sovereignFreeBalance: cockpit.sovereign.sovereignFreeBalance,
      freedomDeficit: cockpit.sovereign.freedomDeficit,
      obligationsDeduction: cockpit.sovereign.obligationsDeduction,
      commandMode: isCommandMode(userMeta),
      persona: userMeta?.persona,
      transactions,
      hasFirstInvestment: transactions.some((t) => t.category?.toLowerCase().includes('investimento')),
      streak,
      hasDebts: debts.length > 0,
      hasRealEstate,
      hasVehicles,
      totalAssetsValue: cockpit.totalInvestments + cockpit.totalProperty,
      marcoZero: cockpit.marcoZero,
      reserveCurrent: cockpit.reserveCurrent,
      reserveTarget,
      reserveGoalMet: false,
      debtJustPaidOff,
      assets,
      passives,
      debts,
    });

    return getCentralInsights(ctx);
  }, [
    transactions, userMeta, hasProAccess, hasPremiumAccess,
    cockpit.sovereign, daysSinceLastTransaction, hasFinancialProfile,
    debts, passives, assets, streak, cockpit.marcoZero,
    cockpit.reserveCurrent, reserveTarget, cockpit.totalInvestments, cockpit.totalProperty,
  ]);

  const journeyStage = getCentralJourneyStage({
    hasLaunches: transactions.length > 0,
    hasFinancialProfile,
    hasPremium: hasPremiumAccess,
  });

  const centralRecommendation = (() => {
    if (transactions.length === 0) {
      return {
        eyebrow: 'Prioridade agora',
        title: 'Monte a base antes de evoluir',
        description:
          'Sem rotina registrada, a leitura estratégica fica limitada. Comece no Controla para destravar os próximos passos aqui.',
        cta: 'Ir para o Controla',
        action: () => onNavigate('manager'),
        tone: 'amber' as const,
      };
    }

    if ((daysSinceLastTransaction ?? 0) >= 7) {
      return {
        eyebrow: 'Prioridade agora',
        title: 'Atualize a base para decidir melhor',
        description: `Há ${daysSinceLastTransaction} dias sem registro. A evolução depende de dados recentes — retome a rotina no Controla.`,
        cta: 'Atualizar no Controla',
        action: () => onNavigate('manager'),
        tone: 'rose' as const,
      };
    }

    if (!hasFinancialProfile) {
      return {
        eyebrow: 'Prioridade agora',
        title: hasPremiumAccess ? 'Estruture seu plano de quitação' : 'Mapeie suas dívidas com clareza',
        description: hasPremiumAccess
          ? 'Com perfil e débitos organizados, você enxerga consequências e prioridades de verdade.'
          : 'Organize seus débitos para ver o caminho de saída — gestão completa no Premium.',
        cta: hasPremiumAccess ? 'Abrir Minhas Dívidas' : 'Ver como funciona',
        action: () => onNavigate('minhas-dividas'),
        tone: 'sky' as const,
      };
    }

    if (!hasPremiumAccess) {
      return {
        eyebrow: 'Prioridade agora',
        title: 'Conecte rotina e estratégia',
        description:
          'Você já tem estrutura básica. O Premium integra dívidas, investimentos e patrimônio numa visão única.',
        cta: 'Conhecer o Premium',
        action: () => onNavigate('pricing'),
        tone: 'emerald' as const,
      };
    }

    return {
      eyebrow: 'Prioridade agora',
      title: 'Revise alocação e proteção',
      description: `Seus módulos estão ativos. Use o Nexus para uma leitura conectada de reserva, ${INSTITUTIONAL_TERM} e patrimônio.`,
      cta: 'Abrir leitura estratégica',
      action: () =>
        onNavigate('chat', {
          initialPrompt:
            'Dê um panorama da minha evolução financeira: reserva, dívidas, investimentos e patrimônio.',
        }),
      tone: 'violet' as const,
    };
  })();

  const recommendationToneMap = {
    amber: { wrapper: 'border-amber-200 bg-amber-50', button: 'bg-amber-500 hover:bg-amber-400 text-white', eyebrow: 'text-amber-700' },
    rose: { wrapper: 'border-rose-200 bg-rose-50', button: 'bg-rose-600 hover:bg-rose-500 text-white', eyebrow: 'text-rose-700' },
    emerald: { wrapper: 'border-emerald-200 bg-emerald-50', button: 'bg-emerald-600 hover:bg-emerald-500 text-white', eyebrow: 'text-emerald-700' },
    sky: { wrapper: 'border-sky-200 bg-sky-50', button: 'bg-sky-600 hover:bg-sky-500 text-white', eyebrow: 'text-sky-700' },
    violet: { wrapper: 'border-violet-200 bg-violet-50', button: 'bg-violet-600 hover:bg-violet-500 text-white', eyebrow: 'text-violet-700' },
  } as const;

  const recTone = recommendationToneMap[centralRecommendation.tone];

  // FIRST-USE STATE
  if (!hasTransactions) {
    return (
      <div className="max-w-7xl mx-auto px-4 pt-14 md:pt-6 pb-28 space-y-8 animate-in fade-in duration-500">
        {showSyncBanner && (
          <div className="flex items-center justify-center gap-3 px-6 py-2 bg-sky-500/10 border border-sky-500/20 rounded-2xl animate-in slide-in-from-top-4">
            <RefreshCw size={12} className="text-sky-500 animate-spin" />
            <span className="text-[9px] font-black text-sky-600 uppercase tracking-widest">
              Sincronizando dados em tempo real...
            </span>
          </div>
        )}
        <FirstTransactionCTA onOpenForm={onOpenForm} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-14 md:pt-6 pb-28 space-y-8 animate-in fade-in duration-500">

      {/* SYNC BANNER */}
      {showSyncBanner && (
        <div className="flex items-center justify-center gap-3 px-6 py-2 bg-sky-500/10 border border-sky-500/20 rounded-2xl animate-in slide-in-from-top-4">
          <RefreshCw size={12} className="text-sky-500 animate-spin" />
          <span className="text-[9px] font-black text-sky-600 uppercase tracking-widest">
            Sincronizando dados em tempo real...
          </span>
        </div>
      )}

      {/* Command Ritual + Sovereign Map */}
      {cockpit.stage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CommandRitual
            stage={cockpit.stage}
            event={cockpit.contextualEvent}
            onNavigate={onNavigate}
            freeBalance={cockpit.sovereign.sovereignFreeBalance}
            shortfall={cockpit.sovereign.protectionShortfall}
            launchCount={transactions.length}
          />
          <SovereignMapCard
            stage={cockpit.stage}
            onNavigate={onNavigate}
          />
        </div>
      )}

      {/* Hero */}
      <CockpitHero
        urgentBills={cockpit.urgentBills}
        userMeta={userMeta}
        isPrivacyMode={isPrivacyMode}
        sovereign={cockpit.sovereign}
        marcoZero={cockpit.marcoZero}
        reserveCurrent={cockpit.reserveCurrent}
        transactions={transactions}
        formatCurrency={formatCurrency}
        onNavigate={onNavigate}
        onOpenForm={onOpenForm}
        onShowUrgentBills={() => setShowUrgentBills(true)}
      />

      {/* Base de Proteção */}
      <div id="base-protecao">
      <ProtectionBar
        saldoRealTotal={cockpit.sovereign.accumulatedBalance}
        colchaoTarget={colchaoInicialTarget}
        reserveTarget={reserveTarget ?? 0}
        isPrivacyMode={isPrivacyMode}
        userId={user?.uid}
        userMeta={userMeta}
        onOpenForm={onOpenForm}
        excludeReserva={excludeReserva}
        excludeColchao={excludeColchao}
        onToggleReserva={toggleReserva}
        onToggleColchao={toggleColchao}
      />
      </div>

      {/* Onde você está — Jornada + métricas */}
      <JornadaMetrics
        stageName={journeyStage.stage}
        effectiveTier={effectiveTier}
        saldoRealTotal={cockpit.sovereign.accumulatedBalance}
        colchaoTarget={colchaoInicialTarget}
        patrimonioLiquido={patrimonioLiquido}
        activeDebtsCount={activeDebtsCount}
        reserveTarget={reserveTarget}
        formatCurrency={formatCurrency}
        onNavigate={onNavigate}
      />

      {/* O que priorizar agora — recomendação contextual */}
      <section id="prioridades" className={`rounded-[2rem] border p-6 md:p-8 shadow-sm ${recTone.wrapper}`}>
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${recTone.eyebrow}`}>
          {centralRecommendation.eyebrow}
        </span>
        <h3 className="mt-3 text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          {centralRecommendation.title}
        </h3>
        <p className="mt-3 text-sm md:text-base text-slate-700 leading-relaxed max-w-3xl">
          {centralRecommendation.description}
        </p>
        <button
          type="button"
          onClick={centralRecommendation.action}
          className={`mt-6 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${recTone.button}`}
        >
          {centralRecommendation.cta}
        </button>
      </section>

      {/* O que seus dados indicam — Nexus insights */}
      {nexusInsights.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-xl text-violet-600">
              <Brain size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Leitura conectada</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">O que seus dados indicam</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nexusInsights.slice(0, 3).map((insight) => (
              <div
                key={insight.id}
                className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center mb-4 ${
                      insight.priority === 'alta'
                        ? 'bg-rose-50 text-rose-600 border border-rose-100'
                        : insight.priority === 'media'
                          ? 'bg-amber-50 text-amber-600 border border-amber-100'
                          : 'bg-sky-50 text-sky-600 border border-sky-100'
                    }`}
                  >
                    <Sparkles size={16} />
                  </div>
                  <h4 className="text-base font-black text-slate-900 mb-2 leading-tight">{insight.message.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-6">{insight.message.body}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(insight.deepLink)}
                  className="w-full py-3 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  {insight.message.ctaLabel} <ChevronRight size={14} />
                </button>
                {insight.action && (
                  <NexusActionButton
                    insight={insight}
                    userPlan={effectiveTier}
                    userId={userId || 'unknown'}
                    onActionExecuted={() => {}}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Onde aprofundar — módulos estratégicos */}
      <CockpitInventory
        totals={cockpit.totals}
        detailedCards={cockpit.detailedCards}
        isPrivacyMode={isPrivacyMode}
        onNavigate={onNavigate}
        formatCurrency={formatCurrency}
      />

      {/* Evolução Patrimonial (recolhida por padrão) */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowEvolucao(!showEvolucao)}
          className="w-full flex items-center justify-between p-4 md:p-6 bg-white border border-slate-200 rounded-[2rem] hover:shadow-sm transition-all text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
              <Target size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Aprofundamento</p>
              <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">Evolução Patrimonial</h3>
            </div>
          </div>
          <ChevronDown
            size={20}
            className={`text-slate-400 transition-transform duration-200 ${showEvolucao ? 'rotate-180' : ''}`}
          />
        </button>

        {showEvolucao && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <CockpitAnalytics
              evolutionData={cockpit.evolutionData}
              investmentComposition={cockpit.investmentComposition}
              propertyComposition={cockpit.propertyComposition}
              debtComposition={cockpit.debtComposition}
              isPrivacyMode={isPrivacyMode}
              validatedModules={cockpit.totals.validatedModules}
              totalInvestments={cockpit.totalInvestments}
              totalProperty={cockpit.totalProperty}
              totalDebts={cockpit.totalDebts}
              onNavigate={onNavigate}
              formatCurrency={formatCurrency}
            />
          </div>
        )}
      </div>

      {/* Urgent Bills Sheet */}
      <UrgentBillsSheet
        bills={cockpit.urgentBills}
        isOpen={showUrgentBills}
        onClose={() => setShowUrgentBills(false)}
        onOpenForm={onOpenForm}
      />

      {/* Locked Module Modal */}
      {lockedModule && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-sky-50 rounded-2xl text-sky-600">
                  <Lock size={32} />
                </div>
                <button
                  type="button"
                  onClick={() => setLockedModule(null)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">{lockedModule}</h3>
              <p className="text-slate-600 leading-relaxed mb-6 text-sm">Recurso estratégico disponível no Premium.</p>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-8">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">No Premium você ganha:</p>
                <ul className="space-y-2.5">
                  {(lockedModule === 'Gestão de Dívidas'
                    ? ['Projeção de quitação e economia de juros', 'Acompanhamento de vencimentos', 'Priorização entre dívidas']
                    : lockedModule === 'Investimentos'
                      ? ['Carteira consolidada', 'Visão de alocação', 'Evolução dos ativos']
                      : ['Patrimônio líquido unificado', 'Bens e passivos organizados', 'Reserva e colchão de proteção']
                  ).map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium leading-tight">
                      <Crown size={12} className="text-emerald-500 fill-emerald-500 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => { setLockedModule(null); onNavigate('pricing'); }}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                >
                  Conhecer o Premium
                </button>
                <button
                  type="button"
                  onClick={() => setLockedModule(null)}
                  className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest transition-all"
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppCockpit;
