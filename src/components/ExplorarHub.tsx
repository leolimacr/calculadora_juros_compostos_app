import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { HomeConteudo } from './Home/HomeConteudo';
import { HomeTerminalMercado } from './Home/HomeTerminalMercado';
import { InfiniteTicker } from './Public/MarketComponents';
import { AssetModal } from './Public/HomeModals';
import { getLatestNews } from '../services/newsService';
import { fetchMarketQuotes } from '../services/marketService';
import type { MarketQuote } from '../types';
import { TrendingUp, Calculator, Target, BookOpen, ChevronRight, Sparkles, Flame, Percent, Wallet, ShoppingCart } from 'lucide-react';
import { courses } from './Public/Courses';
import { TOOL_ROUTES } from '../hooks/useNavigation';

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
  const [radarNews, setRadarNews] = useState<unknown[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<{ component: React.ComponentType } | null>(null);
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

  // Metadados de apresentação por ferramenta. A lista renderizada é derivada de
  // TOOL_ROUTES (contrato E6-02): toda rota com prefixo `tool-` ganha exatamente
  // uma entrada navegável; ids futuros sem metadados usam o fallback genérico.
  const TOOL_META: Record<string, { label: string; desc: string; icon: React.ReactNode; color: string; bg: string }> = {
    'tool-juros': {
      label: 'Juros Compostos',
      desc: 'Simule o crescimento do seu dinheiro no tempo.',
      icon: <TrendingUp size={24} />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    'tool-dividas': {
      label: 'Calculadora de Dívidas',
      desc: 'Descubra o melhor caminho para quitar seus débitos.',
      icon: <Calculator size={24} />,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
    'tool-alugar': {
      label: 'Alugar vs Comprar',
      desc: 'Compare o custo real entre morar de aluguel ou financiar.',
      icon: <Target size={24} />,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
    },
    'tool-fire': {
      label: 'Independência Financeira',
      desc: 'Descubra quando seu patrimônio sustenta seu custo de vida.',
      icon: <Flame size={24} />,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    'tool-inflacao': {
      label: 'Impacto da Inflação',
      desc: 'Veja quanto a inflação corrói seu poder de compra.',
      icon: <Percent size={24} />,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    'tool-dividendos': {
      label: 'Simulador de Dividendos',
      desc: 'Projete a renda passiva da sua carteira.',
      icon: <Wallet size={24} />,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    'tool-buy-cash-or-installments': {
      label: 'À Vista ou Parcelado',
      desc: 'Compare pagar agora ou parcelar e investir a diferença.',
      icon: <ShoppingCart size={24} />,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  };

  const TOOL_FALLBACK = {
    label: 'Ferramenta',
    desc: 'Acessar ferramenta.',
    icon: <Sparkles size={24} />,
    color: 'text-slate-600',
    bg: 'bg-slate-100',
  };

  const ferramentas = Object.keys(TOOL_ROUTES)
    .filter((id) => id.startsWith('tool-'))
    .map((id) => ({ id, ...(TOOL_META[id] ?? { ...TOOL_FALLBACK, label: id }) }));

  return (
    <>
      <div className="min-h-screen bg-surface-canvas text-slate-900 pb-20 pt-20 md:pt-12">
        <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-10 md:space-y-16">
          
          {/* 1. CONVITE (HERO) */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-200/50 text-slate-600 rounded-lg">
              <Sparkles size={12} className="fill-slate-400" />
              <span className="text-[9px] font-black uppercase tracking-widest">Central de Descoberta</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-slate-950 leading-none">
              Simulação e <br />
              <span className="text-emerald-600">Inteligência</span>
            </h1>
            <p className="text-slate-500 text-sm md:text-base max-w-xl font-medium leading-relaxed">
              Explore cenários, aprofunde seus conhecimentos e acompanhe o mercado com ferramentas desenhadas para sua soberania.
            </p>
          </div>

          {/* 2. EXPERIMENTE (FERRAMENTAS) */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 tracking-tight">Ferramentas de Apoio</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {ferramentas.map(f => (
                <button 
                  key={f.id} 
                  onClick={() => onNavigate(f.id)} 
                  className="group p-6 md:p-8 bg-white border border-slate-200 rounded-panel shadow-panel text-left hover:border-slate-300 hover:-translate-y-0.5 transition-all flex flex-col gap-5 md:gap-6"
                >
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${f.bg} ${f.color} flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm`}>
                    {f.icon}
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <span className="block font-black text-lg md:text-xl tracking-tight text-slate-900">{f.label}</span>
                    <p className="text-xs md:text-sm text-slate-500 font-medium leading-snug">{f.desc}</p>
                  </div>
                  <div className="pt-2 md:pt-4 mt-auto flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-emerald-700 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                    Acessar <ChevronRight size={12} />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* 3. APRENDA (TRILHAS) */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 tracking-tight">Educação e Estratégia</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {courses.slice(0, 4).map((curso: typeof courses[number]) => (
                <button 
                  key={curso.slug} 
                  onClick={() => routerNavigate(`/curso/${curso.slug}`)} 
                  className="group relative overflow-hidden p-5 md:p-6 bg-white rounded-section text-left hover:border-slate-300 transition-all flex items-center gap-4 md:gap-5 border border-slate-200"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-40" />
                  <div className="relative z-10 w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <BookOpen size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div className="relative z-10 flex-1 min-w-0">
                    <span className="block font-black text-base md:text-lg tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors uppercase truncate">{curso.title}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1 block">Curso / Módulo</span>
                  </div>
                  <ChevronRight size={18} className="relative z-10 text-slate-500 group-hover:text-slate-900 transition-colors" />
                </button>
              ))}
            </div>
          </section>

          {/* 4. CONTEXTO (MERCADO & LEITURAS) */}
          <section className="space-y-8 pt-8 border-t-2 border-slate-300/60">
            <div className="space-y-2">
              <h2 className="text-sm font-black text-slate-900 tracking-tight">Inteligência de Mercado</h2>
              <p className="text-slate-600 text-xs md:text-sm font-medium">Fatos e movimentos que impactam suas decisões.</p>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-panel border border-slate-200 overflow-hidden shadow-panel">
                <InfiniteTicker data={marketData} />
                <div className="p-4 md:p-8">
                  <HomeTerminalMercado 
                      marketData={marketData} 
                      indicesComIndicadores={[...marketData.indices, ...marketData.indicators]}
                      onSetSelectedAsset={setSelectedAsset}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 tracking-tight px-1">Radar e Artigos</h3>
                <div className="rounded-section p-2 md:p-3 border border-slate-200 bg-surface-subtle">
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
                </div>
              </div>
            </div>
          </section>

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
    </>
  );
};
