
import React from 'react';

interface MobileBottomNavProps {
  currentTool: string;
  onNavigate: (tool: string) => void;
  onOpenAi: () => void;
  onOpenMore: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTool, onNavigate, onOpenAi, onOpenMore }) => {
  const navItems = [
    { id: 'panel', label: 'Início', icon: '🏠' },
    { id: 'manager', label: 'Gestão', icon: '💰' },
    { id: 'game', label: 'Jogo', icon: '🎮' },
    { id: 'education', label: 'Aprender', icon: '📚' },
    { id: 'more', label: 'Mais', icon: '⚡', isMore: true },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#020617]/95 backdrop-blur-md border-t border-slate-800 pb-safe pt-2 px-6 z-40 lg:hidden flex justify-between items-end no-print safe-area-bottom">
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
                 {/* Ícone de Menu Hambúrguer Customizado */}
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                 </svg>
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
