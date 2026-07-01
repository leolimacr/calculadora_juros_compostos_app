import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, TrendingUp, Target, MessageSquare,
  Bell, BarChart2, Lock, ChevronRight, CheckCircle2
} from 'lucide-react';

const PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 9,90',
    period: '/mês',
    highlight: false,
    badge: null,
    description: 'Para quem quer controle da rotina financeira sem limitação.',
    features: [
      'Lançamentos ilimitados',
      'Nexus com memória de 120 dias',
      'Histórico de conversas (30 dias)',
      'Metas de aporte com lembretes',
      'Ferramentas de simulação completas',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 19,90',
    period: '/mês',
    highlight: true,
    badge: 'Mais escolhido',
    description: 'Para quem quer construir patrimônio com acompanhamento de longo prazo.',
    features: [
      'Tudo do Pro, mais:',
      'Nexus com memória de 4 anos',
      'Web Search em tempo real no chat',
      'Histórico de conversas (90 dias)',
      'Acesso completo ao ecossistema',
      'Prioridade no suporte',
    ],
  },
];

const FEATURE_ICONS = [
  { icon: <MessageSquare size={18} className="text-sky-500" />, label: 'Nexus sem limites' },
  { icon: <TrendingUp size={18} className="text-emerald-500" />, label: 'Patrimônio monitorado' },
  { icon: <Target size={18} className="text-amber-500" />, label: 'Metas de aporte' },
  { icon: <Bell size={18} className="text-indigo-500" />, label: 'Lembretes inteligentes' },
  { icon: <BarChart2 size={18} className="text-rose-500" />, label: 'Simulações avançadas' },
  { icon: <Zap size={18} className="text-orange-500" />, label: 'Plano de quitação IA' },
];

export default function UpgradePage() {
  const navigate = useNavigate();
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-widest mb-4">
          <Lock size={10} /> Planos Pro
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-3">
          Deixe o Nexus trabalhar<br />pela sua liberdade financeira.
        </h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
          O plano gratuito te dá uma amostra. O Pro e o Premium te dão o ecossistema completo — sem limite de perguntas, com acompanhamento real.
        </p>
      </div>

      {/* Feature pills */}
      <div className="grid grid-cols-3 gap-2 mb-10">
        {FEATURE_ICONS.map((f, i) => (
          <div key={i} className="flex flex-col items-center gap-2 bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              {f.icon}
            </div>
            <span className="text-[10px] font-bold text-slate-600 leading-tight">{f.label}</span>
          </div>
        ))}
      </div>

      {/* Plans */}
      <div className="space-y-4 mb-8">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-3xl border p-6 transition-all ${
              plan.highlight
                ? 'border-emerald-300 bg-emerald-50 shadow-lg shadow-emerald-100'
                : 'border-slate-200 bg-white shadow-sm'
            }`}
          >
            {plan.badge && (
              <span className="absolute -top-3 left-6 text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white px-3 py-1 rounded-full shadow">
                {plan.badge}
              </span>
            )}

            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                <p className="text-slate-500 text-xs mt-0.5 max-w-[200px] leading-relaxed">{plan.description}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900">{plan.price}</span>
                <span className="text-xs text-slate-500 font-medium">{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-2 mb-6">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span className="text-sm text-slate-700">{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate('/app/mais/pricing')}
              className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                plan.highlight
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-900 hover:bg-slate-700 text-white'
              }`}
            >
              Assinar plano {plan.name} <ChevronRight size={16} />
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-500 leading-relaxed">
        Pagamento seguro. Cancele quando quiser.<br />Dúvidas? <span className="text-emerald-600 font-bold">contato@financasproinvest.com.br</span>
      </p>
    </div>
  );
}
