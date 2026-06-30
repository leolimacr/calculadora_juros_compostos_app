import React from 'react';

interface AppLoadingScreenProps {
  loadingTime?: number;
}

const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({ loadingTime = 0 }) => (
  <div className="min-h-screen bg-surface-primary flex flex-col items-center justify-center gap-4">
    <div className="text-sky-500 font-bold animate-pulse text-xs uppercase tracking-widest">
      {loadingTime > 7000 ? 'Quase lá...' : loadingTime > 3000 ? 'Sincronizando dados...' : 'Carregando...'}
    </div>
    {loadingTime > 10000 && (
      <button 
        onClick={() => window.location.reload()}
        className="text-[10px] text-slate-500 hover:text-slate-900 uppercase tracking-tighter transition-colors"
      >
        Demorando muito? Tente recarregar
      </button>
    )}
  </div>
);

export default AppLoadingScreen;
