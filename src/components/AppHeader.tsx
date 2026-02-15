import React from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { 
  LogOut, Settings, Sparkles, Eye, EyeOff, Globe, Menu 
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
      
      {/* LADO ESQUERDO: LOGO E TÍTULO DA FERRAMENTA */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
          <img src="/icon.png" alt="Logo" className="w-8 h-8 md:w-9 md:h-9 rounded-lg shadow-lg" />
          <h1 className="hidden sm:block text-sm md:text-xl font-black text-sky-400 tracking-tighter uppercase whitespace-nowrap">
            Finanças Pro Invest
          </h1>
        </div>

        {/* EXIBE "GERENCIADOR FINANCEIRO" EM DOURADO SE ESTIVER NA FERRAMENTA */}
        {currentTool === 'manager' && (
          <div className="flex flex-col items-start border-l border-slate-700 pl-2 ml-1 md:pl-4 md:ml-4 leading-none">
            <span className="text-[10px] md:text-lg font-black text-yellow-400 tracking-tight uppercase whitespace-nowrap">
              Gerenciador Financeiro
            </span>
            {isNative && (
              <button onClick={handleOpenWebsite} className="flex items-center gap-1 text-slate-400 hover:text-white font-black text-[8px] uppercase tracking-widest mt-1 transition-colors">
                <Globe size={10} /> Acessar Site
              </button>
            )}
          </div>
        )}
      </div>

      {/* LADO DIREITO: BOTÕES E USUÁRIO */}
      <div className="flex items-center justify-end gap-2 md:gap-4 flex-1">
        
        {/* SE NÃO ESTIVER LOGADO: MOSTRA BOTÃO ENTRAR */}
        {!isAuthenticated && (
          <button 
            onClick={() => onNavigate('login')} 
            className="text-[11px] md:text-xs font-black text-white bg-sky-600 rounded-lg px-4 py-2 uppercase tracking-tighter hover:bg-sky-700 transition shadow-lg active:scale-95"
          >
            Entrar
          </button>
        )}

        {/* SE ESTIVER LOGADO: MOSTRA NOME, PRIVACIDADE E FERRAMENTAS */}
        {isAuthenticated && (
          <>
            <div className="hidden xl:flex items-center gap-3 mr-2 text-sm border-r border-slate-800 pr-4">
              <div className="flex flex-col text-right leading-none">
                <span className="text-slate-500 text-[9px] font-black uppercase mb-1">Seja Bem Vindo,</span>
                <span className="text-[12px] font-bold text-white uppercase tracking-tight">
                  {nickname}
                </span>
              </div>
              <button 
                onClick={onTogglePrivacy} 
                className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                title="Modo Privacidade"
              >
                {isPrivacyMode ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => onNavigate('chat')} 
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase transition-all ${currentTool === 'chat' ? 'bg-sky-600 text-white shadow-lg' : 'bg-slate-800 border-slate-800 text-sky-400 hover:bg-slate-700'}`}
              >
                <Sparkles size={14} /> Nexus IA
              </button>
              
              <button 
                onClick={() => onNavigate('settings')} 
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Configurações"
              >
                <Settings size={18} />
              </button>

              <button 
                onClick={onLogout} 
                className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          </>
        )}

        {/* MENU MOBILE (HAMBÚRGUER) */}
        {!isNative && (
          <div className="lg:hidden flex items-center gap-2">
            <button 
              onClick={onOpenMobileMenu} 
              className="text-slate-300 p-2 rounded-full border border-slate-700 bg-slate-900/60 active:scale-95 transition-all" 
              aria-label="Menu"
            >
              <Menu size={22} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;