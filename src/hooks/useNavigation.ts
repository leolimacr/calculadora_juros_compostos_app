import { useEffect, useState, useCallback, useMemo, useTransition } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const TOOL_ROUTES: Record<string, string> = {
  home: '/app/home',
  manager: '/app/controla',
  central: '/app/central',
  chat: '/app/ia',
  explorar: '/app/explorar',
  settings: '/app/mais',
  pricing: '/app/mais/pricing',
  'minhas-dividas': '/app/minhas-dividas',
  passivos: '/app/passivos',
  investimentos: '/app/investimentos',
  metas: '/app/metas',
  login: '/login',
  register: '/register',
  termos: '/termos',
  privacidade: '/privacidade',
  'tool-fire': '/app/ferramentas/fire',
  'tool-juros': '/app/ferramentas/juros',
  'tool-inflacao': '/app/ferramentas/inflacao',
  'tool-alugar': '/app/ferramentas/alugar',
  'tool-dividas': '/app/ferramentas/dividas',
  'tool-dividendos': '/app/ferramentas/dividendos',
  'tool-buy-cash-or-installments': '/app/ferramentas/compra-avista-parcelado',
  'article-2026': '/artigos/investir-2026',
};

export const useNavigation = () => {
  const isNative = Capacitor.isNativePlatform();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [, startTransition] = useTransition();

  const [homeKey, setHomeKey] = useState(0);
  const [navigationReady, setNavigationReady] = useState(!isNative);
  const [postAuthRedirect, setPostAuthRedirect] = useState<string | null>(null);

  const currentTool = useMemo(() => {
    // Condicionante 1: Enquanto navigationReady for false no Native, retorna 'home'
    if (isNative && !navigationReady) return 'home';

    const path = location.pathname;
    
    // Atalho para home
    if (path === '/' || path === '/app/home') return 'home';
    
    // Inverte o mapeamento TOOL_ROUTES para encontrar a chave a partir do path
    // Ordenamos por tamanho de string decrescente para evitar que '/app/mais' 
    // capture '/app/mais/pricing' indevidamente se usarmos startsWith simples
    const sortedEntries = Object.entries(TOOL_ROUTES).sort((a, b) => b[1].length - a[1].length);
    const entry = sortedEntries.find(([_, route]) => path.startsWith(route));
    
    if (entry) return entry[0];

    // Fallback para rotas de curso
    if (path.includes('/curso')) return 'home';

    return 'home';
  }, [location.pathname, navigationReady, isNative]);

  const navigateTo = useCallback((tool: string, state?: any) => {
    if (tool === 'home') setHomeKey(prev => prev + 1);
    
    const path = TOOL_ROUTES[tool] || (tool === 'home' ? '/' : `/${tool}`);
    
    window.scrollTo(0, 0);
    startTransition(() => {
      navigate(path, { state });
    });

    // Persistência no Capacitor
    if (isNative && user?.uid) {
        const key = `app_home_${user.uid}`;
        Preferences.set({ key, value: tool === 'central' ? 'central' : 'home' });
    }
  }, [navigate, isNative, user?.uid, startTransition]);

  const resetNavigation = useCallback(() => {
    setPostAuthRedirect(null);
    navigate('/');
  }, [navigate]);

  const shouldRememberAuthReturn = useCallback((targetTool: string) => {
    if (targetTool === 'login' || targetTool === 'register') {
      if (currentTool !== 'login' && currentTool !== 'register' && currentTool.startsWith('tool-')) {
        return true;
      }
    }
    return false;
  }, [currentTool]);

  const handleNavigate = useCallback((tool: string, state?: any) => {
    if (shouldRememberAuthReturn(tool)) {
      setPostAuthRedirect(currentTool);
    }

    // Se estiver em uma rota de curso e navegar para algo fora das rotas de curso,
    // o navigateTo já cuida de mudar o path.
    navigateTo(tool, state);
  }, [shouldRememberAuthReturn, currentTool, navigateTo]);

  const handleAuthSuccess = useCallback(() => {
    const destination = postAuthRedirect || 'home';
    setPostAuthRedirect(null);
    navigateTo(destination);
  }, [postAuthRedirect, navigateTo]);

  useEffect(() => {
    if (!isNative) {
      setNavigationReady(true);
      return;
    }

    let cancelled = false;

    const loadInitialTool = async () => {
      try {
        const key = user?.uid ? `app_home_${user.uid}` : 'app_home_guest';
        const { value } = await Preferences.get({ key });

        if (!cancelled) {
          const initialTool = value === 'central' ? 'central' : 'home';
          const initialPath = TOOL_ROUTES[initialTool] || '/app/home';
          
          // Se estiver na raiz no native, navega para a ferramenta salva
          if (location.pathname === '/' || location.pathname === '/index.html') {
              navigate(initialPath, { replace: true });
          }
          
          setNavigationReady(true);
        }
      } catch {
        if (!cancelled) {
          setNavigationReady(true);
        }
      }
    };

    loadInitialTool();

    return () => {
      cancelled = true;
    };
  }, [isNative, user?.uid, navigate]);

  return { 
    currentTool, 
    homeKey, 
    navigateTo, 
    handleNavigate, 
    handleAuthSuccess, 
    resetNavigation, 
    navigationReady 
  };
};
