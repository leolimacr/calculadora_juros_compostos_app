import React from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { 
  LogOut, Settings, Sparkles, Wallet, Eye, EyeOff, LayoutGrid, Globe 
} from 'lucide-react';
interface UserMetaInfo {
  nickname?: string;
  plan?: string;
  [key: string]: unknown;
}

interface AppHeaderProps {
  currentTool: string;
  isAuthenticated: boolean;
  userMeta: UserMetaInfo | null;
  userDisplayName?: string;
  userEmail?: string | null;
  isPrivacyMode: boolean;
  onTogglePrivacy: () => void;
  onNavigate: (tool: string) => void;
  onLogout: () => void;
  onOpenMobileMenu: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  currentTool,
  isAuthenticated,
  userMeta,
  userDisplayName,
  isPrivacyMode,
  onTogglePrivacy,
  onNavigate,
  onLogout,
  onOpenMobileMenu,
}) => {
  const isNative = Capacitor.isNativePlatform();
  const nickname = userMeta?.nickname || userDisplayName || 'Investidor';

  const handleOpenWebsite = async () => {
    await Browser.open({ url: 'https://www.financasproinvest.com.br', windowName: '_system' });
  };

  return (
    <header className="fixed top-0 left-0 w-full z-[100] bg-[#020617]/95 backdrop-blur-md border-b border-slate-800 h-16 flex items-center px-4 md:px-8 shadow-2xl">
      {/* LEFT: LOGO */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
          <img src="/icon.png" alt="Logo" className="w-8 h-8 md:w-9 md:h-9 rounded-lg shadow-lg" />
          <div className="flex flex-col leading-none">
            <h1 className="text-sm md:text-xl font-black text-sky-400 tracking-tighter uppercase whitespace-nowrap">Finanças Pro Invest</h1>
            {isNative && isAuthenticated && (
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest mt-1 truncate">Seja Bem Vindo, {nickname}!</span>
            )}
          </div>
        </div>
        {isNative && isAuthenticated && (
          <div className="flex flex-col items-start border-l border-slate-700 pl-3 ml-1 leading-none">
            <span className="text-[10px] font-black text-yellow-400 tracking-tight uppercase whitespace-nowrap">Gerenciador Financeiro</span>
            <button onClick={handleOpenWebsite} className="flex items-center gap-1 text-slate-400 hover:text-white font-black text-[8px] uppercase tracking-widest mt-1 transition-colors">
              <Globe size={10} /> Acessar o Site
            </button>
          </div>
        )}
        {currentTool === 'manager' && !isNative && (
          <div className="hidden lg:flex items-center border-l border-slate-700 pl-4 ml-4">
            <span className="text-lg font-black text-yellow-400 tracking-tight uppercase">Gerenciador Financeiro</span>
          </div>
        )}
      </div>

      {/* RIGHT: BUTTONS */}
      <div className="flex items-center justify-end gap-2 md:gap-4 flex-1">
        {!isNative && isAuthenticated && (
          <div className="hidden xl:flex items-center gap-3 mr-2 text-sm border-r border-slate-800 pr-4">
            <div className="flex flex-col text-right leading-none">
              <span className="text-slate-500 text-[9px] font-black uppercase mb-1">Seja Bem Vindo,</span>
              <span className="text-white font-bold text-xs">{nickname}!</span>
            </div>
            <button onClick={onTogglePrivacy} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
              {isPrivacyMode ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
        )}



        {!isNative && isAuthenticated && currentTool !== 'manager' && (
          <button onClick={() => onNavigate('manager')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 rounded-full font-black text-[10px] md:text-xs uppercase shadow-lg transition-all active:scale-95 hover:bg-emerald-600 hover:text-white">
            <Wallet size={14} className="shrink-0" /> 
            <span className="whitespace-nowrap">Ir Para GERENCIADOR FINANCEIRO</span>
          </button>
        )}

        {isAuthenticated && !isNative && (
          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => onNavigate('chat')} className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase transition-all ${currentTool === 'chat' ? 'bg-sky-600 text-white shadow-lg' : 'bg-slate-800 border-slate-800 text-sky-400'}`}>
              <Sparkles size={14} /> Nexus IA
            </button>
            <button onClick={() => onNavigate('settings')} className="p-2 text-slate-400 hover:text-white transition-colors"><Settings size={18} /></button>
            <button onClick={onLogout} className="text-slate-500 hover:text-red-400 ml-1"><LogOut size={18} /></button>
          </div>
        )}

        {!isAuthenticated && !isNative && (
          <div className="hidden md:flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
            <button onClick={() => onNavigate('login')} className="text-slate-400 hover:text-white transition-colors">Entrar</button>
            <button onClick={() => onNavigate('register')} className="bg-sky-600 text-white px-5 py-2 rounded-full hover:bg-sky-500 shadow-lg transition-all">Criar Conta</button>
          </div>
        )}

        {(!isNative || !isAuthenticated) && (
          <div className="lg:hidden">
            <button onClick={onOpenMobileMenu} className="text-slate-300 p-2"><LayoutGrid size={24}/></button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
