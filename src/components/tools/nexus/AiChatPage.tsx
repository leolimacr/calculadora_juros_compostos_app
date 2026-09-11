import { useWealthData } from '../../../hooks/useWealthData';
import React from 'react';
import NexusBriefingView from './NexusBriefingView';
import { useAuth } from '../../../contexts/AuthContext';
import { useDebts } from '../../../hooks/useDebts';
import type { Transaction } from '../../../types';

interface AiChatPageProps {
  onNavigate: (tool: string) => void;
}

const AiChatPage: React.FC<AiChatPageProps> = () => {
  const { user } = useAuth();
  const {
    assets,
    passives,
    goals: wealthGoals
  } = useWealthData();
  const { debts } = useDebts(user?.uid);

  const transactions: Transaction[] = []; // Pode ser alimentado pelo context se necessário

  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      <NexusBriefingView
        transactions={transactions}
        goals={wealthGoals}
        assets={assets}
        passives={passives}
        debts={debts}
      />
    </div>
  );
};

export default AiChatPage;
