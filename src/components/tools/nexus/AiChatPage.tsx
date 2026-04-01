import { useWealthData } from '../../../hooks/useWealthData';
import React from 'react';
import AiAdvisor from './AiAdvisor';
import { useAuth } from '../../../contexts/AuthContext';
import { useFirebase } from '../../../hooks/useFirebase';
import { Capacitor } from '@capacitor/core';

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

  const isNative = Capacitor.isNativePlatform();

  return (
    <div
      className={`mt-16 bg-slate-100 flex items-center justify-center p-0 md:p-4 overflow-hidden font-sans ${
        isNative ? 'h-[calc(100vh-190px)]' : 'h-[calc(100vh-64px)]'
      }`}
    >
      <div className="w-full max-w-4xl h-full relative">
        <div className="absolute inset-0 md:relative md:h-full bg-white border-0 md:border md:border-slate-200 md:rounded-3xl overflow-hidden shadow-xl">
          <AiAdvisor
            transactions={filteredTransactions}
            currentCalcResult={simulations}
            goals={wealthGoals}
            assets={assets}
            passives={passives}
            currentTool="chat_web"
          />
        </div>
      </div>
    </div>
  );
};

export default AiChatPage;