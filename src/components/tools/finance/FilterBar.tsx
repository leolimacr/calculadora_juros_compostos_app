import React, { useRef, useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  FileText,
  FolderOpen,
  Search,
  X
} from 'lucide-react';

interface FilterBarProps {
  selectedCategories: string[];
  setSelectedCategories: (cats: string[]) => void;
  typeFilter: 'all' | 'income' | 'expense';
  setTypeFilter: (type: 'all' | 'income' | 'expense') => void;
  categories: string[];
  viewMode: 'day' | 'month' | 'year' | 'all' | 'period';
  setViewMode: (mode: 'day' | 'month' | 'year' | 'all' | 'period') => void;
  changeDate: (offset: number) => void;
  periodLabel: string;
  onExportPDF: () => void;
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  onOpenCategoryManager: () => void;
  onDateSelect: (date: string) => void;
  sortMode: 'date-desc' | 'date-asc' | 'category-asc' | 'category-desc';
  setSortMode: (mode: 'date-desc' | 'date-asc' | 'category-asc' | 'category-desc') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  selectedCategories, 
  setSelectedCategories, 
  typeFilter,
  setTypeFilter,
  categories,
  viewMode,
  setViewMode,
  changeDate,
  periodLabel,
  onExportPDF,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  onOpenCategoryManager,
  onDateSelect,
  sortMode,
  setSortMode,
  searchQuery,
  setSearchQuery
}) => {  
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [showCategories, setShowCategories] = useState(false);
  const handleLabelClick = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      const updated = selectedCategories.filter(c => c !== cat);
      setSelectedCategories(updated.length === 0 ? [] : updated);
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const isAllCategories = selectedCategories.length === 0;

  return (
    <div className="flex flex-col gap-4 bg-white p-4 rounded-3xl border border-slate-200 mb-4 shadow-sm">
      
      {/* BUSCA GLOBAL */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Pesquisar por descrição ou categoria..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {searchQuery && (
        <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest -mt-2 px-1">
          Pesquisando em todos os períodos — filtro de data desativado
        </p>
      )}

      {/* SEÇÃO 1: CONTROLES DE DATA E PDF */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
             
             {/* 1.1 Modos de Visualização */}
             <div className="flex bg-slate-50 rounded-2xl p-1.5 w-full sm:w-auto justify-between border border-slate-200 shadow-sm">
                {['day', 'month', 'year', 'period', 'all'].map((mode) => (
                    <button 
                        key={mode}
                        onClick={() => setViewMode(mode as any)}
                        className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all duration-200 ${
                            viewMode === mode 
                            ? 'bg-emerald-600 text-white shadow-sm scale-105' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        {mode === 'day' ? 'Dia' : mode === 'month' ? 'Mês' : mode === 'year' ? 'Ano' : mode === 'period' ? 'Período' : 'Tudo'}
                    </button>
                ))}
             </div>

             {/* 1.2 Navegação Rápida com Calendário ao Clicar */}
             {viewMode !== 'all' && viewMode !== 'period' && (
                                <div className="flex items-center justify-between w-full sm:w-auto bg-white p-1.5 rounded-2xl border border-slate-200 px-3 shadow-sm relative">
                                        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors z-10">
                        <ChevronLeft size={20}/>
                    </button>
                    
                    <div 
                      onClick={handleLabelClick}
                      className="flex-1 min-w-[110px] text-center cursor-pointer hover:bg-slate-100 rounded-lg py-1 transition-colors mx-1"
                    >
                        <span className="text-sm font-black text-slate-900 capitalize tracking-tight">
                            {periodLabel}
                        </span>
                        <input 
                          ref={dateInputRef}
                          type="date"
                          className="absolute inset-0 opacity-0 w-full pointer-events-none"
                          onChange={(e) => onDateSelect(e.target.value)}
                        />
                    </div>

                    <button onClick={() => changeDate(1)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors z-10">
                        <ChevronRight size={20}/>
                    </button>
                </div>
             )}
          </div>

          {/* 1.3 Inputs Período */}
          {viewMode === 'period' && (
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto bg-slate-50 p-2 rounded-2xl border border-slate-200 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between w-full sm:w-auto gap-3 px-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase">De</span>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 h-10 shadow-sm" />
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto gap-3 px-3 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Até</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 h-10 shadow-sm" />
                </div>
            </div>
          )}

          {/* 1.4 Botão PDF */}
          <button 
            onClick={onExportPDF}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-all active:scale-95 shadow-sm w-full lg:w-auto"
            title="Gerar Relatório PDF"
          >
            <FileText size={16} className="text-emerald-500 shrink-0" />
            <span className="text-[10px] uppercase tracking-[0.15em]">Relatório PDF</span>
          </button>
      </div>

      {/* SEÇÃO 2: FILTRO POR TIPO (TUDO / RECEITAS / DESPESAS) */}
      <div className="w-full border-t border-slate-200 pt-4 mt-1">
        <div className="flex flex-col gap-3 px-1 mb-3">
            <div className="flex flex-wrap gap-2 justify-start">
                <button 
                    onClick={() => setTypeFilter('all')} 
                    className={`px-5 py-3 rounded-xl text-xs font-black uppercase whitespace-nowrap border-2 transition-all duration-200 ${
                        typeFilter === 'all' 
                        ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-sm' 
                        : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
                    }`}
                >
                    Tudo
                </button>
                <button 
                    onClick={() => setTypeFilter('income')} 
                    className={`px-5 py-3 rounded-xl text-xs font-black uppercase whitespace-nowrap border-2 transition-all duration-200 ${
                        typeFilter === 'income' 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm' 
                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800'
                    }`}
                >
                    Receitas
                </button>
                <button 
                    onClick={() => setTypeFilter('expense')} 
                    className={`px-5 py-3 rounded-xl text-xs font-black uppercase whitespace-nowrap border-2 transition-all duration-200 ${
                        typeFilter === 'expense' 
                        ? 'bg-red-50 border-red-300 text-red-700 shadow-sm' 
                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800'
                    }`}
                >
                    Despesas
                </button>
            </div>

            <div className="flex flex-wrap gap-2 justify-start">
                <button
                    onClick={() => setSortMode('date-desc')}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap border transition-all duration-200 ${
                        sortMode === 'date-desc'
                        ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm'
                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800'
                    }`}
                >
                    Mais Recentes
                </button>

                <button
                    onClick={() => setSortMode('date-asc')}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap border transition-all duration-200 ${
                        sortMode === 'date-asc'
                        ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm'
                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800'
                    }`}
                >
                    Mais Antigos
                </button>

                <button
                    onClick={() => setSortMode('category-asc')}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap border transition-all duration-200 ${
                        sortMode === 'category-asc'
                        ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm'
                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800'
                    }`}
                >
                    Categoria A-Z
                </button>

                <button
                    onClick={() => setSortMode('category-desc')}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap border transition-all duration-200 ${
                        sortMode === 'category-desc'
                        ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm'
                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800'
                    }`}
                >
                    Categoria Z-A
                </button>
            </div>
        </div>
        
        {/* SEÇÃO 3: CATEGORIAS (multi-select) */}
        <div className="flex flex-col gap-3 justify-start px-1">
            <div className="flex flex-wrap items-center gap-2">
                <button 
                    onClick={onOpenCategoryManager}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase bg-white border border-slate-200 text-emerald-600 hover:bg-emerald-50 transition-all"
                >
                    <FolderOpen size={16} />
                    <span>Categorias</span>
                </button>

                <button
                    onClick={() => setShowCategories(!showCategories)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase bg-white border border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-all"
                >
                    {showCategories ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span>{showCategories ? 'Ocultar filtro' : 'Filtrar por categoria'}</span>
                </button>
                {!isAllCategories && (
                    <span className="px-3 py-2 rounded-xl text-[10px] font-black uppercase border border-emerald-200 bg-emerald-50 text-emerald-700">
                        {selectedCategories.length} selecionada{selectedCategories.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {showCategories && (
                <div className="flex flex-wrap gap-2 justify-start animate-in fade-in duration-200">
                    <button 
                        onClick={() => setSelectedCategories([])} 
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap border transition-all duration-200 ${
                            isAllCategories ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800'
                        }`}
                    >
                        Todas
                    </button>

                    {categories.map((cat: string) => (
                        <button 
                            key={cat} 
                            onClick={() => toggleCategory(cat)} 
                            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap border transition-all duration-200 ${
                                selectedCategories.includes(cat) ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
