import React, { useCallback, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { LogOut, Settings, Sparkles, Eye, EyeOff, Menu, Globe, CreditCard, Compass, ArrowLeft, Crown, Bell } from 'lucide-react';
import { useNavigation } from '../hooks/useNavigation';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserMeta } from '../types';
import { useNotifications } from '../contexts/NotificationContext';

interface AppHeaderProps {
  isAuthenticated: boolean;
  userMeta: UserMeta | null | undefined;
  userDisplayName?: string;
  isPrivacyMode: boolean;
  onTogglePrivacy: () => void;
  onLogout: () => void;
  onOpenMobileMenu: () => void;
  isPro?: boolean;
  isPremium?: boolean;
  isNotificationsOpen: boolean;
  onOpenNotifications: (open: boolean) => void;
}

const MAIN_ROUTES = ['/app/home', '/app/controla', '/app/central', '/app/mais', '/app/explorar', '/'];

const AppHeader: React.FC<AppHeaderProps> = ({
  isAuthenticated,
  userMeta,
  userDisplayName,
  isPrivacyMode,
  onTogglePrivacy,
  onLogout,
  onOpenMobileMenu,
  isPro,
  isPremium,
  isNotificationsOpen,
  onOpenNotifications,
}) => {
  const isNative = Capacitor.isNativePlatform();
  const { currentTool, handleNavigate } = useNavigation();
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  const isMainRoute = useMemo(() => MAIN_ROUTES.includes(location.pathname), [location.pathname]);

  const isStrictlyPro = isAuthenticated && isPro && !isPremium;

  const handleSmartBack = useCallback(() => {
    // Se houver histórico de navegação na sessão atual, volta. 
    // Senão, vai para a home adequada ao estado de autenticação.
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(isAuthenticated ? '/app/home' : '/');
    }
  }, [navigate, isAuthenticated]);

  // @ts-ignore - nickname pode existir no objeto vindo do firestore
  const rawName = userMeta?.nickname || userDisplayName || 'Investidor';
  const firstName = rawName.split(' ')[0]; 

  const handleOpenWebsite = async () => {
	 await Browser.open({ url: 'https://www.financasproinvest.com.br', windowName: '_system' });
  };

  return (
    <header className="fixed top-0 left-0 w-full z-[100] bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center px-4 md:px-8 shadow-sm transition-all duration-300">
      
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {!isMainRoute ? (
          <button 
            onClick={handleSmartBack}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-100/50 hover:bg-sky-100 text-sky-700 transition-all font-black text-[10px] uppercase tracking-widest border border-sky-200/50 active:scale-95"
          >
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={() => handleNavigate('home')}>
            <img src="/icon.png" alt="Logo" className="w-8 h-8 md:w-9 md:h-9 rounded-lg shadow-lg" />
            <h1 className="text-sm md:text-xl font-black text-sky-600 tracking-tighter uppercase whitespace-nowrap">
              Finanças Pro Invest
            </h1>		  
          </div>
        )}

            {currentTool === 'manager' && isMainRoute && (
              <div className="flex flex-col items-start ml-8 md:ml-12 lg:ml-16 mr-2 leading-none animate-in fade-in slide-in-from-right-2 duration-500">
                <span className="text-[11px] md:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 tracking-tight uppercase whitespace-nowrap drop-shadow-sm">
                  Controla
                </span>

                {isNative && (
                  <button
                    onClick={handleOpenWebsite}
                    className="mt-1 flex items-center gap-1 text-slate-500 hover:text-slate-900 font-bold text-[9px] uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md border border-slate-200"
                  >
                    <Globe size={10} className="text-sky-500" /> Abrir Site
                  </button>
                )}
              </div>
            )}
        
      </div>

      <div className="flex items-center justify-end gap-2 md:gap-4 flex-1">
        
        {isAuthenticated && (
            <button 
                onClick={() => onOpenNotifications(true)}
                className="relative p-2.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all active:scale-95"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in duration-300">
                        {unreadCount}
                    </span>
                )}
            </button>
        )}

        {!isAuthenticated && (
          <button 
            onClick={() => handleNavigate('login')} 
            className="text-[10px] md:text-xs font-black text-white bg-slate-900 rounded-lg px-4 py-2 uppercase tracking-tight shadow-lg shadow-slate-900/20 active:scale-95 transition-all"
          >
            Entrar
          </button>
        )}

        {isAuthenticated && (
          <>
            {isStrictlyPro && (
              <div 
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 mr-4 animate-in fade-in zoom-in duration-300"
                role="status"
                aria-label="Plano Pro ativo"
              >
                <Crown size={12} className="fill-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-wider">Pro Ativo</span>
              </div>
            )}

            <div className="hidden xl:flex items-center gap-3 mr-2 text-sm border-r border-slate-200 pr-4">
              <div className="flex flex-col text-right leading-none">
				<span className="text-slate-500 text-[11px] font-black uppercase mb-1">Seja bem-vindo(a),</span>
                <span className="text-[12px] font-bold text-emerald-600 uppercase tracking-tight">
                  {rawName}!
                </span>
              </div>
              <button onClick={onTogglePrivacy} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors">
                {isPrivacyMode ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>

            {isStrictlyPro && (
              <div 
                className="xl:hidden flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-200/50 mr-2"
                role="status"
                aria-label="Plano Pro ativo"
              >
                <Crown size={12} />
              </div>
            )}

            <div className="xl:hidden flex flex-col items-end text-right mr-1 leading-none animate-in fade-in">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Seja</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">bem vindo(a),</span>
              <span className="text-xs font-black text-emerald-600 tracking-tight">
                {firstName}!
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => handleNavigate('settings')} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><Settings size={18} /></button>
              <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><LogOut size={18} /></button>
            </div>

            {!isNative && (
              <div className="lg:hidden flex items-center gap-2">
                <button 
                  onClick={onOpenMobileMenu} 
                  className="relative text-slate-600 p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm active:scale-95 transition-all" 
                  aria-label="Menu"
                >
                  <Menu size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
