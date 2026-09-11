import React, { useState } from 'react';
import { ArrowRight, Wallet, CalendarCheck, ShieldCheck, TrendingUp, Sparkles, ChevronRight, Lock } from 'lucide-react';

interface MobilePublicHomeProps {
  onLogin: () => void;
  onRegister: () => void;
}

interface Pillar {
  id: string;
  number: string;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  practicalExample: string;
  icon: React.FC<{ size?: number; className?: string; strokeWidth?: number }>;
  color: {
    bg: string;
    border: string;
    text: string;
    iconBg: string;
  };
}

const PILLARS: Pillar[] = [
  {
    id: 'caixa',
    number: '01',
    name: 'Caixa & Rotina',
    badge: 'Disponibilidade',
    tagline: 'O que entra e sai no seu dia a dia',
    description: 'Registro sem limite e sem complicações. O dinheiro da sua conta só é livre quando você sabe o destino de cada centavo.',
    practicalExample: 'Acompanhe seu fluxo diário no Controla sem limites de lançamentos no plano gratuito.',
    icon: Wallet,
    color: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-600',
      iconBg: 'bg-emerald-500 text-white',
    },
  },
  {
    id: 'compromissos',
    number: '02',
    name: 'Compromissos',
    badge: 'Obrigações',
    tagline: 'Contas fixas e faturas programadas',
    description: 'Seu dinheiro livre real só existe depois de garantir o que já está comprometido. Sem surpresas no final do mês.',
    practicalExample: 'Previsão de contas a vencer e faturas futuras já descontadas da sua folga do mês.',
    icon: CalendarCheck,
    color: {
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
      text: 'text-sky-600',
      iconBg: 'bg-sky-500 text-white',
    },
  },
  {
    id: 'protecao',
    number: '03',
    name: 'Base de Proteção',
    badge: 'Segurança',
    tagline: 'Colchão inicial e reserva de emergência',
    description: 'A tranquilidade que separa os imprevistos da sua paz mental. Um amortecedor construído passo a passo.',
    practicalExample: 'Metas graduais de colchão de segurança para nunca precisar recorrer a juros caros.',
    icon: ShieldCheck,
    color: {
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      text: 'text-indigo-600',
      iconBg: 'bg-indigo-500 text-white',
    },
  },
  {
    id: 'evolucao',
    number: '04',
    name: 'Evolução',
    badge: 'Trajetória',
    tagline: 'Multiplicação e independência financeira',
    description: 'Quando o caixa está organizado e a proteção construída, seu excedente trabalha para o seu futuro.',
    practicalExample: 'Diagnóstico contínuo do seu estágio financeiro pelo Nexus com visão integrada.',
    icon: TrendingUp,
    color: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-600',
      iconBg: 'bg-amber-500 text-white',
    },
  },
];

export const MobilePublicHome: React.FC<MobilePublicHomeProps> = ({ onLogin, onRegister }) => {
  const [activeTab, setActiveTab] = useState(0);
  const activePillar = PILLARS[activeTab];
  const IconComponent = activePillar.icon;

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col justify-between font-sans pt-20 pb-8 px-5">
      {/* Top Section: Sober Brand & Positioning */}
      <div className="flex flex-col items-center text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold uppercase tracking-wider">
          <Sparkles size={13} className="text-emerald-600" />
          <span>Controle Financeiro Soberano</span>
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-snug max-w-xs">
          Saiba exatamente quanto <span className="text-emerald-600">sobra de verdade</span> no seu mês
        </h1>

        <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
          O Finanças Pro Invest analisa seu caixa, antecipa compromissos e ajuda você a construir segurança e tranquilidade com sobriedade.
        </p>
      </div>

      {/* Interactive 4 Pillars Carousel / Tab Selector */}
      <div className="my-6 space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            A Arquitetura da Liberdade
          </span>
          <span className="text-[10px] font-bold text-emerald-600 font-mono">
            Pilar {activePillar.number} de 04
          </span>
        </div>

        {/* Pillar Pills */}
        <div className="grid grid-cols-4 gap-2">
          {PILLARS.map((p, idx) => {
            const isSelected = activeTab === idx;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`py-2 px-1 rounded-xl text-center transition-all flex flex-col items-center gap-1 border ${
                  isSelected
                    ? 'bg-white border-slate-300 shadow-sm ring-2 ring-slate-950/5'
                    : 'bg-white/60 border-slate-200/80 text-slate-500 hover:bg-white'
                }`}
              >
                <span className={`text-[10px] font-mono font-black ${isSelected ? p.color.text : 'text-slate-500'}`}>
                  {p.number}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-tight truncate max-w-full ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                  {p.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Pillar Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft transition-all space-y-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${activePillar.color.iconBg}`}>
                <IconComponent size={22} strokeWidth={2.2} />
              </div>
              <div>
                <span className={`text-[10px] font-black uppercase tracking-widest block ${activePillar.color.text}`}>
                  {activePillar.badge}
                </span>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  {activePillar.name}
                </h3>
              </div>
            </div>
            <span className="text-xs font-mono font-black text-slate-300">
              #{activePillar.number}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-800">
              {activePillar.tagline}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {activePillar.description}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-start gap-2 bg-slate-50/80 -mx-6 -mb-6 p-4 rounded-b-3xl">
            <div className="p-1 rounded-md bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
              <ChevronRight size={12} strokeWidth={3} />
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              {activePillar.practicalExample}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Actions: Clear Direct CTAs */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={onRegister}
          className="w-full py-4 px-6 rounded-2xl bg-slate-950 text-white font-black text-xs uppercase tracking-widest shadow-floating hover:bg-slate-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>Criar Conta Gratuita</span>
          <ArrowRight size={16} />
        </button>

        <button
          type="button"
          onClick={onLogin}
          className="w-full py-3 px-6 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
        >
          <Lock size={14} className="text-slate-500" />
          <span>Já tenho conta • Entrar</span>
        </button>

        <p className="text-center text-[10px] text-slate-500 pt-1">
          Gratuito para organizar sua rotina diária. Sem necessidade de cartão.
        </p>
      </div>
    </div>
  );
};

export default MobilePublicHome;
