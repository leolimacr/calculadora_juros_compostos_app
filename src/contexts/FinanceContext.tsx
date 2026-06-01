import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { createCardsRealtimeBridge } from '../services/card.realtime';
import { createBillsRealtimeBridge } from '../services/bill.realtime';

interface FinanceContextValue {
  financeBridgeReady: boolean;
  hasConnectedAtLeastOnce: boolean;
}

const FinanceContext = createContext<FinanceContextValue>({
  financeBridgeReady: false,
  hasConnectedAtLeastOnce: false,
});

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [financeBridgeReady, setFinanceBridgeReady] = useState(false);
  const [hasConnectedAtLeastOnce, setHasConnectedAtLeastOnce] = useState(false);
  
  const unsubscribeCardsRef = useRef<(() => void) | null>(null);
  const unsubscribeBillsRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      if (unsubscribeCardsRef.current) unsubscribeCardsRef.current();
      if (unsubscribeBillsRef.current) unsubscribeBillsRef.current();
      unsubscribeCardsRef.current = null;
      unsubscribeBillsRef.current = null;
      setFinanceBridgeReady(false);
      return;
    }

    // Bridge para Cartões
    const cardsBridge = createCardsRealtimeBridge(user.uid);
    unsubscribeCardsRef.current = cardsBridge.subscribe(() => {
      // Quando pelo menos um snapshot chegar, consideramos parte da ponte pronta
      checkReady();
    });

    // Bridge para Contas Fixas
    const billsBridge = createBillsRealtimeBridge(user.uid);
    unsubscribeBillsRef.current = billsBridge.subscribe(() => {
      checkReady();
    });

    let cardsLoaded = false;
    let billsLoaded = false;

    function checkReady() {
      // Simples heurística: se ambos deram pelo menos um snapshot
      // (mesmo que vazio), a ponte está pronta.
      // Para simplificar, vamos considerar pronto se ambos os subscribes responderem.
      // Mas o subscribe do bridgeBridge chama onUpdate imediatamente se houver cache no Firebase.
      setFinanceBridgeReady(true);
      setHasConnectedAtLeastOnce(true);
    }

    return () => {
      if (unsubscribeCardsRef.current) unsubscribeCardsRef.current();
      if (unsubscribeBillsRef.current) unsubscribeBillsRef.current();
    };
  }, [user?.uid]);

  return (
    <FinanceContext.Provider value={{ financeBridgeReady, hasConnectedAtLeastOnce }}>
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinanceContext = () => useContext(FinanceContext);
