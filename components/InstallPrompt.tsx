
import React, { useState, useEffect } from 'react';

// --- CONFIGURAÇÃO DE LINKS ---
// Preencha com os links reais das lojas quando disponíveis.
// Se vazios, o sistema usará a URL atual (comportamento PWA/Web)
const STORE_LINKS = {
  ANDROID: "", // Ex: https://play.google.com/store/apps/details?id=com.financaspro
  IOS: ""      // Ex: https://apps.apple.com/br/app/financas-pro/id123456
};

// --- UTILITÁRIOS ---
const STORAGE_KEY = 'finpro_download_dismissed_ts';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const isDismissedRecently = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;
  const dismissedAt = parseInt(stored, 10);
  return Date.now() - dismissedAt < SEVEN_DAYS_MS;
};

const dismissForWeek = () => {
  localStorage.setItem(STORAGE_KEY, Date.now().toString());
};

// --- COMPONENTES VISUAIS ---

/**
 * 📱 MOBILE BANNER
 * Banner superior, fixo, alta visibilidade mas compacto (<15% tela).
 */
const MobileBanner = ({ onClose }: { onClose: () => void }) => {
  const handleDownload = () => {
    // Detectar OS simples para direcionar loja
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    
    const link = isIOS ? STORE_LINKS.IOS : STORE_LINKS.ANDROID;
    
    if (link) {
      window.open(link, '_blank');
    } else {
      // Fallback se não houver link da loja: Tenta instalar PWA ou avisa
      alert("Versão nativa em breve! Adicione este site à tela de início para usar agora.");
    }
    onClose(); // Fecha após clicar
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top duration-500 shadow-xl">
      <div className="bg-gradient-to-r from-slate-900 via-[#0f172a] to-slate-900 border-b border-emerald-500/30 p-3 flex items-center justify-between gap-3 backdrop-blur-md bg-opacity-95">
        
        {/* Ícone e Texto */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-xl shadow-lg shrink-0">
            📲
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-xs leading-tight">Finanças Pro Oficial</span>
            <span className="text-emerald-400 text-[10px] leading-tight truncate">Melhor experiência no App</span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={handleDownload}
            className="bg-white text-emerald-900 hover:bg-slate-100 text-xs font-black py-2 px-4 rounded-full shadow-lg transition-transform active:scale-95 whitespace-nowrap"
          >
            BAIXAR APP
          </button>
          <button 
            onClick={() => { dismissForWeek(); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 💻 DESKTOP INVITE (BUBBLE)
 * Pequeno, discreto, canto inferior direito.
 */
const DesktopInviteBubble = ({ onOpenModal, onClose }: { onOpenModal: () => void, onClose: () => void }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[90] animate-in slide-in-from-right duration-700 flex items-center gap-2 group">
      {/* Botão Fechar Externo (aparece no hover ou sempre visível se preferir) */}
      <button 
        onClick={() => { dismissForWeek(); onClose(); }}
        className="absolute -top-2 -right-2 w-6 h-6 bg-slate-700 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-slate-600 z-10"
        title="Não mostrar por 7 dias"
      >
        ✕
      </button>

      <div 
        onClick={onOpenModal}
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
  );
};

/**
 * 💻 DESKTOP QR MODAL
 * Modal central com QR Code grande.
 */
const DesktopQRModal = ({ onClose }: { onClose: () => void }) => {
  // URL para o QR Code (Aponta para a loja ou site atual)
  // Usamos a URL atual para garantir que o usuário caia no contexto certo se não houver link de loja
  const qrData = STORE_LINKS.ANDROID || STORE_LINKS.IOS || (typeof window !== 'undefined' ? window.location.href : '');
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}&bgcolor=1e293b&color=10b981&margin=10`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl relative max-w-md w-full text-center animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white p-2 transition-colors rounded-full hover:bg-slate-800"
        >
          ✕
        </button>

        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">Instale o Aplicativo</h3>
          <p className="text-slate-400 text-sm">
            Aponte a câmera do seu celular para o QR Code abaixo para baixar a versão oficial.
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
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL (MANAGER) ---

const InstallPrompt: React.FC = () => {
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile' | null>(null);
  
  // Estado Desktop
  const [showDesktopInvite, setShowDesktopInvite] = useState(false);
  const [showDesktopModal, setShowDesktopModal] = useState(false);
  
  // Estado Mobile
  const [showMobileBanner, setShowMobileBanner] = useState(false);

  useEffect(() => {
    // 1. Verificar Persistência (7 dias)
    if (isDismissedRecently()) {
      return; // Não mostra nada se fechou recentemente
    }

    // 2. Detectar Dispositivo
    const checkDevice = () => {
      const isMobile = window.innerWidth <= 768;
      setDeviceType(isMobile ? 'mobile' : 'desktop');
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Lógica de Exibição baseada no Dispositivo
  useEffect(() => {
    if (!deviceType) return;

    if (deviceType === 'mobile') {
      // Mobile: Mostra Banner imediatamente
      setShowMobileBanner(true);
      setShowDesktopInvite(false);
      setShowDesktopModal(false);
    } else {
      // Desktop: Mostra Invite Bubble após 2s
      setShowMobileBanner(false);
      setTimeout(() => setShowDesktopInvite(true), 2000);

      // Auto-hide do Invite Desktop após 15s (se não clicou)
      const autoHideTimer = setTimeout(() => {
        if (!showDesktopModal) { // Só esconde se o modal não estiver aberto
           setShowDesktopInvite(false);
        }
      }, 15000);

      return () => clearTimeout(autoHideTimer);
    }
  }, [deviceType, showDesktopModal]);

  // Handlers
  const handleOpenQR = () => {
    setShowDesktopInvite(false); // Esconde o convite
    setShowDesktopModal(true);   // Abre o modal
  };

  const handleCloseDesktopInvite = () => {
    setShowDesktopInvite(false);
  };

  const handleCloseModal = () => {
    setShowDesktopModal(false);
    // Nota: Fechar o modal de QR não necessariamente dismiss por 7 dias, 
    // pois o usuário pode ter escaneado. Mas fechamos a UI atual.
  };

  if (!deviceType) return null;

  return (
    <>
      {/* MOBILE RENDER */}
      {deviceType === 'mobile' && showMobileBanner && (
        <MobileBanner onClose={() => setShowMobileBanner(false)} />
      )}

      {/* DESKTOP RENDER */}
      {deviceType === 'desktop' && (
        <>
          {showDesktopInvite && !showDesktopModal && (
            <DesktopInviteBubble 
              onOpenModal={handleOpenQR} 
              onClose={handleCloseDesktopInvite} 
            />
          )}
          
          {showDesktopModal && (
            <DesktopQRModal onClose={handleCloseModal} />
          )}
        </>
      )}
    </>
  );
};

export default InstallPrompt;
