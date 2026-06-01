import React, { useState, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  CreditCard,
  Wallet,
  Crown,
  ChevronRight,
  Lock,
  X,
  TrendingUp,
  Activity,
  Brain,
  Zap,
  ArrowLeft,
} from 'lucide-react';
import { Transaction, UserMeta } from '../types';
import { useDebts } from '../services/debt/debt.hooks';
import { buildUserContext, getCentralInsights } from '../services/nexusInsightEngine';
import NexusActionButton from './Home/NexusActionButton';
import { useWealthData } from '../hooks/useWealthData';
import { getConsecutiveDays, getStreakMilestoneMessage } from '../utils/streakUtils';
import { useNavigate } from 'react-router-dom';

interface CentralHubProps {
  isPro: boolean;
  isPremium: boolean;
  lancamentos: Transaction[];
  userMeta: UserMeta | null | undefined;
  onNavigate: (tool: string) => void;
}

const ConsistencySeal: React.FC<{ streak: number }> = ({ streak }) => {
  const message = useMemo(() => getStreakMilestoneMessage(streak), [streak]);
  const active = streak > 1;

  return (
    <div className={`rounded-2xl px-4 py-3 border transition-all duration-300 ${
      active 
        ? 'bg-amber-50 border-amber-100 text-amber-700 shadow-sm' 
        : 'bg-slate-50 border-slate-100 text-slate-500 opacity-70'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${active ? 'bg-amber-100' : 'bg-slate-200'}`}>
          <Zap size={16} className={active ? 'text-amber-600' : 'text-slate-400'} />
        </div>
        <p className="text-xs font-bold leading-relaxed">{message}</p>
      </div>
    </div>
  );
};

