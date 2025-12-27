
import React, { useState, useEffect } from 'react';
import { logEvent, ANALYTICS_EVENTS } from '../utils/analytics';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Detecção de Dispositivo
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobileDevice = /iphone|ipad|ipod|android/i.test(userAgent);
    const isIOSDevice = /iphone|ipad|ipod/i.test(userAgent);
    setIsIOS(isIOSDevice);

    if (!isMobileDevice) return;

    // 2. Verificar se já está instalado (Standalone Mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone) return;

    // 3. Verificar Cooldown (Se o usuário fechou recentemente)
    const lastDismissed = localStorage.getItem('finpro_install_dismissed_ts');
    if (lastDismissed) {
      const hoursSinceDismiss = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 72) return; // Só mostra novamente após 72h
    }

    // 4. Lógica Android (Evento nativo)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // 5. Lógica iOS (Forçar exibição pois não existe evento)
    if (isIOSDevice) {
        setShowPrompt(true);
    }

    // 6. Listener de Sucesso
    window.addEventListener('appinstalled', () => {
      logEvent(ANALYTICS_EVENTS.PWA_INSTALLED);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
        // No iOS, mostramos instruções pois não há instalação programática
        setShowIOSInstructions(true);
    } else if (deferredPrompt) {
        // No Android, disparamos o prompt nativo
        logEvent(ANALYTICS_EVENTS.PWA_INSTALL_CLICK);
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        
        setDeferredPrompt(null);
        if (outcome === 'accepted') {
            setShowPrompt(false);
        }
    }
  };

  const handleDismiss = () => {
      setShowPrompt(false);
      setShowIOSInstructions(false);
      // Salva timestamp para esconder por 72h
      localStorage.setItem('finpro_install_dismissed_ts', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <>
        {/* Banner Principal */}
        {!showIOSInstructions ? (
            <div className="fixed bottom-20 left-4 right-4 z-[100] animate-in slide-in-from-bottom-full duration-500">
                <div className="bg-[#0f172a] border border-emerald-500/50 p-5 rounded-2xl shadow-2xl shadow-black flex flex-col gap-4 relative overflow-hidden">
                    {/* Brilho de Fundo */}
                    <div className="absolute top-0 right-0 p-20 bg-emerald-500/10 blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center text-3xl shadow-lg shrink-0 border border-emerald-400/30">
                            📲
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-lg leading-tight mb-1">Instalar Aplicativo</h4>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                Acesse mais rápido e use <strong>offline</strong> direto da sua tela inicial.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 relative z-10">
                        <button 
                            onClick={handleDismiss}
                            className="px-4 py-3 text-sm font-bold text-slate-400 hover:text-white bg-slate-800/50 rounded-xl transition-colors"
                        >
                            Agora não
                        </button>
                        <button 
                            onClick={handleInstallClick}
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/30 transition-all active:scale-95 flex items-center justify-center gap-2 border border-emerald-500/50"
                        >
                            Clique aqui para Instalar
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            /* Instruções Específicas iOS (Overlay) */
            <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-300" onClick={() => setShowIOSInstructions(false)}>
                <div className="bg-[#1e293b] w-full p-6 rounded-t-3xl border-t border-slate-700 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300 relative" onClick={e => e.stopPropagation()}>
                    
                    <button onClick={() => setShowIOSInstructions(false)} className="absolute top-4 right-4 text-slate-400 p-2">✕</button>

                    <div className="flex flex-col items-center text-center gap-4">
                        <h3 className="text-xl font-bold text-white">Como instalar no iPhone</h3>
                        
                        <div className="space-y-4 text-left w-full bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                            <div className="flex items-center gap-3">
                                <span className="bg-slate-700 w-8 h-8 flex items-center justify-center rounded-full text-white font-bold shrink-0">1</span>
                                <p className="text-slate-300 text-sm">Toque no botão <strong className="text-emerald-400">Compartilhar</strong> <span className="inline-block align-middle bg-slate-700 p-1 rounded mx-1">⎋</span> abaixo.</p>
                            </div>
                            <div className="h-px bg-slate-700/50 w-full"></div>
                            <div className="flex items-center gap-3">
                                <span className="bg-slate-700 w-8 h-8 flex items-center justify-center rounded-full text-white font-bold shrink-0">2</span>
                                <p className="text-slate-300 text-sm">Role e selecione <strong className="text-white">"Adicionar à Tela de Início"</strong> <span className="inline-block align-middle text-xl leading-none ml-1">➕</span>.</p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500">Toque em qualquer lugar para fechar</p>
                        
                        {/* Seta indicativa para baixo (simulando a posição do botão share no Safari) */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-emerald-500 text-4xl">
                            ⬇
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

export default InstallPrompt;
