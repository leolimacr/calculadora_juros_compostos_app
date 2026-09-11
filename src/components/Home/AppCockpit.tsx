import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import type { Transaction, UserMeta } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useCockpitData } from './Cockpit/useCockpitData';
import { useEntitlement } from '../../hooks/useEntitlement';
import { useDebts } from '../../services/debt/debt.hooks';
import { useWealthData } from '../../hooks/useWealthData';
import { buildUserContext, getCentralInsights } from '../../services/nexusInsightEngine';
import { isCommandMode } from '../../services/personaCalibrationService';
import { getCentralJourneyStage } from '../../theme/fpiVoiceGuide';
import { getConsecutiveDays } from '../../utils/streakUtils';
import { getLocalDateString } from '../../utils/dateHelpers';
import CockpitHero from './Cockpit/CockpitHero';
import CockpitInventory from './Cockpit/CockpitInventory';
import CockpitAnalytics from './Cockpit/CockpitAnalytics';
import SovereignBuckets from '../tools/finance/dashboard/SovereignBuckets';
import MarginTrajectoryPanel from '../tools/finance/dashboard/MarginTrajectoryPanel';
import CommandRitual from './CommandRitual';
import SovereignMapCard from './SovereignMapCard';
import FirstTransactionCTA from './FirstTransactionCTA';
import UrgentBillsSheet from './UrgentBillsSheet';
import ProtectionBar from '../tools/finance/dashboard/ProtectionBar';
import JornadaMetrics from './JornadaMetrics';
import { RefreshCw, ChevronDown, Brain, Sparkles, ChevronRight, Lock, Crown, X, Target } from 'lucide-react';
import NexusActionButton from './NexusActionButton';
import { useExclusionAmount } from '../../contexts/ExclusionsContext';

interface AppCockpitProps {
  transactions: Transaction[];
  isPrivacyMode: boolean;
  onNavigate: (tool: string, state?: any) => void;
  onOpenForm: (initialData?: any) => void;
  userMeta?: UserMeta | null;
  isSyncing?: boolean;
}

