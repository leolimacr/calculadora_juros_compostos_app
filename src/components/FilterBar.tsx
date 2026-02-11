import React, { useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  FolderOpen // <--- O IMPORT CORRIGIDO AQUI
} from 'lucide-react';

interface FilterBarProps {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
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
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  selectedCategory, 
  setSelectedCategory, 
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
  onDateSelect
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleLabelClick = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-slate-900/50 p-4 rounded-3xl border border-slate-800/60 mb-4 shadow-xl">
      
      {/* SEÇÃO 1: CONTROLES DE DATA E PDF */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
             
             {/* 1.1 Modos de Visualização */}
             <div className="flex bg-slate-950 rounded-2xl p-1.5 w-full sm:w-auto justify-between border border-slate-800/50 shadow-inner">
                {['day', 'month', 'year', 'period', 'all'].map((mode) => (
                    <button 
                        key={mode}
                        onClick={() => setViewMode(mode as any)} 
                        className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all duration-200 ${
                            viewMode === mode 
                            ? 'bg-emerald-600 text-white shadow-lg scale-105' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {mode === 'day' ? 'Dia' : mode === 'month' ? 'Mês' : mode === 'year' ? 'Ano' : mode === 'period' ? 'Período' : 'Tudo'}
                    </button>
                ))}
             </div>

             {/* 1.2 Navegação Rápida com Calendário ao Clicar */}
             {viewMode !== 'all' && viewMode !== 'period' && (
                <div className="flex items-center justify-between w-full sm:w-auto bg-slate-800/40 p-1.5 rounded-2xl border border-slate-700/50 px-3 shadow-sm relative">
                    <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors z-10">
                        <ChevronLeft size={20}/>
                    </button>
                    
                    <div 
                      onClick={handleLabelClick}
                      className="flex-1 min-w-[110px] text-center cursor-pointer hover:bg-slate-700/50 rounded-lg py-1 transition-colors mx-1"
                    >
                        <span className="text-sm font-black text-white capitalize tracking-tight">
                            {periodLabel}
                        </span>
                        <input 
                          ref={dateInputRef}
                          type="date"
                          className="absolute inset-0 opacity-0 w-full pointer-events-none"
                          onChange={(e) => onDateSelect(e.target.value)}
                        />
                    </div>

                    <button onClick={() => changeDate(1)} className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors z-10">
                        <ChevronRight size={20}/>
                    </button>
                </div>
             )}
          </div>

          {/* 1.3 Inputs Período */}
          {viewMode === 'period' && (
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto bg-slate-800/30 p-2 rounded-2xl border border-slate-800 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between w-full sm:w-auto gap-3 px-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase">De</span>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 h-10 shadow-inner" />
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto gap-3 px-3 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Até</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 h-10 shadow-inner" />
                </div>
            </div>
          )}

          {/* 1.4 Botão PDF */}
          <button 
            onClick={onExportPDF}
            className="flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl font-black bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-all active:scale-95 shadow-lg w-full lg:w-auto group"
          >
            <FileText size={18} className="text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] uppercase tracking-[0.15em]">Gerar Relatório PDF</span>
          </button>
      </div>

      {/* SEÇÃO 2: CATEGORIAS */}
      <div className="w-full border-t border-slate-800/60 pt-4 mt-1">
        <div className="flex flex-wrap gap-2 justify-start px-1">
            <button 
                onClick={onOpenCategoryManager}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase bg-slate-800 border border-slate-700 text-emerald-400 hover:bg-slate-700 transition-all"
            >
                <FolderOpen size={16} />
                <span>Categorias</span>
            </button>
            <div className="w-[1px] h-9 bg-slate-800 mx-1"></div>
            <button 
                onClick={() => setSelectedCategory('Todas Categorias')} 
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap border transition-all duration-200 ${
                    selectedCategory === 'Todas Categorias' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-800/40 border-slate-700/50 text-slate-500 hover:border-slate-300'
                }`}
            >
                Tudo
            </button>
            {categories.map((cat: string) => (
                <button 
                    key={cat} 
                    onClick={() => setSelectedCategory(cat)} 
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap border transition-all duration-200 ${
                        selectedCategory === cat ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-800/40 border-slate-700/50 text-slate-500 hover:border-slate-300'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>
      </div>

    </div>
  );
};

export default FilterBar;