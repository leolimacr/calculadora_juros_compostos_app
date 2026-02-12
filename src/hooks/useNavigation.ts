import { useState } from 'react';
import { Capacitor } from '@capacitor/core';

export const useNavigation = () => {
  const isNative = Capacitor.isNativePlatform();

  const [currentTool, setCurrentTool] = useState<string>(() => {
    if (isNative) return 'manager';
    const path = window.location.pathname.replace('/', '');
    return path || 'home';
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

  return { currentTool, homeKey, navigateTo };
};
