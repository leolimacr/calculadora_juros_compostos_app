import React from 'react';
import { Newspaper, TrendingUp, Coins, Landmark, Building2, Globe } from 'lucide-react';
import { MarkdownViewer } from '../Public/MarkdownViewer';

interface Props {
  heroPersona: 'dividas' | 'patrimonio';
  radarNews: any[];
  isAuthenticated: boolean;
  userMeta: any;
  setSelectedArticle: (a: any) => void;
  setShowNewsAdmin: (v: boolean) => void;
  setNewsForm: (f: any) => void;
  handleDeleteNews: (id: string) => void;
}

type CategoryStyle = {
  bg: string;
  text: string;
  border: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
};

export const HomeConteudo: React.FC<Props> = ({ 
  heroPersona, radarNews, isAuthenticated, userMeta, setSelectedArticle, 
  setShowNewsAdmin, setNewsForm, handleDeleteNews 
}) => {
  const categoryColors: Record<string, CategoryStyle> = {
    'Mercado': { bg: 'bg-blue-950/40', text: 'text-blue-400', border: 'border-blue-900/50', Icon: TrendingUp },
    'Economia': { bg: 'bg-emerald-950/40', text: 'text-emerald-400', border: 'border-emerald-900/50', Icon: Coins },
    'Política': { bg: 'bg-purple-950/40', text: 'text-purple-400', border: 'border-purple-900/50', Icon: Landmark },
    'Empresas': { bg: 'bg-amber-950/40', text: 'text-amber-400', border: 'border-amber-900/50', Icon: Building2 },
    'Internacional': { bg: 'bg-indigo-950/40', text: 'text-indigo-400', border: 'border-indigo-900/50', Icon: Globe },
  };

  return (
    <section className="bg-[#0B0F17] border-t border-white/[0.04] py-24 w-full font-sans">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
          <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Newspaper size={20} className="text-blue-400" />
            {heroPersona === 'dividas' ? 'Leituras para monitorar sua rotina' : 'Leituras para basear suas decisões'}
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-[#A0A4AB] uppercase tracking-wider">
              {heroPersona === 'dividas' ? 'Contexto para quitação' : 'Contexto estratégico'}
            </span>
            {isAuthenticated && userMeta?.email === 'leolimacr@hotmail.com' && (
              <button 
                onClick={() => setShowNewsAdmin(true)} 
                className="text-[10px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-900/50 px-3 py-1 rounded-lg hover:bg-emerald-950/40"
              >
                + Nova notícia
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {radarNews.map((news: any, index: number) => {
            const category = news.tag || news.category || 'Mercado';
            const colors = categoryColors[category] || categoryColors['Mercado'];
            const CategoryIcon = colors.Icon;
            
            return (
              <div 
                key={news.id || index} 
                onClick={() => setSelectedArticle({ component: () => (
                  <div className="artigo-visualizacao text-[#E5E7EB]">
                    <style>{`.artigo-visualizacao h1,.artigo-visualizacao h2,.artigo-visualizacao h3,.artigo-visualizacao p,.artigo-visualizacao li,.artigo-visualizacao strong{color:#e5e7eb!important}`}</style>
                    <header className="mb-8 border-b border-white/[0.06] pb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-blue-950/40 text-blue-400 text-xs font-bold uppercase px-3 py-1 rounded-lg border border-blue-900/50">
                          {news.category || news.tag}
                        </span>
                        <span className="text-[#A0A4AB] text-sm font-bold">{news.date || news.badge}</span>
                      </div>
                      <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4">{news.title}</h1>
                      {(news.summary || news.excerpt) && (
                        <p className="text-lg text-[#A0A4AB] font-medium mb-6 leading-relaxed border-l-4 border-blue-500 pl-4">
                          {news.summary || news.excerpt}
                        </p>
                      )}
                      {news.coverImage && (
                        <img 
                          src={news.coverImage} 
                          className="w-full h-[450px] object-contain rounded-2xl border border-white/[0.06] shadow-xl bg-[#0B0F17]" 
                          alt="Capa"
                        />
                      )}
                    </header>
                    <div className="max-w-[800px] mx-auto">
                      <div className="prose prose-invert max-w-none">
                        <MarkdownViewer content={news.content} />
                      </div>
                    </div>
                  </div>
                )})}
                className="bg-[#111622] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer flex flex-col h-full shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
              >
                <div className="relative w-full h-48 bg-[#0B0F17] overflow-hidden border-b border-white/[0.04]">
                  {news.coverImage ? (
                    <img 
                      src={news.coverImage} 
                      className="w-full h-full object-cover" 
                      alt="Notícia"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper size={32} className="text-[#A0A4AB]/25" />
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`${colors.bg} ${colors.text} text-[9px] font-bold uppercase px-2.5 py-1 rounded-lg border ${colors.border} flex items-center gap-1.5`}>
                      <CategoryIcon size={12} />
                      {news.tag || news.category}
                    </span>
                    <div className="flex items-center gap-3">
                      {isAuthenticated && userMeta?.email === 'leolimacr@hotmail.com' && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); setNewsForm({ id: news.id, title: news.title, summary: news.summary || '', content: news.content || '', coverImage: news.coverImage || '' }); setShowNewsAdmin(true); }} className="text-[9px] font-black uppercase text-blue-400 border border-blue-900/50 px-2 py-1 rounded hover:bg-blue-950/40">Editar</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteNews(news.id); }} className="text-[9px] font-black uppercase text-rose-400 border border-rose-900/50 px-2 py-1 rounded hover:bg-rose-950/40">Excluir</button>
                        </>
                      )}
                      <span className="text-[10px] text-[#A0A4AB] font-bold uppercase">{news.badge || news.date}</span>
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-bold text-white mb-3 leading-tight tracking-tight line-clamp-2">
                    {news.title}
                  </h4>
                  
                  <p className="text-sm text-[#A0A4AB] leading-relaxed line-clamp-3 mt-auto">
                    {news.summary || news.excerpt}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};