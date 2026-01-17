import React from 'react';

const MobileBottomNav: React.FC<any> = ({ currentTool, onNavigate, onOpenMore, onAdd }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 bg-[#0f172a] border-t border-slate-800 px-6 flex justify-between items-center z-50 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.6)]">
      
      <button onClick={() => onNavigate('manager')} className={`flex flex-col items-center gap-1.5 transition-colors ${currentTool === 'manager' ? 'text-emerald-400' : 'text-slate-500'}`}>
        <span className="text-2xl">🏠</span>
        <span className="text-[10px] font-black uppercase tracking-wider">Início</span>
      </button>
      
      <button onClick={() => onNavigate('goals')} className={`flex flex-col items-center gap-1.5 transition-colors ${currentTool === 'goals' ? 'text-emerald-400' : 'text-slate-500'}`}>
        <span className="text-2xl">🎯</span>
        <span className="text-[10px] font-black uppercase tracking-wider">Metas</span>
      </button>

      {/* O BOTÃO QUE VOCÊ GOSTAVA */}
      <div className="relative -top-8">
        <button 
            onClick={onAdd} 
            className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/50 border-[6px] border-[#020617] transform active:scale-90 transition-all rotate-3 hover:rotate-0"
        >
            <span className="text-4xl font-bold mb-1">+</span>
        </button>
      </div>

      <button onClick={() => onNavigate('ai_chat')} className={`flex flex-col items-center gap-1.5 transition-colors ${currentTool === 'ai_chat' ? 'text-purple-400' : 'text-slate-500'}`}>
        <span className="text-2xl">✨</span>
        <span className="text-[10px] font-black uppercase tracking-wider">IA</span>
      </button>

      <button onClick={onOpenMore} className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-white">
        <span className="text-2xl">☰</span>
        <span className="text-[10px] font-black uppercase tracking-wider">Menu</span>
      </button>
    </div>
  );
};
export default MobileBottomNav;