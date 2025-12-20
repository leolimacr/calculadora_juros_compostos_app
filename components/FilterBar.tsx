
import React from 'react';
import { FilterPeriod } from '../types';

interface FilterBarProps {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedPeriod: FilterPeriod;
  setSelectedPeriod: (period: FilterPeriod) => void;
  categories: string[];
}

const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  setSelectedCategory,
  selectedPeriod,
  setSelectedPeriod,
  categories
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros
        </h3>
        
        <div className="space-y-4">
          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg" aria-hidden="true">📁</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none"
              >
                <option value="Todas Categorias">Todas Categorias</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-1 rounded-xl flex gap-1">
            {(['tudo', 'hoje', 'mes', 'ano'] as FilterPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${selectedPeriod === p ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
