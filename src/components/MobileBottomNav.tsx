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
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#0f172a] border-t border-slate-800 flex justify-around items-center z-50 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.4)] px-2">
      
      {/* 1. INÍCIO */}
      <button 
        onClick={() => onNavigate('manager')} 
        className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${currentTool === 'manager' ? 'text-emerald-400' : 'text-slate-500'}`}
      >
        <Home size={24} strokeWidth={currentTool === 'manager' ? 3 : 2} />
        <span className="text-[9px] font-black uppercase tracking-widest">Início</span>
      </button>

      {/* 2. BOTÃO ADICIONAR (Lançamento) */}
      <div className="relative -top-6">
        <button 
            onClick={onAdd} 
            className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 border-[4px] border-[#020617] transform active:scale-95 transition-all"
            title="Novo Lançamento"
        >
            <Plus size={32} strokeWidth={3} />
        </button>
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-widest text-emerald-500 text-center w-full">
            Lançar
        </span>
      </div>

      {/* 3. BOTÃO IA (Consultor) */}
      <div className="relative -top-6">
        <button 
            onClick={() => onNavigate('chat')} 
            className={`w-14 h-14 bg-gradient-to-tr from-yellow-600 to-amber-400 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-yellow-500/30 border-[4px] border-[#020617] transform active:scale-95 transition-all ${currentTool === 'chat' ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#020617]' : ''}`}
            title="Consultor IA"
        >
            <Sparkles size={28} strokeWidth={2.5} fill="currentColor" className="opacity-90" />
        </button>
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-widest text-yellow-500 text-center w-full">
            Consultar
        </span>
      </div>

      {/* 4. MENU */}
      <button 
        onClick={onOpenMore} 
        className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition-all active:scale-90"
      >
        <Menu size={24} />
        <span className="text-[9px] font-black uppercase tracking-widest">Menu</span>
      </button>

    </div>
  );
};

export default MobileBottomNav;