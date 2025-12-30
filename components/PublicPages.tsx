
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NewsWidget, MarketWidget, MarketTickerBar } from './Widgets';

// --- Banner Desktop ---
const DesktopAppBanner = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        const lastClosed = localStorage.getItem('finpro_banner_closed');
        const now = new Date().getTime();
        
        if (!isMobile && (!lastClosed || now - parseInt(lastClosed) > 7 * 24 * 60 * 60 * 1000)) {
            setVisible(true);
        }
    }, []);

    if (!visible) return null;

    return (
        <div className="hidden md:flex bg-gradient-to-r from-emerald-900/90 to-slate-900/95 text-white p-3 items-center justify-center gap-6 relative border-b border-emerald-500/30 animate-in slide-in-from-top-full duration-500">
            <div className="flex items-center gap-3">
                <span className="text-2xl">📱</span>
                <div>
                    <p className="text-sm font-bold">Melhor experiência no app mobile!</p>
                    <p className="text-xs text-slate-300">Instale o Finanças Pro Invest para acessar offline.</p>
                </div>
            </div>
            <button className="bg-white text-emerald-900 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors">
                Instalar App
            </button>
            <button 
                onClick={() => {
                    setVisible(false);
                    localStorage.setItem('finpro_banner_closed', new Date().getTime().toString());
                }}
                className="absolute right-4 text-slate-400 hover:text-white"
            >
                ✕
            </button>
        </div>
    );
};

// --- Home Pública ---
export const PublicHome: React.FC<{ onNavigate: (path: any) => void; onStartNow: () => void }> = ({ onNavigate, onStartNow }) => {
  return (
    <>
    <DesktopAppBanner />
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_400px] gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24 lg:pb-0">
      {/* Hero Central */}
      <div className="space-y-12">
        <section className="text-center py-16 md:py-20 px-4 relative overflow-hidden rounded-3xl bg-slate-900/50 border border-slate-800">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>
          
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6 leading-[1.1] tracking-tight">
            Domine o Jogo<br/>do Dinheiro
          </h1>
          
          <div className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed font-light space-y-2">
            <h2 className="sr-only">Gerenciador Financeiro Gratuito e Calculadora FIRE</h2>
            <p>Simuladores profissionais, gerenciamento de caixa e educação financeira.</p>
            <p className="hidden md:block">
              Tudo, <span className="text-emerald-400 font-bold">GRATUITAMENTE</span>, em um só lugar. 
              Basta criar sua conta para acesso a todas as nossas <span className="text-white font-bold">FERRAMENTAS</span>.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 px-4">
            <button 
              onClick={onStartNow} 
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-bold px-8 py-4 rounded-xl shadow-lg shadow-emerald-900/30 transition-all hover:scale-105 active:scale-95"
            >
              Começar Agora
            </button>
            <button 
              onClick={() => onNavigate('demo')} 
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white text-lg font-bold px-8 py-4 rounded-xl border border-slate-600 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <span>👁️</span> Ver Demonstração
            </button>
          </div>
        </section>

        {/* 8 Ferramentas Header */}
        <div className="text-center py-4 px-4">
            <h2 className="text-xl font-bold text-white uppercase tracking-widest border-b border-slate-800 pb-4">
                <span className="text-emerald-500 block md:inline">8 Ferramentas Poderosas</span> para dominar suas finanças
            </h2>
        </div>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/30 transition-colors group flex items-start gap-4">
              <span className="text-4xl group-hover:scale-110 transition-transform">💰</span>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Gerenciador Financeiro</h3>
                <p className="text-slate-400 text-sm">Controle completo de fluxo de caixa e metas.</p>
              </div>
           </div>
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/30 transition-colors group flex items-start gap-4">
              <span className="text-4xl group-hover:scale-110 transition-transform">📈</span>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Simulador Juros Compostos</h3>
                <p className="text-slate-400 text-sm">Visualize o poder do tempo no seu patrimônio.</p>
              </div>
           </div>
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/30 transition-colors group flex items-start gap-4">
              <span className="text-4xl group-hover:scale-110 transition-transform">🔥</span>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Calculadora FIRE</h3>
                <p className="text-slate-400 text-sm">Descubra sua liberdade financeira.</p>
              </div>
           </div>
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/30 transition-colors group flex items-start gap-4">
              <span className="text-4xl group-hover:scale-110 transition-transform">🏔️</span>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Otimizador de Dívidas</h3>
                <p className="text-slate-400 text-sm">Método Avalanche para sair do vermelho.</p>
              </div>
           </div>
        </section>
        
        <div className="text-center pb-8">
            <p className="text-slate-500 text-sm mb-6 px-4">+ Aluguel vs Financiamento, ROI, Dividendos e Simulador de Crise.</p>
            <button onClick={onStartNow} className="text-emerald-400 font-bold hover:text-white transition-colors border-b border-emerald-500/30 pb-1 text-lg">
                Criar conta gratuita para acessar tudo →
            </button>
        </div>
      </div>

      {/* Sidebar News & Market */}
      <aside className="space-y-6">
        <NewsWidget />
        <MarketTickerBar />
        <MarketWidget />
        <div className="bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-2xl text-center">
           <h4 className="font-bold text-emerald-400 mb-2">Cadastre-se Gratuitamente</h4>
           <p className="text-xs text-slate-300 mb-4">Tenha acesso a todas as 8 ferramentas exclusivas.</p>
           <button onClick={onStartNow} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm transition-colors">
             Criar Conta
           </button>
        </div>
      </aside>
    </div>
    </>
  );
};

