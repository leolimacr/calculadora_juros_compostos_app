
import React from 'react';

interface MobileBottomNavProps {
  currentTool: string;
  onNavigate: (tool: string) => void;
  onOpenMore: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTool, onNavigate, onOpenMore }) => {
  const navItems = [
    { id: 'panel', label: 'Início', icon: '🏠' },
    { id: 'manager', label: 'Gestão', icon: '💰' },
    { id: 'game', label: 'Jogo', icon: '🎮' },
    { id: 'artigos', label: 'Aprender', icon: '📚' }, // Link público direto
    { id: 'more', label: 'Mais', icon: '⋯', isMore: true },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#020617]/95 backdrop-blur-md border-t border-slate-800 pb-safe pt-2 px-4 z-40 lg:hidden flex justify-between items-end no-print safe-area-bottom">
      {navItems.map((item) => {
        const isActive = currentTool === item.id;
        
        if (item.isMore) {
           return (
             <button
               key={item.id}
               onClick={onOpenMore}
               className={`flex flex-col items-center gap-1 pb-2 min-w-[60px] transition-colors text-slate-500 hover:text-slate-300`}
             >
               <div className="text-xl h-6 flex items-center justify-center">
                 {item.icon}
               </div>
               <span className="text-[10px] font-bold">{item.label}</span>
             </button>
           );
        }

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 pb-2 min-w-[60px] transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <span className={`text-xl transition-transform ${isActive ? '-translate-y-1' : ''}`}>{item.icon}</span>
            <span className="text-[10px] font-bold">{item.label}</span>
            {isActive && <span className="w-1 h-1 rounded-full bg-emerald-500 absolute bottom-1"></span>}
          </button>
        );
      })}
    </div>
  );
};

export default MobileBottomNav;
