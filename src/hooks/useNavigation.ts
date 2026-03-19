import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useLocation } from 'react-router-dom';

export const useNavigation = () => {
  const isNative = Capacitor.isNativePlatform();
  const location = useLocation();

  const getToolFromPath = () => {
    if (location.pathname.includes('/curso')) return null;
    const path = location.pathname.replace('/', '');
    return path || 'home';
  };

  const [currentTool, setCurrentTool] = useState<string>(() => {
    if (isNative) return 'manager';
    const next = getToolFromPath();
    return next ?? 'home';
  });

  const [homeKey, setHomeKey] = useState(0);

  const navigateTo = (tool: string) => {
    if (tool === 'home') setHomeKey(prev => prev + 1);
    setCurrentTool(tool);
    window.scrollTo(0, 0);
    if (!isNative) {
      const path = tool === 'home' ? '/' : `/${tool}`;
      window.history.pushState({}, '', path);
    }
  };

  // Mantém `currentTool` sincronizado com a URL.
  // Isso é crucial para navegações feitas por botões/links que mudam `location.pathname`.
  useEffect(() => {
    if (isNative) return;
    const nextTool = getToolFromPath();
    if (nextTool) setCurrentTool(nextTool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isNative]);

  return { currentTool, homeKey, navigateTo };
};
