import React from 'react';
import { Compass } from 'lucide-react';

interface HomePanelHeaderProps {
  monthLabel: string;
  isScrolled: boolean;
  onNavigate: (tool: string) => void;
}

const HomePanelHeader: React.FC<HomePanelHeaderProps> = ({ monthLabel, isScrolled, onNavigate }) => {
  return (
    <>
      <div className={`fixed top-16 left-0 z-[100] md:hidden h-14 w-full px-4 flex items-center bg-transparent pointer-events-none transition-all duration-300 ${isScrolled ? 'opacity-5' : 'opacity-100'}`}>
        <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] pointer-events-auto">
          Home
        </h1>
      </div>

      <div className="mb-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="hidden md:block text-4xl font-extrabold text-slate-950 tracking-tight">Home</h1>
          <button
            onClick={() => onNavigate('explorar')}
            className="md:hidden flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase transition-all bg-white border-slate-100 text-slate-600 shadow-soft active:scale-95 pointer-events-auto"
          >
            <Compass size={14} className="text-brand-secondary" /> Explorar
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-12 h-[1px] bg-slate-100"></span>
              {monthLabel} · Painel de Rotina
            </p>
          </div>
          
          <button
            onClick={() => onNavigate('explorar')}
            className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full border text-[11px] font-extrabold uppercase transition-all bg-white border-slate-100 text-slate-500 hover:bg-slate-50 shadow-soft active:scale-95"
          >
            <Compass size={14} className="text-brand-secondary" /> Explorar
          </button>
        </div>
      </div>
    </>
  );
};

export default HomePanelHeader;
