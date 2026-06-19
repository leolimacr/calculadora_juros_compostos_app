import React, { useState, useEffect } from 'react';
import HomePanelHeader from './HomePanel/HomePanelHeader';
import HomeMainColumn from './HomePanel/HomeMainColumn';
import HomeSidebarColumn from './HomePanel/HomeSidebarColumn';
import { useHomePanelData } from './HomePanel/useHomePanelData';
import type { Transaction } from '../../types';

interface LoggedInHomePanelProps {
  transactions: Transaction[];
  isPrivacyMode: boolean;
  onOpenForm: (initialData?: Partial<Transaction>) => void;
  onNavigate: (tool: string) => void;
  hasPaidAccess: boolean;
  userMeta?: any;
}

const LoggedInHomePanel: React.FC<LoggedInHomePanelProps> = ({
  transactions,
  isPrivacyMode,
  onOpenForm,
  onNavigate,
  hasPaidAccess,
  userMeta,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const home = useHomePanelData(transactions, userMeta, hasPaidAccess);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <HomePanelHeader 
        monthLabel={home.monthLabel} 
        isScrolled={isScrolled} 
        onNavigate={onNavigate} 
      />

      <div className="max-w-7xl w-full mx-auto px-4 pt-14 md:pt-10 pb-28 animate-in fade-in duration-300 font-sans">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <HomeMainColumn 
            transactions={transactions}
            nexusReserves={home.nexusReserves}
            contextualEvent={home.contextualEvent}
            userId={home.userId}
            userMeta={userMeta}
            hasPaidAccess={hasPaidAccess}
            onNavigate={onNavigate}
            onOpenForm={onOpenForm}
            onDismissInsight={home.handleDismiss}
          />

          <HomeSidebarColumn 
            transactions={transactions}
            isPrivacyMode={isPrivacyMode}
            hasPaidAccess={hasPaidAccess}
            userMeta={userMeta}
            onNavigate={onNavigate}
          />

        </div>
      </div>
    </>
  );
};

export default LoggedInHomePanel;
