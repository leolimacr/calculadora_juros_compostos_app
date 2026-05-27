import { useState } from 'react';
import { navigationItems } from '../../../config/navigation.config';

export const useNavigationController = (initialId = 'home') => {
  const [activeItemId, setActiveItemId] = useState(initialId);

  const navigateTo = (itemId: string) => {
    const item = navigationItems.find((nav) => nav.id === itemId);

    // Validação de existência e estado de disabled
    if (!item) {
      console.warn(`Navigation item "${itemId}" not found.`);
      return;
    }

    if (item.disabled) {
      console.info(`Navigation item "${itemId}" is disabled.`);
      return;
    }

    setActiveItemId(itemId);
  };

  return {
    activeItemId,
    navigateTo,
  };
};
