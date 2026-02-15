import React from 'react';
import { Browser } from '@capacitor/browser';
import { auth } from '../firebase';
import { 
  LogOut, Settings, User, Eye, EyeOff, Crown, ChevronRight, 
  Smartphone, Sparkles, X, LayoutDashboard
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
  
  // URL da Play Store para fallback
  const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.financasproinvest.app';

  // Função Deep Link Inteligente
  const handleDeepLink = (path: string) => {
    // Tenta abrir o App Nativo
    const appScheme = `financasproinvest://${path}`;
    window.location.href = appScheme;

    // Se não abrir em 1.5s, abre a Store
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
      {/* Overlay com Blur */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Painel Lateral */}
      <div className="relative w-[85%] max-w-[340px] bg-[#0f172a] h-full shadow-2xl border-l border-slate-800 animate-in slide-in-from-right duration-300 flex flex-col">
        
        {/* CABEÇALHO: Perfil "Emocionante" */}
        <div className="relative p-6 bg-gradient-to-b from-indigo-950 to-[#0f172a] border-b border-slate-800/50 overflow-hidden">
          {/* Efeito de fundo decorativo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <h2 className="text-[10px] font-black text-indigo-200/70 uppercase tracking-[0.2em]">Menu Principal</h2>
            <button onClick={onClose} className="bg-slate-800/50 p-2 rounded-full text-slate-300 hover:bg-slate-700 transition-colors">
              <X size={18} />
            </button>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-4 relative z-10">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/20 ring-2 ring-white/10">
                  {nickname.charAt(0).toUpperCase()}
                </div>
                {isPro && (
                  <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-950 p-1.5 rounded-full shadow-md border border-[#0f172a]">
                    <Crown size={12} fill="currentColor" strokeWidth={3} />
                  </div>
                )}
              </div>
              <div>
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Bem vindo,</p>
                <p className="text-white font-black text-xl tracking-tight">{firstName} 🚀</p>
                <p className="text-slate-400 text-[10px] mt-0.5">Vamos evoluir hoje?</p>
              </div>
            </div>
          ) : (
             <div className="text-center py-2 relative z-10">
                <p className="text-indigo-200 text-sm mb-4 font-medium">Faça login para acessar seus dados.</p>
                <button 
                  onClick={() => { onNavigate('login'); onClose(); }}
                  className="w-full py-3 bg-white text-indigo-900 font-black rounded-xl shadow-lg shadow-indigo-900/50 transition-all active:scale-95 uppercase tracking-wide text-xs"
                >
                  Entrar Agora
                </button>
             </div>
          )}
        </div>
        
        {/* CORPO: Botões em Cards Coloridos */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {isAuthenticated && (
            <>
              {/* CARD 1: GERENCIADOR (DOURADO) */}
              <button 
                onClick={() => handleDeepLink('manager')}
                className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-1 transition-all active:scale-95 hover:border-yellow-500/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                <div className="flex items-center gap-4 p-4">
                   <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow-lg shadow-amber-500/20">
                      <LayoutDashboard size={24} strokeWidth={2.5} />
                   </div>
                   <div className="flex-1 text-left">
                      <span className="block text-[10px] font-black uppercase tracking-wider text-yellow-500 mb-0.5">Principal</span>
                      <span className="block text-sm font-bold text-white leading-tight">Ir para Gerenciador</span>
                   </div>
                   <ChevronRight size={20} className="text-slate-600 group-hover:text-yellow-400 transition-colors" />
                </div>
              </button>

              {/* CARD 2: NEXUS IA (AZUL NEON) */}
              <button 
                onClick={() => handleDeepLink('chat')}
                className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-1 transition-all active:scale-95 hover:border-cyan-500/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                <div className="flex items-center gap-4 p-4">
                   <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
                      <Sparkles size={24} strokeWidth={2.5} />
                   </div>
                   <div className="flex-1 text-left">
                      <span className="block text-[10px] font-black uppercase tracking-wider text-cyan-400 mb-0.5">Inteligência Artificial</span>
                      <span className="block text-sm font-bold text-white leading-tight">Nexus IA</span>
                   </div>
                   <ChevronRight size={20} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
                </div>
              </button>

              <div className="h-px bg-slate-800 w-full my-2" />

              {/* OPÇÕES SECUNDÁRIAS (Estilo Clean) */}
              <div className="space-y-2">
                <button onClick={() => { onNavigate('settings'); onClose(); }} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 text-slate-300 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:text-white transition-colors">
                        <Settings size={18} />
                    </div>
                    <span className="font-semibold text-sm">Configurações</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-600"/>
                </button>

                <button 
                  onClick={onTogglePrivacy} 
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 text-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                        {isPrivacyMode ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </div>
                    <span className="font-semibold text-sm">Ocultar Valores</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${isPrivacyMode ? 'bg-indigo-500' : 'bg-slate-600'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isPrivacyMode ? 'translate-x-4' : ''}`} />
                  </div>
                </button>
              </div>
            </>
          )}

          {/* UPGRADE PRO */}
          <button onClick={openPricing} className="w-full mt-2 p-4 rounded-xl bg-gradient-to-r from-emerald-900/40 to-emerald-950/40 border border-emerald-500/20 active:scale-95 transition-all">
            <div className="flex items-center gap-3">
                <Crown size={20} className="text-emerald-400" />
                <div className="text-left">
                  <span className="block text-emerald-400 font-black text-[10px] uppercase tracking-wider">Seja Premium</span>
                  <span className="block text-white font-bold text-xs">Ver Planos Disponíveis</span>
                </div>
            </div>
          </button>
        </div>

        {/* FOOTER */}
        {isAuthenticated && (
          <div className="p-6 border-t border-slate-800 bg-[#0b1120]">
            <button onClick={() => auth.signOut()} className="w-full flex items-center justify-center gap-2 p-3 text-red-400 hover:text-red-300 hover:bg-red-900/10 rounded-xl font-bold transition-all text-sm uppercase tracking-wide">
              <LogOut size={16} /> Sair da Conta
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMenu;