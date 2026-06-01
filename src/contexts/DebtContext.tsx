import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { createDebtRealtimeBridge } from '../services/debt/debt.realtime';

interface DebtContextValue {
  debtBridgeReady: boolean;
  hasConnectedAtLeastOnce: boolean;
}

const DebtContext = createContext<DebtContextValue>({
  debtBridgeReady: false,
  hasConnectedAtLeastOnce: false,
});

export function DebtProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const [debtBridgeReady, setDebtBridgeReady] = useState(false);
  const [hasConnectedAtLeastOnce, setHasConnectedAtLeastOnce] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setDebtBridgeReady(false);
      return;
    }

    const bridge = createDebtRealtimeBridge(user.uid);
    unsubscribeRef.current = bridge.subscribe((data: any) => {
      setDebtBridgeReady(true);
      setHasConnectedAtLeastOnce(true);
      try {
        localStorage.setItem(
          `fpi_debts_${user.uid}`,
          JSON.stringify({ data, ts: Date.now() })
        );
      } catch {}
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user?.uid, queryClient]);

  return (
    <DebtContext.Provider value={{ debtBridgeReady, hasConnectedAtLeastOnce }}>
      {children}
    </DebtContext.Provider>
  );
}

export const useDebtContext = () => useContext(DebtContext);
