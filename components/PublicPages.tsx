
import React from 'react';

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
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed font-light">
            Simuladores profissionais, gerenciamento de caixa e educação financeira. <br/>
            <span className="text-emerald-400 font-medium">Tudo em um só lugar.</span>
          </p>
          
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

// --- Página de Demonstração ---
export const DemoPage: React.FC<{ onNavigate: (path: any) => void }> = ({ onNavigate }) => {
  const tools = [
    { name: "Dashboard", desc: "Visão geral completa", icon: "📊" },
    { name: "Juros Compostos", desc: "Projeção de riqueza", icon: "📈" },
    { name: "Aluguel vs Financiamento", desc: "Decisão imobiliária", icon: "🏠" },
    { name: "Otimizador de Dívidas", desc: "Plano de liberdade", icon: "🏔️" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-white">Veja o que te espera</h2>
        <p className="text-slate-400 text-lg">Uma suíte completa de ferramentas para cada etapa da sua jornada.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {tools.map((tool, idx) => (
          <div key={idx} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:shadow-xl transition-all group">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {tool.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{tool.name}</h3>
                  <p className="text-sm text-slate-400">{tool.desc}</p>
                </div>
             </div>
             {/* Placeholder para GIF/Imagem */}
             <div className="h-40 bg-slate-900/50 rounded-xl flex items-center justify-center border border-slate-700/50 mb-4 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
                <span className="text-xs text-slate-500 font-mono">Previsão da Interface {tool.name}</span>
             </div>
             <button 
                onClick={() => onNavigate('manager')}
                className="w-full py-3 bg-slate-700 hover:bg-emerald-600 hover:text-white text-slate-300 font-bold rounded-xl transition-all"
             >
                Testar Agora
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
            Acessar Ferramentas
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
