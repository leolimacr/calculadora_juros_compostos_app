
import React, { useState, useEffect } from 'react';
import { MarketQuote } from '../types';
import { fetchMarketQuotes } from '../services/marketService';

// --- Widget de Notícias ---
export const NewsWidget = () => {
  const news = [
    { id: 1, tag: 'App', title: 'Nova Calculadora FIRE disponível!', date: 'Hoje' },
    { id: 2, tag: 'Mercado', title: 'Inflação acumula alta de 0,5% no mês.', date: 'Ontem' },
    { id: 3, tag: 'Carreira', title: 'Como negociar salário em 2024.', date: '2 dias atrás' },
    { id: 4, tag: 'IA', title: 'IA ajudando a reduzir gastos fixos.', date: '3 dias atrás' }
  ];

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-5 h-fit shadow-lg">
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

// --- Componentes Auxiliares do Widget de Mercado ---

const MarketSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {[1, 2, 3].map(i => (
      <div key={i} className="flex justify-between items-center py-2 border-b border-slate-700/50">
        <div className="h-3 w-20 bg-slate-700 rounded"></div>
        <div className="space-y-1">
          <div className="h-3 w-16 bg-slate-700 rounded ml-auto"></div>
          <div className="h-2 w-10 bg-slate-700 rounded ml-auto"></div>
        </div>
      </div>
    ))}
  </div>
);

const ItemRow: React.FC<{ item: MarketQuote }> = ({ item }) => {
    const isUSD = item.symbol.includes('/USD') || item.symbol === 'BTC' || item.symbol === 'ETH'; // Ajuste para BTC/ETH poderem ser USD
    return (
      <div className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20 transition-colors px-2 rounded-lg animate-in fade-in duration-500">
          <div className="flex flex-col">
             <span className="text-xs text-slate-300 font-bold">{item.symbol}</span>
             <span className="text-[9px] text-slate-500 truncate max-w-[120px] hidden sm:block">
               {item.name}
             </span>
          </div>
          <div className="text-right">
              <div className="text-xs font-bold text-white">
                  {item.category === 'index' 
                    ? `${item.price.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} pts`
                    : isUSD && !item.symbol.includes('BRL')
                      ? `$ ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : `R$ ${item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
              <div className={`text-[10px] font-bold ${item.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {item.changePercent >= 0 ? '↑' : '↓'} {Math.abs(item.changePercent).toFixed(2)}%
              </div>
          </div>
      </div>
    );
};

// --- Componente: Market Ticker Bar (Faixa Horizontal) ---
export const MarketTickerBar = () => {
    const [quotes, setQuotes] = useState<MarketQuote[]>([]);
    
    useEffect(() => {
        // Carrega dados iniciais (usa cache se existir)
        const load = async () => {
            const { quotes: data } = await fetchMarketQuotes(false);
            setQuotes(data);
        };
        load();
        
        // Atualiza a cada 60s
        const interval = setInterval(load, 60000);
        return () => clearInterval(interval);
    }, []);

    if (quotes.length === 0) return null;

    // Filtra itens principais para o ticker
    const tickerItems = quotes.filter(q => 
        ['USD', 'EUR', 'IBOV', 'VALE3', 'PETR4', 'ITUB4'].includes(q.symbol) || 
        q.symbol === 'BTC'
    );

    return (
        <div className="w-full bg-slate-900 border-y border-slate-700/50 h-10 overflow-hidden relative flex items-center mb-4 lg:rounded-xl lg:border">
            {/* Efeito Marquee CSS (Scroll Infinito) */}
            <div className="flex animate-marquee whitespace-nowrap items-center hover:pause-animation">
                {[...tickerItems, ...tickerItems, ...tickerItems].map((item, idx) => (
                    <div key={`${item.symbol}-${idx}`} className="flex items-center gap-2 px-4 border-r border-slate-800/50">
                        <span className="text-xs font-bold text-slate-300">{item.symbol}</span>
                        <span className="text-xs font-mono text-white">
                            {item.category === 'index' 
                                ? item.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) 
                                : item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`text-[10px] font-bold ${item.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {item.changePercent >= 0 ? '▲' : '▼'} {Math.abs(item.changePercent).toFixed(2)}%
                        </span>
                    </div>
                ))}
            </div>
            
            {/* Inline Style para animação Marquee customizada */}
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                .hover\\:pause-animation:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
};

// --- Widget de Cotações (Real-Time) ---
export const MarketWidget = () => {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const refreshData = async (manual = false) => {
    if (manual) setLoading(true);
    
    const { quotes: data } = await fetchMarketQuotes(manual);
    
    if (data && data.length > 0) {
      setQuotes(data);
      setLastUpdate(new Date());
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(() => refreshData(false), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-5 relative overflow-hidden shadow-lg h-fit flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 pb-2 border-b border-slate-700">
            <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2 mt-1">
                <span className="text-emerald-500 text-lg">📊</span> Mercado
            </h3>
            
            <div className="flex items-center gap-2">
                <div className="group relative">
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-32 p-2 bg-slate-900 border border-slate-700 rounded-lg text-[9px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl text-right">
                        <p>Última: {lastUpdate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                </div>

                <button 
                    onClick={() => refreshData(true)} 
                    disabled={loading}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-900/30 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 transition-all ${loading ? 'cursor-not-allowed opacity-70' : 'active:scale-95'}`}
                    title="Atualizar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>
        </div>

        {/* Content Area */}
        {loading && quotes.length === 0 ? (
          <MarketSkeleton />
        ) : (
          <div className="space-y-4">
              
              {/* Índices */}
              {quotes.some(q => q.category === 'index') && (
                <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase mb-1 block tracking-wider px-1">Principais Índices</span>
                    <div className="bg-slate-900/30 rounded-xl p-2 border border-slate-700/50 space-y-0.5">
                      {quotes.filter(q => q.category === 'index').map(q => <ItemRow key={`${q.symbol}`} item={q} />)}
                    </div>
                </div>
              )}

              {/* Moedas & Cripto */}
              <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase mb-1 block tracking-wider px-1">Moedas</span>
                  <div className="bg-slate-900/30 rounded-xl p-2 border border-slate-700/50 space-y-0.5">
                    {quotes.filter(q => q.category === 'currency' || q.category === 'crypto').slice(0, 4).map(q => <ItemRow key={`${q.symbol}`} item={q} />)}
                  </div>
              </div>

              {/* Ações Ibovespa (Top 5) */}
              {quotes.some(q => q.category === 'stock') && (
                <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase mb-1 block tracking-wider px-1">Ações Ibovespa (Top 5)</span>
                    <div className="bg-slate-900/30 rounded-xl p-2 border border-slate-700/50 space-y-0.5">
                      {quotes.filter(q => q.category === 'stock').map(q => <ItemRow key={`${q.symbol}`} item={q} />)}
                    </div>
                </div>
              )}
          </div>
        )}
    </div>
  );
};
