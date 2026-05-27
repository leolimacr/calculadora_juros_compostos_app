import React from 'react';

export default ({ userMeta, usagePercentage, isPremium }: any) => {
  if (isPremium || !userMeta) return null;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = usagePercentage >= 100;

  const getTitle = () => {
    if (isAtLimit) return "Rotina produtiva — remova as travas para continuar";
    if (isNearLimit) return "Seu ritmo está forte. Mantenha-o sem interrupções";
    return `${userMeta.launchCount} lançamentos — sua base está crescendo`;
  };

  return (
    <div className={`p-4 rounded-3xl border ${isAtLimit ? 'bg-amber-50 border-amber-200' : isNearLimit ? 'bg-brand-accent/10 border-brand-accent/30' : 'bg-surface-secondary border-surface-elevated'}`}>
      <div className="flex justify-between text-xxs font-bold mb-2 uppercase tracking-ultra-wide">
        <span className={isAtLimit ? 'text-amber-700' : isNearLimit ? 'text-brand-accent' : 'text-text-muted'}>
          {getTitle()}
        </span>
        <span className={isAtLimit ? 'text-amber-700 font-black' : isNearLimit ? 'text-brand-accent font-black' : 'text-text-muted font-black'}>
          {userMeta.launchCount} / {userMeta.launchLimit}
        </span>
      </div>
      <div className="w-full bg-surface-elevated h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${isAtLimit ? 'bg-amber-500' : isNearLimit ? 'bg-brand-accent' : 'bg-brand-primary'}`}
          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
        />
      </div>
      {isAtLimit && (
        <p className="text-xxs text-amber-700 font-bold mt-2 uppercase tracking-ultra-wide">
          Com o Pro, você mantém seu ritmo sem pausas
        </p>
      )}
    </div>
  );
};
