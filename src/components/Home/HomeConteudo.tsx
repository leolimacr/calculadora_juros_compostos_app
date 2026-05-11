import React from 'react';
import { Newspaper } from 'lucide-react';
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

export const HomeConteudo: React.FC<Props> = ({ heroPersona, radarNews, isAuthenticated, userMeta, setSelectedArticle, setShowNewsAdmin, setNewsForm, handleDeleteNews }) => {
  const categoryColors: Record<string, any> = {
    'Mercado': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: '📈' },
    'Economia': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', icon: '💰' },
    'Política': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', icon: '🏛️' },
    'Empresas': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', icon: '🏢' },
    'Internacional': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', icon: '🌍' },
  };

  return (
    <section className="bg-white border-y border-slate-200 py-16">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-12">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
            <Newspaper size={20} className="text-emerald-500" />
            {heroPersona === 'dividas' ? 'Leituras para acompanhar melhor sua rotina' : 'Leituras para acompanhar melhor suas decisões'}
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-xs md:text-sm font-bold text-slate-600 uppercase">{heroPersona === 'dividas' ? 'Contexto para revisar prioridades' : 'Contexto para revisar decisões'}</span>
            {isAuthenticated && userMeta?.email === 'leolimacr@hotmail.com' && (
              <button onClick={() => setShowNewsAdmin(true)} className="text-[10px] font-black uppercase tracking-widest text-emerald-700 border border-emerald-200 px-3 py-1 rounded-lg hover:bg-emerald-50">+ Nova notícia</button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {radarNews.map((news: any, index: number) => {
            const category = news.tag || news.category || 'Mercado';
            const colors = categoryColors[category] || categoryColors['Mercado'];
            return (
              <div key={news.id || index} onClick={() => setSelectedArticle({ component: () => (
                <div className="artigo-visualizacao">
                  <style>{`.artigo-visualizacao h1,.artigo-visualizacao h2,.artigo-visualizacao h3,.artigo-visualizacao p,.artigo-visualizacao li,.artigo-visualizacao strong{color:#0f172a!important}`}</style>
                  <header className="mb-8 border-b border-slate-200 pb-8">
                    <div className="flex items-center gap-3 mb-4"><span className="bg-emerald-100 text-emerald-700 text-xs font-black uppercase px-3 py-1 rounded-full border border-emerald-200">{news.category || news.tag}</span><span className="text-slate-800 text-sm font-bold">{news.date || news.badge}</span></div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">{news.title}</h1>
                    {(news.summary || news.excerpt) && <p className="text-lg md:text-xl text-slate-800 font-medium mb-6 leading-relaxed border-l-4 border-emerald-400 pl-4">{news.summary || news.excerpt}</p>}
                    {news.coverImage && <img src={news.coverImage} className="w-full h-[500px] object-contain rounded-3xl border border-slate-200 shadow-xl bg-slate-100" />}
                  </header>
                  <div className="text-slate-900 max-w-[800px] mx-auto"><div className="prose prose-slate prose-lg max-w-none"><MarkdownViewer content={news.content} /></div></div>
                </div>
              )})}
              className={`bg-white border-2 ${colors.border} rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer group flex flex-col h-full hover:shadow-xl`}>
                <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
                  {news.coverImage ? <img src={news.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center"><Newspaper size={32} className="text-slate-700" /></div>}
                </div>
                <div className="p-4 md:p-6 flex flex-col flex-grow">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`${colors.bg} ${colors.text} text-[9px] font-black uppercase px-2 py-1 rounded-full border ${colors.border} flex items-center gap-1`}><span>{colors.icon}</span>{news.tag || news.category}</span>
                    <div className="flex items-center gap-3">
                      {isAuthenticated && userMeta?.email === 'leolimacr@hotmail.com' && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); setNewsForm({ id: news.id, title: news.title, summary: news.summary || '', content: news.content || '', coverImage: news.coverImage || '' }); setShowNewsAdmin(true); }} className="text-[9px] font-black uppercase text-sky-700 border border-sky-200 px-2 py-1 rounded hover:bg-sky-50">Editar</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteNews(news.id); }} className="text-[9px] font-black uppercase text-rose-700 border border-rose-200 px-2 py-1 rounded hover:bg-rose-50">Excluir</button>
                        </>
                      )}
                      <span className="text-[10px] text-slate-500 font-bold uppercase">{news.badge || news.date}</span>
                    </div>
                  </div>
                  <h4 className={`text-lg font-bold text-slate-900 mb-3 leading-tight group-hover:${colors.text} transition-colors line-clamp-2`}>{news.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mt-auto md:text-base">{news.summary || news.excerpt}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};