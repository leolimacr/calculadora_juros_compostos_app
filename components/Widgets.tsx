
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
    const isUSD = item.symbol.includes('/USD');
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
                    ? `${item.price.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} pts`
                    : isUSD 
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

// --- Widget de Cotações (Real-Time) ---
export const MarketWidget = () => {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const refreshData = async (manual = false) => {
    if (manual) setLoading(true); // Mostra loading se for clique manual
    
    // Passa 'manual' como forceRefresh para o serviço
    const { quotes: data } = await fetchMarketQuotes(manual);
    
    if (data && data.length > 0) {
      setQuotes(data);
      setLastUpdate(new Date());
    }
    setLoading(false);
  };

  useEffect(() => {
    // Initial fetch
    refreshData();

    // Atualiza a cada 30 segundos automaticamente (usa cache se disponível)
    const interval = setInterval(() => refreshData(false), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-5 relative overflow-hidden shadow-lg h-fit">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700">
            <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2">
                <span className="text-emerald-500 text-lg">📊</span> Mercado
            </h3>
            <span className="text-[9px] text-slate-500 flex items-center gap-1">
               {loading ? <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span> : <span className="w-2 h-2 bg-slate-600 rounded-full"></span>}
               {lastUpdate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
        </div>

        {loading && quotes.length === 0 ? (
          <MarketSkeleton />
        ) : (
          <div className="space-y-3">
              {/* Moedas */}
              <div className="bg-slate-900/30 rounded-xl p-3 border border-slate-700/50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-wider px-1">Moedas</span>
                  <div className="space-y-0.5">
                    {quotes.filter(q => q.category === 'currency').map(q => <ItemRow key={`${q.symbol}-${lastUpdate.getTime()}`} item={q} />)}
                  </div>
              </div>
              
              {/* Cripto */}
              <div className="bg-slate-900/30 rounded-xl p-3 border border-slate-700/50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-wider px-1">Cripto</span>
                  <div className="space-y-0.5">
                    {quotes.filter(q => q.category === 'crypto').map(q => <ItemRow key={`${q.symbol}-${lastUpdate.getTime()}`} item={q} />)}
                  </div>
              </div>

              {/* Índices (Se houver) */}
              {quotes.some(q => q.category === 'index') && (
                <div className="bg-slate-900/30 rounded-xl p-3 border border-slate-700/50">
                    <span className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-wider px-1">Índices</span>
                    <div className="space-y-0.5">
                      {quotes.filter(q => q.category === 'index').map(q => <ItemRow key={`${q.symbol}-${lastUpdate.getTime()}`} item={q} />)}
                    </div>
                </div>
              )}
          </div>
        )}
        
        <div className="mt-4 pt-2 border-t border-slate-700/50">
           <div className="flex justify-between items-center">
              <p className="text-[8px] text-slate-500 leading-tight max-w-[120px]">
                  Moedas/Cripto: 30s<br/>
                  Índices: 1 min
              </p>
              <button 
                onClick={() => refreshData(true)} 
                className={`text-[10px] text-emerald-500 hover:text-emerald-400 font-bold flex items-center gap-1 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                disabled={loading}
              >
                {loading ? 'Atualizando...' : 'Atualizar ↻'}
              </button>
           </div>
        </div>
    </div>
  );
};
