
import React, { useState, useEffect } from 'react';
import { MarketQuote } from '../types';
import { fetchAssetQuote } from '../services/marketService';
import AssetDetails from './AssetDetails';

interface AssetDetailsPageProps {
  symbol: string;
  initialAsset: MarketQuote | null;
  onBack: () => void;
}

const AssetDetailsPage: React.FC<AssetDetailsPageProps> = ({ symbol, initialAsset, onBack }) => {
  const [asset, setAsset] = useState<MarketQuote | null>(initialAsset);
  const [loading, setLoading] = useState(!initialAsset);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Se já temos o ativo e ele bate com o símbolo pedido (refresh ou navegação direta)
    if (asset && asset.symbol === symbol) {
        setLoading(false);
        return;
    }

    const loadAsset = async () => {
      if (!symbol) {
          setError(true);
          setLoading(false);
          return;
      }

      console.log(`[AssetDetailsPage] Buscando dados iniciais para: ${symbol}`);
      setLoading(true);
      setError(false);
      
      const data = await fetchAssetQuote(symbol);
      
      if (data) {
        console.log('[AssetDetailsPage] Dados carregados:', data);
        setAsset(data);
      } else {
        console.error('[AssetDetailsPage] Falha ao carregar ativo');
        setError(true);
      }
      setLoading(false);
    };

    loadAsset();
  }, [symbol]); // Recarrega se o símbolo na URL mudar

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 animate-pulse">Carregando dados do ativo...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
        <span className="text-4xl mb-4">😕</span>
        <h2 className="text-xl font-bold text-white mb-2">Ativo não encontrado</h2>
        <p className="text-slate-400 mb-6">Não foi possível carregar os dados de "{symbol}".</p>
        <button 
          onClick={onBack}
          className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
        >
          Voltar ao Mercado
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 animate-in fade-in duration-500">
      <AssetDetails 
        asset={asset} 
        onClose={onBack} 
        isFullscreen={true}
      />
    </div>
  );
};

export default AssetDetailsPage;
