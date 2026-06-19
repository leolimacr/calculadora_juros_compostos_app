import React from 'react';
import { BarChart3, Search, LogOut } from 'lucide-react';
import { MarketItemRow } from '../Public/MarketComponents';
import { ALL_B3_TICKERS } from '../../data/tickers';
import { fetchAssetQuote } from '../../services/marketService';

interface Props {
  marketData: any;
  indicesComIndicadores: any[];
  onSetSelectedAsset: (asset: { symbol: string; category: string }) => void;
}

export const HomeTerminalMercado: React.FC<Props> = ({ marketData, indicesComIndicadores, onSetSelectedAsset }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [cryptoSymbol, setCryptoSymbol] = React.useState('');
  const [searchPreview, setSearchPreview] = React.useState<any>(null);
  const [cryptoPreview, setCryptoPreview] = React.useState<any>(null);

  const suggestions = React.useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const term = searchTerm.toUpperCase();
    return ALL_B3_TICKERS.filter((t: string) => t.includes(term)).slice(0, 6);
  }, [searchTerm]);

  const handleSelectSuggestion = async (ticker: string) => {
    setSearchTerm('');
    setSearchPreview({ symbol: ticker, price: null, type: 'stock', change: null, up: true });
    try {
      const quote = await fetchAssetQuote(ticker);
      if (quote) setSearchPreview({ symbol: quote.symbol, price: quote.price, change: quote.changePercent, up: quote.changePercent >= 0, type: quote.category });
      else setSearchPreview(null);
    } catch { setSearchPreview(null); }
  };

  const handleCryptoSearch = async () => {
    if (!cryptoSymbol.trim()) return;
    const ticker = cryptoSymbol.trim().toUpperCase();
    setCryptoPreview({ symbol: ticker, price: null, change: null, up: true });
    try {
      const quote = await fetchAssetQuote(ticker);
      if (quote) setCryptoPreview({ symbol: quote.symbol, price: quote.price, change: quote.changePercent, up: quote.changePercent >= 0, type: quote.category });
      else { setCryptoPreview(null); alert('Criptomoeda não encontrada'); }
    } catch { setCryptoPreview(null); }
    finally { setCryptoSymbol(''); }
  };

  const MarketPanel = ({ title, items }: { title: string; items: any[] }) => {
    const accentMap: Record<string, string> = { 'Câmbio': 'bg-emerald-500', 'Cripto': 'bg-blue-500', 'B3': 'bg-amber-500' };
    const accent = Object.entries(accentMap).find(([k]) => title.includes(k))?.[1] || 'bg-sky-500';
    
    return (
      <div className="bg-[#111622] border border-white/[0.06] rounded-2xl p-5 flex flex-col h-[320px] relative overflow-hidden group hover:border-white/[0.12] transition-colors shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
        <div className={`absolute top-0 left-0 w-full h-[2px] ${accent} opacity-50 group-hover:opacity-100 transition-opacity`} />
        
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 pb-3 border-b border-white/[0.04] flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${accent} animate-pulse`} />
          {title}
        </h3>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {items.map((item: any, idx: number) => (
            <div 
              key={idx} 
              onClick={() => onSetSelectedAsset({ symbol: item.symbol, category: item.type })} 
              className="flex justify-between items-center p-3 bg-[#0B0F17] border border-white/[0.04] rounded-xl cursor-pointer hover:border-white/[0.1] transition-all"
            >
              <div>
                <span className="font-bold text-white text-xs block">{item.symbol}</span>
                <span className="text-[9px] text-[#A0A4AB] font-mono uppercase">{item.type}</span>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="block text-xs font-bold text-white font-mono">
                  {item.type === 'currency' || item.type === 'crypto' ? 'R$ ' : ''}
                  {typeof item.price === 'number' ? item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.price}
                </span>
                {item.change !== undefined && (
                  <span className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 font-mono ${
                    item.up ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' : 'bg-rose-950/40 text-rose-400 border border-rose-900/30'
                  }`}>
                    {item.up ? '+' : ''}{item.change?.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="py-24 bg-[#0B0F17] border-t border-white/[0.04] w-full font-sans">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wider mb-2 flex items-center gap-2">
              <BarChart3 className="text-[#A0A4AB]" size={20} />
              Cotações e Indicadores do Mercado
            </h2>
            <p className="text-[#A0A4AB] text-xs uppercase tracking-wider font-semibold">
              B3, criptoativos, moedas e indicadores monitorados pelo ecossistema
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input 
                type="text" 
                placeholder="Pesquisar B3 (ex: PETR4)" 
                className="w-full bg-[#111622] border border-white/[0.08] focus:border-blue-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white placeholder-[#A0A4AB]/40 transition-colors uppercase outline-none" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && searchTerm && handleSelectSuggestion(searchTerm.toUpperCase())} 
              />
              <Search className="absolute left-3 top-3 text-[#A0A4AB]" size={14} />
              {suggestions.length > 0 && (
                <div className="mt-2 bg-[#111622] border border-white/[0.08] rounded-xl overflow-hidden absolute w-full z-50 shadow-xl">
                  {suggestions.map((t: string, i: number) => (
                    <div 
                      key={i} 
                      className="p-3 hover:bg-white/[0.04] cursor-pointer border-t border-white/[0.04] font-bold text-xs text-white" 
                      onClick={() => handleSelectSuggestion(t)}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="relative flex-1 sm:w-64">
              <input 
                type="text" 
                placeholder="Buscar Cripto (ex: BTC)" 
                className="w-full bg-[#111622] border border-white/[0.08] focus:border-blue-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white placeholder-[#A0A4AB]/40 transition-colors uppercase outline-none" 
                value={cryptoSymbol} 
                onChange={(e) => setCryptoSymbol(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleCryptoSearch()} 
              />
              <Search className="absolute left-3 top-3 text-[#A0A4AB]" size={14} />
            </div>
          </div>
        </div>

        {(searchPreview || cryptoPreview) && (
          <div 
            onClick={() => { const p = searchPreview || cryptoPreview; if (p) onSetSelectedAsset({ symbol: p.symbol, category: p.type }); }} 
            className="bg-[#111622] border border-white/[0.08] hover:border-white/[0.12] p-5 rounded-2xl mb-8 flex items-center justify-between shadow-lg cursor-pointer transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-950/40 border border-blue-900/50 flex items-center justify-center text-blue-400 font-bold text-xs">
                {(searchPreview?.symbol || cryptoPreview?.symbol)?.substring(0, 3)}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{searchPreview?.symbol || cryptoPreview?.symbol}</h3>
                <p className="text-[#A0A4AB] text-[9px] uppercase font-bold tracking-wider">{searchPreview ? 'Ativo B3' : 'Criptomoeda'}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-white font-mono">{searchPreview?.price != null ? `R$ ${Number(searchPreview.price).toFixed(2).replace('.', ',')}` : cryptoPreview?.price != null ? `R$ ${Number(cryptoPreview.price).toFixed(2).replace('.', ',')}` : 'Buscando...'}</div>
              <div className={`text-xs font-black font-mono mt-1 ${(searchPreview?.up ?? cryptoPreview?.up) ? 'text-emerald-400' : 'text-rose-400'}`}>
                {searchPreview?.change != null ? `${searchPreview.change > 0 ? '+' : ''}${Number(searchPreview.change).toFixed(2)}%` : cryptoPreview?.change != null ? `${cryptoPreview.change > 0 ? '+' : ''}${Number(cryptoPreview.change).toFixed(2)}%` : '0,00%'}
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setSearchPreview(null); setCryptoPreview(null); }} className="p-2 hover:bg-white/10 rounded-lg text-[#A0A4AB] hover:text-white transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <MarketPanel title="Índices Globais e Indicadores" items={indicesComIndicadores} />
          <MarketPanel title="Câmbio & Moedas" items={marketData.currencies} />
          <MarketPanel title="Criptoativos" items={marketData.cryptos} />
          <MarketPanel title="Destaques B3" items={marketData.stocks.slice(0, 5)} />
        </div>
      </div>
    </section>
  );
};