import React from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { 
  LogOut, Settings, Sparkles, Eye, EyeOff, Menu 
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
  // Pega o primeiro nome para ser mais íntimo
  const rawName = userMeta?.nickname || userDisplayName || 'Investidor';
  const firstName = rawName.split(' ')[0]; 

  return (
    <header className="fixed top-0 left-0 w-full z-[100] bg-[#020617]/95 backdrop-blur-md border-b border-slate-800 h-16 flex items-center px-4 md:px-8 shadow-2xl transition-all duration-300">
      
      {/* LADO ESQUERDO: LOGO E TÍTULO */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('home')}>
          <img src="/icon.png" alt="Logo" className="w-8 h-8 md:w-9 md:h-9 rounded-lg shadow-lg group-hover:scale-105 transition-transform" />
          
          {/* Título Principal (Oculto em celular se estiver no Gerenciador para dar espaço) */}
          <h1 className={`text-sm md:text-xl font-black text-sky-400 tracking-tighter uppercase whitespace-nowrap ${currentTool === 'manager' ? 'hidden sm:block' : 'block'}`}>
            Finanças Pro
          </h1>
        </div>

        {/* TÍTULO DOURADO DO GERENCIADOR */}
        {currentTool === 'manager' && (
          <div className="flex flex-col items-start border-l border-slate-700 pl-3 ml-2 md:pl-4 md:ml-4 leading-none animate-in fade-in slide-in-from-left-2 duration-500">
            <span className="text-[11px] md:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 tracking-tight uppercase whitespace-nowrap drop-shadow-sm">
              Gerenciador Financeiro
            </span>
          </div>
        )}
      </div>

      {/* LADO DIREITO */}
      <div className="flex items-center justify-end gap-2 md:gap-4 flex-1">
        
        {/* DESLOGADO */}
        {!isAuthenticated && (
          <button 
            onClick={() => onNavigate('login')} 
            className="text-[11px] md:text-xs font-black text-white bg-gradient-to-r from-sky-600 to-indigo-600 rounded-lg px-4 py-2 uppercase tracking-tight hover:shadow-lg hover:shadow-sky-500/30 transition-all active:scale-95"
          >
            Entrar
          </button>
        )}

        {/* LOGADO */}
        {isAuthenticated && (
          <>
            {/* DESKTOP VIEW */}
            <div className="hidden xl:flex items-center gap-3 mr-2 text-sm border-r border-slate-800 pr-4">
              <div className="flex flex-col text-right leading-none">
                <span className="text-slate-500 text-[9px] font-black uppercase mb-1">Bem vindo de volta,</span>
                <span className="text-[12px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 uppercase tracking-tight">
                  {rawName}
                </span>
              </div>
              <button onClick={onTogglePrivacy} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                {isPrivacyMode ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>

            {/* MOBILE VIEW - AQUI ESTÁ A "EMOÇÃO" */}
            <div className="xl:hidden flex flex-col items-end mr-2 leading-none animate-in fade-in duration-700">
               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Olá,</span>
               <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 tracking-tight drop-shadow-sm">
                 {firstName}! 👋
               </span>
            </div>

            {/* BOTÕES DE AÇÃO (Desktop) */}
            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => onNavigate('chat')} className="flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase transition-all bg-slate-800 border-slate-800 text-sky-400 hover:bg-slate-700">
                <Sparkles size={14} /> Nexus IA
              </button>
              <button onClick={() => onNavigate('settings')} className="p-2 text-slate-400 hover:text-white transition-colors"><Settings size={18} /></button>
              <button onClick={onLogout} className="p-2 text-slate-500 hover:text-red-400 transition-colors"><LogOut size={18} /></button>
            </div>
          </>
        )}

        {/* MENU HAMBÚRGUER */}
        {!isNative && (
          <div className="lg:hidden flex items-center gap-2">
            <button 
              onClick={onOpenMobileMenu} 
              className="relative text-yellow-50 p-2 rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 active:scale-95 transition-all shadow-lg shadow-black/20" 
              aria-label="Menu"
            >
              <Menu size={20} />
              {/* Pontinho de notificação (opcional, para charme) */}
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]"></span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;