import React from 'react';

const FilterBar: React.FC<any> = ({ selectedCategory, setSelectedCategory, categories = [] }) => {
  // Garante que categories é um array
  const safeCategories = Array.isArray(categories) ? categories : [];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
      <button 
        onClick={() => setSelectedCategory('Todas Categorias')} 
        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === 'Todas Categorias' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
      >
        Tudo
      </button>
      
      {safeCategories.map((cat: string) => (
        <button 
          key={cat} 
          onClick={() => setSelectedCategory(cat)} 
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};
export default FilterBar;