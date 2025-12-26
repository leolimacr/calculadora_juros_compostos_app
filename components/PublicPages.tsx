
import React, { useState } from 'react';
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
export const PublicHome: React.FC<{ onNavigate: (path: any) => void }> = ({ onNavigate }) => {
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
              onClick={() => onNavigate('manager')} 
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

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/30 transition-colors">
              <span className="text-3xl mb-3 block">💰</span>
              <h3 className="text-xl font-bold text-white mb-2">Gerenciador Financeiro</h3>
              <p className="text-slate-400 text-sm">Controle receitas, despesas e metas em um painel unificado e seguro.</p>
           </div>
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/30 transition-colors">
              <span className="text-3xl mb-3 block">📈</span>
              <h3 className="text-xl font-bold text-white mb-2">Simulador Juros Compostos</h3>
              <p className="text-slate-400 text-sm">Visualize o poder do tempo e dos aportes mensais no seu patrimônio.</p>
           </div>
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/30 transition-colors">
              <span className="text-3xl mb-3 block">🔥</span>
              <h3 className="text-xl font-bold text-white mb-2">Calculadora FIRE</h3>
              <p className="text-slate-400 text-sm">Descubra exatamente quanto você precisa para atingir a independência financeira.</p>
           </div>
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/30 transition-colors">
              <span className="text-3xl mb-3 block">🏔️</span>
              <h3 className="text-xl font-bold text-white mb-2">Otimizador de Dívidas</h3>
              <p className="text-slate-400 text-sm">Use o método Avalanche para sair do vermelho da forma mais rápida possível.</p>
           </div>
        </section>
      </div>

      {/* Sidebar News */}
      <aside className="hidden lg:block">
        <NewsWidget />
        <div className="mt-6 bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-2xl text-center">
           <h4 className="font-bold text-emerald-400 mb-2">Cadastre-se Gratuitamente</h4>
           <p className="text-xs text-slate-300 mb-4">Tenha acesso a todas as 8 ferramentas exclusivas.</p>
           <button onClick={() => onNavigate('manager')} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm transition-colors">
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

  // Estados locais para interatividade dos cards
  // 1. Juros Compostos
  const [compoundMonthly, setCompoundMonthly] = useState(500);
  const [compoundYears, setCompoundYears] = useState(20);
  const compoundResult = calculateCompoundInterest({
    initialValue: 0,
    monthlyValue: compoundMonthly,
    interestRate: 10, // 10% a.a. fixo para demo
    rateType: 'annual',
    period: compoundYears,
    periodType: 'years',
    taxRate: 0,
    inflationRate: 0
  });

  // 2. FIRE
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
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4">
      
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
        
        {isAuthenticated && (
          <button 
            onClick={() => onNavigate('manager')}
            className="mt-4 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 px-6 py-2 rounded-xl font-bold transition-all"
          >
            Você já está logado. Ir para Versão Completa →
          </button>
        )}
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
                  onChange={(e) => setCompoundMonthly(+e.target.value)}
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
                  onChange={(e) => setCompoundYears(+e.target.value)}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="bg-slate-900 p-4 rounded-xl text-center border border-slate-700">
                 <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Patrimônio Projetado</p>
                 <p className="text-3xl font-black text-white mt-1">{formatCurrency(compoundResult.summary.totalFinal)}</p>
                 <p className="text-[10px] text-slate-500 mt-2">Considerando taxa média de 10% a.a.</p>
              </div>
           </div>

           <div className="mt-6 pt-4 border-t border-slate-700 text-center">
              <p className="text-xs text-slate-400 mb-3">Gostou do resultado?</p>
              <button 
                onClick={() => onNavigate('manager')}
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
                  onChange={(e) => setFireExpenses(+e.target.value)}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>

              <div className="bg-slate-900 p-4 rounded-xl text-center border border-slate-700 flex flex-col justify-center h-32">
                 <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Número de Liberdade</p>
                 <p className="text-3xl font-black text-white mt-1">{formatCurrency(fireResult.fireNumber)}</p>
                 <p className="text-[10px] text-slate-500 mt-2">Montante necessário para viver com saques de 4% a.a.</p>
              </div>
           </div>

           <div className="mt-6 pt-4 border-t border-slate-700 text-center">
              <p className="text-xs text-slate-400 mb-3">Quer calcular seu prazo?</p>
              <button 
                onClick={() => onNavigate('manager')}
                className="w-full py-3 bg-slate-700 hover:bg-white hover:text-slate-900 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
              >
                Acessar Ferramenta Completa
              </button>
           </div>
        </div>

        {/* Card Visual: Dashboard */}
        <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none"></div>
           
           <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="flex-1 space-y-4">
                 <div className="inline-block bg-indigo-900/30 text-indigo-400 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    O Coração do Sistema
                 </div>
                 <h3 className="text-2xl font-bold text-white">Gerenciador Financeiro Completo</h3>
                 <p className="text-slate-400 leading-relaxed">
                    Mais que uma planilha. Organize suas receitas, despesas e metas em um dashboard visual. 
                    Acompanhe seu progresso e receba insights automáticos.
                 </p>
                 <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Funciona 100% Offline</li>
                    <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Categorias Personalizáveis</li>
                    <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Metas de Curto e Longo Prazo</li>
                 </ul>
                 <button 
                    onClick={() => onNavigate('manager')}
                    className="mt-4 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/30 transition-transform hover:scale-105"
                 >
                    Criar meu Dashboard Grátis
                 </button>
              </div>
              
              {/* Visual Mockup */}
              <div className="flex-1 w-full bg-slate-900 rounded-2xl border border-slate-700 p-4 opacity-90 rotate-1 group-hover:rotate-0 transition-transform duration-500">
                 <div className="flex justify-between mb-4 border-b border-slate-700 pb-2">
                    <div className="h-4 w-24 bg-slate-700 rounded"></div>
                    <div className="h-4 w-8 bg-slate-700 rounded"></div>
                 </div>
                 <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="h-20 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center">
                       <span className="text-emerald-500 font-bold">+ R$ 5.000</span>
                    </div>
                    <div className="h-20 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center">
                       <span className="text-red-400 font-bold">- R$ 3.200</span>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <div className="h-10 bg-slate-800 rounded-lg w-full"></div>
                    <div className="h-10 bg-slate-800 rounded-lg w-full"></div>
                    <div className="h-10 bg-slate-800 rounded-lg w-full"></div>
                 </div>
              </div>
           </div>
        </div>

      </div>

      {/* Outras Ferramentas (Cards Menores) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {[
            { title: "Aluguel vs Financiamento", icon: "🏠", desc: "Matemática imobiliária precisa." },
            { title: "Otimizador de Dívidas", icon: "🏔️", desc: "Método Avalanche para quitar débitos." },
            { title: "Calculadora ROI", icon: "📊", desc: "Analise a rentabilidade de projetos." },
            { title: "Simulador de Dividendos", icon: "💎", desc: "Efeito bola de neve na renda passiva." }
         ].map((tool, idx) => (
            <div key={idx} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:border-slate-500 transition-colors text-center">
               <span className="text-3xl block mb-3">{tool.icon}</span>
               <h4 className="font-bold text-white text-sm mb-2">{tool.title}</h4>
               <p className="text-xs text-slate-400 mb-4">{tool.desc}</p>
               <button 
                  onClick={() => onNavigate('manager')}
                  className="text-xs font-bold text-emerald-400 hover:text-white transition-colors"
               >
                  Usar agora →
               </button>
            </div>
         ))}
      </div>

      <div className="bg-gradient-to-r from-emerald-900/40 to-slate-900 p-8 rounded-3xl border border-emerald-500/30 text-center">
         <h3 className="text-2xl font-bold text-white mb-4">Pronto para assumir o controle?</h3>
         <button 
            onClick={() => onNavigate('manager')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg transition-transform hover:scale-105"
         >
            Criar Conta Gratuita e Acessar Tudo
         </button>
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
          { q: "É realmente gratuito?", a: "Sim, 100% gratuito. Nossa missão é democratizar ferramentas financeiras de alto nível." },
          { q: "Preciso de internet?", a: "O app funciona offline (PWA), mas recursos de IA e atualizações de taxas precisam de conexão." },
          { q: "O login dura quanto tempo?", a: "Para sua segurança e conveniência, a sessão dura 7 dias. Após isso, pedimos o PIN novamente." }
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
        onClick={() => onNavigate('manager')}
        className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors border-b-2 border-emerald-500/30 hover:border-emerald-500 pb-1"
      >
        Junte-se a nós e comece hoje →
      </button>
    </div>
  );
};
