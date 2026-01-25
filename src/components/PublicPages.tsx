import React, { useEffect, useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  Search,
  X,
  Maximize2
} from 'lucide-react';

// === CONFIGURAÇÕES ===
const CLOUD_API_URL = 'https://getmarketdata-5auxvdzm3q-uc.a.run.app';
const AWESOME_API_URL = 'https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL,BNB-BRL,SOL-BRL,BTC-USD,ETH-USD,SOL-USD';

// === COMPONENTE MODAL DE GRÁFICO (Corrigido: Botões dentro da barra) ===
const AssetModal = ({ symbol, onClose }: { symbol: string, onClose: () => void }) => {
  const [isFull, setIsFull] = useState(false);

  const getTradingViewSymbol = (s: string) => {
    if (s === 'IBOV') return 'BMFBOVESPA:IBOV';
    if (s === 'S&P 500') return 'SP:SPX';
    if (s.includes('USD') && s.includes('BRL')) return `FX_IDC:${s.replace('-','')}`;
    if (s === 'BTC' || s === 'BTC-USD') return 'BINANCE:BTCUSD';
    if (s === 'ETH' || s === 'ETH-USD') return 'BINANCE:ETHUSD';
    return `BMFBOVESPA:${s}`;
  };

  const widgetSymbol = getTradingViewSymbol(symbol);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
      
      {/* Container do Modal */}
      <div className={`bg-[#0f172a] border border-slate-700 rounded-2xl flex flex-col overflow-hidden transition-all duration-300 relative ${isFull ? 'fixed inset-0 w-full h-full rounded-none z-[10000]' : 'w-full max-w-5xl h-[600px]'}`}>
        
        {/* Header do Modal (Agora contém os botões para alinhamento perfeito) */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-[#020617]">
            
            {/* Título (Lado Esquerdo) */}
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <span className="text-emerald-400">📊</span> Análise Técnica: {symbol}
            </h3>

            {/* Botões de Controle (Lado Direito - Dentro da barra) */}
            <div className="flex items-center gap-2">
                {!isFull && (
                    <button 
                        onClick={() => setIsFull(true)} 
                        className="bg-slate-800 p-2 hover:bg-slate-700 rounded-full text-white transition shadow-sm border border-slate-600 group" 
                        title="Tela Cheia"
                    >
                        <Maximize2 size={18} className="group-hover:scale-110 transition-transform"/>
                    </button>
                )}
                <button 
                    onClick={onClose} 
                    className="bg-red-600 p-2 hover:bg-red-500 rounded-full text-white transition shadow-sm border border-red-400 group" 
                    title="Fechar"
                >
                    <X size={18} className="group-hover:scale-110 transition-transform" />
                </button>
            </div>
        </div>

        {/* Conteúdo (TradingView Widget) */}
        <div className="flex-1 bg-black relative">
            <iframe 
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${widgetSymbol}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=America%2FSao_Paulo`}
                className="w-full h-full absolute inset-0 border-0"
                allowTransparency={true}
                scrolling="no"
                allowFullScreen
            ></iframe>
        </div>
      </div>
    </div>
  );
};

// === UTILS: FORMATAÇÃO ===
const formatNumber = (val: string | number, decimals: number = 2) => {
    let num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '---';
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);
};

const formatChange = (val: string | number) => {
    let num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '0.00%';
    return (num >= 0 ? '+' : '') + num.toFixed(2).replace('.', ',') + '%';
};

const getDisplayPrice = (type: string, symbol: string, rawPrice: any) => {
    if (rawPrice === '---' || rawPrice === undefined) return '---';
    const decimals = (type === 'currency' || symbol.includes('BTC') || symbol.includes('ETH')) ? 3 : 2;
    const formatted = formatNumber(rawPrice, decimals);

    if (type === 'index') return `${formatted} Pts`;
    if (type === 'currency') return `R$ ${formatted}`;
    if (type === 'crypto' && symbol.includes('USD')) return `US$ ${formatted}`;
    if (type === 'crypto') return `R$ ${formatted}`;
    if (type === 'stock') return `R$ ${formatted}`;
    
    return formatted;
};

// === PÁGINA PRINCIPAL ===
export const PublicHome: React.FC<any> = ({ onNavigate, onStartNow }) => {
  const [marketData, setMarketData] = useState({
    indices: [],
    stocks: [],
    currencies: [],
    cryptos: []
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const allAssets = useMemo(() => {
    return [
        ...marketData.indices,
        ...marketData.stocks,
        ...marketData.currencies,
        ...marketData.cryptos
    ];
  }, [marketData]);

  const searchResults = useMemo(() => {
      if (!searchTerm) return [];
      return allAssets.filter((asset: any) => 
          asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [searchTerm, allAssets]);

  const formatCoin = (symbol: string, rawData: any, type: 'currency' | 'crypto') => {
      if (!rawData) return { symbol, price: 0, change: 0, up: true, type };
      return {
          symbol,
          price: parseFloat(rawData.bid),
          change: parseFloat(rawData.pctChange),
          up: parseFloat(rawData.pctChange) >= 0,
          type
      };
  };

  const fetchMarketData = async () => {
    try {
      const [cloudResponse, awesomeResponse] = await Promise.all([
          fetch(`${CLOUD_API_URL}/?t=${Date.now()}`),
          fetch(AWESOME_API_URL)
      ]);

      const cloudData = await cloudResponse.json();
      const awesomeData = await awesomeResponse.json();

      const currencies = [
          formatCoin('USD', awesomeData.USDBRL, 'currency'),
          formatCoin('EUR', awesomeData.EURBRL, 'currency')
      ];

      const cryptos = [
          formatCoin('BTC', awesomeData.BTCBRL, 'crypto'),
          formatCoin('BTC-USD', awesomeData.BTCUSD, 'crypto'),
          formatCoin('ETH', awesomeData.ETHBRL, 'crypto'),
          formatCoin('ETH-USD', awesomeData.ETHUSD, 'crypto'),
          formatCoin('SOL', awesomeData.SOLBRL, 'crypto'),
          formatCoin('SOL-USD', awesomeData.SOLUSD, 'crypto'),
      ];

      const indices = (cloudData.indices || []).map((i: any) => ({...i, type: 'index'}));
      const stocks = (cloudData.stocks || []).map((i: any) => ({...i, type: 'stock'}));

      setMarketData({ indices, stocks, currencies, cryptos });

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const intervalId = setInterval(fetchMarketData, 60000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col bg-[#020617] min-h-screen text-white font-sans">
      
      {/* Modal de Gráfico */}
      {selectedAsset && (
          <AssetModal symbol={selectedAsset} onClose={() => setSelectedAsset(null)} />
      )}

      {/* Ticker (Topo) */}
      <div className="pt-16">
        <InfiniteTicker data={marketData} />
      </div>

      {/* === COLUNA LATERAL DE MERCADO === */}
      <section className="px-4 lg:px-12 py-12 lg:py-20 max-w-[1600px] mx-auto w-full grid lg:grid-cols-12 gap-8 items-start">
        
        <div className="hidden lg:flex lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex-col gap-4 shadow-2xl h-[700px] overflow-y-auto custom-scrollbar">
            
            <div className="relative mb-2">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Buscar ativo (ex: VALE3)" 
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors uppercase placeholder:text-slate-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-3 text-slate-500" size={16} />
                </div>
                
                {searchTerm && (
                    <div className="mt-2 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden animate-fade-in">
                        <p className="text-[10px] text-slate-400 uppercase font-bold px-3 py-2 bg-slate-900/50">Resultados</p>
                        {searchResults.length > 0 ? (
                            searchResults.map((item: any, i: number) => (
                                <div key={i} className="p-2 hover:bg-slate-700 cursor-pointer border-t border-slate-700/50" onClick={() => setSelectedAsset(item.symbol)}>
                                    <MarketItemRow item={item} isSearchResult={true} />
                                </div>
                            ))
                        ) : (
                            <div className="p-3 text-center text-xs text-slate-500">
                                Nenhum ativo encontrado na lista.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <h3 className="text-emerald-400 font-black text-xs uppercase tracking-widest border-b border-slate-800 pb-2 mt-2">Mercado ao Vivo</h3>
            
            <MarketGroup title="Índices Globais" items={marketData.indices} onClickItem={setSelectedAsset} />
            <MarketGroup title="Câmbio" items={marketData.currencies} onClickItem={setSelectedAsset} />
            <MarketGroup title="Criptomoedas" items={marketData.cryptos} onClickItem={setSelectedAsset} />
            <MarketGroup title="Destaques B3" items={marketData.stocks} onClickItem={setSelectedAsset} />
            
        </div>

        {/* === CONTEÚDO CENTRAL === */}
        <div className="lg:col-span-6 text-center space-y-8 py-10">
            <h1 className="text-5xl lg:text-8xl font-black text-white leading-none tracking-tight">
                Domine o Jogo <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">do Dinheiro</span>
            </h1>
            <p className="text-slate-400 text-lg lg:text-xl max-w-xl mx-auto">
                Tudo o que você precisa para gerenciar, simular e investir melhor.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <button onClick={onStartNow} className="bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all">
                    COMEÇAR AGORA
                </button>
                <button onClick={() => onNavigate && onNavigate('compound')} className="bg-slate-800 text-white px-8 py-5 rounded-2xl font-bold text-xl border border-slate-700 hover:bg-slate-700 transition-all">
                    DEMONSTRAÇÃO
                </button>
            </div>
            
            <div className="grid grid-cols-4 gap-2 opacity-50 grayscale pt-10 max-w-md mx-auto">
                <div className="text-center"><span className="text-2xl block">💰</span><span className="text-[10px] font-bold">GESTÃO</span></div>
                <div className="text-center"><span className="text-2xl block">📈</span><span className="text-[10px] font-bold">JUROS</span></div>
                <div className="text-center"><span className="text-2xl block">🔥</span><span className="text-[10px] font-bold">FIRE</span></div>
                <div className="text-center"><span className="text-2xl block">🤖</span><span className="text-[10px] font-bold">IA</span></div>
            </div>
        </div>

        {/* === COLUNA DIREITA: INSIGHTS === */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-6">
            <InsightCard title="Calculadora FIRE" desc="Nova ferramenta de independência financeira liberada." tag="NOVO" onClick={() => onNavigate && onNavigate('fire')} />
            <InsightCard title="Como investir em 2026" desc="O guia completo sobre a nova economia." tag="CURSO" onClick={() => onNavigate && onNavigate('blog')} />
            <InsightCard title="Inflação no Brasil" desc="O IPCA acumulado exige cautela na renda fixa." tag="NOTÍCIA" onClick={() => onNavigate && onNavigate('blog')} />
        </div>
      </section>

      {/* FERRAMENTAS */}
      <section className="bg-slate-900/30 py-20 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-center text-slate-500 font-bold uppercase tracking-widest mb-12">8 Ferramentas Poderosas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <ToolItem icon="💰" name="Gerenciador" desc="Fluxo de Caixa" onClick={onStartNow} />
                <ToolItem icon="📈" name="Juros Compostos" desc="Simulador" onClick={() => onNavigate && onNavigate('compound')} />
                <ToolItem icon="🔥" name="Calculadora FIRE" desc="Independência" onClick={() => onNavigate && onNavigate('fire')} />
                <ToolItem icon="🤖" name="Consultor IA" desc="Análise 24h" onClick={() => onNavigate && onNavigate('ai_chat')} />
                <ToolItem icon="📉" name="Inflação" desc="Poder de Compra" onClick={() => onNavigate && onNavigate('inflation')} />
                <ToolItem icon="🏠" name="Imóveis" desc="Alugar vs Comprar" onClick={() => onNavigate && onNavigate('rent_vs_buy')} />
                <ToolItem icon="💳" name="Dívidas" desc="Otimizador" onClick={() => onNavigate && onNavigate('debt')} />
                <ToolItem icon="📊" name="Dividendos" desc="Renda Passiva" onClick={() => onNavigate && onNavigate('dividends')} />
            </div>
        </div>
      </section>
    </div>
  );
};

// === COMPONENTES AUXILIARES ===

const InfiniteTicker = ({ data }: any) => {
    const all = [ ...data.indices, ...(data.currencies || []), ...data.stocks, ...(data.cryptos || []) ];
    
    const formatItem = (item: any) => {
        const val = getDisplayPrice(item.type, item.symbol, item.price);
        const change = formatChange(item.change);
        return { val, change };
    };

    return (
        <div className="w-full bg-[#0f172a] border-b border-slate-800 h-12 flex items-center overflow-hidden z-40">
            <div className="animate-marquee flex whitespace-nowrap items-center">
                {[...all, ...all].map((item, i) => {
                    const { val, change } = formatItem(item);
                    return (
                        <div key={`${item.symbol}-${i}`} className="flex items-center gap-2 mx-8 text-sm font-mono font-bold">
                            <span className="text-slate-400">{item.symbol}</span>
                            <span className={item.up ? 'text-emerald-400' : 'text-red-400'}>{val}</span>
                            <span className={`text-xs ${item.up ? 'text-emerald-500' : 'text-red-500'} opacity-80 flex items-center`}>
                               {item.up ? <TrendingUp size={12} strokeWidth={3} className="mr-1"/> : <TrendingDown size={12} strokeWidth={3} className="mr-1"/>}
                               {change}
                            </span>
                        </div>
                    );
                })}
            </div>
            <style>{` @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee { animation: marquee 80s linear infinite; } `}</style>
        </div>
    );
};

const MarketGroup = ({ title, items, onClickItem }: any) => (
    <div className="mb-4">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">{title}</p>
        <div className="flex flex-col gap-1">
            {items.map((item: any, i: number) => (
                <MarketItemRow key={i} item={item} onClick={() => onClickItem(item.symbol)} />
            ))}
        </div>
    </div>
);

const MarketItemRow = ({ item, onClick, isSearchResult }: any) => {
    const displayPrice = getDisplayPrice(item.type, item.symbol, item.price);
    const displayChange = formatChange(item.change);

    return (
        <div 
            onClick={onClick} 
            className={`
                flex items-center justify-between 
                bg-slate-800/40 border border-slate-800/60 rounded-lg p-2 
                hover:bg-slate-700/60 hover:border-slate-600 transition-all cursor-pointer group
                ${isSearchResult ? 'border-none bg-transparent' : ''}
            `}
        >
            <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors min-w-[60px]">
                    {item.symbol}
                </span>
                <span className="text-xs font-bold text-white tracking-wide">
                    {displayPrice}
                </span>
            </div>

            <span className={`text-[10px] font-bold flex items-center ${item.up ? 'text-emerald-500' : 'text-red-500'}`}>
                {item.up ? <TrendingUp size={12} strokeWidth={3} className="mr-1"/> : <TrendingDown size={12} strokeWidth={3} className="mr-1"/>}
                {displayChange}
            </span>
        </div>
    );
};

const InsightCard = ({ title, desc, tag, onClick }: any) => (
    <div onClick={onClick} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-sky-500/30 transition-all cursor-pointer group">
        <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-1 rounded font-black uppercase mb-3 inline-block">{tag}</span>
        <h4 className="text-white font-bold mb-2 group-hover:text-sky-300 transition-colors">{title}</h4>
        <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
    </div>
);

const ToolItem = ({ icon, name, desc, onClick }: any) => (
    <div onClick={onClick} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col items-center text-center gap-3 hover:border-emerald-500/40 transition-all cursor-pointer active:scale-95">
        <span className="text-4xl">{icon}</span>
        <div>
            <h5 className="text-white font-bold text-sm">{name}</h5>
            <p className="text-slate-500 text-[10px] font-bold uppercase mt-1">{desc}</p>
        </div>
    </div>
);

export default PublicHome;