import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  CreditCard,
  Wallet,
  Building2,
  Crown,
  ChevronRight,
  Lock,
  X,
  Brain,
  Target,
} from 'lucide-react';
import type { Transaction, UserMeta } from '../types';
import { useDebts } from '../services/debt/debt.hooks';
import { buildUserContext, getCentralInsights } from '../services/nexusInsightEngine';
import NexusActionButton from './Home/NexusActionButton';
import { useWealthData } from '../hooks/useWealthData';
import { useSovereignSnapshot } from '../hooks/useSovereignSnapshot';
import { getConsecutiveDays } from '../utils/streakUtils';
import { getCentralHeroCopy, getCentralJourneyStage, INSTITUTIONAL_TERM } from '../theme/fpiVoiceGuide';
import { isCommandMode } from '../services/personaCalibrationService';
import CommandCalibration from './tools/nexus/CommandCalibration';
import { hasPlanAccess as checkPlanAccess } from '../utils/plan';
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';
import BaseDeProtecaoCard from './CentralHub/BaseDeProtecaoCard';
import BaseDeProtecaoDrawer from './CentralHub/BaseDeProtecaoDrawer';
import { firestore } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface CentralHubProps {
  lancamentos: Transaction[];
  userMeta: UserMeta | null | undefined;
  onNavigate: (tool: string) => void;
}

