import React from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { 
  LogOut, Settings, Sparkles, Eye, EyeOff, Menu, Globe 
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
  const rawName = userMeta?.nickname || userDisplayName || 'Investidor';
  const firstName = rawName.split(' ')[0]; 

  // CORREÇÃO CRÍTICA: Força abrir no navegador do sistema (Chrome/Safari)
  // Isso mantém o login do usuário.
  const handleOpenWebsite = async () => {
    await Browser.open({ 
      url: 'https://www.financasproinvest.com.br', 
      windowName: '_system' // _system é o segredo para sair da WebView
    });
  };

  return (
    <header className="fixed top-0 left-0 w-full z-[100] bg-[#020617]/95 backdrop-blur-md border-b border-slate-800 h-16 flex items-center px-4 md:px-8 shadow-2xl transition-all duration-300">
      
      {/* LADO ESQUERDO: LOGO E TÍTULO */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={() => onNavigate('home')}>
          <img src="/icon.png" alt="Logo" className="w-8 h-8 md:w-9 md:h-9 rounded-lg shadow-lg" />
          
          {/* TÍTULO PRINCIPAL:
              Se estiver no celular e na tela 'manager', ocultamos o nome do App
              para tentar mostrar o título dourado. Mas se estiver deslogado,
              priorizamos mostrar o nome do app. */}
          <h1 className={`text-sm md:text-xl font-black text-sky-400 tracking-tighter uppercase whitespace-nowrap 
            ${currentTool === 'manager' && isAuthenticated ? 'hidden sm:block' : 'block'}`}>
            Finanças Pro
          </h1>
        </div>

        {/* TÍTULO DOURADO DO GERENCIADOR */}
        {currentTool === 'manager' && (
          <div className={`flex flex-col items-start border-l border-slate-700 pl-3 ml-2 md:pl-4 md:ml-4 leading-none 
            ${!isAuthenticated ? 'hidden sm:flex' : 'flex'} 
            animate-in fade-in slide-in-from-left-2 duration-500`}>
            
            {/* Se estiver deslogado, ESCONDE no mobile (hidden sm:flex) para não quebrar o layout com o botão Entrar */}
            <span className="text-[11px] md:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 tracking-tight uppercase whitespace-nowrap drop-shadow-sm">
              Gerenciador Financeiro
            </span>
            
            {/* Link para o site (só aparece se for App Nativo) */}
            {isNative && (
              <button onClick={handleOpenWebsite} className="flex items-center gap-1 text-slate-400 hover:text-white font-black text-[8px] uppercase tracking-widest mt-1 transition-colors">
                <Globe size={10} /> Acessar Site
              </button>
            )}
          </div>
        )}
      </div>

      {/* LADO DIREITO */}
      <div className="flex items-center justify-end gap-2 md:gap-4 flex-1">
        
        {/* DESLOGADO (Botão Entrar) */}
        {!isAuthenticated && (
          <button 
            onClick={() => onNavigate('login')} 
            className="text-[10px] md:text-xs font-black text-white bg-gradient-to-r from-sky-600 to-indigo-600 rounded-lg px-3 py-2 md:px-4 md:py-2 uppercase tracking-tight hover:shadow-lg hover:shadow-sky-500/30 transition-all active:scale-95 whitespace-nowrap"
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
                <span className="text-slate-500 text-[9px] font-black uppercase mb-1">Bem vindo,</span>
                <span className="text-[12px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 uppercase tracking-tight">
                  {rawName}
                </span>
              </div>
              <button onClick={onTogglePrivacy} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                {isPrivacyMode ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>

            {/* MOBILE VIEW - Saudação Curta */}
            <div className="xl:hidden flex flex-col items-end mr-1 leading-none animate-in fade-in duration-700">
               <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Olá,</span>
               <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 tracking-tight drop-shadow-sm">
                 {firstName}!
               </span>
            </div>

            {/* BOTÕES DE AÇÃO (Desktop Only) */}
            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => onNavigate('chat')} className="flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase transition-all bg-slate-800 border-slate-800 text-sky-400 hover:bg-slate-700">
                <Sparkles size={14} /> Nexus IA
              </button>
              <button onClick={() => onNavigate('settings')} className="p-2 text-slate-400 hover:text-white transition-colors"><Settings size={18} /></button>
              <button onClick={onLogout} className="p-2 text-slate-500 hover:text-red-400 transition-colors"><LogOut size={18} /></button>
            </div>
          </>
        )}

        {/* MENU HAMBÚRGUER (Aparece no Mobile Web e App) */}
        {!isNative && (
          <div className="lg:hidden flex items-center gap-2">
            <button 
              onClick={onOpenMobileMenu} 
              className="relative text-yellow-50 p-2 rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 active:scale-95 transition-all shadow-lg shadow-black/20" 
              aria-label="Menu"
            >
              <Menu size={20} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;