import React from 'react';
import { Browser } from '@capacitor/browser';
import { TrendingUp, Target, X, ChevronRight, Sparkles, LayoutGrid, Brain, Crown, BarChart3, FileText, Shield } from 'lucide-react';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

export default function PaywallModal({ open, onClose, feature }: PaywallModalProps) {
  if (!open) return null;

  const normalized = feature?.toLowerCase() || '';
  const isHistory =
    normalized.includes('histor') ||
    normalized.includes('retrovisor') ||
    normalized.includes('mês anterior') ||
    normalized.includes('mes anterior');
  const isPremiumModule =
    normalized.includes('divida') ||
    normalized.includes('invest') ||
    normalized.includes('passivo') ||
    normalized.includes('patrim') ||
    normalized.includes('premium');
  const isIA =
    normalized.includes('nexus') ||
    normalized.includes('ia') ||
    normalized.includes('chat');

  const context = isHistory
    ? {
        title: 'Seu passado revela sua proteção real',
        subtitle:
          'Sua rotina no Free segue sem limites. No Pro, você acessa meses e anos anteriores para comparar períodos, ver padrões e entender sua verdadeira margem de segurança.',
        icon: <TrendingUp size={22} className="text-sky-400" />,
        cta: 'Liberar histórico completo',
        benefits: [
          { icon: <LayoutGrid size={14} className="text-sky-500" />, text: 'Histórico completo — todos os meses e anos' },
          { icon: <BarChart3 size={14} className="text-emerald-500" />, text: 'Compare períodos e veja suas médias reais' },
          { icon: <FileText size={14} className="text-indigo-500" />, text: 'Exporte relatórios de qualquer período' },
        ],
      }
    : isPremiumModule
      ? {
          title: 'Sua soberania conecta tudo',
          subtitle:
            'No Premium, sua rotina, dívidas, investimentos e patrimônio se encontram num só comando. Decisões conectadas, visão completa do seu ecossistema financeiro.',
          icon: <Crown size={22} className="text-amber-400" />,
          cta: 'Conhecer o Premium',
          benefits: [
            { icon: <Target size={14} className="text-rose-500" />, text: 'Gestão de Dívidas com projeções e estratégia' },
            { icon: <TrendingUp size={14} className="text-emerald-500" />, text: 'Acompanhamento de investimentos e carteira' },
            { icon: <LayoutGrid size={14} className="text-sky-500" />, text: 'Patrimônio líquido consolidado' },
            { icon: <Shield size={14} className="text-indigo-500" />, text: 'Central completa com visão estratégica' },
          ],
        }
      : isIA
        ? {
            title: 'Análises mais profundas no Pro',
            subtitle:
              'O Nexus já funciona no seu Free com o mês atual. No Pro, ele enxerga seu histórico completo para análises mais precisas, padrões sazonais e comparações entre períodos.',
            icon: <Sparkles size={22} className="text-violet-400" />,
            cta: 'Liberar análises completas',
            benefits: [
              { icon: <Brain size={14} className="text-indigo-500" />, text: 'Nexus com acesso ao seu histórico completo' },
              { icon: <BarChart3 size={14} className="text-emerald-500" />, text: 'Análises e comparações entre períodos' },
              { icon: <TrendingUp size={14} className="text-sky-500" />, text: 'Padrões que o mês atual sozinho não mostra' },
            ],
          }
        : {
            title: 'Seu passado revela mais',
            subtitle:
              'Continue usando o Free para sua rotina. No Pro, você acessa seu histórico completo para comparar períodos, ver padrões e basear decisões em dados reais.',
            icon: <TrendingUp size={22} className="text-emerald-400" />,
            cta: 'Liberar histórico completo',
            benefits: [
              { icon: <LayoutGrid size={14} className="text-sky-500" />, text: 'Histórico completo de todos os meses' },
              { icon: <BarChart3 size={14} className="text-emerald-500" />, text: 'Comparações e médias ao longo do tempo' },
              { icon: <FileText size={14} className="text-indigo-500" />, text: 'Relatórios e exportação de períodos anteriores' },
              { icon: <Brain size={14} className="text-violet-500" />, text: 'Nexus com contexto do seu histórico' },
            ],
          };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 px-6 pt-8 pb-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {context.icon}
          </div>
          <h2 className="text-white text-lg font-black tracking-tight mb-1">
            {context.title}
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto font-medium">
            {context.subtitle}
          </p>
        </div>

        <div className="px-6 py-5 space-y-3">
          {context.benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                {b.icon}
              </div>
              <span className="text-slate-700 text-sm font-bold tracking-tight">{b.text}</span>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={() => Browser.open({ url: 'https://financasproinvest.com.br/pricing' })}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 uppercase text-xs tracking-widest"
          >
            {context.cta} <ChevronRight size={16} />
          </button>
          <button
            onClick={onClose}
            className="w-full text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest py-2 transition-colors"
          >
            Seguir registrando minha rotina
          </button>
        </div>
      </div>
    </div>
  );
}
