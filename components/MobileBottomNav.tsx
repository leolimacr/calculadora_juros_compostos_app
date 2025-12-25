
import React from 'react';

interface MobileBottomNavProps {
  currentTool: string;
  onNavigate: (tool: string) => void;
  onOpenAi: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTool, onNavigate, onOpenAi }) => {
  const navItems = [
    { id: 'home', label: 'Início', icon: '🏠' },
    { id: 'manager', label: 'Gestão', icon: '💰' },
    { id: 'ai', label: 'IA', icon: '🤖', isAction: true },
    { id: 'game', label: 'Jogo', icon: '🎮' },
    { id: 'education', label: 'Aprender', icon: '📚' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#020617]/95 backdrop-blur-md border-t border-slate-800 pb-safe pt-2 px-6 z-40 lg:hidden flex justify-between items-end no-print safe-area-bottom">
      {navItems.map((item) => {
        const isActive = currentTool === item.id;
        
        if (item.isAction) {
           return (
             <button
               key={item.id}
               onClick={onOpenAi}
               className="relative -top-5 bg-gradient-to-br from-emerald-500 to-emerald-700 w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-emerald-900/50 border-4 border-[#020617] transform active:scale-95 transition-transform"
             >
               {item.icon}
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