const AppCockpitInner: React.FC<AppCockpitProps> = ({
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
  const location = useLocation();

  const { data: debts = [] } = useDebts(user?.uid || undefined);
  const { assets = [], passives = [], patrimonioLiquido = 0 } = useWealthData();

  const showSyncBanner = !!isSyncing;
  const hasTransactions = transactions.length > 0;
  const hasPremiumAccess = effectiveTier === 'premium';
  const hasProAccess = effectiveTier === 'pro' || effectiveTier === 'premium';

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const activeDebtsCount = debts.filter((d: any) => (d.saldoDevedor ?? 0) > 0).length;
  const hasFinancialProfile = Boolean(userMeta?.financialProfile);
  const colchaoInicialTarget = userMeta?.financialProfile?.colchaoInicialTarget || 0;
  const reserveTarget = userMeta?.financialProfile?.emergencyReserveTarget;

  const exclusionAmount = useExclusionAmount(colchaoInicialTarget, reserveTarget ?? 0);
  const adjustedBalance = cockpit.sovereign.accumulatedBalance - exclusionAmount;

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
        eyebrow: 'Prontidão dos dados',
        title: 'Inicie sua leitura financeira',
        description:
          'Sem rotina registrada, a leitura estratégica fica limitada. Registre sua primeira movimentação no Controla.',
        cta: 'Ir para o Controla',
        action: () => onNavigate('manager'),
        tone: 'amber' as const,
      };
    }

    if ((daysSinceLastTransaction ?? 0) >= 7) {
      return {
        eyebrow: 'Prontidão dos dados',
        title: 'Atualize seus registros recentes',
        description: `Há ${daysSinceLastTransaction} dias sem novas movimentações. Dados recentes garantem que sua Disponibilidade Real reflita o momento atual.`,
        cta: 'Atualizar no Controla',
        action: () => onNavigate('manager'),
        tone: 'amber' as const,
      };
    }

    if (!hasFinancialProfile) {
      return {
        eyebrow: 'Prontidão dos dados',
        title: 'Configure suas metas de proteção',
        description:
          'Defina suas metas de Colchão Inicial e Reserva de Emergência para calibrar sua Disponibilidade Real com maior precisão.',
        cta: 'Configurar metas',
        action: () => {
          const el = document.getElementById('base-protecao');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          } else {
            onNavigate('central', { focusSection: 'base-protecao' });
          }
        },
        tone: 'sky' as const,
      };
    }

    return null;
  })();

  const recommendationToneMap = {
    amber: {
      wrapper: 'border-amber-200/80 bg-amber-50/50',
      button: 'bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900',
      eyebrow: 'text-amber-800',
    },
    sky: {
      wrapper: 'border-sky-200/80 bg-sky-50/50',
      button: 'bg-white hover:bg-sky-100/60 border border-sky-300 text-sky-900',
      eyebrow: 'text-sky-800',
    },
  } as const;

  const recTone = centralRecommendation ? recommendationToneMap[centralRecommendation.tone] : null;

  // FIRST-USE STATE
  if (!hasTransactions) {
    return (
      <div className="max-w-7xl mx-auto px-4 pt-14 md:pt-6 pb-28 space-y-5 md:space-y-8 animate-in fade-in duration-500">
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

      {/* N1 — Situação financeira atual */}
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
        exclusionAmount={exclusionAmount}
      />

      {/* N1 — Comando: ponto de atenção e próximo passo */}
      {cockpit.stage && (
        <CommandRitual
          stage={cockpit.stage}
          event={cockpit.contextualEvent}
          onNavigate={onNavigate}
          freeBalance={cockpit.sovereign.sovereignFreeBalance}
          shortfall={cockpit.sovereign.protectionShortfall}
          launchCount={transactions.length}
          urgentCount={cockpit.urgentBills.length}
          projectedBalance={cockpit.sovereign.projectedBalance}
        />
      )}

      {/* N2 — O que explica este número */}
      <section className="space-y-4 md:space-y-5" aria-label="O que explica este número">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-1">
          O que explica este número
        </p>
        {cockpit.stage && (
          <SovereignMapCard
            stage={cockpit.stage}
            onNavigate={onNavigate}
          />
        )}
        <div id="base-protecao">
          <ProtectionBar
            saldoRealTotal={cockpit.sovereign.accumulatedBalance - exclusionAmount}
            colchaoTarget={colchaoInicialTarget}
            reserveTarget={reserveTarget ?? 0}
            isPrivacyMode={isPrivacyMode}
            userId={user?.uid}
            userMeta={userMeta}
            onOpenForm={onOpenForm}
            effectiveBalanceOverride={adjustedBalance}
          />
        </div>

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
      </section>

      {/* Lembretes operacionais secundários — somente quando aplicáveis */}
      {centralRecommendation && recTone && (
        <section
          id="prontidao-dados"
          aria-label="Prontidão dos dados"
          className={`rounded-section border p-4 md:p-5 ${recTone.wrapper}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${recTone.eyebrow}`}>
                {centralRecommendation.eyebrow}
              </span>
              <h3 className="text-sm md:text-base font-bold text-slate-900 tracking-tight">
                {centralRecommendation.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {centralRecommendation.description}
              </p>
            </div>
            <button
              type="button"
              onClick={centralRecommendation.action}
              className={`shrink-0 px-4 py-2 rounded-xl text-[11px] font-bold transition-all shadow-sm ${recTone.button}`}
            >
              {centralRecommendation.cta}
            </button>
          </div>
        </section>
      )}

      {/* N3 — Aprofunde quando quiser */}
      <section className="space-y-4 md:space-y-5" aria-label="Aprofunde quando quiser">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-1">
          Aprofunde quando quiser
        </p>

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
                  className="bg-white border border-slate-200 rounded-section p-6 flex flex-col justify-between hover:border-slate-300 transition-all"
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
                    className="w-full py-2.5 rounded-xl bg-surface-subtle border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider hover:border-slate-300 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5"
                  >
                    {insight.message.ctaLabel} <ChevronRight size={14} />
                  </button>
                  {insight.action && (
                    <NexusActionButton
                      insight={insight}
                      userId={userId || 'unknown'}
                      onActionExecuted={() => {}}
                      variant="secondary"
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

        {/* Composição do saldo e trajetória — antes dentro do Hero */}
        {cockpit.sovereign.commandMode && (
          <div className="space-y-4 md:space-y-5">
            <SovereignBuckets
              snapshot={cockpit.sovereign}
              marcoZero={cockpit.marcoZero}
              reserveCurrent={cockpit.reserveCurrent}
              isPrivacyMode={isPrivacyMode}
              variant="light"
            />
            <MarginTrajectoryPanel
              transactions={transactions}
              financialProfile={userMeta?.financialProfile}
              currentMargin={cockpit.sovereign.sovereignFreeBalance}
              isPrivacyMode={isPrivacyMode}
              variant="light"
              months={6}
            />
          </div>
        )}

        {/* Evolução Patrimonial (recolhida por padrão) */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowEvolucao(!showEvolucao)}
            className="w-full flex items-center justify-between p-4 md:p-5 bg-white border border-slate-200 rounded-section hover:border-slate-300 transition-all text-left"
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
              className={`text-slate-500 transition-transform duration-200 ${showEvolucao ? 'rotate-180' : ''}`}
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
      </section>

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

const AppCockpit: React.FC<AppCockpitProps> = (props) => (
  <AppCockpitInner {...props} />
);

export default AppCockpit;
