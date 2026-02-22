import React from 'react';
import { LayoutDashboard, Plus, Sparkles, Menu } from 'lucide-react';

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
    <div className="fixed bottom-0 left-0 right-0 z-[90] bg-[#020617]/90 backdrop-blur-xl border-t border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      {/* Safe-area padding para iPhones modernos */}
      <div className="mx-auto max-w-lg px-6 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        <div className="flex items-end justify-between">
          
          {/* 1. GERENCIADOR (Agora Dourado quando ativo, igual ao Desktop) */}
          <button
            onClick={() => onNavigate('manager')}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-1.5 py-2 transition-all active:scale-95 group ${
              currentTool === 'manager' ? 'text-yellow-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${currentTool === 'manager' ? 'bg-yellow-400/10' : ''}`}>
               <LayoutDashboard size={24} strokeWidth={currentTool === 'manager' ? 2.5 : 2} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">
              Gerenciador
            </span>
          </button>

          {/* 2. BOTÃO CENTRAL DE AÇÃO (Lançar) */}
          <div className="relative -top-5 mx-2">
            <button
              onClick={onAdd}
              className="flex flex-col items-center justify-center gap-1 transition-transform active:scale-90"
              title="Novo Lançamento"
            >
              <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/40 border-[4px] border-[#020617] ring-1 ring-slate-800">
                <Plus size={28} strokeWidth={3} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mt-1">
                Lançar
              </span>
            </button>
          </div>

          {/* 3. NEXUS IA (Azul/Sky quando ativo) */}
          <button
            onClick={() => onNavigate('chat')}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-1.5 py-2 transition-all active:scale-95 ${
              currentTool === 'chat' ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
             <div className={`p-1 rounded-lg transition-all ${currentTool === 'chat' ? 'bg-sky-400/10' : ''}`}>
               <Sparkles size={24} strokeWidth={currentTool === 'chat' ? 2.5 : 2} />
             </div>
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">
              Nexus IA
            </span>
          </button>

          {/* 4. MENU (Hambúrguer) */}
          <button
            onClick={onOpenMore}
            className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1.5 py-2 text-slate-500 hover:text-white transition-all active:scale-95"
          >
            <div className="p-1">
               <Menu size={24} strokeWidth={2} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">
              Menu
            </span>
          </button>

        </div>
      </div>
    </div>
  );
}; 

export default MobileBottomNav;