const CentralHub: React.FC<CentralHubProps> = ({
  lancamentos,
  userMeta,
  onNavigate,
}) => {
  const [lockedModule, setLockedModule] = useState<string | null>(null);
  const [showCalibration, setShowCalibration] = useState(false);
  const [showBaseDrawer, setShowBaseDrawer] = useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const {
    assets = [],
    passives = [],
    totalInvestments = 0,
    totalProperty = 0,
    patrimonioLiquido = 0,
    marcoZero = 0,
    reserveCurrent = 0,
    colchaoInicialTarget = 0,
  } = useWealthData();

  const sovereign = useSovereignSnapshot(lancamentos, userMeta);
  const totalAssets = totalInvestments + totalProperty;

  const lockedDescriptions: Record<string, string> = {
    'Gestão de Dívidas':
      'Acompanhe juros, vencimentos e projeções de quitação com estratégia clara.',
    Investimentos:
      'Veja alocação, rentabilidade e evolução da carteira num só lugar.',
    Patrimônio:
      'Consolide bens, passivos e patrimônio líquido para entender o que você construiu.',
  };

  const hasFinancialProfile = Boolean(userMeta?.financialProfile);

  const getModuleBadge = (moduleTitle: string, isLocked: boolean) => {
    if (isLocked) return 'Premium';
    if (moduleTitle === 'Gestão de Dívidas' && hasFinancialProfile) return 'Ativo';
    return null;
  };

  const { currentPlan } = useSubscriptionAccess();
  const hasProAccess = checkPlanAccess(currentPlan, 'pro');
  const hasPremiumAccess = checkPlanAccess(currentPlan, 'premium');
  const now = new Date();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleSaveBaseProtecao = async (data: {
    colchaoInicialTarget: number;
    colchaoInicialCurrent: number;
    reserveTarget: number;
    reserveCurrent: number;
    protectionMonths: number;
  }) => {
    if (!userId) return;
    const userDocRef = doc(firestore, 'users', userId);
    await setDoc(
      userDocRef,
      {
        financialProfile: {
          ...(userMeta?.financialProfile || {}),
          marcoZero: data.colchaoInicialCurrent,
          emergencyReserveCurrent: data.reserveCurrent,
          emergencyReserveTarget: data.reserveTarget,
          protectionMonths: data.protectionMonths,
          colchaoInicialTarget: data.colchaoInicialTarget,
        },
      },
      { merge: true }
    );
  };

  const validTransactionDates = lancamentos
    .map((t) => new Date(t.date))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  const lastTransactionDate = validTransactionDates[0] ?? null;
  const daysSinceLastTransaction = lastTransactionDate
    ? Math.floor((now.getTime() - lastTransactionDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const streak = useMemo(() => getConsecutiveDays(lancamentos), [lancamentos]);
  const saldoLivreOperacional = sovereign.heroValue;
  const userId = lancamentos.length > 0 ? lancamentos[0]?.userId : null;
  const { data: debts = [] } = useDebts(userId || undefined);

  const activeDebtsCount = debts.filter((d) => (d.saldoDevedor ?? 0) > 0).length;
  const reserveTarget = userMeta?.financialProfile?.emergencyReserveTarget;
  const protectionMonths = userMeta?.financialProfile?.protectionMonths || 6;

  const nexusInsights = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const txToday = lancamentos.filter((t) => t.date === todayStr).length;
    const hasRealEstate = passives.some((p) => p.category === 'Imóveis');
    const hasVehicles = passives.some((p) => p.category === 'Veículos');
    const debtJustPaidOff = debts.some((d) => d.saldoDevedor === 0);

    const ctx = buildUserContext({
      hasFinancialProfile,
      financialProfile: userMeta?.financialProfile,
      hasPaidAccess: hasProAccess || hasPremiumAccess,
      isPremium: hasPremiumAccess,
      transactionsToday: txToday,
      daysSinceLastTransaction: daysSinceLastTransaction ?? 999,
      launchCount: lancamentos.length,
      launchLimit: userMeta?.launchLimit || 30,
      monthBalance: sovereign.monthBalance,
      monthIncome: sovereign.income,
      monthExpenses: sovereign.expenses,
      sovereignFreeBalance: sovereign.sovereignFreeBalance,
      freedomDeficit: sovereign.freedomDeficit,
      obligationsDeduction: sovereign.obligationsDeduction,
      commandMode: isCommandMode(userMeta),
      persona: userMeta?.persona,
      transactions: lancamentos,
      hasFirstInvestment: lancamentos.some((t) => t.category?.toLowerCase().includes('investimento')),
      streak,
      hasDebts: debts.length > 0,
      hasRealEstate,
      hasVehicles,
      totalAssetsValue: totalAssets,
      marcoZero,
      reserveCurrent,
      reserveTarget,
      freeBalance: saldoLivreOperacional,
      reserveGoalMet: false,
      debtJustPaidOff,
      assets,
      passives,
      debts,
    });

    return getCentralInsights(ctx);
  }, [
    lancamentos,
    userMeta,
    hasProAccess,
    hasPremiumAccess,
    sovereign,
    daysSinceLastTransaction,
    hasFinancialProfile,
    debts,
    passives,
    assets,
    totalAssets,
    streak,
    marcoZero,
    reserveCurrent,
    reserveTarget,
    saldoLivreOperacional,
  ]);

  const heroCopy = getCentralHeroCopy(hasPremiumAccess, hasProAccess);
  const journeyStage = getCentralJourneyStage({
    hasLaunches: lancamentos.length > 0,
    hasFinancialProfile,
    hasPremium: hasPremiumAccess,
  });

  const centralRecommendation = (() => {
    if (lancamentos.length === 0) {
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

  const strategyModules = [
    {
      title: 'Gestão de Dívidas',
      description: 'Quitação, juros e projeção do que cada decisão muda no longo prazo.',
      action: () => (hasPremiumAccess ? onNavigate('minhas-dividas') : onNavigate('pricing')),
      icon: CreditCard,
      accent: 'rose',
      cta: hasPremiumAccess ? 'Abrir dívidas' : 'Ver Premium',
      locked: !hasPremiumAccess,
    },
    {
      title: 'Investimentos',
      description: 'Carteira, alocação e evolução dos seus ativos ao longo do tempo.',
      action: () => (hasPremiumAccess ? onNavigate('investimentos') : onNavigate('pricing')),
      icon: Wallet,
      accent: 'emerald',
      cta: hasPremiumAccess ? 'Ver carteira' : 'Ver Premium',
      locked: !hasPremiumAccess,
    },
    {
      title: 'Patrimônio',
      description: 'Bens, passivos e patrimônio líquido consolidados.',
      action: () => (hasPremiumAccess ? onNavigate('passivos') : onNavigate('pricing')),
      icon: Building2,
      accent: 'sky',
      cta: hasPremiumAccess ? 'Abrir patrimônio' : 'Ver Premium',
      locked: !hasPremiumAccess,
    },
  ] as const;

  const accentClassMap = {
    rose: 'from-rose-400/20 to-rose-500/10 border-rose-200 text-rose-500',
    emerald: 'from-emerald-400/20 to-teal-500/10 border-emerald-200 text-emerald-600',
    sky: 'from-sky-400/20 to-indigo-500/10 border-sky-200 text-sky-600',
  } as const;

  const recommendationToneMap = {
    amber: {
      wrapper: 'border-amber-200 bg-amber-50',
      button: 'bg-amber-500 hover:bg-amber-400 text-white',
      eyebrow: 'text-amber-700',
    },
    rose: {
      wrapper: 'border-rose-200 bg-rose-50',
      button: 'bg-rose-600 hover:bg-rose-500 text-white',
      eyebrow: 'text-rose-700',
    },
    emerald: {
      wrapper: 'border-emerald-200 bg-emerald-50',
      button: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      eyebrow: 'text-emerald-700',
    },
    sky: {
      wrapper: 'border-sky-200 bg-sky-50',
      button: 'bg-sky-600 hover:bg-sky-500 text-white',
      eyebrow: 'text-sky-700',
    },
    violet: {
      wrapper: 'border-violet-200 bg-violet-50',
      button: 'bg-violet-600 hover:bg-violet-500 text-white',
      eyebrow: 'text-violet-700',
    },
  } as const;

  const recTone = recommendationToneMap[centralRecommendation.tone];

  return (
    <>
      <div
        className={`fixed top-16 left-0 z-[100] md:hidden h-14 w-full px-4 flex items-center bg-transparent pointer-events-none transition-all duration-300 ${isScrolled ? 'opacity-5' : 'opacity-100'}`}
      >
        <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-700 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] pointer-events-auto">
          Central
        </h1>
      </div>

      {showCalibration && userId && (
        <CommandCalibration
          userId={userId}
          onComplete={() => setShowCalibration(false)}
          onClose={() => setShowCalibration(false)}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 pt-14 md:pt-6 pb-10 space-y-8 animate-in fade-in duration-300">
        {/* 0. Base de Proteção */}
        <BaseDeProtecaoCard
          colchaoInicialTarget={colchaoInicialTarget}
          colchaoInicialCurrent={marcoZero}
          reserveTarget={reserveTarget}
          reserveCurrent={reserveCurrent}
          monthlyExpenses={sovereign.expenses}
          formatCurrency={formatCurrency}
          onAjustar={() => setShowBaseDrawer(true)}
        />

        {/* 1. Onde você está */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-white to-slate-50 border border-slate-200 border-l-4 border-l-indigo-500 p-6 md:p-8 shadow-sm">
          <div className="relative space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700">
                Evolução
              </span>
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${
                  hasPremiumAccess
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : hasProAccess
                      ? 'bg-sky-100 text-sky-700 border border-sky-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {hasPremiumAccess ? <Crown size={12} /> : null}
                Plano {currentPlan}
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                Estágio: {journeyStage.stage}
              </span>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">{heroCopy.title}</h2>
              <p className="text-slate-600 max-w-3xl leading-relaxed mt-2 text-sm md:text-base">
                {heroCopy.description}
              </p>
              <p className="text-xs text-slate-500 mt-2 font-medium">{journeyStage.hint}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Reserva</p>
                <p className="text-sm font-black text-slate-900">
                  {reserveCurrent > 0 ? formatCurrency(reserveCurrent) : '—'}
                </p>
                {reserveTarget != null && reserveTarget > 0 && (
                  <p className="text-[10px] text-slate-500 mt-1">Meta {formatCurrency(reserveTarget)}</p>
                )}
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">{INSTITUTIONAL_TERM}</p>
                <p className="text-sm font-black text-slate-900">
                  {marcoZero > 0 ? formatCurrency(marcoZero) : '—'}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Patrimônio líquido</p>
                <p className="text-sm font-black text-slate-900">
                  {patrimonioLiquido !== 0 || passives.length > 0 || assets.length > 0
                    ? formatCurrency(patrimonioLiquido)
                    : '—'}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Dívidas ativas</p>
                <p className="text-sm font-black text-slate-900">{activeDebtsCount > 0 ? activeDebtsCount : '—'}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('manager')}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Manter rotina no Controla →
            </button>
          </div>
        </section>

        {/* 2. O que priorizar agora */}
        <section className={`rounded-[2rem] border p-6 md:p-8 shadow-sm ${recTone.wrapper}`}>
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

        {hasPremiumAccess && passives.length === 0 && (
          <button
            type="button"
            onClick={() => onNavigate('passivos')}
            className="w-full rounded-3xl border border-dashed border-sky-200 bg-sky-50/50 p-6 flex items-center justify-between group hover:bg-sky-50 transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-sky-600">
                <Building2 size={24} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 tracking-tight">Complete seu patrimônio</p>
                <p className="text-xs text-slate-600">
                  Cadastre bens e passivos para consolidar reserva, {INSTITUTIONAL_TERM} e patrimônio líquido.
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-sky-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        )}

        {/* 3. O que os dados estão dizendo */}
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
                      userPlan={currentPlan}
                      userId={userId || 'unknown'}
                      onActionExecuted={() => {}}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Onde aprofundar estrategicamente */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
              <Target size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Estratégia</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">Onde aprofundar</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {strategyModules.map(({ title, description, action, icon: Icon, accent, cta, locked }) => {
              const dynamicBadge = getModuleBadge(title, locked);

              return (
                <button
                  key={title}
                  type="button"
                  onClick={() => (locked ? setLockedModule(title) : action())}
                  className={`text-left rounded-[2rem] border p-6 shadow-sm transition-all group ${
                    locked
                      ? 'border-slate-100 bg-slate-50/50 opacity-90'
                      : 'border-slate-200 bg-white hover:shadow-lg hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${accentClassMap[accent]}`}>
                      <Icon size={22} />
                    </div>
                    <div className="flex items-center gap-2">
                      {dynamicBadge && (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            locked
                              ? 'bg-slate-100 text-slate-500 border-slate-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}
                        >
                          {dynamicBadge}
                        </span>
                      )}
                      {locked && <Lock size={16} className="text-slate-400" />}
                    </div>
                  </div>

                  <h4 className={`text-lg font-black tracking-tight mb-2 ${locked ? 'text-slate-500' : 'text-slate-900'}`}>
                    {title}
                  </h4>
                  <p className={`text-sm leading-relaxed mb-5 ${locked ? 'text-slate-400' : 'text-slate-600'}`}>
                    {description}
                  </p>

                  <span
                    className={`inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest ${
                      locked ? 'text-slate-400' : 'text-slate-900 group-hover:text-sky-600'
                    }`}
                  >
                    {locked ? 'Saber mais' : cta}
                    {!locked && <ChevronRight size={14} />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <BaseDeProtecaoDrawer
        isOpen={showBaseDrawer}
        onClose={() => setShowBaseDrawer(false)}
        colchaoInicialTarget={colchaoInicialTarget}
        colchaoInicialCurrent={marcoZero}
        reserveTarget={reserveTarget}
        reserveCurrent={reserveCurrent}
        protectionMonths={protectionMonths}
        onSave={handleSaveBaseProtecao}
      />

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
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">{lockedModule}</h3>
              <p className="text-slate-600 leading-relaxed mb-6 text-sm">
                {lockedDescriptions[lockedModule] || 'Recurso estratégico disponível no Premium.'}
              </p>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">No Premium você ganha:</p>
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
                  onClick={() => {
                    setLockedModule(null);
                    onNavigate('pricing');
                  }}
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
    </>
  );
};

export default CentralHub;
