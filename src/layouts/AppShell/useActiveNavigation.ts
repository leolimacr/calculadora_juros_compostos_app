import { useState } from 'react';

export const useActiveNavigation = (initialId = 'home') => {
  const [activeItemId, setActiveItemId] = useState(initialId);

  return {
    activeItemId,
    setActiveItemId,
  };
};
