
import React, { useState, useEffect } from 'react';

// --- CONFIGURAÇÃO ---
// Defina aqui os links reais das lojas quando tiver.
// Deixe vazio para usar o comportamento padrão (QR Code aponta para o site atual).
const STORE_LINKS = {
  ANDROID: "https://play.google.com/store/apps/details?id=com.financasproinvest.app",
  IOS: "https://apps.apple.com/br/app/financas-pro-invest/id1234567890"
};

const STORAGE_KEY = 'finpro_install_dismissed_v2'; // Chave nova para resetar estados antigos
const COOLDOWN_DAYS = 7;

const InstallPrompt: React.FC = () => {
  const [device, setDevice] = useState<'mobile' | 'desktop' | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // URL para o QR Code (Aponta para a loja ou site atual)
  // QRCode aponta para Play Store (Android é mais comum no Brasil)
  const appUrl = STORE_LINKS.ANDROID || (typeof window !== 'undefined' ? window.location.origin : '');
  // Se tiver link da loja, o QR Code pode apontar direto para um link universal, ou para o site
  const qrData = encodeURIComponent(appUrl); 
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrData}&bgcolor=1e293b&color=10b981&margin=10`;

  useEffect(() => {
    setIsMounted(true);

    // 1. Verificar se já foi fechado recentemente
    const lastDismissed = localStorage.getItem(STORAGE_KEY);
    if (lastDismissed) {
      const daysSince = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < COOLDOWN_DAYS) {
        return; // Não mostra se fechou há menos de 7 dias
      }
    }

    // 2. Detectar Dispositivo
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      setDevice(isMobile ? 'mobile' : 'desktop');
    };
    
    handleResize(); // Check inicial
    window.addEventListener('resize', handleResize);

    // 3. Mostrar Banner (Delay para não ser intrusivo no load imediato)
    const showTimer = setTimeout(() => {
        setIsVisible(true);
    }, 2000);

    return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(showTimer);
    };
  }, []);

  // Efeito Auto-Hide para Desktop (10 segundos)
  useEffect(() => {
    if (device === 'desktop' && isVisible && !showQRModal) {
        const hideTimer = setTimeout(() => {
            // Só esconde se o modal de QR não estiver aberto
            setIsVisible(false);
        }, 10000); // 10 segundos
        return () => clearTimeout(hideTimer);
    }
  }, [device, isVisible, showQRModal]);

  const handleDismiss = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsVisible(false);
    setShowQRModal(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  };

  const handleMobileDownload = () => {
    // Lógica para redirecionar para loja ou instrução
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;

    const link = isIOS ? STORE_LINKS.IOS : STORE_LINKS.ANDROID;

    if (link) {
        window.open(link, '_blank');
    } else {
        // Se não houver link de loja, assume comportamento de PWA/Instrução
        alert("O app está em fase final de publicação! Por enquanto, adicione este site à sua tela inicial para usar como aplicativo.");
    }
    // Opcional: fechar banner após clique
    // handleDismiss(); 
  };

  if (!isMounted || !device) return null;

  // --- RENDER: MOBILE BANNER (TOPO) ---
  if (device === 'mobile') {
    if (!isVisible) return null;
    return (
        <div className="fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top duration-500">
            <div className="bg-[#0f172a]/95 backdrop-blur-md border-b border-emerald-500/30 p-3 shadow-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center text-xl shadow-lg shrink-0">
                        📲
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white font-bold text-xs leading-tight">Finanças Pro</span>
                        <span className="text-emerald-400 text-[10px] leading-tight">App Oficial Grátis</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleMobileDownload}
                        className="bg-white text-emerald-900 hover:bg-slate-200 text-xs font-black py-2 px-4 rounded-full shadow-lg transition-transform active:scale-95 whitespace-nowrap"
                    >
                        BAIXAR
                    </button>
                    <button 
                        onClick={handleDismiss}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
  }

  // --- RENDER: DESKTOP (TOAST + MODAL) ---
  return (
    <>
        {/* Toast Discreto (Canto Inferior Direito) */}
        {isVisible && !showQRModal && (
            <div className="fixed bottom-6 right-6 z-[90] animate-in slide-in-from-right duration-700 group">
                <button 
                    onClick={handleDismiss}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-slate-700 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-slate-600 z-10"
                    title="Fechar por 7 dias"
                >
                    ✕
                </button>
                <div 
                    onClick={() => setShowQRModal(true)}
                    className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/30 p-4 rounded-2xl shadow-2xl cursor-pointer transition-all hover:scale-105 hover:border-emerald-500/60 flex items-center gap-4 max-w-[300px]"
                >
                    <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                            📱
                        </div>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-800 animate-pulse"></span>
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm">Baixe nosso App</h4>
                        <p className="text-xs text-slate-400">Versão mobile disponível</p>
                    </div>
                </div>
            </div>
        )}

        {/* Modal QR Code (Central) */}
        {showQRModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowQRModal(false)}>
                <div 
                    className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl relative max-w-md w-full text-center animate-in zoom-in-95 duration-300 mx-4"
                    onClick={e => e.stopPropagation()}
                >
                    <button 
                        onClick={() => setShowQRModal(false)}
                        className="absolute top-4 right-4 text-slate-500 hover:text-white p-2 transition-colors rounded-full hover:bg-slate-800"
                    >
                        ✕
                    </button>

                    <div className="mb-6">
                        <h3 className="text-2xl font-bold text-white mb-2">Instale o Aplicativo</h3>
                        <p className="text-slate-400 text-sm">
                            Aponte a câmera do seu celular para o QR Code abaixo.
                        </p>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-2xl inline-block shadow-inner border border-slate-700 mb-6">
                        <img 
                            src={qrCodeUrl} 
                            alt="QR Code Download" 
                            className="w-48 h-48 md:w-56 md:h-56 object-contain rounded-lg" 
                            loading="lazy"
                        />
                    </div>

                    <div className="flex justify-center gap-4 opacity-70">
                        <span className="flex items-center gap-2 text-xs text-slate-400 font-bold border border-slate-700 px-3 py-1.5 rounded-lg bg-slate-950">
                             iOS
                        </span>
                        <span className="flex items-center gap-2 text-xs text-slate-400 font-bold border border-slate-700 px-3 py-1.5 rounded-lg bg-slate-950">
                            🤖 Android
                        </span>
                    </div>
                    
                    <p className="text-[10px] text-slate-600 mt-6">
                        Disponível gratuitamente para todas as plataformas.
                    </p>
                </div>
            </div>
        )}
    </>
  );
};

export default InstallPrompt;
