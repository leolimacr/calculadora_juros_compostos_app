
import React from 'react';

const AppInstallButton: React.FC = () => {
  const handleClick = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;

    // Play Store links
    const ANDROID_LINK = "https://play.google.com/store/apps/details?id=com.financasproinvest.app";
    const IOS_LINK = "https://apps.apple.com/br/app/financas-pro-invest/id1234567890";

    const link = isIOS ? IOS_LINK : ANDROID_LINK;
    window.open(link, '_blank');
  };

  return (
    <button 
        onClick={handleClick} 
        className="fixed bottom-24 right-6 lg:bottom-12 lg:right-12 z-30 bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white rounded-full w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center shadow-2xl shadow-emerald-900/50 transition-all active:scale-95 border-2 border-white/10 group no-print animate-in slide-in-from-bottom-10 fade-in duration-700" 
        title="Instalar App Oficial" 
        aria-label="Instalar aplicativo" 
    >
      <span className="text-2xl lg:text-3xl group-hover:scale-110 transition-transform">📲</span>
      {/* Indicador de notificação para chamar atenção */}
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#020617] animate-pulse"></span>
    </button>
  );
};

export default AppInstallButton;
