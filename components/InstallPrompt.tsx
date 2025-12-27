
import React, { useState, useEffect } from 'react';
import { logEvent, ANALYTICS_EVENTS } from '../utils/analytics';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [displayMode, setDisplayMode] = useState<'hidden' | 'mobile' | 'desktop'>('hidden');
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  
  // URL atual para o QR Code
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://financasproinvest.com.br';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(appUrl)}&bgcolor=0f172a&color=10b981`;

  useEffect(() => {
    // 1. Verificar se já está rodando como App (Standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone) {
        setDisplayMode('hidden');
        return;
    }

    // 2. Detecção do Tipo de Dispositivo
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobileDevice = /iphone|ipad|ipod|android/i.test(userAgent);
    const isIOSDevice = /iphone|ipad|ipod/i.test(userAgent);
    setIsIOS(isIOSDevice);

    // 3. Verificar se o usuário fechou o aviso NESTA sessão
    const sessionDismissed = sessionStorage.getItem('finpro_install_dismissed');
    if (sessionDismissed) {
        setDisplayMode('hidden');
        return;
    }

    if (isMobileDevice) {
        setDisplayMode('mobile');
    } else {
        setDisplayMode('desktop');
    }

    // 4. Capturar evento do Android (Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Se for Android, garante que mostramos o modo mobile
      if (isMobileDevice) setDisplayMode('mobile');
    };
    window.addEventListener('beforeinstallprompt', handler);

    // 5. Listener de Sucesso
    window.addEventListener('appinstalled', () => {
      logEvent(ANALYTICS_EVENTS.PWA_INSTALLED);
      setDisplayMode('hidden');
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
        // iOS não permite instalação via botão, mostra instruções
        setShowIOSInstructions(true);
    } else if (deferredPrompt) {
        // Android nativo
        logEvent(ANALYTICS_EVENTS.PWA_INSTALL_CLICK);
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        if (outcome === 'accepted') {
            setDisplayMode('hidden');
        }
    } else {
        // Fallback Android (caso o evento não tenha disparado ainda) ou outros
        alert('Para instalar: Toque no menu do navegador (três pontos) e selecione "Instalar aplicativo" ou "Adicionar à tela inicial".');
    }
  };

  const handleDismiss = () => {
      setDisplayMode('hidden');
      setShowIOSInstructions(false);
      // Salva na sessão para não incomodar até o usuário reabrir a aba/navegador
      sessionStorage.setItem('finpro_install_dismissed', 'true');
  };

  if (displayMode === 'hidden') return null;

  // --- RENDERIZAÇÃO DESKTOP (QR CODE) ---
  if (displayMode === 'desktop') {
      return (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-right duration-700 flex flex-col items-end pointer-events-none">
            {/* Card Principal */}
            <div className="bg-[#0f172a] border border-slate-700 p-5 rounded-2xl shadow-2xl max-w-xs pointer-events-auto relative group">
                <button onClick={handleDismiss} className="absolute top-2 right-2 text-slate-500 hover:text-white p-1">✕</button>
                
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-xl shadow-lg">📲</div>
                    <div>
                        <h4 className="font-bold text-white text-sm">Versão Mobile</h4>
                        <p className="text-xs text-slate-400">Use o app no seu celular</p>
                    </div>
                </div>

                <div className="bg-white p-2 rounded-xl w-fit mx-auto mb-3">
                    <img src={qrCodeUrl} alt="QR Code para Mobile" className="w-32 h-32 object-contain" />
                </div>
                
                <p className="text-[10px] text-center text-slate-500 leading-tight">
                    Aponte a câmera do seu celular para instalar o aplicativo offline.
                </p>
            </div>
        </div>
      );
  }

  // --- RENDERIZAÇÃO MOBILE (BANNER) ---
  return (
    <>
        {!showIOSInstructions ? (
            <div className="fixed bottom-0 left-0 right-0 z-[100] animate-in slide-in-from-bottom duration-500">
                {/* Backdrop gradiente para legibilidade */}
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/90 to-transparent -z-10 pointer-events-none"></div>
                
                <div className="bg-[#0f172a] border-t border-emerald-500/30 p-4 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
                    <div className="flex items-center gap-4 max-w-lg mx-auto">
                        <div className="hidden sm:flex w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl items-center justify-center text-2xl shadow-lg shrink-0 border border-emerald-400/30">
                            ✨
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-white text-sm leading-tight mb-1">Instale o App Oficial</h4>
                            <p className="text-xs text-slate-400 leading-tight">
                                Acesso mais rápido e funciona <strong>100% offline</strong>.
                            </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button 
                                onClick={handleDismiss}
                                className="px-3 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                Fechar
                            </button>
                            <button 
                                onClick={handleInstallClick}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-lg shadow-emerald-900/50 transition-all active:scale-95 border border-emerald-500/50 flex items-center gap-2"
                            >
                                <span>📥</span> Baixar App
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            /* Instruções Específicas iOS (Overlay Fullscreen) */
            <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-300" onClick={() => setShowIOSInstructions(false)}>
                <div className="bg-[#1e293b] w-full p-6 rounded-t-3xl border-t border-slate-700 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300 relative max-w-md" onClick={e => e.stopPropagation()}>
                    
                    <button onClick={() => setShowIOSInstructions(false)} className="absolute top-4 right-4 text-slate-400 p-2">✕</button>

                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-16 h-1 bg-slate-700 rounded-full mb-2"></div>
                        <h3 className="text-xl font-bold text-white">Instalar no iPhone</h3>
                        
                        <div className="space-y-4 text-left w-full bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                            <div className="flex items-center gap-3">
                                <span className="bg-slate-700 w-8 h-8 flex items-center justify-center rounded-full text-white font-bold shrink-0">1</span>
                                <p className="text-slate-300 text-sm">Toque no botão <strong className="text-emerald-400">Compartilhar</strong> <span className="inline-block align-middle bg-slate-700 p-1 rounded mx-1">⎋</span> na barra inferior.</p>
                            </div>
                            <div className="h-px bg-slate-700/50 w-full"></div>
                            <div className="flex items-center gap-3">
                                <span className="bg-slate-700 w-8 h-8 flex items-center justify-center rounded-full text-white font-bold shrink-0">2</span>
                                <p className="text-slate-300 text-sm">Role para cima e selecione <strong className="text-white">"Adicionar à Tela de Início"</strong> <span className="inline-block align-middle text-xl leading-none ml-1">➕</span>.</p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500 mt-2">Toque em qualquer lugar para fechar</p>
                        
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
