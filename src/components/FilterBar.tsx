import React from 'react';

export default ({ selectedCategory, setSelectedCategory, categories }: any) => (
  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
    <button onClick={() => setSelectedCategory('Todas Categorias')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${selectedCategory === 'Todas Categorias' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Tudo</button>
    {categories.map((cat: string) => (
      <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${selectedCategory === cat ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{cat}</button>
    ))}
  </div>
);