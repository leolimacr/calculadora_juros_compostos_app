
import React, { useState } from 'react';

export const HeaderInstallAction: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // ========================================================================
  // CONFIGURAÇÃO DO APP
  // ========================================================================
  // Substitua a URL abaixo pelo link da sua loja ou página de download universal
  const APP_URL = "https://play.google.com/store/apps/details?id=com.financasproinvest.app";
  
  // Geração do QR Code usando API pública (QRServer)
  const qrData = encodeURIComponent(APP_URL);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrData}&bgcolor=ffffff&color=000000&margin=10`;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="group relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        title="Instalar App no Celular"
      >
        <span className="text-lg">📱</span>
        <span className="hidden xl:inline">Instalar App</span>
        
        {/* Tooltip (Hover) - Visualmente leve e discreto */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
          Aponte a câmera do seu celular para o QR Code e faça a instalação.
          {/* Seta do Tooltip */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-t border-l border-slate-700 rotate-45"></div>
        </div>
      </button>

      {/* Modal/Popover com QR Code */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
            <div 
                className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl relative max-w-sm w-full text-center animate-in zoom-in-95 duration-200 mx-4"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
                >
                    ✕
                </button>
                
                <div className="mb-6">
                    <span className="text-4xl mb-4 block">📲</span>
                    <h3 className="text-xl font-bold text-white mb-2">Instalar Finanças Pro Invest</h3>
                    <p className="text-sm text-slate-400">Abra a câmera do seu celular e aponte para o QR Code para instalar o aplicativo.</p>
                </div>
                
                {/* Container do QR Code (Fundo branco para contraste) */}
                <div className="bg-white p-3 rounded-2xl inline-block shadow-inner mb-6 border-4 border-slate-800">
                    <img src={qrCodeUrl} alt="QR Code para Download" className="w-48 h-48 object-contain" />
                </div>
                
                <div className="flex justify-center gap-4 opacity-70 mb-6">
                    <span className="text-xs font-bold text-slate-500 border border-slate-700 px-3 py-1 rounded-lg flex items-center gap-1">
                        🤖 Android
                    </span>
                    <span className="text-xs font-bold text-slate-500 border border-slate-700 px-3 py-1 rounded-lg flex items-center gap-1">
                        🍎 iOS
                    </span>
                </div>
                
                <button 
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors"
                >
                    Fechar
                </button>
            </div>
        </div>
      )}
    </>
  );
};
