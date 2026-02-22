import React from 'react';

export default ({ userMeta, usagePercentage, isPremium }: any) => {
  if (isPremium || !userMeta) return null;
  return (
    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
      <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
        <span>Limite mensal grátis</span>
        <span>{userMeta.launchCount} / {userMeta.launchLimit}</span>
      </div>
      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
        <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${usagePercentage}%` }}></div>
      </div>
    </div>
  );
};