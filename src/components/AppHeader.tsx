import React, { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { LogOut, Settings, Eye, EyeOff, Menu, Globe, ArrowLeft, Crown, Bell, Smartphone } from 'lucide-react';
import { useNavigation } from '../hooks/useNavigation';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEntitlement } from '../hooks/useEntitlement';
import type { UserMeta } from '../types';
import { useNotifications } from '../contexts/NotificationContext';

interface AppHeaderProps {
  isAuthenticated: boolean;
  userMeta: UserMeta | null | undefined;
  userDisplayName?: string;
  isPrivacyMode: boolean;
  onTogglePrivacy: () => void;
  onLogout: () => void;
  onOpenMobileMenu: () => void;
  isNotificationsOpen: boolean;
  onOpenNotifications: (open: boolean) => void;
  showDesktopNav?: boolean;
}

const MAIN_ROUTES = ['/app/central', '/app/controla', '/app/dashboard', '/app/mais', '/app/explorar', '/app/agenda', '/'];

const AppHeader: React.FC<AppHeaderProps> = ({
  isAuthenticated,
  userMeta,
  userDisplayName,
  isPrivacyMode,
  onTogglePrivacy,
  onLogout,
  onOpenMobileMenu,
  onOpenNotifications,
  showDesktopNav = false,
}) => {
  const isNative = Capacitor.isNativePlatform();
  const { currentTool, handleNavigate } = useNavigation();
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const isMainRoute = MAIN_ROUTES.includes(location.pathname);

  const { effectiveTier } = useEntitlement();
  const hasProAccess = effectiveTier !== 'free';
  const hasPremiumAccess = effectiveTier === 'premium';
  const isProOnly = hasProAccess && !hasPremiumAccess;

  const handleSmartBack = useCallback(() => {
    // Se houver histórico de navegação na sessão atual, volta. 
    // Senão, vai para a home adequada ao estado de autenticação.
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(isAuthenticated ? '/app/central' : '/');
    }
  }, [navigate, isAuthenticated]);

  // @ts-ignore - nickname pode existir no objeto vindo do firestore
  const rawName = userMeta?.nickname || userDisplayName || 'Investidor';
  const firstName = rawName.split(' ')[0]; 

  const handleOpenWebsite = async () => {
	 await Browser.open({ url: 'https://www.financasproinvest.com.br', windowName: '_system' });
  };

  return (
    <header className={`fixed top-0 left-0 w-full z-[100] bg-white/70 backdrop-blur-xl border-b border-slate-200/50 h-[calc(4rem+env(safe-area-inset-top))] shadow-soft transition-all duration-300 font-sans ${showDesktopNav ? 'lg:pl-4' : ''}`}>
      <div className="h-[env(safe-area-inset-top)]" aria-hidden="true" />
      <div className="flex items-center h-16 px-4 md:px-8">
      
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {!isMainRoute ? (
          <button 
            onClick={handleSmartBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all font-black text-[10px] uppercase tracking-widest border border-slate-200 active:scale-95"
          >
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </button>
        ) : (
          <div className="flex items-center gap-3.5 cursor-pointer group" onClick={() => handleNavigate('central')}>
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200/30 group-hover:shadow-emerald-300/50 group-hover:scale-105 transition-all duration-300 overflow-hidden ring-1 ring-white/20">
              <div className="absolute inset-0 bg-gradient-to-tl from-white/0 via-white/5 to-white/20" />
              <img src="/assets/images/brand/logo.png" alt="Finanças Pro Invest" className="w-full h-full object-cover relative z-10" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm md:text-base font-black text-slate-950 tracking-tight leading-none">
                  Finanças Pro
                </span>
                <span className="text-sm md:text-base font-black text-emerald-600 tracking-tight leading-none">
                  Invest
                </span>
              </div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-none mt-1">
                Controle financeiro inteligente
              </span>
            </div>
          </div>
        )}

            {currentTool === 'manager' && isMainRoute && (
              <div className={`max-lg:hidden flex flex-col items-start ml-8 md:ml-12 lg:ml-16 mr-2 leading-none animate-in fade-in slide-in-from-right-2 duration-500 ${showDesktopNav ? 'lg:hidden' : ''}`}>
                <span className="text-[11px] md:text-sm font-black text-slate-950 tracking-tight uppercase whitespace-nowrap">
                  Controla
                </span>

                {isNative && (
                  <button
                    onClick={handleOpenWebsite}
                    className="mt-1 flex items-center gap-1 text-slate-500 hover:text-slate-900 font-bold text-[9px] uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100"
                  >
                    <Globe size={10} className="text-emerald-600" /> Abrir Site
                  </button>
                )}
              </div>
            )}
        
      </div>

      <div className="flex items-center justify-end gap-2 md:gap-4 flex-1">
        
        {isAuthenticated && (
            <button 
                onClick={() => onOpenNotifications(true)}
                className="relative p-2.5 text-slate-500 hover:text-slate-950 hover:bg-slate-50 rounded-xl transition-all active:scale-95"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in duration-300">
                        {unreadCount}
                    </span>
                )}
            </button>
        )}

        {!isAuthenticated && (
          <div className="flex items-center gap-2">
            {!isNative && (
              <button
                onClick={() => handleNavigate('download')}
                className="hidden sm:inline-flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-3.5 py-2.5 uppercase tracking-wider transition-all active:scale-95"
              >
                <Smartphone size={14} className="text-emerald-600" />
                <span>Baixar App</span>
              </button>
            )}
            <button 
              onClick={() => handleNavigate('login')} 
              className="text-[10px] md:text-xs font-black text-white bg-slate-950 hover:bg-slate-800 rounded-xl px-5 md:px-6 py-2.5 uppercase tracking-wider shadow-floating active:scale-95 transition-all"
            >
              Entrar
            </button>
          </div>
        )}

        {isAuthenticated && (
          <>
            {hasPremiumAccess && (
              <div 
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 mr-4 animate-in fade-in zoom-in duration-300 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                role="status"
                aria-label="Plano Premium"
              >
                <Crown size={12} className="fill-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-wider">Premium</span>
              </div>
            )}
            {isProOnly && (
              <div 
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 mr-4 animate-in fade-in zoom-in duration-300"
                role="status"
                aria-label="Plano Pro"
              >
                <Crown size={12} className="text-sky-600" />
                <span className="text-[10px] font-black uppercase tracking-wider">Pro</span>
              </div>
            )}

            <div className="hidden xl:flex items-center gap-3 mr-2 text-sm border-r border-slate-100 pr-4">
              <div className="flex flex-col text-right leading-none">
                <span className="text-slate-500 text-[9px] font-bold uppercase mb-1 tracking-wider">Seja bem vindo,</span>
                <span className="text-[12px] font-black text-slate-950 uppercase tracking-tight">
                  {rawName}!
                </span>
              </div>
              <button onClick={onTogglePrivacy} className="p-2 bg-slate-50 rounded-xl text-slate-500 hover:text-slate-900 transition-colors border border-slate-100">
                {isPrivacyMode ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>

            {hasPremiumAccess && (
              <div 
                className="xl:hidden flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-600 text-white shadow-lg shadow-emerald-200/50 mr-2"
                role="status"
                aria-label="Plano Premium"
              >
                <Crown size={12} />
              </div>
            )}
            {isProOnly && (
              <div 
                className="xl:hidden flex items-center justify-center w-6 h-6 rounded-lg bg-sky-600 text-white shadow-lg shadow-sky-200/50 mr-2"
                role="status"
                aria-label="Plano Pro"
              >
                <Crown size={12} />
              </div>
            )}

            <div className="xl:hidden flex flex-col items-end text-right mr-1 leading-none animate-in fade-in">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Seja bem vindo,</span>
              <span className="text-xs font-black text-emerald-600 tracking-tight">
                {firstName}!
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => handleNavigate('settings')} className="p-2 text-slate-500 hover:text-slate-900 transition-colors"><Settings size={18} /></button>
              <button onClick={onLogout} className="p-2 text-slate-500 hover:text-red-500 transition-colors"><LogOut size={18} /></button>
            </div>

            <div className="lg:hidden flex items-center gap-2">
              <button
                onClick={onOpenMobileMenu}
                className="relative text-slate-600 p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm active:scale-95 transition-all"
                aria-label="Menu"
              >
                <Menu size={20} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
    </header>
  );
};

export default AppHeader;
