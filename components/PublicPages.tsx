
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { calculateCompoundInterest, calculateFire, maskCurrency, formatCurrency } from '../utils/calculations';

// --- Widget de Notícias ---
export const NewsWidget = () => {
  const news = [
    { id: 1, tag: 'App', title: 'Nova Calculadora FIRE disponível!', date: 'Hoje' },
    { id: 2, tag: 'Mercado', title: 'Inflação acumula alta de 0,5% no mês.', date: 'Ontem' },
    { id: 3, tag: 'Carreira', title: 'Como negociar salário em 2024.', date: '2 dias atrás' },
    { id: 4, tag: 'IA', title: 'IA ajudando a reduzir gastos fixos.', date: '3 dias atrás' }
  ];

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-5 h-fit sticky top-24">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
        <span className="text-xl">📰</span>
        <h3 className="font-bold text-white text-sm uppercase tracking-wide">Em Destaque</h3>
      </div>
      <div className="space-y-4">
        {news.map(item => (
          <div key={item.id} className="group cursor-pointer">
            <div className="flex justify-between items-center mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                item.tag === 'App' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-700 text-slate-300'
              }`}>
                {item.tag}
              </span>
              <span className="text-[10px] text-slate-500">{item.date}</span>
            </div>
            <h4 className="text-sm text-slate-200 group-hover:text-emerald-400 transition-colors font-medium leading-snug">
              {item.title}
            </h4>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-slate-700 text-center">
        <button className="text-xs text-slate-400 hover:text-white transition-colors">Ver todas as notícias →</button>
      </div>
    </div>
  );
};

// --- Home Pública ---
export const PublicHome: React.FC<{ onNavigate: (path: any) => void; onStartNow: () => void }> = ({ onNavigate, onStartNow }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Central */}
      <div className="lg:col-span-2 space-y-12">
        <section className="text-center py-12 md:py-20 px-4 relative overflow-hidden rounded-3xl bg-slate-900/50 border border-slate-800">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>
          <h1 className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6 leading-tight tracking-tight">
            Domine o Jogo<br/>do Dinheiro
          </h1>
          
          <div className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-8 leading-relaxed font-light space-y-2">
            <p>Simuladores profissionais, gerenciamento de caixa e educação financeira.</p>
            <p>
              Tudo, <span className="text-emerald-400 font-bold">GRATUITAMENTE</span>, em um só lugar. 
              Basta criar sua conta para acesso a todas as nossas <span className="text-white font-bold">FERRAMENTAS</span>.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={onStartNow} 
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-bold px-8 py-4 rounded-xl shadow-lg shadow-emerald-900/30 transition-all hover:scale-105 active:scale-95"
            >
              Começar Agora
            </button>
            <button 
              onClick={() => onNavigate('demo')} 
              className="bg-slate-800 hover:bg-slate-700 text-white text-lg font-bold px-8 py-4 rounded-xl border border-slate-600 transition-all hover:scale-105"
            >
              Ver Demonstração
            </button>
          </div>
        </section>

        {/* 8 Ferramentas Header */}
        <div className="text-center py-4">
            <h2 className="text-xl font-bold text-white uppercase tracking-widest border-b border-slate-800 pb-4">
                <span className="text-emerald-500">8 Ferramentas Poderosas</span> para dominar suas finanças
            </h2>
        </div>

        {/* Features Grid (Updated to show 8 tools conceptually, or main 4 with link) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/30 transition-colors group">
              <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">💰</span>
              <h3 className="text-xl font-bold text-white mb-2">Gerenciador Financeiro</h3>
              <p className="text-slate-400 text-sm">Controle completo de fluxo de caixa e metas.</p>
           </div>
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/30 transition-colors group">
              <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">📈</span>
              <h3 className="text-xl font-bold text-white mb-2">Simulador Juros Compostos</h3>
              <p className="text-slate-400 text-sm">Visualize o poder do tempo no seu patrimônio.</p>
           </div>
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/30 transition-colors group">
              <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">🔥</span>
              <h3 className="text-xl font-bold text-white mb-2">Calculadora FIRE</h3>
              <p className="text-slate-400 text-sm">Descubra sua liberdade financeira.</p>
           </div>
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/30 transition-colors group">
              <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">🏔️</span>
              <h3 className="text-xl font-bold text-white mb-2">Otimizador de Dívidas</h3>
              <p className="text-slate-400 text-sm">Método Avalanche para sair do vermelho.</p>
           </div>
        </section>
        
        <div className="text-center">
            <p className="text-slate-500 text-sm mb-4">+ Aluguel vs Financiamento, ROI, Dividendos e Simulador de Crise.</p>
            <button onClick={onStartNow} className="text-emerald-400 font-bold hover:text-white transition-colors border-b border-emerald-500/30 pb-1">
                Criar conta gratuita para acessar tudo →
            </button>
        </div>
      </div>

      {/* Sidebar News */}
      <aside className="hidden lg:block">
        <NewsWidget />
        <div className="mt-6 bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-2xl text-center">
           <h4 className="font-bold text-emerald-400 mb-2">Cadastre-se Gratuitamente</h4>
           <p className="text-xs text-slate-300 mb-4">Tenha acesso a todas as 8 ferramentas exclusivas.</p>
           <button onClick={onStartNow} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm transition-colors">
             Criar Conta
           </button>
        </div>
      </aside>
    </div>
  );
};

// --- Página de Demonstração (INTERATIVA) ---
export const DemoPage: React.FC<{ onNavigate: (path: any) => void }> = ({ onNavigate }) => {
  const { isAuthenticated } = useAuth();
  const [showToast, setShowToast] = useState(false);

  // Redireciona se já logado
  useEffect(() => {
    if (isAuthenticated) {
        onNavigate('panel');
    }
  }, [isAuthenticated, onNavigate]);

  const handleInteraction = () => {
    if (!showToast) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
    }
  };

  // Estados locais para interatividade dos cards
  const [compoundMonthly, setCompoundMonthly] = useState(500);
  const [compoundYears, setCompoundYears] = useState(20);
  const compoundResult = calculateCompoundInterest({
    initialValue: 0,
    monthlyValue: compoundMonthly,
    interestRate: 10,
    rateType: 'annual',
    period: compoundYears,
    periodType: 'years',
    taxRate: 0,
    inflationRate: 0
  });

  const [fireExpenses, setFireExpenses] = useState(4000);
  const fireResult = calculateFire({
    monthlyExpenses: fireExpenses,
    currentNetWorth: 0,
    monthlyContribution: 0,
    annualReturn: 0,
    inflation: 0,
    safeWithdrawalRate: 4
  });

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 relative">
      
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-yellow-600 text-white px-6 py-3 rounded-full shadow-xl z-50 animate-in slide-in-from-top-2 fade-in font-bold text-sm border border-yellow-400">
            💾 Modo Demo: Dados não serão salvos.
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-emerald-900/30 text-emerald-400 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Modo Demonstração
        </div>
        <h2 className="text-4xl font-bold text-white">Teste nossas ferramentas na prática</h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Use versões simplificadas abaixo com dados fictícios. <br/>
          <span className="text-white">Para salvar seus resultados, crie sua conta gratuitamente.</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Card Interativo: Juros Compostos */}
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-xl flex flex-col">
           <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
              <div className="w-10 h-10 bg-emerald-900/50 rounded-lg flex items-center justify-center text-2xl">📈</div>
              <div>
                <h3 className="font-bold text-white text-lg">Juros Compostos</h3>
                <p className="text-xs text-slate-400">Poder do tempo e aportes (Demo)</p>
              </div>
           </div>
           
           <div className="space-y-6 flex-grow">
              <div>
                <label className="flex justify-between text-sm font-bold text-slate-300 mb-2">
                  <span>Aporte Mensal</span>
                  <span className="text-emerald-400">R$ {compoundMonthly}</span>
                </label>
                <input 
                  type="range" min="100" max="5000" step="100" 
                  value={compoundMonthly} 
                  onChange={(e) => { setCompoundMonthly(+e.target.value); handleInteraction(); }}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
              <div>
                <label className="flex justify-between text-sm font-bold text-slate-300 mb-2">
                  <span>Tempo (Anos)</span>
                  <span className="text-emerald-400">{compoundYears} Anos</span>
                </label>
                <input 
                  type="range" min="5" max="40" step="1" 
                  value={compoundYears} 
                  onChange={(e) => { setCompoundYears(+e.target.value); handleInteraction(); }}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="bg-slate-900 p-4 rounded-xl text-center border border-slate-700">
                 <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Patrimônio Projetado</p>
                 <p className="text-3xl font-black text-white mt-1">{formatCurrency(compoundResult.summary.totalFinal)}</p>
              </div>
           </div>

           <div className="mt-6 pt-4 border-t border-slate-700 text-center">
              <p className="text-xs text-slate-400 mb-3">Gostou do resultado?</p>
              <button 
                onClick={() => onNavigate('register')}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
              >
                Criar Conta para Salvar
              </button>
           </div>
        </div>

        {/* Card Interativo: FIRE */}
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-xl flex flex-col">
           <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
              <div className="w-10 h-10 bg-orange-900/50 rounded-lg flex items-center justify-center text-2xl">🔥</div>
              <div>
                <h3 className="font-bold text-white text-lg">Calculadora FIRE</h3>
                <p className="text-xs text-slate-400">Quanto preciso para viver de renda? (Demo)</p>
              </div>
           </div>
           
           <div className="space-y-6 flex-grow">
              <div>
                <label className="flex justify-between text-sm font-bold text-slate-300 mb-2">
                  <span>Gasto Mensal Desejado</span>
                  <span className="text-orange-400">R$ {fireExpenses}</span>
                </label>
                <input 
                  type="range" min="2000" max="20000" step="500" 
                  value={fireExpenses} 
                  onChange={(e) => { setFireExpenses(+e.target.value); handleInteraction(); }}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>

              <div className="bg-slate-900 p-4 rounded-xl text-center border border-slate-700 flex flex-col justify-center h-32">
                 <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Número de Liberdade</p>
                 <p className="text-3xl font-black text-white mt-1">{formatCurrency(fireResult.fireNumber)}</p>
              </div>
           </div>

           <div className="mt-6 pt-4 border-t border-slate-700 text-center">
              <p className="text-xs text-slate-400 mb-3">Quer calcular seu prazo?</p>
              <button 
                onClick={() => onNavigate('register')}
                className="w-full py-3 bg-slate-700 hover:bg-white hover:text-slate-900 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
              >
                Acessar Ferramenta Completa
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Guias e Checklists ---
export const GuidesPage: React.FC<{ onNavigate: (path: any) => void }> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      <div className="text-center mb-10">
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
               className="bg-slate-700 hover:bg-slate-600 text-emerald-400 px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap"
             >
               Usar Ferramenta
             </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- FAQ ---
export const FaqPage = () => {
  return (
    <div className="max-w-3xl mx-auto animate-in fade-in">
      <h2 className="text-3xl font-bold text-white text-center mb-10">Perguntas Frequentes</h2>
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

// --- Sobre ---
export const AboutPage: React.FC<{ onNavigate: (path: any) => void }> = ({ onNavigate }) => {
  return (
    <div className="max-w-3xl mx-auto text-center space-y-8 animate-in fade-in">
      <h2 className="text-3xl font-bold text-white">Nosso Propósito</h2>
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
        className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors border-b-2 border-emerald-500/30 hover:border-emerald-500 pb-1"
      >
        Junte-se a nós e comece hoje →
      </button>
    </div>
  );
};
