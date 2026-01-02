
import React from 'react';
import { useGamification } from '../hooks/useGamification';

const GamificationWidget: React.FC = () => {
  const { stats, progress, currentLevelTitle, newUnlocks } = useGamification();

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 relative overflow-hidden shadow-lg mb-8">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-16 bg-purple-500/10 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none"></div>

      {/* Header Info */}
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="text-2xl">🏆</span>
             <h3 className="text-white font-bold text-lg">Nível {stats.level}</h3>
          </div>
          <p className="text-purple-400 text-xs font-bold uppercase tracking-wider">{currentLevelTitle}</p>
        </div>
        
        <div className="text-right">
           <div className="flex items-center gap-1 justify-end text-orange-400">
              <span className="text-lg">🔥</span>
              <span className="font-black text-xl">{stats.currentStreak}</span>
           </div>
           <p className="text-slate-500 text-[10px] uppercase font-bold">Dias Seguidos</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative z-10">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
           <span>{stats.totalPoints} XP</span>
           <span>Próx. Nível</span>
        </div>
        <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
           <div 
             className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-1000 ease-out relative"
             style={{ width: `${progress}%` }}
           >
             <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
           </div>
        </div>
      </div>

      {/* Badges Preview */}
      {stats.unlockedAchievements.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-700/50 flex gap-2 overflow-x-auto no-scrollbar">
           {stats.unlockedAchievements.map(id => (
             <div key={id} className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs shadow-sm" title={id}>
               🏅
             </div>
           ))}
        </div>
      )}

      {/* Notification Toast (Unlock) */}
      {newUnlocks.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-2 rounded-full shadow-2xl animate-in slide-in-from-top-4 fade-in zoom-in font-bold text-sm flex items-center gap-2 whitespace-nowrap z-50">
           <span>🎉</span> Desbloqueado: {newUnlocks[0]}
        </div>
      )}
    </div>
  );
};

export default GamificationWidget;
