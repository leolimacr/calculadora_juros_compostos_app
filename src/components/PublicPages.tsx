import React, { useEffect, useState } from 'react';

// --- DADOS INICIAIS ---
const INITIAL_MARKET_DATA = {
    indices: [
        { symbol: 'IBOV', name: 'Ibovespa', price: 'Carregando...', change: '0.00%', up: true },
        { symbol: 'S&P 500', name: 'S&P 500', price: '...', change: '0.00%', up: true },
    ],
    currencies: [
        { symbol: 'USD', name: 'Dólar', price: '...', change: '0.00%', up: false },
        { symbol: 'EUR', name: 'Euro', price: '...', change: '0.00%', up: true },
    ],
    indicators: [
        { symbol: 'CDI', name: 'Taxa CDI', price: '10,65%', change: 'a.a.', up: true },
        { symbol: 'IPCA', name: 'IPCA 12m', price: '4,50%', change: 'a.a.', up: false },
    ],
    crypto: [
        { symbol: 'BTC', name: 'Bitcoin', price: '...', change: '0.00%', up: true },
    ],
    stocks: [
        { symbol: 'VALE3', name: 'Vale', price: '...', change: '0.00%', up: true },
        { symbol: 'PETR4', name: 'Petrobras', price: '...', change: '0.00%', up: false },
        { symbol: 'ITUB4', name: 'Itaú', price: '...', change: '0.00%', up: true },
        { symbol: 'BBDC4', name: 'Bradesco', price: '...', change: '0.00%', up: false },
        { symbol: 'BBAS3', name: 'Banco do Brasil', price: '...', change: '0.00%', up: true },
    ]
};

