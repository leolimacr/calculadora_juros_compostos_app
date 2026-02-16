import React from 'react';
import { Browser } from '@capacitor/browser';
import { auth } from '../firebase';
import { 
  LogOut, Settings, User, Eye, EyeOff, Crown, ChevronRight, 
  Smartphone, Sparkles, X, LayoutDashboard, ShieldCheck
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
  isOpen, onClose, onNavigate, isAuthenticated, userDisplayName, userMeta, isPrivacyMode, onTogglePrivacy 
}) => {
  if (!isOpen) return null;

  const nickname = userMeta?.nickname || userDisplayName || 'Investidor';
  const firstName = nickname.split(' ')[0].toUpperCase();
  const isPro = userMeta?.plan === 'pro' || userMeta?.plan === 'premium';
  
  const handleDeepLink = (path: string) => {
    const appScheme = `financasproinvest://${path}`;
    window.location.href = appScheme;
    setTimeout(() => { if (!document.hidden) Browser.open({ url: 'https://play.google.com/store/apps/details?id=com.financasproinvest.app', windowName: '_system' }); }, 1500);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex justify-end font-sans">
      {/* Background com desfoque mais intenso */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Painel Lateral Estilizado */}
      <div className="relative w-[80%] max-w-[320px] bg-[#020617] h-full shadow-2xl border-l border-white/5 animate-in slide-in-from-right duration-300 flex flex-col">
        
        {/* HEADER: SEJA BEM VINDO */}
        <div className="p-6 pt-10 border-b border-white/5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em] mb-1">Área do Investidor</p>
              <h2 className="text-white text-xl font-black tracking-tight">SEJA BEM VINDO,<br/> <span className="text-sky-400">{firstName}!</span></h2>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-lg text-slate-400">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* CORPO DO MENU */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pt-6">
          
          {/* BOTÃO 1: GERENCIADOR FINANCEIRO (Dourado/Premium) */}
          <button 
            onClick={() => handleDeepLink('manager')}
            className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/20 p-4 transition-all active:scale-95"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-2xl rounded-full -mr-10 -mt-10"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-lg shadow-amber-900/40">
                <LayoutDashboard size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <span className="block text-[10px] font-black uppercase text-amber-500/70 tracking-widest">Acessar App</span>
                <span className="block text-[15px] font-bold text-white uppercase leading-tight">Gerenciador Financeiro</span>
              </div>
              <ChevronRight size={18} className="text-slate-600 group-hover:text-amber-400" />
            </div>
          </button>

          {/* BOTÃO 2: NEXUS IA (Azul Neon) */}
          <button 
            onClick={() => handleDeepLink('chat')}
            className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-sky-500/20 p-4 transition-all active:scale-95"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 blur-2xl rounded-full -mr-10 -mt-10"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 text-white shadow-lg shadow-sky-900/40">
                <Sparkles size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <span className="block text-[10px] font-black uppercase text-sky-500/70 tracking-widest">Inteligência Artificial</span>
                <span className="block text-[15px] font-bold text-white uppercase leading-tight">Nexus IA</span>
              </div>
              <ChevronRight size={18} className="text-slate-600 group-hover:text-sky-400" />
            </div>
          </button>

          {/* BOTÃO 3: CONFIGURAÇÕES (Clean) */}
          <button 
            onClick={() => { onNavigate('settings'); onClose(); }}
            className="w-full group flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all active:scale-95"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400 group-hover:text-white transition-colors">
              <Settings size={20} />
            </div>
            <span className="flex-1 text-left font-bold text-slate-200 uppercase text-sm tracking-wide">Configurações</span>
            <ChevronRight size={16} className="text-slate-600" />
          </button>

          {/* TOGGLE DE PRIVACIDADE */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className={`p-2 rounded-lg ${isPrivacyMode ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
              {isPrivacyMode ? <EyeOff size={20}/> : <Eye size={20}/>}
            </div>
            <span className="flex-1 text-left font-bold text-slate-400 uppercase text-[12px]">Modo Privado</span>
            <button onClick={onTogglePrivacy} className={`w-10 h-5 rounded-full relative transition-colors ${isPrivacyMode ? 'bg-emerald-500' : 'bg-slate-700'}`}>
              <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isPrivacyMode ? 'translate-x-5' : ''}`} />
            </button>
          </div>

        </div>

        {/* RODAPÉ: SAIR */}
        <div className="p-6 border-t border-white/5 bg-slate-950/50">
          <button onClick={() => auth.signOut()} className="w-full flex items-center justify-center gap-2 p-3 text-red-500 font-black text-xs uppercase tracking-[0.2em] border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all">
            <LogOut size={16} /> Sair da Conta
          </button>
          <div className="mt-4 flex justify-center items-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            <ShieldCheck size={12} /> Ambiente Seguro
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;