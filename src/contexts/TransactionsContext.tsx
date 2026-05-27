import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { createTransactionsRealtimeBridge } from '../services/transaction.realtime';

interface TransactionsContextValue {
  bridgeReady: boolean;
}

const TransactionsContext = createContext<TransactionsContextValue>({
  bridgeReady: false,
});

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const [bridgeReady, setBridgeReady] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setBridgeReady(false);
      return;
    }

    const bridge = createTransactionsRealtimeBridge(user.uid);
    unsubscribeRef.current = bridge.subscribe((data: any) => {
      setBridgeReady(true);
      try {
        localStorage.setItem(
          `fpi_tx_${user.uid}`,
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
    <TransactionsContext.Provider value={{ bridgeReady }}>
      {children}
    </TransactionsContext.Provider>
  );
}

export const useTransactionsContext = () => useContext(TransactionsContext);