// --- COMPONENTE TICKER (CORRIGIDO) ---
const TopTicker = ({ data }: { data: any }) => {
    const allAssets = [
        ...data.indices, ...data.currencies, ...data.indicators,
        ...data.crypto, ...data.stocks
    ];

    return (
        <div className="w-full h-10 bg-[#0f172a] border-b border-slate-800 flex items-center overflow-hidden relative z-50 shadow-md">
            <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-[#0f172a] to-transparent z-40"></div>
            <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[#0f172a] to-transparent z-40"></div>

            <div className="animate-marquee flex whitespace-nowrap items-center h-full">
                {[...allAssets, ...allAssets].map((asset: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 mx-6 text-[11px] font-mono font-bold tracking-wide">
                        <span className="text-slate-400">{asset.symbol}</span>
                        <span className={asset.up === false ? 'text-red-400' : 'text-emerald-400'}>
                            {asset.price} <span className="opacity-80 text-[10px]">({asset.change})</span>
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-700 ml-4"></span>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-marquee { animation: marquee 80s linear infinite; }
                .animate-marquee:hover { animation-play-state: paused; }
            `}</style>
        </div>
    );
};

export const PublicHome: React.FC<any> = ({ onNavigate, onStartNow }) => {
  const [marketData, setMarketData] = useState(INITIAL_MARKET_DATA);

  useEffect(() => {
    const fetchMarketData = async () => {
        try {
            const response = await fetch('/api/market'); 
            if (!response.ok) throw new Error('Falha na API');
            const realData = await response.json();
            setMarketData(prev => ({ ...prev, ...realData }));
        } catch (error) { console.error("Reconectando API...", error); }
    };
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] animate-in fade-in duration-700 overflow-x-hidden flex flex-col">
      
      <TopTicker data={marketData} />
      
      {/* 
         HERO SECTION CORRIGIDA:
         - Removido "fixed height"
         - Adicionado "pb-24" (Padding Bottom) grande para empurrar o conteúdo
         - Layout flexível que cresce com o conteúdo
      */}
      <section className="relative py-12 px-4 lg:px-6 w-full flex flex-col justify-center">
        <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">

            {/* --- COLUNA ESQUERDA: MERCADO (Altura Controlada) --- */}
            <div className="hidden lg:flex lg:col-span-3 flex-col gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-sm h-[550px] flex flex-col">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2 flex-shrink-0">
                        <h3 className="text-emerald-400 font-bold text-sm flex items-center gap-2">
                            <span className="animate-pulse text-red-500">●</span> MERCADO REAL
                        </h3>
                        <span className="text-[10px] text-slate-500 font-mono opacity-70">30S UPDATE</span>
                    </div>

                    {/* Scrollbar interna impede que o card cresça sobre o site */}
                    <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar flex-grow">
                        <MarketSection title="ÍNDICES GLOBAIS" items={marketData.indices} />
                        <MarketSection title="INDICADORES" items={marketData.indicators} />
                        <MarketSection title="MOEDAS" items={marketData.currencies} />
                        <MarketSection title="CRIPTOMOEDAS" items={marketData.crypto} />
                        <MarketSection title="AÇÕES IBOVESPA" items={marketData.stocks} />
                    </div>
                </div>
            </div>

            {/* --- COLUNA CENTRAL --- */}
            <div className="lg:col-span-6 flex flex-col justify-center text-center relative py-4">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/10 blur-[100px] rounded-full -z-10"></div>

                <div className="mb-8">
                    <div className="inline-block bg-slate-800/80 border border-slate-700 px-4 py-1.5 rounded-full text-sky-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-lg">
                        Ecossistema Financeiro Completo
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black text-white leading-[0.9] tracking-tight mb-6">
                        Domine o Jogo <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">do Dinheiro</span>
                    </h1>
                    <p className="text-slate-400 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
                        Simuladores profissionais, gerenciamento de caixa e educação financeira em um só lugar.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
                    <button onClick={onStartNow} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-5 rounded-xl font-bold text-lg shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all active:scale-95 border-b-4 border-emerald-700">
                        Começar Agora
                    </button>
                    <button onClick={() => onNavigate('compound')} className="w-full sm:w-auto bg-slate-800 text-white px-8 py-5 rounded-xl font-bold text-lg border border-slate-700 hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                        <span>👁️</span> Ver Demonstração
                    </button>
                </div>

                <div className="grid grid-cols-4 gap-2 max-w-lg mx-auto w-full opacity-80">
                     <MiniTool icon="💰" label="Gestão" />
                     <MiniTool icon="📈" label="Juros" />
                     <MiniTool icon="🔥" label="FIRE" />
                     <MiniTool icon="🤖" label="IA" />
                </div>
            </div>

            {/* --- COLUNA DIREITA (Altura Controlada) --- */}
            <div className="hidden lg:flex lg:col-span-3 flex-col gap-6 h-[550px]">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/30 transition-all cursor-pointer group flex-1 flex flex-col justify-center" onClick={() => onNavigate('blog')}>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded uppercase mb-3 inline-block w-fit">Em Destaque</span>
                    <h3 className="text-white font-bold text-lg leading-tight mb-2 group-hover:text-emerald-400 transition-colors">
                        Nova Calculadora FIRE disponível!
                    </h3>
                    <p className="text-slate-400 text-xs mb-0">Planeje sua independência financeira com precisão matemática.</p>
                </div>

                <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 hover:border-indigo-500/50 transition-all cursor-pointer group flex-1 flex flex-col justify-center" onClick={() => onNavigate('blog')}>
                     <div className="flex justify-between items-start mb-2">
                        <span className="text-3xl">🎓</span>
                        <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Grátis</span>
                     </div>
                    <h3 className="text-white font-bold text-lg leading-tight mb-2 group-hover:text-indigo-400 transition-colors">
                        Como negociar salário em 2026
                    </h3>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-sky-500/30 transition-all cursor-pointer flex-1 flex flex-col justify-center" onClick={() => onNavigate('blog')}>
                    <span className="bg-sky-500/10 text-sky-400 text-[10px] font-bold px-2 py-1 rounded uppercase mb-3 inline-block w-fit">Mercado</span>
                    <h3 className="text-white font-bold text-lg leading-tight mb-2">
                        Inflação acumula alta de 0,5% no mês
                    </h3>
                </div>
            </div>
        </div>
      </section>

      {/* 
         SEÇÃO DE CONTEÚDO (ISOLADA)
         - Adicionado border-t (linha divisória)
         - Adicionado margin-top para garantir separação física
         - z-index garante que fique na camada correta
      */}
      <section className="relative z-20 px-4 py-20 max-w-7xl mx-auto border-t border-slate-800 bg-[#020617] mt-8">
        <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <span className="bg-sky-500/10 text-sky-500 p-2 rounded-lg">🎓</span> 
                Academia & Insights
            </h2>
            <button onClick={() => onNavigate('blog')} className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest border-b border-transparent hover:border-white transition-all pb-1">
                Ver todo o conteúdo
            </button>
        </div>

        <div className="grid md:grid-cols-12 gap-8">
            <div className="col-span-1 md:col-span-7 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[2.5rem] overflow-hidden group cursor-pointer hover:shadow-[0_0_30px_rgba(14,165,233,0.1)] transition-all" onClick={() => onNavigate('blog')}>
                <div className="h-full flex flex-col md:flex-row">
                    <div className="md:w-2/5 bg-slate-800 relative overflow-hidden">
                        <div className="absolute inset-0 bg-sky-600/20 mix-blend-overlay"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-7xl group-hover:scale-110 transition-transform duration-500">🚀</div>
                        <div className="absolute top-4 left-4 bg-sky-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-lg">Curso Grátis</div>
                    </div>
                    <div className="p-8 md:w-3/5 flex flex-col justify-center">
                        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-sky-400 transition-colors">Liberdade Financeira (FIRE)</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            Um roadmap completo de 10 passos para sair das dívidas e construir uma carteira de investimentos que paga seus boletos.
                        </p>
                        <div className="flex items-center gap-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <span className="flex items-center gap-1">📚 10 Aulas</span>
                            <span className="flex items-center gap-1">⏱️ 45 min</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-span-1 md:col-span-5 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col justify-between hover:border-emerald-500/30 transition-all cursor-pointer group" onClick={() => onNavigate('blog')}>
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-emerald-400 font-mono text-[10px] uppercase">Mercado Agora</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4 leading-tight group-hover:text-emerald-400 transition-colors">
                        "O Fim da Poupança": Por que a inflação de 2026 exige novos ativos.
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                        Analistas do JP Morgan e da XP alertam para a mudança na curva de juros. Veja onde alocar sua reserva de emergência.
                    </p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
                    <span className="text-slate-500 text-xs">Leitura: 3 min</span>
                    <span className="text-white text-lg group-hover:translate-x-1 transition-transform">→</span>
                </div>
            </div>
        </div>
      </section>

      {/* 4. SEÇÃO FERRAMENTAS */}
      <section className="py-20 px-4 border-t border-white/5 bg-slate-950">
        <div className="max-w-6xl mx-auto">
             <div className="text-center mb-16">
                 <h2 className="text-3xl font-black text-white mb-4">Ferramentas Profissionais</h2>
                 <p className="text-slate-400">Tudo o que você precisa em um único lugar.</p>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ToolCard icon="💰" title="Gerenciador" desc="Fluxo de Caixa" onClick={onStartNow} />
                <ToolCard icon="📈" title="Juros Compostos" desc="Simulador Pro" onClick={() => onNavigate('compound')} />
                <ToolCard icon="🔥" title="Calculadora FIRE" desc="Independência" onClick={() => onNavigate('pricing')} highlight />
                <ToolCard icon="🤖" title="Consultor IA" desc="Análise 24h" onClick={() => onNavigate('pricing')} highlight />
                <ToolCard icon="📉" title="Inflação" desc="Poder de Compra" onClick={() => onNavigate('compound')} />
                <ToolCard icon="🏠" title="Imóveis" desc="Aluguel vs Compra" onClick={() => onNavigate('pricing')} />
                <ToolCard icon="💳" title="Dívidas" desc="Método Snowball" onClick={() => onNavigate('pricing')} />
                <ToolCard icon="📊" title="Dividendos" desc="Magic Number" onClick={() => onNavigate('pricing')} />
             </div>
        </div>
      </section>

      {/* 5. BANNER FINAL APP */}
      <section className="max-w-6xl mx-auto px-4 mt-10 mb-20">
        <div className="bg-indigo-900 rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-sky-500 rounded-full blur-[100px] opacity-50"></div>
            <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">Pare de perder dinheiro.</h2>
                <p className="text-indigo-200 text-lg mb-10">
                    Instale o app agora e descubra para onde seu salário está indo. A IA do Finanças Pro já ajudou mais de 10.000 pessoas a saírem do vermelho.
                </p>
                <button onClick={onStartNow} className="bg-white text-indigo-950 px-10 py-5 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-transform">
                    CRIAR MINHA CONTA AGORA
                </button>
                <p className="mt-6 text-indigo-300 text-xs font-bold uppercase tracking-widest">Disponível para Android & Web</p>
            </div>
        </div>
      </section>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};

// --- SUB-COMPONENTES ---

const MarketSection = ({ title, items }: any) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="mb-4 last:mb-0 animate-in fade-in duration-500">
            <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 border-b border-slate-800/50 pb-1">{title}</h4>
            <div className="space-y-2">
                {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs group hover:bg-slate-800/50 p-1 rounded transition-colors">
                        <div>
                            <span className="font-bold text-slate-200 block">{item.symbol}</span>
                            <span className="text-[10px] text-slate-500">{item.name}</span>
                        </div>
                        <div className="text-right">
                            <span className="font-mono text-slate-200 block">{item.price}</span>
                            <span className={`font-mono text-[10px] ${item.up === false ? 'text-red-400' : 'text-emerald-400'}`}>
                                {item.up === false ? '▼' : '▲'} {item.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MiniTool = ({ icon, label }: any) => (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col items-center justify-center gap-1">
        <span className="text-xl">{icon}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
    </div>
);

const ToolCard = ({ icon, title, desc, onClick, highlight }: any) => (
    <div 
        onClick={onClick}
        className={`p-6 rounded-3xl border transition-all cursor-pointer hover:-translate-y-1 active:scale-95 flex flex-col items-center text-center gap-3 group
        ${highlight 
            ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-emerald-500/30 hover:border-emerald-500 shadow-lg shadow-emerald-900/10' 
            : 'bg-slate-900/50 border-slate-800 hover:border-sky-500/30 hover:bg-slate-800'}`}
    >
        <span className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">{icon}</span>
        <div>
            <h3 className="text-white font-bold text-sm mb-1">{title}</h3>
            <p className={`text-[10px] uppercase font-bold tracking-wider ${highlight ? 'text-emerald-400' : 'text-slate-500 group-hover:text-sky-400'}`}>{desc}</p>
        </div>
    </div>
);

export const DemoPage = () => <div className="text-white p-20 text-center">Demonstração Interativa em Breve</div>;
export const GuidesPage = () => <div className="text-white p-20 text-center">Guias Financeiros</div>;
export const FaqPage = () => <div className="text-white p-20 text-center">FAQ</div>;
export const AboutPage = () => <div className="text-white p-20 text-center">Sobre Nós</div>;