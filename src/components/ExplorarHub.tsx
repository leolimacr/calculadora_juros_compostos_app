import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { HomeConteudo } from './Home/HomeConteudo';
import { HomeTerminalMercado } from './Home/HomeTerminalMercado';
import { InfiniteTicker } from './Public/MarketComponents';
import { AssetModal } from './Public/HomeModals';
import { getLatestNews } from '../services/newsService';
import { fetchMarketQuotes } from '../services/marketService';
import { MarketQuote } from '../types';
import { TrendingUp, Calculator, Target, BookOpen } from 'lucide-react';
import { courses } from './Public/Courses';

interface MarketData {
  indices: MarketQuote[];
  stocks: MarketQuote[];
  currencies: MarketQuote[];
  cryptos: MarketQuote[];
  indicators: MarketQuote[];
}

interface ExplorarHubProps {
  onNavigate: (tool: string) => void;
  routerNavigate: (path: string) => void;
}

export const ExplorarHub: React.FC<ExplorarHubProps> = ({ onNavigate, routerNavigate }) => {
  const [radarNews, setRadarNews] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [marketData, setMarketData] = useState<MarketData>({ indices: [], stocks: [], currencies: [], cryptos: [], indicators: [] });
  const [selectedAsset, setSelectedAsset] = useState<{ symbol: string; category: string } | null>(null);

  useEffect(() => {
    getLatestNews(9).then((news) => { if (news) setRadarNews(news); });
    fetchMarketQuotes().then(res => {
        const quotes = res.quotes;
        setMarketData({
            indices: quotes.filter(q => q.category === 'index'),
            stocks: quotes.filter(q => q.category === 'stock'),
            currencies: quotes.filter(q => q.category === 'currency'),
            cryptos: quotes.filter(q => q.category === 'crypto'),
            indicators: quotes.filter(q => q.category === 'indicator'),
        });
    });
  }, []);

  const ferramentas = [
    { id: 'tool-juros', label: 'Juros Compostos', icon: <TrendingUp size={20} /> },
    { id: 'tool-dividas', label: 'Calculadora de Dívidas', icon: <Calculator size={20} /> },
    { id: 'tool-alugar', label: 'Alugar vs Comprar', icon: <Target size={20} /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-12">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Explorar</h1>

        <section>
          <h2 className="text-lg font-bold mb-4">Ferramentas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ferramentas.map(f => (
              <button key={f.id} onClick={() => onNavigate(f.id)} className="p-6 bg-white border border-slate-200 rounded-2xl text-left hover:border-sky-500 transition-all flex items-center gap-4">
                <div className="text-sky-600">{f.icon}</div>
                <span className="font-bold">{f.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <InfiniteTicker data={marketData} />
          <div className="mt-8">
            <HomeTerminalMercado 
                marketData={marketData} 
                indicesComIndicadores={[...marketData.indices, ...marketData.indicators]}
                onSetSelectedAsset={setSelectedAsset}
            />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-4">Trilhas de Aprendizado</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.slice(0, 4).map((curso: typeof courses[number]) => (
              <button 
                key={curso.slug} 
                onClick={() => routerNavigate(`/curso/${curso.slug}`)} 
                className="p-6 bg-white border border-slate-200 rounded-2xl text-left hover:border-emerald-500 transition-all flex items-center gap-4"
              >
                <div className="text-emerald-600"><BookOpen size={20} /></div>
                <span className="font-bold">{curso.title}</span>
              </button>
            ))}
          </div>
        </section>

        <HomeConteudo 
          heroPersona="patrimonio" 
          radarNews={radarNews} 
          isAuthenticated={true} 
          userMeta={{}} 
          setSelectedArticle={setSelectedArticle}
          setShowNewsAdmin={() => {}} 
          setNewsForm={() => {}} 
          handleDeleteNews={() => {}} 
        />

        {selectedArticle && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 md:p-8">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-8 relative mt-8 mb-8 shadow-2xl">
              <button onClick={() => setSelectedArticle(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-xl transition-colors">
                Fechar
              </button>
              <selectedArticle.component />
            </div>
          </div>
        )}

        {selectedAsset && ReactDOM.createPortal(
          <AssetModal
            asset={selectedAsset}
            onClose={() => setSelectedAsset(null)}
          />,
          document.body
        )}
      </div>
    </div>
  );
};
