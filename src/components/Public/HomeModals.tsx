import React, { useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';

export const ContentModal = ({ title, icon: Icon, children, onClose }: any) => (
  <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
    <div className="bg-[#0f172a] border border-slate-700 w-full max-w-3xl max-h-[85vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden relative">
      <div className="absolute top-0 right-0 p-6">
        <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition-colors"><X size={24}/></button>
      </div>
      <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400"><Icon size={32} /></div>
          <h2 className="text-3xl font-black text-white tracking-tighter">{title}</h2>
        </div>
        <div className="text-slate-300 space-y-6 leading-relaxed">{children}</div>
      </div>
    </div>
  </div>
);
export const AssetModal = ({ asset, onClose }: { asset: { symbol: string; category: string }, onClose: () => void }) => {  	
  const [isFull, setIsFull] = useState(false); // ✅ Estado para controlar o tamanho da tela
  
  const normalizeCryptoPair = (raw: string) => {
    const value = raw.toUpperCase().trim();

    const slashMatch = value.match(/^([A-Z0-9]+)\/(BRL|USD|USDT)$/);
    if (slashMatch) {
      return { base: slashMatch[1], quote: slashMatch[2] as 'BRL' | 'USD' | 'USDT' };
    }

    const dashMatch = value.match(/^([A-Z0-9]+)-(BRL|USD|USDT)$/);
    if (dashMatch) {
      return { base: dashMatch[1], quote: dashMatch[2] as 'BRL' | 'USD' | 'USDT' };
    }

    return { base: value.replace('.SA', ''), quote: 'BRL' as const };
  };

  const getTradingViewSymbol = (s: string, cat: string) => {
    const sym = s.toUpperCase().trim();

    if (cat === 'index') {
      if (sym.includes('IBOV') || sym === '^BVSP') return 'BMFBOVESPA:IBOV';
      if (sym.includes('S&P') || sym === '^GSPC') return 'SP:SPX';
    }

    if (cat === 'currency') {
      if (sym === 'USD' || sym === 'USDBRL') return 'FX_IDC:USDBRL';
      if (sym === 'EUR' || sym === 'EURBRL') return 'FX_IDC:EURBRL';
    }

    if (cat === 'crypto') {
      const { base, quote } = normalizeCryptoPair(sym);

      if (quote === 'BRL') return `BINANCE:${base}BRL`;
      if (quote === 'USD') return `COINBASE:${base}USD`;
      if (quote === 'USDT') return `BINANCE:${base}USDT`;

      return `BINANCE:${base}BRL`;
    }

    return `BMFBOVESPA:${sym.replace('.SA', '')}`;
  };
  
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
      
      {/* Container do Modal com transição suave entre normal e full screen */}
      <div className={`bg-[#0f172a] border border-slate-700 flex flex-col overflow-hidden transition-all duration-300 relative 
        ${isFull ? 'fixed inset-0 w-full h-full rounded-none z-[10001]' : 'w-full max-w-5xl h-[600px] rounded-2xl'}`}>
        
        {/* Header do Modal */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-[#020617]">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <span className="text-emerald-400">📊</span> Análise Técnica: {asset.symbol}
            </h3>

            {/* Agrupamento de botões à direita */}
            <div className="flex items-center gap-2">
                {/* Botão de Expandir / Reduzir */}
                <button 
                    onClick={() => setIsFull(!isFull)} 
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition border border-slate-600 group"
                    title={isFull ? "Reduzir Tela" : "Tela Cheia"}
                >
                    {isFull ? (
                        <Minimize2 size={18} className="group-hover:scale-110 transition-transform" />
                    ) : (
                        <Maximize2 size={18} className="group-hover:scale-110 transition-transform" />
                    )}
                </button>

                {/* Botão de Fechar */}
                <button 
                    onClick={onClose} 
                    className="p-2 bg-red-600 hover:bg-red-500 rounded-full text-white transition border border-red-400 group"
                    title="Fechar"
                >
                    <X size={18} className="group-hover:scale-110 transition-transform" />
                </button>
            </div>
        </div>

        {/* Iframe do Gráfico */}
        <div className="flex-1 bg-black relative">
            <iframe 
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${getTradingViewSymbol(asset.symbol, asset.category)}&interval=D&hidesidetoolbar=1&theme=dark&style=1&timezone=America%2FSao_Paulo`}
                className="w-full h-full absolute inset-0 border-0" 
                allowTransparency 
                allowFullScreen
            ></iframe>
        </div>
      </div>
    </div>
  );
};