// ... Resto dos componentes (DemoPage, GuidesPage, etc) mantidos iguais, apenas a PublicHome foi alterada
export const DemoPage: React.FC<{ onNavigate: (path: any) => void }> = ({ onNavigate }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 'manager',
      title: 'Gerenciador Financeiro',
      icon: '💰',
      question: 'Para onde está indo o seu dinheiro?',
      desc: 'Não é apenas uma lista de gastos. O Gerenciador permite categorizar despesas, criar metas de poupança e visualizar o fluxo de caixa mensal. Essencial para organizar a casa antes de começar a investir.',
      visual: (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 space-y-3">
           <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-emerald-400">Entradas: R$ 5.000</span>
              <span className="text-xs font-bold text-orange-400">Saídas: R$ 3.200</span>
           </div>
           <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300 bg-slate-800 p-2 rounded">
                 <span>🛒 Supermercado</span>
                 <span className="font-mono text-orange-300">-R$ 450,00</span>
              </div>
              <div className="flex justify-between text-xs text-slate-300 bg-slate-800 p-2 rounded">
                 <span>🏠 Aluguel</span>
                 <span className="font-mono text-orange-300">-R$ 1.200,00</span>
              </div>
              <div className="flex justify-between text-xs text-slate-300 bg-slate-800 p-2 rounded border-l-2 border-emerald-500">
                 <span>💰 Salário</span>
                 <span className="font-mono text-emerald-300">+R$ 5.000,00</span>
              </div>
           </div>
        </div>
      )
    },
    {
      id: 'compound',
      title: 'Juros Compostos',
      icon: '📈',
      question: 'O tempo está jogando a seu favor?',
      desc: 'Simule o efeito "bola de neve". Veja como pequenos aportes mensais, aliados a uma taxa de juros constante e longo prazo, podem transformar seu patrimônio de forma exponencial.',
      visual: (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 h-48 flex items-end gap-2 justify-center relative overflow-hidden">
           <div className="w-8 bg-emerald-800 rounded-t h-1/6"></div>
           <div className="w-8 bg-emerald-700 rounded-t h-2/6"></div>
           <div className="w-8 bg-emerald-600 rounded-t h-3/6"></div>
           <div className="w-8 bg-emerald-500 rounded-t h-4/6 relative group">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-emerald-900 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">R$ 1 Milhão</div>
           </div>
           <div className="w-8 bg-emerald-400 rounded-t h-5/6"></div>
           <div className="absolute top-2 right-2 text-[10px] text-slate-500 font-mono">Curva Exponencial</div>
        </div>
      )
    },
    {
      id: 'fire',
      title: 'Calculadora FIRE',
      icon: '🔥',
      question: 'Qual é o seu número de liberdade?',
      desc: 'Financial Independence, Retire Early. Calcule exatamente quanto dinheiro você precisa acumular para que seus rendimentos cubram todo o seu custo de vida, permitindo que você pare de trabalhar se quiser.',
      visual: (
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-700 text-center flex flex-col justify-center h-full">
           <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Meta de Patrimônio</p>
           <p className="text-2xl font-black text-white mb-4">R$ 1.500.000</p>
           <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full w-[45%]"></div>
           </div>
           <p className="text-[10px] text-slate-400">45% do caminho percorrido</p>
        </div>
      )
    },
    {
      id: 'debt',
      title: 'Otimizador de Dívidas',
      icon: '🏔️',
      question: 'Qual dívida pagar primeiro?',
      desc: 'Use o método matemático "Avalanche". Liste suas dívidas e a ferramenta ordenará o pagamento pela maior taxa de juros, economizando milhares de reais e reduzindo o tempo endividado.',
      visual: (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 space-y-3">
           <div className="bg-red-900/20 border border-red-500/30 p-2 rounded flex justify-between items-center opacity-50 line-through">
              <span className="text-xs text-red-300">Cartão Loja (14% a.m.)</span>
              <span className="text-xs font-bold text-red-300">Pago ✅</span>
           </div>
           <div className="bg-red-900/40 border border-red-500 p-2 rounded flex justify-between items-center animate-pulse">
              <span className="text-xs text-white font-bold">Cheque Especial (12% a.m.)</span>
              <span className="text-xs font-bold text-white">FOCAR AQUI</span>
           </div>
           <div className="bg-slate-800 border border-slate-700 p-2 rounded flex justify-between items-center">
              <span className="text-xs text-slate-400">Financiamento (1.5% a.m.)</span>
              <span className="text-xs font-bold text-slate-500">Mínimo</span>
           </div>
        </div>
      )
    },
    {
      id: 'rent',
      title: 'Aluguel vs Financiamento',
      icon: '🏠',
      question: 'O sonho da casa própria compensa?',
      desc: 'Não decida com a emoção, decida com a matemática. Comparamos os juros do financiamento, a valorização do imóvel e o rendimento do dinheiro investido para te dizer o que vale mais a pena financeiramente.',
      visual: (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 flex flex-col justify-center gap-4">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-900/50 rounded flex items-center justify-center text-lg">🏠</div>
              <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                 <div className="bg-indigo-500 h-full w-[70%]"></div>
              </div>
              <span className="text-[10px] font-bold text-indigo-400">Financiar</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-900/50 rounded flex items-center justify-center text-lg">📈</div>
              <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                 <div className="bg-emerald-500 h-full w-[90%]"></div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400">Alugar + Investir</span>
           </div>
           <p className="text-[10px] text-center text-slate-500 mt-1">Resultado: Alugar gera +R$ 200k em 30 anos (Simulação)</p>
        </div>
      )
    },
    {
      id: 'roi',
      title: 'Calculadora ROI',
      icon: '📊',
      question: 'Seu projeto vai dar lucro?',
      desc: 'Return on Investment. Perfeito para empreendedores ou freelancers avaliarem se um projeto, curso ou equipamento vai se pagar e qual será o lucro real percentual.',
      visual: (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 flex flex-col items-center justify-center space-y-2">
           <div className="w-24 h-24 rounded-full border-4 border-slate-700 flex items-center justify-center relative">
              <span className="text-xl font-bold text-emerald-400">+150%</span>
              <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent -rotate-45"></div>
           </div>
           <p className="text-xs text-slate-400 font-bold uppercase">Retorno sobre Investimento</p>
        </div>
      )
    },
    {
      id: 'dividend',
      title: 'Simulador Dividendos',
      icon: '💎',
      question: 'Quando vou viver de renda?',
      desc: 'Focado em renda passiva. Calcule o "Número Mágico": o momento exato em que os dividendos que você recebe são suficientes para comprar novas cotas sozinhos.',
      visual: (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 relative overflow-hidden">
           <div className="flex justify-between items-end h-20 gap-1 px-4 pb-4">
              <div className="w-1/5 bg-purple-900/50 h-[20%] rounded-t"></div>
              <div className="w-1/5 bg-purple-800/50 h-[35%] rounded-t"></div>
              <div className="w-1/5 bg-purple-700/50 h-[55%] rounded-t"></div>
              <div className="w-1/5 bg-purple-600/50 h-[80%] rounded-t"></div>
              <div className="w-1/5 bg-purple-500 h-full rounded-t relative">
                 <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-lg">✨</div>
              </div>
           </div>
           <div className="bg-slate-800 p-2 text-center text-[10px] text-purple-300 font-bold">
              Mês 84: Dividendos compram +1 cota
           </div>
        </div>
      )
    },
    {
      id: 'game',
      title: 'Simulador de Resiliência',
      icon: '🎮',
      question: 'Você sobreviveria a uma crise?',
      desc: 'Um "mini-game" de decisões financeiras. Teste se sua reserva de emergência e sua saúde mental aguentam os imprevistos da vida real (carro quebra, perda de emprego, burnout).',
      visual: (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 space-y-3">
           <div className="flex justify-between text-xs font-bold text-white mb-2">
              <span>Saúde Mental: 40% ⚠️</span>
              <span>Caixa: R$ 800</span>
           </div>
           <div className="bg-slate-800 p-3 rounded border border-red-500/50">
              <p className="text-[10px] text-red-300 mb-2">EVENTO: Seu computador pifou!</p>
              <div className="flex gap-2">
                 <div className="bg-slate-700 px-2 py-1 rounded text-[9px] text-white">Comprar Novo (-R$ 3k)</div>
                 <div className="bg-slate-700 px-2 py-1 rounded text-[9px] text-white">Remendar (-R$ 500)</div>
              </div>
           </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (activeStep < steps.length - 1) setActiveStep(prev => prev + 1);
    else onNavigate('register'); // Final do tour leva ao cadastro
  };

  const handlePrev = () => {
    if (activeStep > 0) setActiveStep(prev => prev - 1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in pb-24 lg:pb-0">
      
      {/* Header */}
      <div className="text-center mb-10">
         <div className="inline-block bg-emerald-900/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/20 mb-3">
            Tour do Produto
         </div>
         <h2 className="text-3xl md:text-4xl font-black text-white mb-2">8 Ferramentas, 1 Objetivo</h2>
         <p className="text-slate-400">Liberdade Financeira.</p>
      </div>

      {/* Navigation Progress Bar (Desktop & Mobile Scrollable) */}
      <div className="flex overflow-x-auto gap-2 mb-8 pb-4 no-scrollbar justify-start md:justify-center">
         {steps.map((step, idx) => (
            <button
               key={step.id}
               onClick={() => setActiveStep(idx)}
               className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                  activeStep === idx 
                     ? 'bg-slate-100 text-slate-900 border-white scale-105' 
                     : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
               }`}
            >
               {step.icon} <span className="hidden md:inline ml-1">{step.title}</span>
            </button>
         ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden min-h-[500px] flex flex-col md:flex-row relative">
         
         {/* Background Decor */}
         <div className="absolute top-0 right-0 p-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

         {/* Left: Content */}
         <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative z-10">
            <div className="mb-6">
               <span className="text-6xl mb-4 block">{steps[activeStep].icon}</span>
               <h3 className="text-3xl font-bold text-white mb-2">{steps[activeStep].title}</h3>
               <p className="text-lg text-emerald-400 font-bold italic mb-6">"{steps[activeStep].question}"</p>
               <p className="text-slate-300 leading-relaxed">
                  {steps[activeStep].desc}
               </p>
            </div>

            <div className="flex gap-4 mt-auto pt-8">
               <button 
                  onClick={handlePrev} 
                  disabled={activeStep === 0}
                  className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
               >
                  Anterior
               </button>
               <button 
                  onClick={handleNext}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
               >
                  {activeStep === steps.length - 1 ? 'Começar Gratuitamente 🚀' : 'Próxima Ferramenta →'}
               </button>
            </div>
         </div>

         {/* Right: Visual Preview */}
         <div className="md:w-1/2 bg-slate-900/50 border-l border-slate-700 p-8 flex items-center justify-center relative overflow-hidden">
            <div className="w-full max-w-sm aspect-square bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-600 shadow-2xl p-6 flex flex-col relative group">
               {/* Browser UI decoration */}
               <div className="flex gap-2 mb-4 opacity-50">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
               </div>
               
               {/* The actual tool visual */}
               <div className="flex-1 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500">
                  {steps[activeStep].visual}
               </div>

               {/* "Live Preview" Label */}
               <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-500 bg-black/20 px-2 py-1 rounded">
                  Preview Simplificado
               </div>
            </div>
         </div>
      </div>

      {/* Footer CTA */}
      <div className="text-center mt-12">
         <p className="text-slate-400 mb-4 text-sm">Gostou do que viu?</p>
         <button 
            onClick={() => onNavigate('register')}
            className="text-emerald-400 hover:text-white font-bold border-b border-emerald-500/30 hover:border-white transition-all pb-1"
         >
            Crie sua conta gratuita para testar na prática
         </button>
      </div>
    </div>
  );
};

export const GuidesPage: React.FC<{ onNavigate: (path: any) => void }> = ({ onNavigate }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-24 lg:pb-0 px-4">
      <div className="text-center mb-10 pt-4">
        <h2 className="text-3xl font-bold text-white mb-3">Guias Práticos</h2>
        <p className="text-slate-400">Roteiros passo a passo para sua organização.</p>
      </div>

      <div className="space-y-4">
        {[
          { title: "Checklist: Fechamento de Mês", tool: "manager", desc: "O que revisar antes de virar o mês para não ter surpresas." },
          { title: "Roteiro: Saindo das Dívidas", tool: "debt", desc: "Passo a passo para negociar e quitar pendências." },
          { title: "Checklist: Comprar ou Alugar?", tool: "rent", desc: "Perguntas essenciais antes de assinar contrato." },
          { title: "Plano: Aposentadoria FIRE", tool: "fire", desc: "Como calcular seu número de liberdade." }
        ].map((guide, idx) => (
          <div key={idx} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-500 transition-colors">
             <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <span className="text-emerald-500">✓</span> {guide.title}
                </h3>
                <p className="text-sm text-slate-400 mt-1">{guide.desc}</p>
             </div>
             <button 
               onClick={() => onNavigate(guide.tool)}
               className="bg-slate-700 hover:bg-slate-600 text-emerald-400 px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap w-full md:w-auto"
             >
               Usar Ferramenta
             </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const FaqPage = () => {
  return (
    <div className="max-w-5xl mx-auto animate-in fade-in pb-24 lg:pb-0 px-4">
      <h2 className="text-3xl font-bold text-white text-center mb-10 pt-4">Perguntas Frequentes</h2>
      <div className="space-y-4">
        {[
          { q: "Meus dados são seguros?", a: "Sim. Seus dados são armazenados localmente no seu dispositivo (LocalStorage) com criptografia básica no login. Nós não temos servidores que leem seus dados financeiros." },
          { q: "Como faço um backup dos meus dados?", a: "Seus dados estão apenas neste dispositivo. Recomendamos fazer prints dos seus resumos ou anotar os valores importantes. Estamos trabalhando em uma funcionalidade de exportação." },
          { q: "Posso usar a conta em mais de um dispositivo?", a: "Não. Como os dados são salvos localmente no navegador, cada dispositivo (celular, notebook) terá seus próprios dados separados." },
          { q: "O que acontece se eu limpar o cache do navegador?", a: "Se você limpar os dados de navegação/cache, seus lançamentos serão apagados. Tenha cuidado ao usar ferramentas de limpeza." },
          { q: "É realmente gratuito?", a: "Sim, 100% gratuito. Nossa missão é democratizar ferramentas financeiras de alto nível." },
          { q: "Preciso de internet?", a: "O app funciona offline (PWA), mas recursos de IA e atualizações de taxas precisam de conexão." },
        ].map((faq, idx) => (
          <details key={idx} className="bg-slate-800 rounded-xl border border-slate-700 group">
            <summary className="p-6 font-bold text-white cursor-pointer list-none flex justify-between items-center">
              {faq.q}
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-6 text-slate-400 text-sm leading-relaxed border-t border-slate-700/50 pt-4">
              {faq.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
};

export const AboutPage: React.FC<{ onNavigate: (path: any) => void }> = ({ onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto text-center space-y-8 animate-in fade-in pb-24 lg:pb-0 px-4">
      <h2 className="text-3xl font-bold text-white pt-4">Nosso Propósito</h2>
      <p className="text-lg text-slate-300 leading-relaxed">
        Acreditamos que a <strong>liberdade financeira</strong> não deve ser complexa nem custosa. 
        Criamos o <span className="text-emerald-400 font-bold">Finanças Pro Invest</span> para substituir planilhas complicadas e calculadoras quebradas por uma experiência fluida, educativa e poderosa.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
         <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
            <span className="text-2xl block mb-2">🔒</span>
            <h4 className="font-bold text-white">Privacidade</h4>
            <p className="text-xs text-slate-400 mt-1">Dados locais, seus e de mais ninguém.</p>
         </div>
         <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
            <span className="text-2xl block mb-2">⚡</span>
            <h4 className="font-bold text-white">Velocidade</h4>
            <p className="text-xs text-slate-400 mt-1">Ferramentas que carregam instantaneamente.</p>
         </div>
         <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
            <span className="text-2xl block mb-2">🧠</span>
            <h4 className="font-bold text-white">Educação</h4>
            <p className="text-xs text-slate-400 mt-1">Aprenda enquanto planeja seu futuro.</p>
         </div>
      </div>

      <button 
        onClick={() => onNavigate('register')}
        className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors border-b-2 border-emerald-500/30 hover:border-emerald-500 pb-1 text-lg"
      >
        Junte-se a nós e comece hoje →
      </button>
    </div>
  );
};
