import React from 'react';
import { Browser } from '@capacitor/browser';
import { auth } from '../firebase';
import { 
  LogOut, Settings, User, Eye, EyeOff, Crown, ChevronRight, 
  Smartphone, Sparkles, X, LayoutDashboard, ExternalLink, ShieldCheck
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
      {/* Fundo escuro com desfoque */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      
      {/* Painel Lateral */}
      <div className="relative w-[85%] max-w-[340px] bg-[#0f172a] h-full shadow-2xl border-l border-slate-800 animate-in slide-in-from-right duration-300 flex flex-col">
        
        {/* === CABEÇALHO DO PERFIL === */}
        <div className="relative p-6 overflow-hidden border-b border-slate-800">
          {/* Background decorativo sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-[#0f172a] z-0"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded">Menu Principal</span>
            <button onClick={onClose} className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white hover:bg-red-500/20 transition-all">
              <X size={18} />
            </button>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-4 relative z-10">
              <div className="relative group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/30 ring-2 ring-white/10 group-hover:scale-105 transition-transform">
                  {nickname.charAt(0).toUpperCase()}
                </div>
                {isPro && (
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-300 to-amber-500 text-amber-950 p-1.5 rounded-full shadow-lg border border-[#0f172a]">
                    <Crown size={12} fill="currentColor" strokeWidth={3} />
                  </div>
                )}
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Olá, Investidor</p>
                <p className="text-white font-black text-xl tracking-tight leading-none mb-1">{firstName}</p>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isPro ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></div>
                  <span className="text-[10px] text-slate-400 font-medium">{isPro ? 'Conta Premium' : 'Conta Gratuita'}</span>
                </div>
              </div>
            </div>
          ) : (
             <div className="relative z-10 text-center py-4">
               <p className="text-slate-300 mb-4 text-sm">Acesse sua conta para sincronizar.</p>
               <button onClick={() => { onNavigate('login'); onClose(); }} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/25 active:scale-95 transition-all">
                 ENTRAR AGORA
               </button>
             </div>
          )}
        </div>
        
        {/* === CORPO DO MENU (BOTÕES COLORIDOS) === */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#0f172a]">
          
{isAuthenticated && (
            <>
              {/* SEÇÃO 1: APPS PRINCIPAIS */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Acesso Rápido</h3>

                {/* BOTÃO GERENCIADOR - Estilo Dourado Premium */}
                <button 
                  onClick={() => handleDeepLink('manager')}
                  className="w-full group relative p-px rounded-2xl bg-gradient-to-b from-amber-400/40 to-transparent shadow-lg shadow-amber-950/20 transition-all active:scale-[0.97]"
                >
                  <div className="relative bg-[#0f172a] rounded-[15px] p-4 flex items-center gap-4 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[40px] rounded-full -mr-16 -mt-16" />
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                        <LayoutDashboard size={24} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 text-left">
                        <span className="block text-[10px] font-black uppercase tracking-widest text-amber-500/80">Plataforma</span>
                        <span className="block text-lg font-black text-white">Gerenciador</span>
                    </div>
                    <ChevronRight size={20} className="text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>

                {/* BOTÃO NEXUS IA - Estilo Cyan Neon */}
                <button 
                  onClick={() => handleDeepLink('chat')}
                  className="w-full group relative p-px rounded-2xl bg-gradient-to-b from-sky-400/40 to-transparent shadow-lg shadow-sky-950/20 transition-all active:scale-[0.97]"
                >
                  <div className="relative bg-[#0f172a] rounded-[15px] p-4 flex items-center gap-4 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-[40px] rounded-full -mr-16 -mt-16" />
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 text-white shadow-[0_0_15px_rgba(56,189,248,0.4)]">
                        <Sparkles size={24} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 text-left">
                        <span className="block text-[10px] font-black uppercase tracking-widest text-sky-400/80">Inteligência</span>
                        <span className="block text-lg font-black text-white">Nexus IA</span>
                    </div>
                    <ChevronRight size={20} className="text-slate-600 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              </div>

              {/* SEÇÃO 2: CONFIGURAÇÕES E PREFERÊNCIAS */}
              <div className="pt-2 space-y-3">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Painel</h3>
                 
                 <div className="grid grid-cols-1 gap-2">
                    {/* Botão Configurações - Agora com estilo */}
                    <button 
                      onClick={() => { onNavigate('settings'); onClose(); }} 
                      className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 transition-all group"
                    >
                        <div className="p-2.5 bg-slate-800 rounded-xl text-slate-400 group-hover:text-white transition-colors">
                            <Settings size={20} />
                        </div>
                        <span className="font-bold text-[15px] text-slate-200 flex-1 text-left">Configurações</span>
                        <ChevronRight size={16} className="text-slate-700 group-hover:text-slate-400" />
                    </button>

                    {/* Botão Meu Perfil */}
                    <button 
                      onClick={() => { onNavigate('perfil'); onClose(); }} 
                      className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 transition-all group"
                    >
                        <div className="p-2.5 bg-slate-800 rounded-xl text-slate-400 group-hover:text-white transition-colors">
                            <User size={20} />
                        </div>
                        <span className="font-bold text-[15px] text-slate-200 flex-1 text-left">Meu Perfil</span>
                        <ChevronRight size={16} className="text-slate-700 group-hover:text-slate-400" />
                    </button>

                    {/* Toggle de Privacidade Estilizado */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-inner">
                        <div className={`p-2.5 rounded-xl transition-colors ${isPrivacyMode ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-400'}`}>
                             {isPrivacyMode ? <EyeOff size={20}/> : <Eye size={20}/>}
                        </div>
                        <div className="flex-1 text-left" onClick={onTogglePrivacy}>
                            <span className="font-bold text-[15px] text-slate-200 block">Modo Privado</span>
                            <span className="text-[10px] text-slate-500 uppercase font-medium">{isPrivacyMode ? 'Valores Ocultos' : 'Valores Visíveis'}</span>
                        </div>
                        <button 
                          onClick={onTogglePrivacy}
                          className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner ${isPrivacyMode ? 'bg-emerald-500' : 'bg-slate-700'}`}
                        >
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${isPrivacyMode ? 'translate-x-6' : ''}`} />
                        </button>
                    </div>
                 </div>
              </div>
            </>
          )}

          {/* CARD DE UPGRADE (PREMIUM) */}
          <button onClick={openPricing} className="w-full p-0.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 group active:scale-95 transition-all shadow-lg shadow-emerald-900/20">
             <div className="bg-slate-900 rounded-[14px] p-4 flex items-center justify-between group-hover:bg-slate-900/90 transition-colors">
                <div className="flex items-center gap-3">
                   <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
                      <Crown size={20} />
                   </div>
                   <div className="text-left">
                     <span className="block text-emerald-400 font-black text-[10px] uppercase tracking-wider">Upgrade</span>
                     <span className="block text-white font-bold text-sm">Seja Premium</span>
                   </div>
                </div>
                <ChevronRight size={16} className="text-emerald-500/50 group-hover:text-emerald-400" />
             </div>
          </button>
        </div>

        {/* RODAPÉ */}
        {isAuthenticated && (
          <div className="p-6 border-t border-slate-800 bg-[#0b1120]">
            <button onClick={() => auth.signOut()} className="w-full flex items-center justify-center gap-2 p-3 text-red-400 hover:text-white hover:bg-red-600 rounded-xl font-bold transition-all text-sm uppercase tracking-wide border border-red-900/30 hover:border-red-600">
              <LogOut size={18} /> Sair do App
            </button>
            <div className="mt-4 flex justify-center gap-4 text-slate-600">
               <ShieldCheck size={14} />
               <span className="text-[10px] uppercase tracking-widest font-bold">Ambiente Seguro</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMenu;