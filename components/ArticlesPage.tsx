
import React, { useState } from 'react';
import { subscribeToNewsletter } from '../services/newsletterService';
import { FULL_ARTICLES } from '../data/articlesContent';
import { Article } from '../types';

interface ArticlesPageProps {
  onReadArticle?: (slug: string) => void;
}

const ArticlesPage: React.FC<ArticlesPageProps> = () => {
  const [activeTab, setActiveTab] = useState<'ia' | 'carreira' | 'fundamentos'>('ia');
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  
  // Newsletter Logic
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = async () => {
    if (!email || !email.includes('@') || !email.includes('.')) return;

    setStatus('loading');
    try {
        await subscribeToNewsletter(email, 'hub_conhecimento');
        setStatus('success');
        setEmail('');
    } catch (error) {
        setStatus('error');
    }
  };

  // Se estiver lendo um artigo, mostra o Reader View
  if (readingArticle) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-right duration-300 pb-24">
        <button 
          onClick={() => setReadingArticle(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors mb-8 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar para o Hub
        </button>

        <article>
          <header className="mb-10 border-b border-slate-800 pb-8">
            <div className="flex gap-3 mb-4">
               <span className="text-xs font-bold text-emerald-400 bg-emerald-900/20 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-500/20">
                 {readingArticle.tag}
               </span>
               <span className="text-xs font-mono text-slate-500 flex items-center">
                 {readingArticle.date} • Leitura de 3 min
               </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-6">
              {readingArticle.title}
            </h1>
            <p className="text-xl text-slate-400 font-light leading-relaxed border-l-4 border-emerald-500 pl-6 italic">
              {readingArticle.desc}
            </p>
          </header>

          <div className="prose prose-invert prose-lg max-w-none prose-p:text-slate-300 prose-headings:text-white prose-a:text-emerald-400 hover:prose-a:text-emerald-300 prose-strong:text-white">
             {readingArticle.fullContent}
          </div>

          <div className="mt-16 pt-8 border-t border-slate-800 text-center">
             <p className="text-slate-500 mb-4 italic">Gostou da reflexão?</p>
             <button 
               onClick={() => setReadingArticle(null)}
               className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
             >
               Ler outros artigos
             </button>
          </div>
        </article>
      </div>
    );
  }

  // View Principal (Lista)
  const filteredArticles = FULL_ARTICLES.filter(a => a.category === activeTab);

  // Mock para outras categorias (se não houver no fullArticles)
  // Mantemos o mock antigo para carreira/fundamentos se não estiverem no FULL_ARTICLES
  const displayArticles = filteredArticles.length > 0 ? filteredArticles : [
    { id: 99, title: "Em Breve", desc: "Novos artigos estão sendo escritos.", tag: "Aguarde", date: "---", category: activeTab }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 px-4 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-6">
        <div>
            <h2 className="text-3xl font-bold text-white mb-1">Hub de Conhecimento</h2>
            <p className="text-slate-400 text-sm">Reflexões sobre dinheiro, risco e realidade.</p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 overflow-x-auto max-w-full">
          {[
            { id: 'ia', label: '🤖 IA & Risco' },
            { id: 'carreira', label: '💼 Carreira' },
            { id: 'fundamentos', label: '🏛️ Fundamentos' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'bg-emerald-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayArticles.map((article: any) => (
          <div 
            key={article.id} 
            onClick={() => article.fullContent && setReadingArticle(article)}
            className={`bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/50 transition-all group hover:-translate-y-1 flex flex-col h-full shadow-lg ${article.fullContent ? 'cursor-pointer' : 'opacity-70'}`}
          >
            <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded inline-block border border-emerald-500/20 uppercase tracking-wider">
                {article.tag}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{article.date}</span>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors leading-snug">
              {article.title}
            </h3>
            
            <p className="text-sm text-slate-400 leading-relaxed mb-6 flex-grow border-l-2 border-slate-700 pl-3 italic">
              "{article.desc}"
            </p>
            
            <div className="pt-4 border-t border-slate-700/50 mt-auto">
                <span className="text-xs text-slate-500 font-bold group-hover:text-white transition-colors flex items-center gap-2">
                    {article.fullContent ? 'Ler ensaio completo' : 'Em breve'} 
                    {article.fullContent && <span className="group-hover:translate-x-1 transition-transform">→</span>}
                </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900 p-8 rounded-2xl border border-indigo-500/20 text-center mt-12 transition-all">
        <h3 className="text-xl font-bold text-white mb-2">Insights fora do consenso</h3>
        <p className="text-slate-400 text-sm mb-6">Receba análises semanais que desafiam o senso comum financeiro.</p>
        
        {status === 'success' ? (
            <div className="bg-emerald-900/30 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl animate-in zoom-in">
                <p className="font-bold">Pronto! Você está inscrito.</p>
                <p className="text-xs mt-1">Quando houver novidades relevantes em IA e finanças, você será o primeiro a saber.</p>
                <button onClick={() => setStatus('idle')} className="text-xs underline mt-2 hover:text-white">Cadastrar outro e-mail</button>
            </div>
        ) : (
            <div className="flex flex-col items-center">
                <div className="flex max-w-md w-full gap-2 relative">
                    <input 
                        type="email" 
                        placeholder="Seu melhor e-mail" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={status === 'loading'}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors disabled:opacity-50" 
                    />
                    <button 
                        onClick={handleSubscribe}
                        disabled={status === 'loading'}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {status === 'loading' ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            'Assinar'
                        )}
                    </button>
                </div>
                {status === 'error' && (
                    <p className="text-red-400 text-xs mt-3 animate-in fade-in">
                        Não conseguimos salvar seu e-mail agora. Tente novamente em alguns minutos.
                    </p>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default ArticlesPage;
