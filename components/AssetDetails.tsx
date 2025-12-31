
import React, { useState, useEffect } from 'react';
import { MarketQuote, HistoricalDataPoint } from '../types';
import { fetchHistoricalData } from '../services/marketService';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface AssetDetailsProps {
  asset: MarketQuote;
  onClose?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

const AssetDetails: React.FC<AssetDetailsProps> = ({ asset, onClose, onToggleFullscreen, isFullscreen }) => {
  const [range, setRange] = useState<'1d' | '5d' | '1mo' | '6mo' | '1y' | '5y'>('1mo');
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      console.log(`[AssetDetails] Carregando gráfico para ${asset.symbol} no intervalo ${range}`);
      setLoading(true);
      setError(false);
      try {
        const history = await fetchHistoricalData(asset.symbol, range);
        if (history && history.length > 0) {
            setData(history);
        } else {
            console.warn(`[AssetDetails] Sem dados históricos retornados para ${asset.symbol}`);
            setError(true);
        }
      } catch (e) {
        console.error(`[AssetDetails] Erro fatal ao carregar gráfico:`, e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [asset.symbol, range]);

  const ranges = [
    { label: '1D', val: '1d' },
    { label: '5D', val: '5d' },
    { label: '1M', val: '1mo' },
    { label: '6M', val: '6mo' },
    { label: '1A', val: '1y' },
    { label: '5A', val: '5y' },
  ];

  const isPositive = (asset.changePercent || 0) >= 0;
  const color = isPositive ? '#10b981' : '#ef4444'; 

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (range === '1d' || range === '5d') {
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const formatPrice = (val: number) => {
      const digits = (asset.category === 'currency' || asset.symbol === 'USD' || asset.symbol === 'EUR') ? 3 : 2;
      return val.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  };

  return (
    <div className={`bg-slate-900 flex flex-col ${isFullscreen ? 'min-h-screen w-full' : 'h-full'}`}>
      {/* Header */}
      <div className={`flex justify-between items-start p-6 border-b border-slate-800 ${isFullscreen ? 'pt-8 px-8' : ''}`}>
        <div>
            <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-white">{asset.symbol}</h2>
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded font-bold uppercase border border-slate-700">
                    {asset.category === 'crypto' ? 'Cripto' : asset.category === 'stock' ? 'Ação' : asset.category === 'currency' ? 'Moeda' : 'Índice'}
                </span>
            </div>
            <p className="text-slate-400 text-sm mb-4">{asset.name}</p>
            
            <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-white">
                    {asset.category === 'index' ? '' : 'R$'} {formatPrice(asset.price)}
                </span>
                <span className={`text-lg font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? '▲' : '▼'} {Math.abs(asset.changePercent || 0).toFixed(2)}%
                </span>
            </div>
        </div>

        <div className="flex gap-2">
            {!isFullscreen && onToggleFullscreen && (
                <button onClick={onToggleFullscreen} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Tela cheia">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                </button>
            )}
            
            {isFullscreen ? (
                <button 
                    onClick={onClose} 
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-slate-700"
                >
                    <span>←</span> Voltar ao Mercado
                </button>
            ) : (
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            )}
        </div>
      </div>

      {/* Chart Controls */}
      <div className="flex gap-2 p-6 pb-2 overflow-x-auto no-scrollbar">
        {ranges.map(r => (
            <button
                key={r.val}
                onClick={() => setRange(r.val as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    range === r.val 
                        ? 'bg-slate-700 text-white shadow-lg' 
                        : 'bg-slate-800/50 text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
            >
                {r.label}
            </button>
        ))}
      </div>

      {/* Chart Area */}
      {/* 
          CRITICAL FIX: Altura explícita em fullscreen. 
          min-h-screen no pai não garante altura para o filho flex-grow se não houver conteúdo.
          h-[60vh] garante espaço para o ResponsiveContainer desenhar.
      */}
      <div className={`p-6 relative w-full ${isFullscreen ? 'h-[60vh] md:h-[70vh]' : 'h-[300px] flex-grow'}`}>
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10 backdrop-blur-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        )}
        
        {error ? (
            <div className="h-full flex items-center justify-center text-slate-500 flex-col gap-2 min-h-[200px]">
                <span className="text-3xl">📉</span>
                <p>Não foi possível carregar o gráfico histórico.</p>
                <button onClick={() => setRange('1mo')} className="text-emerald-400 text-sm hover:underline">Tentar Novamente</button>
            </div>
        ) : (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={color} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                    <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        tick={{fontSize: 10, fill: '#64748b'}}
                        minTickGap={30}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis 
                        domain={['auto', 'auto']}
                        tickFormatter={(val) => val.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        tick={{fontSize: 10, fill: '#64748b'}}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                        labelFormatter={(label) => new Date(label).toLocaleString('pt-BR')}
                        formatter={(val: number) => [`R$ ${formatPrice(val)}`, 'Preço']}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke={color} 
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        )}
      </div>
      
      <div className="p-6 text-center text-xs text-slate-600 border-t border-slate-800 mt-auto">
        Dados fornecidos por Yahoo Finance (atraso de 15min pode ocorrer). <br/>
        Este gráfico é para fins educacionais e não constitui recomendação de investimento.
      </div>
    </div>
  );
};

export default AssetDetails;
