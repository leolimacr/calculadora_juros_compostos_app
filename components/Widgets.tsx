
import React, { useState, useEffect, useRef } from 'react';
import { MarketQuote } from '../types';
import { fetchMarketQuotes, searchAssets, fetchAssetQuote, AssetSearchResult } from '../services/marketService';

interface MarketWidgetProps {
    onAssetClick?: (asset: MarketQuote) => void;
}

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

const ItemRow: React.FC<{ item: MarketQuote; isHighlight?: boolean; onClick?: () => void }> = ({ item, isHighlight, onClick }) => {
    // Identifica se é Cripto para formatação específica
    const isCrypto = item.category === 'crypto';
    const isFiatCurrency = item.category === 'currency';
    const isUSD = item.symbol.includes('/USD');
    
    return (
      <div 
        onClick={onClick}
        className={`flex justify-between items-center py-2 px-2 rounded-lg animate-in fade-in duration-500 cursor-pointer ${
          isHighlight 
            ? 'bg-emerald-900/20 border border-emerald-500/30 shadow-md mb-2' 
            : 'border-b border-slate-700/50 last:border-0 hover:bg-slate-700/40 transition-colors'
      }`}>
          <div className="flex flex-col">
             <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-bold group-hover:text-white transition-colors">{item.symbol}</span>
                {isHighlight && <span className="text-[9px] bg-emerald-500 text-slate-900 px-1 rounded font-bold">BUSCA</span>}
                {isCrypto && !isHighlight && <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1 rounded border border-indigo-500/20">Cripto</span>}
             </div>
             <span className="text-[9px] text-slate-500 truncate max-w-[120px] hidden sm:block">
               {item.name}
             </span>
          </div>
          <div className="text-right">
              <div className="text-xs font-bold text-white">
                  {item.category === 'index' 
                    ? `${item.price.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} pts`
                    : isUSD
                        ? `US$ ${item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : isFiatCurrency 
                            ? `R$ ${item.price.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
                            : `R$ ${item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
              <div className={`text-[10px] font-bold ${item.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {item.changePercent >= 0 ? '↑' : '↓'} {Math.abs(item.changePercent).toFixed(2)}%
              </div>
          </div>
      </div>
    );
};

// --- Componente: Market Ticker Bar (Faixa Horizontal - 50%) ---
export const MarketTickerBar: React.FC<{ onAssetClick?: (asset: MarketQuote) => void }> = ({ onAssetClick }) => {
    const [quotes, setQuotes] = useState<MarketQuote[]>([]);
    
    useEffect(() => {
        const load = async () => {
            const { quotes: data } = await fetchMarketQuotes(false);
            setQuotes(data);
        };
        load();
        const interval = setInterval(load, 60000);
        return () => clearInterval(interval);
    }, []);

    if (quotes.length === 0) return (
        <div className="h-8 bg-[#020617] flex items-center justify-center border-r border-slate-800">
            <span className="text-[10px] text-slate-600 animate-pulse">Carregando mercado...</span>
        </div>
    );

    // Filtra ativos principais para o ticker
    const tickerItems = quotes.filter(q => 
        ['USD', 'EUR', 'IBOV', 'VALE3', 'PETR4', 'ITUB4'].includes(q.symbol) || 
        q.category === 'crypto'
    );

    return (
        <div className="w-full h-8 bg-[#020617] overflow-hidden relative flex items-center border-r border-slate-800/50">
            <div className="flex animate-marquee whitespace-nowrap items-center hover:pause-animation">
                {[...tickerItems, ...tickerItems, ...tickerItems].map((item, idx) => {
                    const isFiat = item.category === 'currency';
                    const decimals = isFiat ? 3 : 2;
                    const isUSD = item.symbol.includes('/USD');
                    
                    return (
                        <button 
                            key={`${item.symbol}-${idx}`} 
                            onClick={() => onAssetClick?.(item)}
                            className="flex items-center gap-2 px-4 border-r border-slate-800/30 h-full hover:bg-slate-800/50 transition-colors focus:outline-none"
                        >
                            <span className="text-[10px] font-bold text-slate-400">{item.symbol}</span>
                            <span className="text-[10px] font-mono text-white">
                                {item.category === 'index' 
                                    ? item.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) 
                                    : (isUSD ? 'US$ ' : 'R$ ') + item.price.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
                            </span>
                            <span className={`text-[9px] font-bold ${item.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {item.changePercent >= 0 ? '▲' : '▼'} {Math.abs(item.changePercent).toFixed(2)}%
                            </span>
                        </button>
                    );
                })}
            </div>
            
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 40s linear infinite;
                }
                .hover\\:pause-animation:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
};

// --- Componente: Market Status Bar (Faixa Horizontal Direita - 50%) ---
export const MarketStatusBar = () => {
    const [time, setTime] = useState(new Date());
    const [marketStatus, setMarketStatus] = useState<'open' | 'closed'>('closed');
    const [ibovTrend, setIbovTrend] = useState<'bull' | 'bear' | 'flat'>('flat');

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setTime(now);
            
            // Lógica B3 (Simples): Dias úteis 10:00 - 17:00
            const day = now.getDay();
            const hour = now.getHours();
            const isWeekend = day === 0 || day === 6;
            const isWorkingHours = hour >= 10 && hour < 17;
            
            setMarketStatus(!isWeekend && isWorkingHours ? 'open' : 'closed');
        }, 1000);

        // Verifica tendência IBOV para status visual
        const checkTrend = async () => {
            const { quotes } = await fetchMarketQuotes(false);
            const ibov = quotes.find(q => q.symbol === 'IBOV' || q.symbol === '^BVSP');
            if (ibov) {
                if (ibov.changePercent > 0.1) setIbovTrend('bull');
                else if (ibov.changePercent < -0.1) setIbovTrend('bear');
                else setIbovTrend('flat');
            }
        };
        checkTrend();

        return () => clearInterval(timer);
    }, []);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div className="w-full h-8 bg-[#020617] flex items-center justify-between px-4 text-[10px] sm:text-xs">
            {/* Status B3 */}
            <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
                    marketStatus === 'open' 
                        ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400' 
                        : 'bg-slate-800/50 border-slate-700 text-slate-400'
                }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${marketStatus === 'open' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                    <span className="font-bold uppercase tracking-wider">{marketStatus === 'open' ? 'B3 ABERTA' : 'B3 FECHADA'}</span>
                </div>
                
                {/* Indicador de Sentimento */}
                <div className="hidden sm:flex items-center gap-1 text-slate-500 border-l border-slate-800 pl-3 ml-1">
                    <span>Sentimento:</span>
                    <span className={`font-bold ${
                        ibovTrend === 'bull' ? 'text-emerald-400' : ibovTrend === 'bear' ? 'text-red-400' : 'text-slate-300'
                    }`}>
                        {ibovTrend === 'bull' ? 'Otimista 🐂' : ibovTrend === 'bear' ? 'Pessimista 🐻' : 'Neutro ⚖️'}
                    </span>
                </div>
            </div>

            {/* Relógio / Data */}
            <div className="flex items-center gap-3 font-mono text-slate-400">
                <span className="hidden sm:inline">{formatDate(time)}</span>
                <span className="text-slate-600 hidden sm:inline">|</span>
                <span className="text-white font-bold">{formatTime(time)}</span>
                <span className="text-[9px] bg-slate-800 px-1 rounded text-slate-500">BRT</span>
            </div>
        </div>
    );
};

// --- Widget de Cotações (Real-Time) ---
export const MarketWidget: React.FC<MarketWidgetProps> = ({ onAssetClick }) => {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AssetSearchResult[]>([]);
  const [searchedAsset, setSearchedAsset] = useState<MarketQuote | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchResultLoading, setIsSearchResultLoading] = useState(false);
  const searchTimeout = useRef<any>(null);

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

  // Debounce Search Logic
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (searchQuery.length >= 2) {
      setIsSearching(true);
      searchTimeout.current = setTimeout(async () => {
        const results = await searchAssets(searchQuery);
        setSuggestions(results.slice(0, 5)); // Top 5
        setIsSearching(false);
      }, 500); // 500ms debounce
    } else {
      setSuggestions([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSelectAsset = async (symbol: string) => {
    setSearchQuery(''); // Limpa input
    setSuggestions([]); // Limpa lista
    setIsSearchResultLoading(true);
    
    const quote = await fetchAssetQuote(symbol);
    if (quote) {
      setSearchedAsset(quote);
    } else {
      alert('Não foi possível carregar a cotação deste ativo no momento.');
    }
    setIsSearchResultLoading(false);
  };

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

        {/* --- Busca de Ativos --- */}
        <div className="mb-4 relative z-20">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Buscar ação, FII ou cripto (ex: BTC)"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 pl-8 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                
                {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="block w-2 h-2 rounded-full border-2 border-slate-500 border-t-emerald-500 animate-spin"></span>
                    </div>
                )}
            </div>

            {/* Lista de Sugestões (Dropdown) */}
            {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-600 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                    {suggestions.map((asset) => (
                        <button
                            key={asset.symbol}
                            onClick={() => handleSelectAsset(asset.symbol)}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 transition-colors flex justify-between items-center group"
                        >
                            <div>
                                <span className="font-bold text-white block">{asset.symbol}</span>
                                <span className="text-slate-500 text-[10px] truncate max-w-[150px] block">{asset.name}</span>
                            </div>
                            <span className={`text-[9px] px-1.5 rounded ${
                                asset.type === 'Cripto' ? 'bg-indigo-900/50 text-indigo-300' : 'bg-slate-800 text-slate-400'
                            } group-hover:bg-opacity-80`}>
                                {asset.type}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Loading Result State */}
        {isSearchResultLoading && (
            <div className="py-4 text-center">
                <span className="text-xs text-slate-400 animate-pulse">Buscando cotação atualizada...</span>
            </div>
        )}

        {/* Resultado da Busca */}
        {searchedAsset && !isSearchResultLoading && (
            <div className="mb-4 relative group">
                <button 
                    onClick={() => setSearchedAsset(null)} 
                    className="absolute -top-2 -right-1 text-slate-500 hover:text-red-400 z-10 bg-slate-900 rounded-full w-4 h-4 flex items-center justify-center text-[10px]" 
                    title="Fechar busca"
                >
                    ✕
                </button>
                <ItemRow item={searchedAsset} isHighlight onClick={() => onAssetClick?.(searchedAsset)} />
            </div>
        )}

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
                      {quotes.filter(q => q.category === 'index').map(q => <ItemRow key={`${q.symbol}`} item={q} onClick={() => onAssetClick?.(q)} />)}
                    </div>
                </div>
              )}

              {/* Moedas (Fiat) */}
              <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase mb-1 block tracking-wider px-1">Moedas</span>
                  <div className="bg-slate-900/30 rounded-xl p-2 border border-slate-700/50 space-y-0.5">
                    {quotes.filter(q => q.category === 'currency').map(q => <ItemRow key={`${q.symbol}`} item={q} onClick={() => onAssetClick?.(q)} />)}
                  </div>
              </div>

              {/* Criptomoedas (Nova Seção) */}
              {quotes.some(q => q.category === 'crypto') && (
                <div>
                    <span className="text-[10px] font-bold text-indigo-400/80 uppercase mb-1 block tracking-wider px-1">Criptomoedas</span>
                    <div className="bg-indigo-950/10 rounded-xl p-2 border border-indigo-500/10 space-y-0.5">
                      {quotes.filter(q => q.category === 'crypto').map(q => <ItemRow key={`${q.symbol}`} item={q} onClick={() => onAssetClick?.(q)} />)}
                    </div>
                </div>
              )}

              {/* Ações Ibovespa (Top 5) */}
              {quotes.some(q => q.category === 'stock') && (
                <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase mb-1 block tracking-wider px-1">Ações Ibovespa (Top 5)</span>
                    <div className="bg-slate-900/30 rounded-xl p-2 border border-slate-700/50 space-y-0.5">
                      {quotes.filter(q => q.category === 'stock').map(q => <ItemRow key={`${q.symbol}`} item={q} onClick={() => onAssetClick?.(q)} />)}
                    </div>
                </div>
              )}
          </div>
        )}
    </div>
  );
};
