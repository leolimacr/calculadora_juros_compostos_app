
import React, { useState, useEffect } from 'react';
import { logEvent, ANALYTICS_EVENTS } from '../utils/analytics';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 1. Escuta o evento do navegador
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // 2. Verifica se o usuário é "engajado" antes de mostrar
      // Isso reduz atrito e só pede instalação para quem realmente usa
      const isEngaged = localStorage.getItem('finpro_has_used_manager') === 'true';
      const hasDismissed = sessionStorage.getItem('finpro_install_dismissed');
      
      // Só mostra se: Engajado E não recusou na sessão atual
      if (isEngaged && !hasDismissed) {
         setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      logEvent(ANALYTICS_EVENTS.PWA_INSTALLED);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    logEvent(ANALYTICS_EVENTS.PWA_INSTALL_CLICK);
    
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
      setShowPrompt(false);
      sessionStorage.setItem('finpro_install_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 lg:bottom-8 left-4 right-4 lg:left-auto lg:right-8 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500 max-w-sm ml-auto">
      <div className="bg-slate-800 border border-emerald-500/50 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-xl shadow-lg shrink-0">
            📲
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Instalar App</h4>
            <p className="text-xs text-slate-400">Acesse offline e mais rápido.</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
            <button 
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white px-2 py-2 text-xs font-bold"
            >
                Agora não
            </button>
            <button 
                onClick={handleInstallClick}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg shadow-emerald-900/20"
            >
                Instalar
            </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
