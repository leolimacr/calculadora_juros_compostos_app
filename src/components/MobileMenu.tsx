import React from 'react';
import { Browser } from '@capacitor/browser';
import { auth } from '../firebase';
import { 
  LogOut, Settings, User, Eye, EyeOff, Crown, ChevronRight, 
  Smartphone, Sparkles, X, LayoutDashboard, ExternalLink
} from 'lucide-react';

interface UserMetaInfo {
  nickname?: string;
  plan?: string;
  [key: string]: unknown;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tool: string) => void;
  isAuthenticated: boolean;
  userDisplayName?: string;
  userMeta?: UserMetaInfo | null;
  isPrivacyMode: boolean;
  onTogglePrivacy: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ 
  isOpen, 
  onClose, 
  onNavigate, 
  isAuthenticated,
  userDisplayName,
  userMeta,
  isPrivacyMode,
  onTogglePrivacy
}) => {
  if (!isOpen) return null;

  const nickname = userMeta?.nickname || userDisplayName || 'Investidor';
  const firstName = nickname.split(' ')[0];
  const isPro = userMeta?.plan === 'pro' || userMeta?.plan === 'premium';
  
  const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.financasproinvest.app';

  const handleDeepLink = (path: string) => {
    const appScheme = `financasproinvest://${path}`;
    window.location.href = appScheme;

    setTimeout(() => {
      if (!document.hidden) {
        Browser.open({ url: PLAY_STORE_URL, windowName: '_system' });
      }
    }, 1500);
    onClose();
  };

  const openPricing = async () => {
    await Browser.open({ url: 'https://www.financasproinvest.com.br/pricing', windowName: '_system' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex justify-end font-sans">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Container Principal */}
      <div className="relative w-[85%] max-w-[340px] bg-[#0f172a] h-full shadow-2xl border-l border-slate-800 animate-in slide-in-from-right duration-300 flex flex-col">
        
        {/* CABEÇALHO */}
        <div className="relative p-6 bg-gradient-to-b from-slate-900 to-[#0f172a] border-b border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Menu Principal</span>
            <button onClick={onClose} className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {isAuthenticated && (
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-900/40 border border-white/10">
                  {nickname.charAt(0).toUpperCase()}
                </div>
                {isPro && (
                  <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 p-1 rounded-full border border-slate-900">
                    <Crown size={10} fill="currentColor" strokeWidth={3} />
                  </div>
                )}
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Bem vindo de volta,</p>
                <p className="text-white font-black text-xl tracking-tight">{firstName}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* LISTA DE CARDS (Onde estava "sem graça") */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {isAuthenticated && (
            <>
              {/* CARD 1: GERENCIADOR (FUNDO AMARELO/DOURADO) */}
              <button 
                onClick={() => handleDeepLink('manager')}
                className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 p-0.5 shadow-lg shadow-orange-900/20 group active:scale-95 transition-all"
              >
                <div className="bg-[#0f172a] rounded-[10px] p-4 h-full relative overflow-hidden group-hover:bg-[#151e32] transition-colors">
                  {/* Brilho no fundo */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                  
                  <div className="flex items-center gap-4 relative z-10">
                     <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg text-white shadow-md">
                        <LayoutDashboard size={22} strokeWidth={2.5} />
                     </div>
                     <div className="flex-1 text-left">
                        <span className="block text-[9px] font-black uppercase tracking-wider text-amber-500 mb-0.5">Aplicativo</span>
                        <span className="block text-white font-bold text-sm">Gerenciador Financeiro</span>
                     </div>
                     <ExternalLink size={16} className="text-slate-500 group-hover:text-amber-400" />
                  </div>
                </div>
              </button>

              {/* CARD 2: NEXUS IA (FUNDO AZUL/CIANO) */}
              <button 
                onClick={() => handleDeepLink('chat')}
                className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-blue-900/20 group active:scale-95 transition-all"
              >
                <div className="bg-[#0f172a] rounded-[10px] p-4 h-full relative overflow-hidden group-hover:bg-[#151e32] transition-colors">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                  
                  <div className="flex items-center gap-4 relative z-10">
                     <div className="p-3 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg text-white shadow-md">
                        <Sparkles size={22} strokeWidth={2.5} />
                     </div>
                     <div className="flex-1 text-left">
                        <span className="block text-[9px] font-black uppercase tracking-wider text-cyan-400 mb-0.5">Inteligência Artificial</span>
                        <span className="block text-white font-bold text-sm">Nexus IA</span>
                     </div>
                     <ChevronRight size={18} className="text-slate-500 group-hover:text-cyan-400" />
                  </div>
                </div>
              </button>

              <div className="h-px bg-slate-800 w-full my-2" />

              {/* CONFIGURAÇÕES E PRIVACIDADE (Estilo Lista Clean) */}
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                <button onClick={() => { onNavigate('settings'); onClose(); }} className="w-full flex items-center gap-3 p-4 hover:bg-slate-800 text-slate-300 transition-colors border-b border-slate-800">
                    <Settings size={18} className="text-slate-400"/>
                    <span className="font-semibold text-sm flex-1 text-left">Configurações</span>
                    <ChevronRight size={16} className="text-slate-600"/>
                </button>

                <button onClick={onTogglePrivacy} className="w-full flex items-center gap-3 p-4 hover:bg-slate-800 text-slate-300 transition-colors border-b border-slate-800">
                    {isPrivacyMode ? <EyeOff size={18} className="text-indigo-400"/> : <Eye size={18} className="text-emerald-400"/>}
                    <span className="font-semibold text-sm flex-1 text-left">Ocultar Valores</span>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${isPrivacyMode ? 'bg-indigo-500' : 'bg-slate-600'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isPrivacyMode ? 'translate-x-4' : ''}`} />
                    </div>
                </button>
                
                <button onClick={() => { onNavigate('perfil'); onClose(); }} className="w-full flex items-center gap-3 p-4 hover:bg-slate-800 text-slate-300 transition-colors">
                    <User size={18} className="text-slate-400"/>
                    <span className="font-semibold text-sm flex-1 text-left">Meu Perfil</span>
                    <ChevronRight size={16} className="text-slate-600"/>
                </button>
              </div>
            </>
          )}

          {/* UPGRADE PRO */}
          <button onClick={openPricing} className="w-full p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between group active:scale-95 transition-all">
             <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-400">
                   <Crown size={18} />
                </div>
                <div className="text-left">
                  <span className="block text-emerald-400 font-bold text-xs uppercase">Seja Premium</span>
                  <span className="block text-slate-400 text-[10px]">Desbloqueie recursos</span>
                </div>
             </div>
             <ChevronRight size={16} className="text-emerald-500/50" />
          </button>
        </div>

        {/* FOOTER */}
        {isAuthenticated && (
          <div className="p-6 border-t border-slate-800 bg-[#0b1120]">
            <button onClick={() => auth.signOut()} className="w-full flex items-center justify-center gap-2 p-3 text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 rounded-xl font-bold transition-all text-sm uppercase tracking-wide">
              <LogOut size={16} /> Encerrar Sessão
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMenu;