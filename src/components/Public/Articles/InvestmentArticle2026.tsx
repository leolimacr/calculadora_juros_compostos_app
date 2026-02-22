import React from 'react';
import { ArrowRight, ChevronLeft, ShieldCheck, Zap, TrendingUp, CheckCircle2 } from 'lucide-react';
export const metadata = {
  id: 'investir-2026',
  title: 'Investir em 2026',
  category: 'Análise',
  excerpt: 'Por que a organização vence a sorte.',
  readTime: '8 min',
  icon: '📈' // ou um ícone do lucide-react, se preferir
};
export const InvestmentArticle2026 = ({ onNavigate }: any) => (
  <div className="max-w-4xl mx-auto px-6 py-12 text-slate-300 leading-relaxed font-sans animate-in fade-in duration-500 pb-32">
    <button onClick={() => onNavigate('home')} className="mb-10 text-sky-400 font-bold flex items-center gap-2 hover:underline text-xs uppercase tracking-widest">
      <ChevronLeft size={16}/> Voltar para o Hub
    </button>
    
    <div className="space-y-10">
      <header className="space-y-4">
         <span className="bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border border-emerald-500/20">Dossiê Estratégico 2026</span>
         <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter">
           O Novo Ciclo da Riqueza: <br/>
           <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">Estratégia e Inteligência em 2026</span>
         </h1>
      </header>
      
      <p className="text-xl text-slate-400 font-medium leading-relaxed border-l-4 border-emerald-500 pl-6 py-2">
        "O ano de 2026 marca o fim do amadorismo financeiro. Com a inteligência artificial fundida ao mercado de capitais, a diferença entre quem enriquece e quem apenas trabalha será a capacidade de dominar dados e antecipar movimentos."
      </p>

      <section className="space-y-6">
        <h2 className="text-3xl font-black text-white">1. O Cenário Macro</h2>
        <p>Estamos vivendo a consolidação da nova economia digital. Juros globais voláteis e a inflação real exigem que o investidor saia da inércia. Em 2026, ativos que geram fluxo de caixa real (dividendos) e empresas com forte vantagem competitiva tecnológica são os novos portos seguros.</p>
      </section>

      <div className="grid md:grid-cols-2 gap-8 my-12">
        <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 shadow-xl">
          <Zap className="text-sky-400 mb-4" size={28}/>
          <h3 className="text-white font-bold text-lg mb-2">Poder da Antecipação</h3>
          <p className="text-sm text-slate-500 leading-relaxed">Não se trata mais de 'adivinhar' o mercado, mas de usar ferramentas de simulação para entender o risco. Quem não projeta o futuro com cálculos de juros reais está apenas contando com a sorte.</p>
        </div>
        <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 shadow-xl">
          <ShieldCheck className="text-emerald-400 mb-4" size={28}/>
          <h3 className="text-white font-bold text-lg mb-2">Blindagem Patrimonial</h3>
          <p className="text-sm text-slate-500 leading-relaxed">A organização financeira (Gerenciador) deixou de ser uma tarefa doméstica e se tornou engenharia de patrimônio. Cada real economizado e aportado em 2026 tem um poder multiplicador 3x maior que há uma década.</p>
        </div>
      </div>

      <section className="bg-gradient-to-br from-slate-900 to-[#020617] p-10 rounded-[3rem] border border-emerald-500/30 shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-[60px] rounded-full"></div>
        <h2 className="text-2xl font-black text-white mb-6 relative z-10">Por que o Gerenciador Financeiro é sua arma principal?</h2>
        <div className="space-y-4 relative z-10">
            <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-1" size={18}/>
                <p className="text-slate-300"><strong>Controle de Sangramento:</strong> Identifique gastos invisíveis que corroem sua capacidade de aporte mensal.</p>
            </div>
            <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-1" size={18}/>
                <p className="text-slate-300"><strong>Clareza de Metas:</strong> Transforme o 'sonho da liberdade' no número exato da sua Independência Financeira (FIRE).</p>
            </div>
        </div>
        <button onClick={() => onNavigate('manager')} className="w-full mt-10 bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 relative z-10">
           ABRIR MEU GERENCIADOR FINANCEIRO <ArrowRight size={20}/>
        </button>
      </section>
    </div>
  </div>
);