import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { createCardsRealtimeBridge } from '../services/card.realtime';
import { createBillsRealtimeBridge } from '../services/bill.realtime';
import { createAssetsRealtimeBridge, createPassivesRealtimeBridge } from '../services/wealth.realtime';
import { createDebtRealtimeBridge } from '../services/debt/debt.realtime';
import { createGoalRealtimeBridge } from '../services/goal.realtime';
import { createCategoriesRealtimeBridge } from '../services/category.realtime';
import { createInvoicesRealtimeBridge } from '../services/invoice.realtime';

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
  const unsubscribeAssetsRef = useRef<(() => void) | null>(null);
  const unsubscribePassivesRef = useRef<(() => void) | null>(null);
  const unsubscribeDebtsRef = useRef<(() => void) | null>(null);
  const unsubscribeGoalsRef = useRef<(() => void) | null>(null);
  const unsubscribeCategoriesRef = useRef<(() => void) | null>(null);
  const unsubscribeInvoicesRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      if (unsubscribeCardsRef.current) unsubscribeCardsRef.current();
      if (unsubscribeBillsRef.current) unsubscribeBillsRef.current();
      if (unsubscribeAssetsRef.current) unsubscribeAssetsRef.current();
      if (unsubscribePassivesRef.current) unsubscribePassivesRef.current();
      if (unsubscribeDebtsRef.current) unsubscribeDebtsRef.current();
      if (unsubscribeGoalsRef.current) unsubscribeGoalsRef.current();
      if (unsubscribeCategoriesRef.current) unsubscribeCategoriesRef.current();
      if (unsubscribeInvoicesRef.current) unsubscribeInvoicesRef.current();

      unsubscribeCardsRef.current = null;
      unsubscribeBillsRef.current = null;
      unsubscribeAssetsRef.current = null;
      unsubscribePassivesRef.current = null;
      unsubscribeDebtsRef.current = null;
      unsubscribeGoalsRef.current = null;
      unsubscribeCategoriesRef.current = null;
      unsubscribeInvoicesRef.current = null;
      setFinanceBridgeReady(false);
      return;
    }

    const uid = user.uid;

    // Bridge para Cartões
    const cardsBridge = createCardsRealtimeBridge(uid);
    unsubscribeCardsRef.current = cardsBridge.subscribe(() => checkReady());

    // Bridge para Contas Fixas
    const billsBridge = createBillsRealtimeBridge(uid);
    unsubscribeBillsRef.current = billsBridge.subscribe(() => checkReady());

    // [FINOPS] Centralizando Ativos e Passivos
    const assetsBridge = createAssetsRealtimeBridge(uid);
    unsubscribeAssetsRef.current = assetsBridge.subscribe(() => checkReady());

    const passivesBridge = createPassivesRealtimeBridge(uid);
    unsubscribePassivesRef.current = passivesBridge.subscribe(() => checkReady());

    // [FINOPS] Centralizando Dívidas
    const debtsBridge = createDebtRealtimeBridge(uid);
    unsubscribeDebtsRef.current = debtsBridge.subscribe(() => checkReady());

    // [FINOPS] Centralizando Metas
    const goalsBridge = createGoalRealtimeBridge(uid);
    unsubscribeGoalsRef.current = goalsBridge.subscribe(() => checkReady());

    // [FINOPS] Centralizando Categorias
    const categoriesBridge = createCategoriesRealtimeBridge(uid);
    unsubscribeCategoriesRef.current = categoriesBridge.subscribe(() => checkReady());

    // Bridge para Faturas por período
    const invoicesBridge = createInvoicesRealtimeBridge(uid);
    unsubscribeInvoicesRef.current = invoicesBridge.subscribe(() => checkReady());

    function checkReady() {
      setFinanceBridgeReady(true);
      setHasConnectedAtLeastOnce(true);
    }

    return () => {
      if (unsubscribeCardsRef.current) unsubscribeCardsRef.current();
      if (unsubscribeBillsRef.current) unsubscribeBillsRef.current();
      if (unsubscribeAssetsRef.current) unsubscribeAssetsRef.current();
      if (unsubscribePassivesRef.current) unsubscribePassivesRef.current();
      if (unsubscribeDebtsRef.current) unsubscribeDebtsRef.current();
      if (unsubscribeGoalsRef.current) unsubscribeGoalsRef.current();
      if (unsubscribeCategoriesRef.current) unsubscribeCategoriesRef.current();
      if (unsubscribeInvoicesRef.current) unsubscribeInvoicesRef.current();
    };
  }, [user?.uid]);

  return (
    <FinanceContext.Provider value={useMemo(() => ({ financeBridgeReady, hasConnectedAtLeastOnce }), [financeBridgeReady, hasConnectedAtLeastOnce])}>
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinanceContext = () => useContext(FinanceContext);
