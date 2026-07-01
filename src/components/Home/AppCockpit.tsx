import React, { useState } from 'react';
import type { Transaction, UserMeta } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useCockpitData } from './Cockpit/useCockpitData';
import { useEntitlement } from '../../hooks/useEntitlement';
import CockpitHero from './Cockpit/CockpitHero';
import CockpitControlaAction from './Cockpit/CockpitControlaAction';
import CockpitInventory from './Cockpit/CockpitInventory';
import CockpitAnalytics from './Cockpit/CockpitAnalytics';
import ExplorarDiscoveryStrip from './Cockpit/ExplorarDiscoveryStrip';
import CommandRitual from './CommandRitual';
import SovereignMapCard from './SovereignMapCard';
import FirstTransactionCTA from './FirstTransactionCTA';
import NexusIntroCard from './NexusIntroCard';
import UrgentBillsSheet from './UrgentBillsSheet';
import { RefreshCw } from 'lucide-react';
interface AppCockpitProps {
  transactions: Transaction[];
  isPrivacyMode: boolean;
  onNavigate: (tool: string, state?: any) => void;
  onOpenForm: (initialData?: any) => void;
  userMeta?: UserMeta | null;
  isSyncing?: boolean;
}

const AppCockpit: React.FC<AppCockpitProps> = ({
  transactions,
  isPrivacyMode,
  onNavigate,
  onOpenForm,
  userMeta,
  isSyncing
}) => {
  const { user } = useAuth();
  const { effectiveTier } = useEntitlement();
  const cockpit = useCockpitData(user, transactions, userMeta);
  const [showUrgentBills, setShowUrgentBills] = useState(false);

  const hasTransactions = transactions.length > 0;

  const formatCurrency = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // FIRST-USE STATE: Free user with zero transactions — show dominant CTA only
  if (!hasTransactions) {
    return (
      <div className="max-w-7xl mx-auto px-4 pt-14 md:pt-6 pb-28 space-y-8 animate-in fade-in duration-500">
        {isSyncing && (
          <div className="flex items-center justify-center gap-3 px-6 py-2 bg-sky-500/10 border border-sky-500/20 rounded-2xl animate-in slide-in-from-top-4">
            <RefreshCw size={12} className="text-sky-500 animate-spin" />
            <span className="text-[9px] font-black text-sky-600 uppercase tracking-widest">
              Sincronizando dados em tempo real...
            </span>
          </div>
        )}
        <FirstTransactionCTA onOpenForm={onOpenForm} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-14 md:pt-6 pb-28 space-y-8 animate-in fade-in duration-500">
      
      {/* SYNC BANNER */}
      {isSyncing && (
        <div className="flex items-center justify-center gap-3 px-6 py-2 bg-sky-500/10 border border-sky-500/20 rounded-2xl animate-in slide-in-from-top-4">
          <RefreshCw size={12} className="text-sky-500 animate-spin" />
          <span className="text-[9px] font-black text-sky-600 uppercase tracking-widest">
            Sincronizando dados em tempo real...
          </span>
        </div>
      )}

      {/* Command Ritual + Sovereign Map row */}
      {hasTransactions && cockpit.stage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CommandRitual
            stage={cockpit.stage}
            event={cockpit.contextualEvent}
            onNavigate={onNavigate}
            freeBalance={cockpit.sovereign.sovereignFreeBalance}
            shortfall={cockpit.sovereign.protectionShortfall}
            launchCount={transactions.length}
          />
          <SovereignMapCard
            stage={cockpit.stage}
            onNavigate={onNavigate}
          />
        </div>
      )}

      {/* Nexus Intro Card — aparece depois do Command Ritual, antes do hero */}
      <NexusIntroCard
        effectiveTier={effectiveTier}
        onOpenNexus={() => onNavigate('chat')}
      />

      <CockpitHero 
        urgentBills={cockpit.urgentBills}
        userMeta={userMeta}
        isPrivacyMode={isPrivacyMode}
        sovereign={cockpit.sovereign}
        marcoZero={cockpit.marcoZero}
        reserveCurrent={cockpit.reserveCurrent}
        transactions={transactions}
        formatCurrency={formatCurrency}
        onNavigate={onNavigate}
        onOpenForm={onOpenForm}
        onShowUrgentBills={() => setShowUrgentBills(true)}
      />

      <CockpitControlaAction 
        onNavigate={onNavigate}
        isPrivacyMode={isPrivacyMode}
        controlaBalance={cockpit.totals.controlaBalance}
        dataHealth={cockpit.dataHealth}
        daysSinceLastSnapshot={cockpit.daysSinceLastSnapshot}
        sovereignCommandMode={cockpit.sovereign.commandMode}
        formatCurrency={formatCurrency}
      />

      <ExplorarDiscoveryStrip onNavigate={onNavigate} />

      <CockpitInventory 
        totals={cockpit.totals}
        detailedCards={cockpit.detailedCards}
        isPrivacyMode={isPrivacyMode}
        onNavigate={onNavigate}
        formatCurrency={formatCurrency}
      />

      <CockpitAnalytics 
        evolutionData={cockpit.evolutionData}
        investmentComposition={cockpit.investmentComposition}
        propertyComposition={cockpit.propertyComposition}
        debtComposition={cockpit.debtComposition}
        isPrivacyMode={isPrivacyMode}
        validatedModules={cockpit.totals.validatedModules}
        totalInvestments={cockpit.totalInvestments}
        totalProperty={cockpit.totalProperty}
        totalDebts={cockpit.totalDebts}
        onNavigate={onNavigate}
        formatCurrency={formatCurrency}
      />

      {/* FOOTER LITE */}
      <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          Finanças Pro Invest · {new Date().getFullYear()}
        </p>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('explorar')} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-primary transition-colors">Explorar Ferramentas</button>
          <span className="w-1 h-1 bg-slate-200 rounded-full" />
          <button onClick={() => onNavigate('mais')} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-primary transition-colors">Configurações</button>
        </div>
      </div>

      <UrgentBillsSheet
        bills={cockpit.urgentBills}
        isOpen={showUrgentBills}
        onClose={() => setShowUrgentBills(false)}
        onOpenForm={onOpenForm}
      />
    </div>
  );
};

export default AppCockpit;
