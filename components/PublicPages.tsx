import React from 'react';
import { MarketQuote } from '../types';
import { MarketTickerBar } from './Widgets';

// Interface definitions
interface PublicHomeProps {
  onNavigate: (page: string) => void;
  onStartNow: () => void;
  onAssetClick?: (asset: MarketQuote) => void;
}

interface PageProps {
  onNavigate: (page: string) => void;
}

// --- PublicHome ---
export const PublicHome: React.FC<PublicHomeProps> = ({ onNavigate, onStartNow, onAssetClick }) => {
  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="text-center space-y-8 pt-10 px-4 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-emerald-400 mb-4 animate-in slide-in-from-top-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Nova Versão 2.0 Disponível
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Domine o Jogo do <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Seu Dinheiro</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Pare de adivinhar. Use ferramentas profissionais para calcular juros compostos, planejar sua aposentadoria (FIRE) e sair das dívidas. 
          <span className="block mt-2 text-slate-500 text-base">Sem planilhas chatas. Sem "economês".</span>
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 px-4 pt-4">
            <button 
              onClick={onStartNow} 
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-bold px-8 py-4 rounded-xl shadow-lg shadow-emerald-900/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              Começar Agora <span className="text-xl">🚀</span>
            </button>
            <button 
              onClick={() => onNavigate('demo')} 
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white text-lg font-bold px-8 py-4 rounded-xl border border-slate-700 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <span>👁️</span> Ver Demonstração
            </button>
        </div>
        
        {/* Social Proof / Stats */}
        <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto opacity-70">
           <div>
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest">Privacidade</div>
           </div>
           <div>
              <div className="text-2xl font-bold text-white">Offline</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest">First</div>
           </div>
           <div>
              <div className="text-2xl font-bold text-white">8+</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest">Ferramentas</div>
           </div>
           <div>
              <div className="text-2xl font-bold text-white">Grátis</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest">Para Começar</div>
           </div>
        </div>
      </section>

      {/* Feature Highlight: Juros Compostos */}
      <section className="max-w-6xl mx-auto px-4 py-12">
         <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl relative group cursor-pointer" onClick={() => onNavigate('compound')}>
            <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/20 transition-all"></div>
            <div className="grid md:grid-cols-2 gap-8 items-center p-8 md:p-12">
               <div className="space-y-6">
                  <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center text-2xl">📈</div>
                  <h2 className="text-3xl font-bold text-white">O Poder dos Juros Compostos</h2>
                  <p className="text-slate-400 text-lg">
                     Você sabe quanto teria se investisse R$ 500 por mês durante 20 anos? Nossa calculadora mostra exatamente o efeito "bola de neve" no seu patrimônio.
                  </p>
                  <button className="text-indigo-400 font-bold flex items-center gap-2 hover:text-white transition-colors">
                     Simular Agora <span>→</span>
                  </button>
               </div>
               <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700 shadow-inner opacity-90 group-hover:scale-[1.02] transition-transform duration-500">
                  {/* Mock Graph */}
                  <div className="flex items-end justify-between h-40 gap-2">
                     {[20, 35, 45, 60, 80, 100].map((h, i) => (
                        <div key={i} className="w-full bg-indigo-500 rounded-t-lg opacity-80" style={{ height: `${h}%` }}></div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
         <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-emerald-500/50 transition-all group cursor-pointer" onClick={() => onNavigate('fire')}>
            <span className="text-4xl mb-4 block">🔥</span>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">Movimento FIRE</h3>
            <p className="text-slate-400 text-sm">Descubra seu número de independência financeira e aposente-se mais cedo.</p>
         </div>
         <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-orange-500/50 transition-all group cursor-pointer" onClick={() => onNavigate('manager')}>
            <span className="text-4xl mb-4 block">💰</span>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">Fluxo de Caixa</h3>
            <p className="text-slate-400 text-sm">Gerencie receitas e despesas. Entenda para onde seu dinheiro está indo.</p>
         </div>
         <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-red-500/50 transition-all group cursor-pointer" onClick={() => onNavigate('debt')}>
            <span className="text-4xl mb-4 block">🏔️</span>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors">Adeus Dívidas</h3>
            <p className="text-slate-400 text-sm">Use o método Avalanche para eliminar dívidas pagando o mínimo de juros possível.</p>
         </div>
      </section>

      {/* Market Ticker (Preview) */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
         <div className="text-center mb-6">
            <h3 className="text-white font-bold text-lg">De olho no Mercado</h3>
            <p className="text-slate-500 text-sm">Cotações em tempo real (USD, BTC, IBOV)</p>
         </div>
         <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <MarketTickerBar onAssetClick={onAssetClick} />
         </div>
      </section>
    </div>
  );
};

// --- DemoPage ---
export const DemoPage: React.FC<PageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-in slide-in-from-right duration-500">
      <div className="text-center mb-12">
         <h1 className="text-3xl font-bold text-white mb-4">Demonstração Interativa</h1>
         <p className="text-slate-400">
            Veja como o painel funciona. <button onClick={() => onNavigate('register')} className="text-emerald-400 hover:underline font-bold">Crie sua conta</button> para salvar seus dados.
         </p>
      </div>
      
      <div className="bg-slate-800 rounded-2xl p-2 border border-slate-700 shadow-2xl relative">
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 pointer-events-none rounded-2xl"></div>
         
         {/* Fake Dashboard Preview */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 opacity-50 blur-[1px] select-none">
            <div className="col-span-2 bg-slate-700 h-64 rounded-xl"></div>
            <div className="bg-slate-700 h-64 rounded-xl"></div>
            <div className="bg-slate-700 h-40 rounded-xl"></div>
            <div className="col-span-2 bg-slate-700 h-40 rounded-xl"></div>
         </div>

         <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="bg-slate-900/90 backdrop-blur-md p-8 rounded-3xl border border-slate-600 text-center max-w-md shadow-2xl">
               <span className="text-4xl mb-4 block">✨</span>
               <h3 className="text-xl font-bold text-white mb-2">Experimente na Prática</h3>
               <p className="text-slate-400 text-sm mb-6">
                  A melhor forma de entender é usando. O plano gratuito inclui acesso ao Gerenciador e Simuladores.
               </p>
               <button 
                 onClick={() => onNavigate('manager')}
                 className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all hover:scale-105"
               >
                 Abrir Gerenciador (Modo Guest)
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

// --- GuidesPage ---
export const GuidesPage: React.FC<PageProps> = ({ onNavigate }) => {
  return (
    <div className="text-center py-20 animate-in fade-in">
        <h2 className="text-2xl font-bold text-white">Hub de Conhecimento</h2>
        <p className="text-slate-400 mt-2 mb-6">Acesse nossos artigos completos na nova seção de Blog.</p>
        <button 
          onClick={() => onNavigate('blog')} 
          className="bg-slate-800 hover:bg-slate-700 text-emerald-400 px-6 py-3 rounded-xl border border-slate-700 transition-colors font-bold"
        >
          Ir para o Blog
        </button>
    </div>
  );
};

// --- FaqPage ---
export const FaqPage: React.FC<PageProps> = ({ onNavigate }) => {
  const faqs = [
    { q: "É realmente gratuito?", a: "Sim! Temos um plano gratuito generoso que inclui todas as calculadoras e o gerenciador com limite de 30 lançamentos. Para uso ilimitado e backup na nuvem, temos o plano Premium." },
    { q: "Meus dados estão seguros?", a: "Sim. No modo gratuito/local, os dados ficam apenas no seu navegador. No modo Premium, são criptografados e salvos no Google Firebase." },
    { q: "Preciso saber investir?", a: "Não. O app é focado em organização e planejamento. As ferramentas são educativas para ajudar você a aprender." },
    { q: "Funciona no celular?", a: "Sim! O Finanças Pro é um PWA (Progressive Web App). Você pode instalá-lo no seu Android ou iOS e usar como um aplicativo nativo." }
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4">
      <h1 className="text-3xl font-bold text-white mb-8 text-center">Perguntas Frequentes</h1>
      <div className="space-y-4">
        {faqs.map((item, idx) => (
          <details key={idx} className="bg-slate-800 rounded-xl border border-slate-700 group open:border-emerald-500/50 transition-all">
            <summary className="p-6 font-bold text-white cursor-pointer list-none flex justify-between items-center text-lg">
              {item.q}
              <span className="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-6 text-slate-300 leading-relaxed border-t border-slate-700/50 pt-4">
              {item.a}
            </div>
          </details>
        ))}
      </div>
      <div className="text-center mt-12">
         <p className="text-slate-400 mb-4">Ainda com dúvidas?</p>
         <button onClick={() => onNavigate('sobre')} className="text-emerald-400 font-bold hover:text-white transition-colors">Entre em contato</button>
      </div>
    </div>
  );
};

// --- AboutPage ---
export const AboutPage: React.FC<PageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center animate-in zoom-in duration-500">
       <div className="w-24 h-24 bg-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-900/50 rotate-3">
          <span className="text-5xl font-bold text-white">FP</span>
       </div>
       
       <h1 className="text-3xl font-bold text-white mb-6">Sobre o Finanças Pro Invest</h1>
       
       <div className="prose prose-invert prose-lg mx-auto text-slate-300">
          <p>
             Nascemos da frustração com planilhas complicadas e aplicativos bancários cheios de anúncios. 
             Acreditamos que a liberdade financeira é uma questão de <strong>matemática + comportamento</strong>.
          </p>
          <p>
             Nossa missão é fornecer ferramentas profissionais, precisas e fáceis de usar para que qualquer pessoa possa tomar o controle do seu futuro.
          </p>
          <p>
             Somos transparentes, focados em privacidade e obcecados por design funcional.
          </p>
       </div>

       <div className="mt-12 pt-8 border-t border-slate-800">
          <p className="text-sm text-slate-500 mb-2">Contato</p>
          <a href="mailto:contato@financasproinvest.com.br" className="text-emerald-400 hover:text-white transition-colors font-bold text-lg">
             contato@financasproinvest.com.br
          </a>
       </div>
    </div>
  );
};