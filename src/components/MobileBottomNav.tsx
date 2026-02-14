
import React from 'react';
import { Home, Plus, Sparkles, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  currentTool: string;
  onNavigate: (tool: string) => void;
  onOpenMore: () => void;
  onAdd: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ 
  currentTool, 
  onNavigate, 
  onOpenMore, 
  onAdd 
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f172a]/95 backdrop-blur border-t border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
      {/* Safe-area + largura controlada no mobile */}
      <div className="mx-auto max-w-md px-2 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="grid grid-cols-4 items-end gap-2">
          {/* 1. INÍCIO */}
          <button
		  onClick={() => onNavigate('manager')}
		  className={`min-w-0 flex flex-col items-center justify-center gap-1 transition-all active:scale-90 ${
			currentTool === 'manager' ? 'text-emerald-400' : 'text-slate-500'
		  }`}
		>
		  <Home size={22} strokeWidth={currentTool === 'manager' ? 3 : 2} />
		  <span className="w-full text-center text-[9px] leading-tight font-black uppercase tracking-widest">
			<span className="block">Ir para</span>
			<span className="block">Gerenciador Financeiro</span>
		  </span>
		</button>

          {/* 2. LANÇAR */}
          <button
            onClick={onAdd}
            className="min-w-0 flex flex-col items-center justify-center gap-1 transition-all active:scale-90"
            title="Novo Lançamento"
          >
            <div className="w-12 h-12 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 border-[3px] border-[#020617]">
              <Plus size={26} strokeWidth={3} />
            </div>
            <span className="w-full text-center text-[10px] leading-none font-black uppercase tracking-widest text-emerald-500 truncate">
              Lançar
            </span>
          </button>

          {/* 3. NEXUS */}
          <button
            onClick={() => onNavigate('chat')}
            className="min-w-0 flex flex-col items-center justify-center gap-1 transition-all active:scale-90"
            title="Nexus IA"
          >
            <div
              className={`w-12 h-12 bg-gradient-to-tr from-yellow-600 to-amber-400 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-yellow-500/30 border-[3px] border-[#020617] ${
                currentTool === 'chat'
                  ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#020617]'
                  : ''
              }`}
            >
              <Sparkles size={24} strokeWidth={2.5} fill="currentColor" className="opacity-90" />
            </div>
            <span className="w-full text-center text-[10px] leading-none font-black uppercase tracking-widest text-yellow-500 truncate">
              Nexus
            </span>
          </button>

          {/* 4. MENU */}
          <button
            onClick={onOpenMore}
            className="min-w-0 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-white transition-all active:scale-90"
          >
            <Menu size={22} />
            <span className="w-full text-center text-[10px] leading-none font-black uppercase tracking-widest truncate">
              Menu
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}; 

export default MobileBottomNav;