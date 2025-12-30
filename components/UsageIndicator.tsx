
import React from 'react';
import { UserMeta } from '../types';

interface UsageIndicatorProps {
  userMeta: UserMeta | null;
  usagePercentage: number;
  isPremium: boolean;
}

const UsageIndicator: React.FC<UsageIndicatorProps> = ({ userMeta, usagePercentage, isPremium }) => {
  if (!userMeta || isPremium) return null;

  const count = userMeta.launchCount;
  const limit = userMeta.launchLimit;
  
  // Cores baseadas no uso
  let colorClass = 'bg-emerald-500';
  let textClass = 'text-emerald-400';
  
  if (usagePercentage > 70) { colorClass = 'bg-yellow-500'; textClass = 'text-yellow-400'; }
  if (usagePercentage >= 100) { colorClass = 'bg-red-500'; textClass = 'text-red-400'; }

  return (
    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50 mb-4 animate-in fade-in">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plano Grátis</span>
        <span className={`text-[10px] font-bold ${textClass}`}>
          {count} / {limit} lançamentos
        </span>
      </div>
      
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all duration-700 ease-out`}
          style={{ width: `${usagePercentage}%` }}
        ></div>
      </div>
      
      {usagePercentage >= 90 && (
        <p className="text-[9px] text-center mt-2 text-slate-500">
          Você está quase sem espaço. <span className="text-emerald-400 font-bold cursor-pointer hover:underline">Seja Premium ✨</span>
        </p>
      )}
    </div>
  );
};

export default UsageIndicator;
