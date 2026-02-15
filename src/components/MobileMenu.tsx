import React from 'react';
import { Browser } from '@capacitor/browser';
import { auth } from '../firebase';
import { 
  LogOut, Settings, User, Eye, EyeOff, Crown, Globe, ChevronRight 
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
  isAuthenticated: boolean; // Nova prop
  userDisplayName?: string; // Nova prop
  userMeta?: UserMetaInfo | null; // Nova prop
  isPrivacyMode: boolean; // Nova prop
  onTogglePrivacy: () => void; // Nova prop
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

  const openPricing = async () => {
    await Browser.open({ url: 'https://www.financasproinvest.com.br/pricing', windowName: '_system' });
    onClose();
  };

  const openSite = async () => {
    await Browser.open({ url: 'https://www.financasproinvest.com.br', windowName: '_system' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Overlay Escuro */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Painel Lateral */}
      <div className="relative w-[85%] max-w-[320px] bg-[#0f172a] h-full shadow-2xl border-l border-slate-800 animate-in slide-in-from-right duration-300 flex flex-col">
        
        {/* CABEÇALHO DO MENU: PERFIL */}
        <div className="p-6 bg-slate-900 border-b border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Painel de Controle</h2>
            <button onClick={onClose} className="text-slate-400 p-1 hover:text-white transition-colors">✕</button>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-sky-900/20">
                {nickname.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-lg truncate leading-tight">{nickname}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wide ${isPro ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-700 text-slate-400'}`}>
                    {isPro ? 'Membro Pro' : 'Gratuito'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
             <div className="text-center py-2">
                <p className="text-slate-400 text-sm mb-3">Faça login para salvar seus dados.</p>
                <button 
                  onClick={() => { onNavigate('login'); onClose(); }}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
                >
                  ENTRAR AGORA
                </button>
             </div>
          )}
        </div>
        
        {/* LISTA DE OPÇÕES */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          
          {isAuthenticated && (
            <>
              {/* Toggle de Privacidade (Igual Desktop) */}
              <button 
                onClick={onTogglePrivacy} 
                className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-all"
              >
                <div className="flex items-center gap-3">
                  {isPrivacyMode ? <EyeOff size={20} className="text-sky-400"/> : <Eye size={20} className="text-emerald-400"/>}
                  <span className="font-semibold text-sm">Ocultar Valores</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${isPrivacyMode ? 'bg-sky-600' : 'bg-slate-600'}`}>
                  <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isPrivacyMode ? 'translate-x-5' : ''}`} />
                </div>
              </button>

              <div className="h-px bg-slate-800 my-2" />

              <button onClick={() => { onNavigate('perfil'); onClose(); }} className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-slate-800/50 text-slate-200 transition-colors group">
                <div className="flex items-center gap-3">
                  <User size={20} className="text-slate-400 group-hover:text-white"/>
                  <span className="font-semibold">Meu Perfil</span>
                </div>
                <ChevronRight size={16} className="text-slate-600"/>
              </button>
              
              <button onClick={() => { onNavigate('settings'); onClose(); }} className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-slate-800/50 text-slate-200 transition-colors group">
                <div className="flex items-center gap-3">
                  <Settings size={20} className="text-slate-400 group-hover:text-white"/>
                  <span className="font-semibold">Configurações</span>
                </div>
                <ChevronRight size={16} className="text-slate-600"/>
              </button>
            </>
          )}

          {/* BOTÃO PLANOS DE ASSINATURA (Estilo Dourado/Premium) */}
          <button onClick={openPricing} className="w-full mt-4 relative overflow-hidden p-4 rounded-xl bg-gradient-to-r from-emerald-900/40 to-slate-900 border border-emerald-500/30 group active:scale-95 transition-all">
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                  <Crown size={20} />
                </div>
                <div className="text-left">
                  <span className="block text-emerald-400 font-black text-xs uppercase tracking-wider">Upgrade</span>
                  <span className="block text-white font-bold text-sm">Seja Membro Pro</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-emerald-500/50"/>
            </div>
          </button>

          <button onClick={openSite} className="w-full flex items-center gap-3 p-4 rounded-xl text-slate-400 hover:text-white text-sm font-semibold transition-colors mt-2">
            <Globe size={18} /> Acessar Site Oficial
          </button>
        </div>

        {/* RODAPÉ: LOGOUT */}
        {isAuthenticated && (
          <div className="p-6 border-t border-slate-800 bg-slate-900/50">
            <button onClick={() => auth.signOut()} className="w-full flex items-center justify-center gap-2 p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl font-bold transition-all">
              <LogOut size={18} /> Sair do App
            </button>
            <p className="text-center text-slate-600 text-[10px] font-mono mt-4 uppercase tracking-widest">
              Finanças Pro Invest v1.7.0
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMenu;