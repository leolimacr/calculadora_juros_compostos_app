import React from 'react';

export const PublicHome: React.FC<any> = ({ onNavigate, onStartNow }) => {
  return (
    <div className="space-y-16 pb-20 animate-in fade-in duration-700">
      {/* SEÇÃO HERO: Chamada Principal */}
      <section className="text-center pt-10 px-4">
        <div className="inline-block bg-sky-500/10 border border-sky-500/20 px-4 py-1.5 rounded-full text-sky-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
          Inteligência Financeira
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
          Domine seu dinheiro com <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">Poder de IA</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg mb-10">
          O Ecossistema Finanças Pro Invest une gestão de gastos, simuladores avançados e um consultor virtual pronto para guiar seu patrimônio.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={onStartNow} className="bg-sky-500 hover:bg-sky-400 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-sky-900/40 transition-all active:scale-95">
            Começar Agora Grátis
          </button>
          <button onClick={() => onNavigate('compound')} className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold text-lg border border-slate-700 hover:bg-slate-700 transition-all">
            Ver Simuladores
          </button>
        </div>
      </section>

      {/* SEÇÃO NOTÍCIAS/FEED (TÓPICO 1 DO PLANO) */}
      <section className="grid md:grid-cols-3 gap-8 px-4">
        <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 hover:border-sky-500/30 transition-colors group">
          <span className="text-3xl mb-4 block">🤖</span>
          <h3 className="text-white font-bold text-xl mb-3">IA no Mercado</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">Descubra como o Google Gemini e a Groq estão revolucionando a análise de investimentos em 2026.</p>
          <button onClick={() => onNavigate('blog')} className="text-sky-400 font-bold text-xs uppercase tracking-widest group-hover:underline">Ler artigo &rarr;</button>
        </div>

        <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 hover:border-emerald-500/30 transition-colors group">
          <span className="text-3xl mb-4 block">📈</span>
          <h3 className="text-white font-bold text-xl mb-3">Foco no Dividendos</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">Estratégias para viver de renda usando juros compostos. Use nosso simulador para projetar seu futuro.</p>
          <button onClick={() => onNavigate('pricing')} className="text-emerald-400 font-bold text-xs uppercase tracking-widest group-hover:underline">Seja PRO &rarr;</button>
        </div>

        <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 hover:border-indigo-500/30 transition-colors group">
          <span className="text-3xl mb-4 block">🛡️</span>
          <h3 className="text-white font-bold text-xl mb-3">Segurança Bancária</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">Por que seus dados estão mais seguros em um ecossistema fechado do que em planilhas abertas.</p>
          <button onClick={() => onNavigate('blog')} className="text-indigo-400 font-bold text-xs uppercase tracking-widest group-hover:underline">Saiba mais &rarr;</button>
        </div>
      </section>

      {/* BANNER DE CHAMADA PARA O APP */}
      <section className="bg-gradient-to-r from-sky-900/40 to-emerald-900/40 p-10 rounded-[3rem] border border-white/5 mx-4 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-md">
          <h2 className="text-2xl font-bold text-white mb-2">Leve o Gerenciador no Bolso</h2>
          <p className="text-slate-300">Baixe nosso App para Android e faça lançamentos rápidos em segundos. Grátis até 30 registros.</p>
        </div>
        <button onClick={onStartNow} className="bg-white text-slate-950 px-10 py-4 rounded-2xl font-black whitespace-nowrap shadow-2xl active:scale-95 transition-all">
          BAIXAR APP AGORA
        </button>
      </section>
    </div>
  );
};

export const DemoPage = () => <div className="text-white p-10">Página de Demonstração em Breve</div>;
export const GuidesPage = () => <div className="text-white p-10">Guias Financeiros em Breve</div>;
export const FaqPage = () => <div className="text-white p-10">Perguntas Frequentes</div>;
export const AboutPage = () => <div className="text-white p-10">Sobre o Ecossistema Finanças Pro Invest</div>;