
import React, { useState } from 'react';
import { BLOG_POSTS } from '../../data/blogPosts';
import { BlogPost } from '../../types/blog';
import Breadcrumb from '../Breadcrumb';

interface BlogPageProps {
  onNavigate: (path: string) => void;
}

const BlogPage: React.FC<BlogPageProps> = ({ onNavigate }) => {
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [readingPost, setReadingPost] = useState<BlogPost | null>(null);

  const categories = ['todos', 'investimentos', 'planejamento', 'psicologia', 'cripto'];

  const filteredPosts = activeCategory === 'todos' 
    ? BLOG_POSTS 
    : BLOG_POSTS.filter(p => p.category === activeCategory);

  // --- Article Reader View ---
  if (readingPost) {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right duration-300 pb-20">
        <button 
          onClick={() => setReadingPost(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar para o Blog
        </button>

        <article className="bg-slate-800 p-8 md:p-12 rounded-3xl border border-slate-700 shadow-2xl">
          <header className="mb-10 border-b border-slate-700 pb-8">
            <div className="flex gap-3 mb-4">
               <span className="bg-emerald-900/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                 {readingPost.category}
               </span>
               <span className="text-slate-500 text-xs font-bold flex items-center">
                 {readingPost.readTime} leitura • {readingPost.date}
               </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-6">
              {readingPost.title}
            </h1>
            <p className="text-xl text-slate-300 font-light leading-relaxed">
              {readingPost.excerpt}
            </p>
          </header>

          <div 
            className="prose prose-invert prose-lg max-w-none prose-p:text-slate-300 prose-headings:text-white prose-a:text-emerald-400 hover:prose-a:text-emerald-300 prose-strong:text-white prose-blockquote:border-emerald-500 prose-blockquote:bg-slate-900/50 prose-blockquote:p-4 prose-blockquote:rounded-r-lg"
            dangerouslySetInnerHTML={{ __html: readingPost.content }}
          />

          <div className="mt-12 pt-8 border-t border-slate-700">
             <h4 className="text-white font-bold mb-4">Gostou deste artigo?</h4>
             <div className="flex gap-4">
                <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg">
                   Compartilhar
                </button>
                <button 
                   onClick={() => onNavigate('register')}
                   className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-bold transition-colors"
                >
                   Criar Conta Grátis
                </button>
             </div>
          </div>
        </article>
      </div>
    );
  }

  // --- List View ---
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div className="text-center md:text-left">
        <h2 className="text-3xl font-black text-white mb-2">Blog & Educação</h2>
        <p className="text-slate-400 max-w-2xl">
          Domine os conceitos fundamentais para tomar decisões financeiras inteligentes.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
              activeCategory === cat 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map(post => (
          <div 
            key={post.slug}
            onClick={() => setReadingPost(post)}
            className="group bg-slate-800 rounded-2xl border border-slate-700 hover:border-emerald-500/50 p-6 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col h-full"
          >
            <div className="mb-4">
               <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-900/10 px-2 py-1 rounded">
                 {post.category}
               </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors">
              {post.title}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-grow line-clamp-3">
              {post.excerpt}
            </p>
            <div className="flex justify-between items-center pt-4 border-t border-slate-700/50 mt-auto">
               <span className="text-xs text-slate-500 font-bold">{post.readTime} de leitura</span>
               <span className="text-emerald-400 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                 Ler Artigo <span>→</span>
               </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogPage;
