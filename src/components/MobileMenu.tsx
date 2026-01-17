import React from 'react';
import { Browser } from '@capacitor/browser';
import { auth } from '../firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tool: string) => void;
  onUpgrade: () => void;
  isPro: boolean;
}

const MobileMenu: React.FC<Props> = ({ isOpen, onClose, onNavigate, isPro }) => {
  if (!isOpen) return null;

  const openPricing = async () => {
    // Abre o navegador do sistema (Chrome) na página específica de planos
    // Isso evita a taxa de 30% pois a compra é feita na Web
    await Browser.open({ url: 'https://www.financasproinvest.com.br/pricing' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Fundo escuro que fecha o menu ao clicar */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Painel lateral */}
      <div className="relative w-72 bg-slate-900 h-full shadow-2xl p-6 border-l border-slate-800 animate-in slide-in-from-right duration-300 flex flex-col">
        <div className="flex justify-between items-center mb-10">
          <span className="font-bold text-white text-xl">Menu</span>
          <button onClick={onClose} className="text-slate-400 text-2xl p-2 rounded-full hover:bg-slate-800">✕</button>
        </div>
        
        <div className="space-y-4 flex-grow">
          <button onClick={() => { onNavigate('perfil'); onClose(); }} className="w-full text-left p-4 rounded-xl bg-slate-800 text-white flex items-center gap-3 border border-slate-700 hover:bg-slate-700 transition-colors">
            <span>👤</span> Meu Perfil
          </button>
          
          <button onClick={() => { onNavigate('settings'); onClose(); }} className="w-full text-left p-4 rounded-xl bg-slate-800 text-white flex items-center gap-3 border border-slate-700 hover:bg-slate-700 transition-colors">
            <span>⚙️</span> Configurações
          </button>

          {/* BOTÃO PLANOS DE ASSINATURA (CORRIGIDO) */}
          <button onClick={openPricing} className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold flex items-center gap-3 shadow-lg shadow-emerald-900/20 active:scale-95 transition-transform border border-emerald-500/30">
            <span>💎</span> Planos de Assinatura
          </button>
        </div>

        <div className="pt-6 border-t border-slate-800">
          <button onClick={() => auth.signOut()} className="w-full text-left p-4 text-red-400 font-bold flex items-center gap-3 hover:bg-red-500/10 rounded-xl transition-colors">
            <span>🚪</span> Sair do App
          </button>
          <p className="text-center text-slate-600 text-xs mt-4">Versão 1.7.0</p>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;