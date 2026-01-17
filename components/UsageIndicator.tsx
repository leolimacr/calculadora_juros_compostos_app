import React from 'react';

const UsageIndicator: React.FC<any> = ({ userMeta, usagePercentage, isPremium }) => {
  // Se for Premium ou se os dados ainda não carregaram, não mostra nada
  if (isPremium || !userMeta || typeof userMeta.launchCount !== 'number') return null;

  // Garante que a porcentagem é um número válido entre 0 e 100
  const safePercent = Math.min(100, Math.max(0, Number(usagePercentage) || 0));

  return (
    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
      <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
        <span>Uso Gratuito</span>
        <span className={safePercent >= 100 ? 'text-red-400' : 'text-emerald-400'}>
          {userMeta.launchCount} / {userMeta.launchLimit}
        </span>
      </div>
      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
        <div 
          className={`h-full transition-all duration-1000 ease-out ${safePercent >= 100 ? 'bg-red-500' : 'bg-emerald-500'}`} 
          style={{ width: `${safePercent}%` }}
        ></div>
      </div>
    </div>
  );
};
export default UsageIndicator;