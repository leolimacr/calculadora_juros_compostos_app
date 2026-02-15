import React from 'react';
import { Browser } from '@capacitor/browser';
import { auth } from '../firebase';
import { 
  LogOut, Settings, User, Eye, EyeOff, Crown, Globe, ChevronRight, Smartphone, Sparkles 
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
  const isPro = userMeta?.plan === 'pro' || userMeta?.plan === 'premium';
  
  // ID DO SEU APP NA PLAYSTORE (Verifique no seu capacitor.config.json)
  const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.leolimacr.financaspro';

  // Função para abrir App Nativo ou Loja
  const handleDeepLink = (path: string) => {
    // 1. Tenta abrir o App Nativo (Custom Scheme)
    // Isso requer que seu app Android tenha o scheme configurado no AndroidManifest.xml
    const appScheme = `financasproinvest://${path}`; // Ex: financasproinvest://manager
    
    // Tenta abrir o app
    window.location.href = appScheme;

    // 2. Fallback: Se não abrir em 1.5s, vai para a Play Store
    setTimeout(() => {
      // Verifica se a página ainda está visível (se o app abriu, a página perde o foco)
      if (!document.hidden) {
        Browser.open({ url: PLAY_STORE_URL });
      }
    }, 1500);

    onClose();
  };

  const openPricing = async () => {
    await Browser.open({ url: 'https://www.financasproinvest.com.br/pricing', windowName: '_system' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Overlay Escuro */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Painel Lateral */}
      <div className="relative w-[85%] max-w-[320px] bg-[#0f172a] h-full shadow-2xl border-l border-slate-800 animate-in slide-in-from-right duration-300 flex flex-col">
        
        {/* CABEÇALHO DO MENU: PERFIL COM EMOÇÃO */}
        <div className="p-6 bg-gradient-to-b from-slate-900 to-[#0f172a] border-b border-slate-800">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Menu Principal</h2>
            <button onClick={onClose} className="text-slate-400 p-2 rounded-full hover:bg-slate-800 transition-colors">✕</button>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-sky-500/20 ring-2 ring-[#0f172a]">
                  {nickname.charAt(0).toUpperCase()}
                </div>
                {isPro && (
                  <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-[#0f172a] p-1 rounded-full shadow-sm">
                    <Crown size={12} fill="currentColor" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Olá,</p>
                <p className="text-white font-black text-lg truncate leading-tight tracking-tight">{nickname} 🚀</p>
              </div>
            </div>
          ) : (
             <div className="text-center py-2">
                <p className="text-slate-400 text-sm mb-3 font-medium">Faça login para sincronizar seus dados.</p>
                <button 
                  onClick={() => { onNavigate('login'); onClose(); }}
                  className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-sky-900/20 transition-all active:scale-95 uppercase tracking-wide text-xs"
                >
                  Entrar na Conta
                </button>
             </div>
          )}
        </div>
        
        {/* LISTA DE OPÇÕES */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          
          {isAuthenticated && (
            <>
              {/* BOTÃO ESPECIAL 1: IR PARA O APP (GERENCIADOR) */}
              <button 
                onClick={() => handleDeepLink('manager')}
                className="w-full relative overflow-hidden p-4 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 border border-yellow-500/20 group active:scale-95 transition-all shadow-md"
              >
                <div className="flex items-center justify-between relative z-10">
                   <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-yellow-500/10 rounded-lg text-yellow-400 shadow-inner ring-1 ring-yellow-500/20">
                        <Smartphone size={20} />
                      </div>
                      <div className="text-left">
                        <span className="block text-yellow-400 font-black text-[10px] uppercase tracking-widest mb-0.5">Aplicativo Nativo</span>
                        <span className="block text-white font-bold text-sm">Abrir Gerenciador</span>
                      </div>
                   </div>
                   <ChevronRight size={16} className="text-slate-600 group-hover:text-yellow-400 transition-colors"/>
                </div>
              </button>

              {/* BOTÃO ESPECIAL 2: IR PARA O APP (NEXUS IA) */}
              <button 
                onClick={() => handleDeepLink('chat')}
                className="w-full relative overflow-hidden p-4 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 border border-sky-500/20 group active:scale-95 transition-all shadow-md"
              >
                <div className="flex items-center justify-between relative z-10">
                   <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-sky-500/10 rounded-lg text-sky-400 shadow-inner ring-1 ring-sky-500/20">
                        <Sparkles size={20} />
                      </div>
                      <div className="text-left">
                        <span className="block text-sky-400 font-black text-[10px] uppercase tracking-widest mb-0.5">Inteligência Artificial</span>
                        <span className="block text-white font-bold text-sm">Abrir Nexus IA</span>
                      </div>
                   </div>
                   <ChevronRight size={16} className="text-slate-600 group-hover:text-sky-400 transition-colors"/>
                </div>
              </button>

              <div className="h-px bg-slate-800/50 my-3 mx-2" />

              {/* Toggle de Privacidade */}
              <button 
                onClick={onTogglePrivacy} 
                className="w-full flex items-center justify-between p-3.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-all active:scale-95"
              >
                <div className="flex items-center gap-3">
                  {isPrivacyMode ? <EyeOff size={18} className="text-slate-400"/> : <Eye size={18} className="text-emerald-400"/>}
                  <span className="font-semibold text-sm">Ocultar Valores</span>
                </div>
                <div className={`w-9 h-5 rounded-full relative transition-colors ${isPrivacyMode ? 'bg-sky-600' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isPrivacyMode ? 'translate-x-4' : ''}`} />
                </div>
              </button>

              <button onClick={() => { onNavigate('perfil'); onClose(); }} className="w-full flex items-center justify-between p-3.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors group active:scale-95">
                <div className="flex items-center gap-3">
                  <User size={18} className="text-slate-400 group-hover:text-white transition-colors"/>
                  <span className="font-semibold text-sm">Meu Perfil</span>
                </div>
                <ChevronRight size={16} className="text-slate-600"/>
              </button>
              
              <button onClick={() => { onNavigate('settings'); onClose(); }} className="w-full flex items-center justify-between p-3.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors group active:scale-95">
                <div className="flex items-center gap-3">
                  <Settings size={18} className="text-slate-400 group-hover:text-white transition-colors"/>
                  <span className="font-semibold text-sm">Configurações</span>
                </div>
                <ChevronRight size={16} className="text-slate-600"/>
              </button>
            </>
          )}

          {/* UPGRADE BUTTON */}
          <button onClick={openPricing} className="w-full mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-900/60 to-emerald-950/60 border border-emerald-500/30 group active:scale-95 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-emerald-500/20 rounded text-emerald-400">
                  <Crown size={18} />
                </div>
                <div className="text-left leading-none">
                  <span className="block text-emerald-400 font-black text-[10px] uppercase tracking-wider mb-1">Premium</span>
                  <span className="block text-white font-bold text-sm">Planos & Assinaturas</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* RODAPÉ */}
        {isAuthenticated && (
          <div className="p-6 border-t border-slate-800 bg-[#0b1120]">
            <button onClick={() => auth.signOut()} className="w-full flex items-center justify-center gap-2 p-3 text-red-400 hover:text-red-300 hover:bg-red-900/10 rounded-xl font-bold transition-all text-sm uppercase tracking-wide">
              <LogOut size={16} /> Encerrar Sessão
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMenu;