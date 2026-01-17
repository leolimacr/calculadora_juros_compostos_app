import { useCallback } from 'react';

export const useGamification = () => {
  const trackAction = useCallback((action: string, label?: string) => {
    // Lógica silenciosa para não quebrar o build se não tiver backend pronto
    // console.log('Gamification:', action, label);
  }, []);

  return { trackAction };
};