const CentralHub: React.FC<CentralHubProps> = ({
  isPro,
  isPremium,
  lancamentos,
  userMeta,
  onNavigate,
}) => {
  const [lockedModule, setLockedModule] = useState<string | null>(null);

  // Estado para controlar a transparência do título no scroll
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { 
    passives = [], 
    totalInvestments = 0, 
    totalProperty = 0, 
    patrimonioLiquido = 0 
  } = useWealthData();

  const totalAssets = totalInvestments + totalProperty;
  const navigate = useNavigate();

  const handleSmartBack = useCallback(() => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      onNavigate('home');
    }
  }, [navigate, onNavigate]);

  // Descrições de valor para o modal de bloqueio
  const lockedDescriptions: Record<string, string> = {
    'Gestão de Dívidas': 'Assuma o controle total dos seus débitos. O Nexus analisa seus juros e cria um plano matemático de quitação para você sair do vermelho mais rápido.',
    'Investimentos': 'Monitore a rentabilidade real da sua carteira em tempo real. Visualize a alocação de ativos e receba insights sobre diversificação.',
    'Patrimônio': 'Uma visão panorâmica de tudo o que você construiu. Consolide bens, reservas e passivos para entender seu patrimônio líquido real.',
  };

  const hasFinancialProfile = Boolean(userMeta?.financialProfile);

  // Helper para determinar o badge de jornada
  const getModuleBadge = (moduleTitle: string, isLocked: boolean) => {
    if (isLocked) return 'Próximo passo';
    if (moduleTitle === 'Controla' && lancamentos.length > 0) return 'Em uso';
    if (moduleTitle === 'Gestão de Dívidas' && hasFinancialProfile) return 'Ativo';
    if (moduleTitle === 'Nexus IA') return 'Inteligência';
    return null;
  };


  const isCentralUnlocked = isPremium;
  const planLabel = isPremium ? 'Premium' : isPro ? 'Pro' : 'Free';
  const now = new Date();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const validTransactionDates = lancamentos
    .map((t) => new Date(t.date))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  const lastTransactionDate = validTransactionDates[0] ?? null;
  const daysSinceLastTransaction = lastTransactionDate
    ? Math.floor((now.getTime() - lastTransactionDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const recent30DaysTransactions = lancamentos.filter((t) => {
    const transactionDate = new Date(t.date);
    if (Number.isNaN(transactionDate.getTime())) return false;
    return now.getTime() - transactionDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
  });

  const totalIncome30Days = recent30DaysTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  const totalExpense30Days = recent30DaysTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  const balance30Days = totalIncome30Days - totalExpense30Days;
  const userId = lancamentos.length > 0 ? lancamentos[0]?.userId : null;
  const { data: debts = [] } = useDebts(userId || undefined);

  const streak = useMemo(() => getConsecutiveDays(lancamentos), [lancamentos]);

  // LÓGICA DO NEXUS ENGINE PARA CENTRAL
  const nexusInsights = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const txToday = lancamentos.filter(t => t.date === todayStr).length;

    const hasRealEstate = passives.some(p => p.category === 'Imóveis');
    const hasVehicles = passives.some(p => p.category === 'Veículos');
    const debtJustPaidOff = debts.some(d => d.saldoDevedor === 0);

    const ctx = buildUserContext({
      hasFinancialProfile,
      hasPaidAccess: isPro || isPremium,
      isPremium,
      transactionsToday: txToday,
      daysSinceLastTransaction: daysSinceLastTransaction ?? 999,
      launchCount: lancamentos.length,
      launchLimit: userMeta?.launchLimit || 30,
      monthBalance: balance30Days,
      hasFirstInvestment: lancamentos.some(t => t.category?.toLowerCase().includes('investimento')),
      streak,
      hasDebts: debts.length > 0,
      hasRealEstate,
      hasVehicles,
      totalAssetsValue: totalAssets,
      reserveGoalMet: false, // Placeholder até integração com goalService
      debtJustPaidOff,
      debts
    });

    return getCentralInsights(ctx);
  }, [lancamentos, userMeta, isPro, isPremium, balance30Days, daysSinceLastTransaction, hasFinancialProfile, debts, passives, totalAssets, streak]);

  const heroTitle = isPremium
    ? 'Sua vida financeira em uma visão só.'
    : isPro
      ? 'Seu controle diário já está destravado.'
      : 'Comece simples. Evolua com clareza.';

  const heroDescription = isPremium
    ? 'A Central agora deixa de ser só uma vitrine e passa a resumir seu momento financeiro, seu ritmo de uso e o próximo passo mais coerente dentro do ecossistema.'
    : isPro
      ? 'Você já destravou o Controla completo. Agora a Central começa a mostrar contexto real, prioridades e o caminho natural para subir de profundidade.'
      : 'No Free, a Central passa a mostrar seu momento real no produto e deixa visível qual é o próximo salto de valor quando você quiser evoluir.';

  const upgradeButtonLabel =
    !isPro && !isPremium ? 'Desbloquear Pro' : isPro && !isPremium ? 'Evoluir para Premium' : null;

  const centralRecommendation = (() => {
    // 1. FUNDAMENTOS (Atrito Zero)
    if (lancamentos.length === 0) {
      return {
        eyebrow: 'Passo 1: Fundamentos',
        title: 'Ative sua rotina financeira',
        description: 'Sua jornada começa com clareza. Registre sua primeira movimentação no Controla para destravar os próximos passos.',
        cta: 'Abrir Controla',
        action: () => onNavigate('manager'),
        tone: 'amber' as const,
      };
    }

    // 2. OPERACIONAL (Manutenção do Hábito)
    if ((daysSinceLastTransaction ?? 0) >= 7) {
      return {
        eyebrow: 'Passo 2: Consistência',
        title: 'Retome o ritmo dos seus dados',
        description: `Você está há ${daysSinceLastTransaction} dias sem registrar. Dados atualizados geram decisões melhores.`,
        cta: 'Atualizar Lançamentos',
        action: () => onNavigate('manager'),
        tone: 'rose' as const,
      };
    }

    // 3. SEGURANÇA (Dívidas e Perfil)
    if (!hasFinancialProfile) {
      return {
        eyebrow: 'Passo 3: Segurança',
        title: isPremium ? 'Configure seu Plano de Quitação' : 'Mapeie suas dívidas estrategicamente',
        description: isPremium 
          ? 'Use o Nexus para criar uma estratégia matemática e sair do vermelho mais rápido.' 
          : 'Organize seus débitos para visualizar o caminho de saída — recurso completo no Premium.',
        cta: isPremium ? 'Montar Plano' : 'Começar Mapeamento',
        action: () => onNavigate('minhas-dividas'),
        tone: 'sky' as const,
      };
    }

    // 4. CRESCIMENTO (Investimentos e Patrimônio)
    if (!isPremium) {
      return {
        eyebrow: 'Próximo Nível',
        title: 'Conecte sua rotina ao seu futuro',
        description: 'Você já domina o Controla. O próximo passo é integrar investimentos e patrimônio para uma visão de 360º.',
        cta: 'Conhecer o Premium',
        action: () => onNavigate('pricing'),
        tone: 'emerald' as const,
      };
    }

    // 5. PROFUNDIDADE (Usuários Premium)
    return {
      eyebrow: 'Visão Estratégica',
      title: 'Otimize seu Patrimônio Líquido',
      description: 'Todos os seus módulos estão ativos. Use o Nexus IA para analisar sua alocação de ativos e diversificação hoje.',
      cta: 'Consultar Nexus IA',
      action: () => onNavigate('chat'),
      tone: 'violet' as const,
    };
  })();

  const centralModules = [
    {
      title: 'Controla',
      description: 'Rotina financeira, lançamentos e saldo mensal sempre sob controle.',
      action: () => onNavigate('manager'),
      icon: LayoutDashboard,
      accent: 'amber',
      cta: 'Abrir Controla',
      locked: false,
    },
    {
      title: 'Gestão de Dívidas',
      description: 'Acompanhe vencimentos, juros e evolução do seu plano de quitação.',
      action: () => (isCentralUnlocked ? onNavigate('minhas-dividas') : onNavigate('pricing')),
      icon: CreditCard,
      accent: 'rose',
      cta: isCentralUnlocked ? 'Abrir gestão' : 'Ver Premium',
      locked: !isCentralUnlocked,
    },
    {
      title: 'Investimentos',
      description: 'Acompanhe a rentabilidade e o comportamento dos seus ativos.',
      action: () => (isCentralUnlocked ? onNavigate('investimentos') : onNavigate('pricing')),
      icon: Wallet,
      accent: 'emerald',
      cta: isCentralUnlocked ? 'Ver ativos' : 'Ver Premium',
      locked: !isCentralUnlocked,
    },
    {
      title: 'Patrimônio',
      description: 'Consolide seus bens e reservas em uma visão estratégica.',
      action: () => (isCentralUnlocked ? onNavigate('passivos') : onNavigate('pricing')),
      icon: Wallet,
      accent: 'sky',
      cta: isCentralUnlocked ? 'Abrir patrimônio' : 'Ver Premium',
      locked: !isCentralUnlocked,
    },
  ] as const;

  const nexusModule = {
      title: 'Nexus IA',
      description: isPremium
        ? 'Converse com a IA do ecossistema usando mais contexto do seu histórico financeiro.'
        : isPro
          ? 'Use o Nexus com mais contexto da sua rotina e enxergue o próximo passo do produto.'
          : 'Veja como a IA se encaixa na sua jornada financeira antes de subir de plano.',
      action: () => onNavigate('chat'),
      icon: Sparkles,
      accent: 'violet',
      cta: 'Abrir Nexus',
  } as const;

  const accentClassMap = {
    amber: 'from-amber-400/20 to-orange-500/10 border-amber-200 text-amber-600',
    rose: 'from-rose-400/20 to-rose-500/10 border-rose-200 text-rose-500',
    emerald: 'from-emerald-400/20 to-teal-500/10 border-emerald-200 text-emerald-600',
    sky: 'from-sky-400/20 to-indigo-500/10 border-sky-200 text-sky-600',
    violet: 'from-violet-400/20 to-fuchsia-500/10 border-violet-200 text-violet-600',
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

  return (
    <>
      {/* Barra Fixa Invisível para Título CENTRAL (Mobile Only) */}
      <div className={`fixed top-16 left-0 z-[100] md:hidden h-14 w-full px-4 flex items-center bg-transparent pointer-events-none transition-all duration-300 ${isScrolled ? 'opacity-5' : 'opacity-100'}`}>
        <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-700 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] pointer-events-auto">
          Central
        </h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-14 md:pt-6 pb-10 space-y-6 animate-in fade-in duration-300">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-white to-slate-50 border border-slate-200 border-l-4 border-l-emerald-500 p-6 md:p-8 text-slate-900 shadow-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.08),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.06),transparent_28%)]" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Central Financeira
              </span>
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${
                isPremium
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : isPro
                    ? 'bg-sky-100 text-sky-700 border border-sky-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {isPremium ? <Crown size={12} /> : null}
              {planLabel}
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">{heroTitle}</h2>
          <p className="text-slate-600 max-w-3xl leading-relaxed">{heroDescription}</p>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={handleSmartBack}
              className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10"
            >
              <ArrowLeft size={14} /> Voltar
            </button>
            {upgradeButtonLabel && (
              <button
                onClick={() => onNavigate('pricing')}
                className="px-5 py-3 rounded-2xl bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all border border-emerald-400/20"
              >
                {upgradeButtonLabel}
              </button>
            )}
          </div>
        </div>
      </div>

      {isPremium && passives.length === 0 && (
        <div className="rounded-3xl border border-dashed border-sky-200 bg-sky-50/50 p-6 flex items-center justify-between group cursor-pointer hover:bg-sky-50 transition-colors" onClick={() => onNavigate('passivos')}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-sky-600">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 tracking-tight">Complete sua Visão 360º</p>
              <p className="text-xs text-slate-600">Cadastre seus bens patrimoniais para ver seu patrimônio consolidado e saldo líquido real.</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-sky-400 group-hover:translate-x-1 transition-transform" />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            Momento financeiro
          </span>
          <h3 className="mt-3 text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp size={16} className="text-slate-400" /> Últimos 30 dias
          </h3>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Entradas</span>
              <span className="text-sm font-black text-emerald-600">{formatCurrency(totalIncome30Days)}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Saídas</span>
              <span className="text-sm font-black text-rose-600">{formatCurrency(totalExpense30Days)}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Saldo</span>
              <span
                className={`text-sm font-black ${balance30Days >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {formatCurrency(balance30Days)}
              </span>
            </div>
            {isPremium && patrimonioLiquido > 0 && (
              <div className="flex items-center justify-between rounded-2xl bg-violet-600 px-4 py-3 shadow-lg shadow-violet-200">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-100">Patrimônio Líquido</span>
                <span className="text-sm font-black text-white">{formatCurrency(patrimonioLiquido)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Ritmo de uso</span>
          <h3 className="mt-3 text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 mb-4">
            <Activity size={16} className="text-slate-400" /> Sua base atual
          </h3>
          
          <div className="mb-5">
            <ConsistencySeal streak={streak} />
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Lançamentos</p>
              <p className="text-2xl font-black text-slate-900">{lancamentos.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">
                Último registro
              </p>
              <p className="text-sm font-bold text-slate-900">
                {lastTransactionDate
                  ? lastTransactionDate.toLocaleDateString('pt-BR')
                  : 'Nenhum lançamento ainda'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {daysSinceLastTransaction === null
                  ? 'Seu histórico ainda vai começar.'
                  : daysSinceLastTransaction === 0
                    ? 'Você registrou movimentação hoje.'
                    : `Faz ${daysSinceLastTransaction} dia(s) desde o último lançamento.`}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
              <div className="flex justify-between items-end mb-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Módulos Ativados</p>
                <p className="text-[10px] font-black text-sky-600">
                  {[lancamentos.length > 0, hasFinancialProfile, isPremium, isPremium].filter(Boolean).length} de 4
                </p>
              </div>
              {/* Mini barra de progresso */}
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-sky-500 transition-all duration-1000" 
                  style={{ width: `${([lancamentos.length > 0, hasFinancialProfile, isPremium, isPremium].filter(Boolean).length / 4) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tight">
                {isPremium ? 'Jornada Completa Ativada' : 'Desbloqueie módulos no Premium'}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`rounded-[2rem] border p-6 shadow-sm ${recommendationToneMap[centralRecommendation.tone].wrapper}`}
        >
          <span
            className={`text-[10px] font-black uppercase tracking-[0.2em] ${recommendationToneMap[centralRecommendation.tone].eyebrow}`}
          >
            {centralRecommendation.eyebrow}
          </span>
          <h3 className="mt-3 text-lg font-black text-slate-900 tracking-tight">{centralRecommendation.title}</h3>
          <p className="mt-3 text-sm text-slate-700 leading-relaxed">{centralRecommendation.description}</p>
          <button
            onClick={centralRecommendation.action}
            className={`mt-5 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${recommendationToneMap[centralRecommendation.tone].button}`}
          >
            {centralRecommendation.cta}
          </button>
        </div>
      </div>

      {/* ANÁLISES DO NEXUS */}
      {nexusInsights.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-xl text-violet-600">
              <Brain size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Inteligência Estratégica</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">Análises do Nexus</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nexusInsights.map((insight) => (
              <div key={insight.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
                <div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-4 ${
                    insight.priority === 'alta' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                    insight.priority === 'media' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                    'bg-sky-50 text-sky-600 border border-sky-100'
                  }`}>
                    <Sparkles size={16} />
                  </div>
                  <h4 className="text-base font-black text-slate-900 mb-2 leading-tight">{insight.message.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-6">{insight.message.body}</p>
                </div>
                <button
                  onClick={() => onNavigate(insight.deepLink)}
                  className="w-full py-3 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  {insight.message.ctaLabel} <ChevronRight size={14} />
                </button>

                {insight.action && (
                  <NexusActionButton
                    insight={insight}
                    userPlan={isPremium ? 'premium' : isPro ? 'pro' : 'free'}
                    userId={userId || 'unknown'}
                    onActionExecuted={() => console.log(`Ação ${insight.action?.type} executada na Central para o insight ${insight.id}`)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Módulos</p>
          <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">Ações da Central</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Nexus IA em Destaque */}
        <button
            onClick={nexusModule.action}
            className="xl:col-span-3 text-left rounded-[2rem] border border-violet-200 bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${accentClassMap[nexusModule.accent]}`}>
                    <nexusModule.icon size={28} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">{nexusModule.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{nexusModule.description}</p>
                </div>
            </div>
            <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-900 group-hover:text-violet-600 transition-colors mr-2">
                {nexusModule.cta} <ChevronRight size={14} />
            </span>
        </button>

        {centralModules.map(({ title, description, action, icon: Icon, accent, cta, locked }: { 
          title: string, 
          description: string, 
          action: () => void, 
          icon: any, 
          accent: keyof typeof accentClassMap, 
          cta: string, 
          locked: boolean 
        }) => {
          const dynamicBadge = getModuleBadge(title, locked);
          
          return (
            <button
              key={title}
              onClick={() => locked ? setLockedModule(title) : action()}
              className={`text-left rounded-[2rem] border p-6 shadow-sm transition-all group relative
                ${locked ? 'border-slate-100 bg-slate-50/50 opacity-80' : 'border-slate-200 bg-white hover:shadow-lg hover:-translate-y-0.5'}`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${accentClassMap[accent]}`}>
                  <Icon size={22} />
                </div>
                
                <div className="flex items-center gap-2">
                  {dynamicBadge && (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
                      ${locked ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                      {dynamicBadge}
                    </span>
                  )}
                  {locked && <Lock size={16} className="text-slate-400" />}
                </div>
              </div>

              <h3 className={`text-lg font-black tracking-tight mb-2 ${locked ? 'text-slate-500' : 'text-slate-900'}`}>{title}</h3>
              <p className={`text-sm leading-relaxed mb-5 min-h-[66px] ${locked ? 'text-slate-400' : 'text-slate-600'}`}>
                {description}
                {locked && (
                  <span className="block mt-3 text-[11px] font-bold text-sky-600 uppercase tracking-tight hover:underline">
                    Ver visão completa →
                  </span>
                )}
              </p>

              <div className="flex items-center justify-between gap-3">
                <span className={`inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-colors
                  ${locked ? 'text-slate-400' : 'text-slate-900 group-hover:text-sky-600'}`}>
                  {locked ? 'Saber valor' : cta}
                  {!locked && <ChevronRight size={14} />}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal de Módulo Bloqueado */}
      {lockedModule && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-sky-50 rounded-2xl text-sky-600">
                  <Lock size={32} />
                </div>
                <button onClick={() => setLockedModule(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
                {lockedModule}
              </h3>
              <p className="text-slate-600 leading-relaxed mb-8">
                {lockedDescriptions[lockedModule] || 'Esta funcionalidade exclusiva ajuda você a atingir um novo nível de clareza financeira.'}
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setLockedModule(null); onNavigate('pricing'); }}
                  className="w-full py-4 rounded-2xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-200"
                >
                  Conhecer Planos Premium
                </button>
                <button
                  onClick={() => setLockedModule(null)}
                  className="w-full py-4 rounded-2xl bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Agora não
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default CentralHub;
