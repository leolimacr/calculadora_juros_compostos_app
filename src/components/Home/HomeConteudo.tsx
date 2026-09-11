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
    'Mercado': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', Icon: TrendingUp },
    'Economia': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', Icon: Coins },
    'Política': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', Icon: Landmark },
    'Empresas': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', Icon: Building2 },
    'Internacional': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', Icon: Globe },
  };

  return (
    <section className="bg-surface-secondary border-t border-slate-200 py-24 w-full font-sans">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
          <h3 className="text-xl font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Newspaper size={20} className="text-blue-600" />
            {heroPersona === 'dividas' ? 'Leituras para monitorar sua rotina' : 'Leituras para basear suas decisões'}
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {heroPersona === 'dividas' ? 'Contexto para quitação' : 'Contexto estratégico'}
            </span>
            {isAuthenticated && userMeta?.email === 'leolimacr@hotmail.com' && (
              <button 
                onClick={() => setShowNewsAdmin(true)} 
                className="text-[10px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-200 px-3 py-1 rounded-lg hover:bg-emerald-50"
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
                  <div className="artigo-visualizacao text-slate-700">
                    <style>{`.artigo-visualizacao h1,.artigo-visualizacao h2,.artigo-visualizacao h3,.artigo-visualizacao p,.artigo-visualizacao li,.artigo-visualizacao strong{color:#334155!important}`}</style>
                    <header className="mb-8 border-b border-slate-200 pb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-blue-50 text-blue-600 text-xs font-bold uppercase px-3 py-1 rounded-lg border border-blue-200">
                          {news.category || news.tag}
                        </span>
                        <span className="text-slate-500 text-sm font-bold">{news.date || news.badge}</span>
                      </div>
                      <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-4">{news.title}</h1>
                      {(news.summary || news.excerpt) && (
                        <p className="text-lg text-slate-500 font-medium mb-6 leading-relaxed border-l-4 border-blue-500 pl-4">
                          {news.summary || news.excerpt}
                        </p>
                      )}
                      {news.coverImage && (
                        <img 
                          src={news.coverImage} 
                          className="w-full h-[450px] object-contain rounded-2xl border border-slate-200 shadow-xl bg-surface-secondary" 
                          alt="Capa"
                        />
                      )}
                    </header>
                    <div className="max-w-[800px] mx-auto">
                      <div className="prose max-w-none">
                        <MarkdownViewer content={news.content} />
                      </div>
                    </div>
                  </div>
                )})}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer flex flex-col h-full shadow-sm"
              >
                <div className="relative w-full h-48 bg-surface-secondary overflow-hidden border-b border-slate-200">
                  {news.coverImage ? (
                    <img 
                      src={news.coverImage} 
                      className="w-full h-full object-cover" 
                      alt="Notícia"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper size={32} className="text-slate-300" />
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
                          <button onClick={(e) => { e.stopPropagation(); setNewsForm({ id: news.id, title: news.title, summary: news.summary || '', content: news.content || '', coverImage: news.coverImage || '' }); setShowNewsAdmin(true); }} className="text-[9px] font-black uppercase text-blue-600 border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">Editar</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteNews(news.id); }} className="text-[9px] font-black uppercase text-rose-600 border border-rose-200 px-2 py-1 rounded hover:bg-rose-50">Excluir</button>
                        </>
                      )}
                      <span className="text-[10px] text-slate-500 font-bold uppercase">{news.badge || news.date}</span>
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-bold text-slate-900 mb-3 leading-tight tracking-tight line-clamp-2">
                    {news.title}
                  </h4>
                  
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mt-auto">
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