import React from 'react';

export default ({ userMeta, usagePercentage, isPremium }: any) => {
  if (isPremium || !userMeta) return null;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = usagePercentage >= 100;
  return (
    <div className={`p-4 rounded-2xl border ${isAtLimit ? 'bg-red-50 border-red-200' : isNearLimit ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex justify-between text-[10px] font-bold mb-2 uppercase tracking-wider">
        <span className={isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-slate-500'}>
          {isAtLimit ? 'Limite atingido' : isNearLimit ? 'Quase no limite' : 'Limite mensal grátis'}
        </span>
        <span className={isAtLimit ? 'text-red-600 font-black' : isNearLimit ? 'text-amber-600 font-black' : 'text-slate-500'}>
          {userMeta.launchCount} / {userMeta.launchLimit}
        </span>
      </div>
      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'}`}
          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
        />
      </div>
      {isAtLimit && (
        <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-wide">
          Faça upgrade para continuar registrando
        </p>
      )}
    </div>
  );
};