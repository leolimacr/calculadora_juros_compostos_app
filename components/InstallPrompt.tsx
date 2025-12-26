
import React, { useState, useEffect } from 'react';
import { logEvent, ANALYTICS_EVENTS } from '../utils/analytics';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 1. Check if Mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // 2. Check 72h Dismissal Cooldown
    const lastDismissed = localStorage.getItem('finpro_install_dismissed_ts');
    if (lastDismissed) {
      const hoursSinceDismiss = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 72) return;
    }

    // 3. Listen for browser event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // 4. Handle installation success
    window.addEventListener('appinstalled', () => {
      logEvent(ANALYTICS_EVENTS.PWA_INSTALLED);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
        // Fallback for iOS or if event didn't fire (manual instructions could go here)
        alert("Para instalar no iPhone: Toque em 'Compartilhar' e depois em 'Adicionar à Tela de Início'.");
        return;
    }
    
    logEvent(ANALYTICS_EVENTS.PWA_INSTALL_CLICK);
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
      setShowPrompt(false);
      // Save timestamp to hide for 72 hours
      localStorage.setItem('finpro_install_dismissed_ts', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-8 left-4 right-4 z-[999] animate-in slide-in-from-bottom-full duration-500 safe-area-bottom">
      <div className="bg-[#0f172a] border border-emerald-500/30 p-4 rounded-2xl shadow-2xl shadow-black flex flex-col gap-3 relative overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 p-16 bg-emerald-500/10 blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

        <div className="flex items-start gap-4 relative z-10">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center text-2xl shadow-lg shrink-0 border border-emerald-500/20">
            📲
          </div>
          <div>
            <h4 className="font-bold text-white text-sm leading-tight">Melhore sua experiência</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Instale o app para acesso mais rápido, offline e em tela cheia.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-1 relative z-10">
            <button 
                onClick={handleDismiss}
                className="flex-1 py-2.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-800/50 rounded-lg transition-colors"
            >
                Agora não
            </button>
            <button 
                onClick={handleInstallClick}
                className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-900/30 transition-colors flex items-center justify-center gap-2"
            >
                Instalar App ⚡
            </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
