import { useWealthData } from '../../../hooks/useWealthData';
import React from 'react';
import AiAdvisor from './AiAdvisor';
import { useAuth } from '../../../contexts/AuthContext';
import { useFirebase } from '../../../hooks/useFirebase';
import { Capacitor } from '@capacitor/core';
import { useDebts } from '../../../hooks/useDebts';

interface AiChatPageProps {
  onNavigate: (tool: string) => void;
  simulations?: any[];
  filteredTransactions: any[];
}

const AiChatPage: React.FC<AiChatPageProps> = ({
  onNavigate,
  simulations = [],
  filteredTransactions = []
}) => {
  const { user } = useAuth();
  const { userMeta } = useFirebase(user?.uid);
  const {
    assets,
    passives,
    goals: wealthGoals
  } = useWealthData();
  const { debts } = useDebts(user?.uid);

  const isNative = Capacitor.isNativePlatform();

  return (
    <div className="w-full h-full flex flex-col">
      <AiAdvisor
        transactions={filteredTransactions}
        currentCalcResult={simulations}
        goals={wealthGoals}
        assets={assets}
        passives={passives}
        debts={debts}
        currentTool="chat"
      />
    </div>
  );
};

export default AiChatPage;