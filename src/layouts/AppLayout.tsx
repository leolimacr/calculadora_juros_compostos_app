import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import AppMobileDrawer from '../components/AppMobileDrawer';
import MobileBottomNav from '../components/MobileBottomNav';
import NotificationHub from '../components/NotificationHub';
import ContentModal from '../components/ContentModal';
import TransactionForm from '../components/tools/finance/TransactionForm';
import { ToastProvider, useToast } from '../contexts/ToastContext';
import { maskCurrency } from '../utils/calculations';
import type { useAppState } from '../hooks/useAppState';
import { useNavigation } from '../hooks/useNavigation';
import { useIsMobile } from '../hooks/useIsMobile';
import { useOnboarding } from '../hooks/useOnboarding';
import PageShell from './PageShell';
import OnboardingOverlay from '../components/Onboarding/OnboardingOverlay';
import { useSovereignSnapshot } from '../hooks/useSovereignSnapshot';
import { useEventSubscriptions } from '../hooks/useEventSubscriptions';
import { useNexusEventBridge } from '../hooks/useNexusEventBridge';
import { useInvoiceSync } from '../hooks/useInvoiceSync';
import { clearEventInsightStore } from '../services/eventInsightStore';
import type { NexusAdvisoryContext } from '../services/nexusInsightEngine';
import { useBills } from '../hooks/useBills';
import { addPaidRecurringBillTransaction } from '../services/transactionService';
import { PresenceEventService } from '../services/PresenceEventService';

import AppOnlyBlock from '../components/AppOnlyBlock';
import AppDesktopNav from '../components/AppDesktopNav';

interface AppLayoutProps {
  state: ReturnType<typeof useAppState>;
  children?: React.ReactNode;
}

const AppLayoutInner: React.FC<AppLayoutProps> = ({ state }) => {
  const isMobile = useIsMobile();
  const { handleNavigate, currentTool } = useNavigation();
  const { addToast } = useToast();

  const {
    user,
    isAuthenticated,
    userMeta,
    lancamentos,
    isPrivacyMode,
    setIsPrivacyMode,
    isNotificationsOpen,
    setIsNotificationsOpen,
    mobileMenuOpen,
    setMobileMenuOpen,
    isPremium,
    isAppLocked,
    activeModal,
    editingTransaction,
    categories,
    handleLogout,
    handleCloseModal,
    saveLancamento,
    saveCategory,
    deleteCategory,
    openTransactionForm,
    routerNavigate,
    isMobileBrowser,
  } = state;

  useEventSubscriptions(user?.uid);
  useNexusEventBridge(user?.uid, userMeta?.persona?.archetype);
  useInvoiceSync(lancamentos);
  const { bills: recurringBills } = useBills(user?.uid);

  // Clean event insight store when session is lost (logout, token expiry, account switch)
  React.useEffect(() => {
    if (!isAuthenticated) {
      clearEventInsightStore();
    }
  }, [isAuthenticated]);

  const sovereign = useSovereignSnapshot(lancamentos, userMeta);

  const nexusAdvisoryContext = React.useMemo((): NexusAdvisoryContext | undefined => {
    if (!lancamentos) return undefined;

    const now = new Date();

    const categorySpending = lancamentos
      .filter((t) => {
        const [y, m] = t.date.split('-').map(Number);
        return y === now.getFullYear() && m === now.getMonth() + 1 && t.type === 'expense';
      })
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return {
      snapshot: sovereign,
      commandMode: sovereign.commandMode,
      categorySpending,
      isPremium,
    };
  }, [lancamentos, userMeta, sovereign, isPremium]);

  const location = useLocation();
  const filterCardId = (location.state as Record<string, unknown> | null)?.filterCardId as string | undefined;

  const handleBackToCards = React.useCallback(() => {
    handleCloseModal();
    routerNavigate('/app/controla', { state: { clearCardFilter: true }, replace: true });
  }, [handleCloseModal, routerNavigate]);

  const { step, nextStep, skip, finish } = useOnboarding(lancamentos.length);

  const showDesktopNav = isAuthenticated && !isAppLocked;

  const handleOnboardingLaunch = () => {
    handleNavigate('controla');
    setTimeout(() => {
      openTransactionForm();
    }, 100);
  };

  const handleOnboardingNext = () => {
    nextStep();
  };

  const handleMarkBillAsPaid = React.useCallback(async (billId: string) => {
    if (!user) return;

    const bill = recurringBills.find((item) => item.id === billId && item.isActive);
    if (!bill) return;

    const now = new Date();
    if (bill.lastPaidDate) {
      const lastPaid = new Date(bill.lastPaidDate);
      if (lastPaid.getFullYear() === now.getFullYear() && lastPaid.getMonth() === now.getMonth()) {
        addToast(`A conta ${bill.name} já foi marcada como paga neste mês.`, 'warning');
        return;
      }
    }

    await addPaidRecurringBillTransaction(user.uid, bill);
    await PresenceEventService.markRecurringBillActioned(user.uid, bill.id);
    handleNavigate('manager');
  }, [user, recurringBills, addToast, handleNavigate]);

  return (
    <div className="min-h-screen bg-surface-secondary text-text-primary flex flex-col font-sans animate-in fade-in duration-300">
      <AppHeader
        isAuthenticated={isAuthenticated}
        userMeta={userMeta}
        userDisplayName={user?.displayName?.split(' ')[0]}
        isPrivacyMode={isPrivacyMode}
        onTogglePrivacy={() => setIsPrivacyMode(!isPrivacyMode)}
        onLogout={handleLogout}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        isNotificationsOpen={isNotificationsOpen}
        onOpenNotifications={setIsNotificationsOpen}
        showDesktopNav={showDesktopNav}
      />

      <div className="flex flex-1 min-h-0 pt-16">
        {showDesktopNav && <AppDesktopNav />}

        <main className="flex-1 min-w-0 overflow-y-auto">
          <PageShell
            currentTool={currentTool}
            withMobileNav={isAuthenticated && !isAppLocked && isMobile}
          >
            <Outlet />
          </PageShell>
        </main>
      </div>

      <AppMobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isAuthenticated={isAuthenticated}
        userMeta={userMeta}
        userDisplayName={user?.displayName}
        onLogout={handleLogout}
        onOpenCourse={() => routerNavigate('/curso/dividas')}
      />

      {isAuthenticated && !isAppLocked && isMobile && (
        <MobileBottomNav
          onOpenMore={() => handleNavigate('settings')}
          onAdd={openTransactionForm}
        />
      )}

      <AppOnlyBlock isMobileBrowser={isMobileBrowser} hasBottomNav={isAuthenticated && !isAppLocked && isMobile} />

      <NotificationHub
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={handleNavigate}
        onMarkBillAsPaid={handleMarkBillAsPaid}
      />

      <ContentModal
        isOpen={activeModal === 'transaction'}
        onClose={handleCloseModal}
        title={editingTransaction?.id ? 'Editar Lançamento' : 'Novo Lançamento'}
      >
        {filterCardId && (
          <div className="flex items-center justify-end mb-4">
            <button
              type="button"
              onClick={handleBackToCards}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-secondary/10 hover:bg-brand-secondary/20 text-brand-secondary font-black text-[9px] uppercase tracking-widest border border-brand-secondary/20 transition-all active:scale-95"
            >
              Voltar aos cartões
            </button>
          </div>
        )}
        <TransactionForm
          initialData={editingTransaction}
          onSave={async (t: { id?: string; amount: number; linkedDebtId?: string; type?: string; [key: string]: any }) => {
            const { id, ...rest } = t;
            const amount = Number(t.amount);
            const cleanData = { ...rest, amount } as Parameters<typeof saveLancamento>[0];
            if (id) cleanData.id = id;

            const wasFirstTransaction = lancamentos.length === 0;

            await saveLancamento(cleanData);
            handleCloseModal();

            const freeBalance = sovereign.sovereignFreeBalance;

            if (wasFirstTransaction && !t.type?.includes('expense') && amount > 0) {
              addToast(
                'Pronto. Agora você vê quanto sobra de verdade no seu mês.',
                'success'
              );
            } else if (t.type === 'expense' && freeBalance < 0) {
              addToast(
                `Suas despesas consumiram a liberdade. Seu saldo livre é ${maskCurrency(freeBalance)}.`,
                'warning'
              );
            } else if (t.type === 'expense' && freeBalance >= 0 && freeBalance < 500) {
              addToast(
                `Atenção: sua liberdade real é de ${maskCurrency(freeBalance)}.`,
                'info'
              );
            } else if (!t.type?.includes('expense') && amount > 0) {
              addToast(
                `Receita registrada. Sua liberdade real agora é ${maskCurrency(freeBalance)}.`,
                'success'
              );
            }
          }}
          onCancel={handleCloseModal}
          categories={categories}
          onSaveCategory={saveCategory}
          onDeleteCategory={async (id: string) => {
            const catName = categories.find(c => c.id === id)?.name;
            const usageCount = lancamentos.filter((t: any) => t.category === catName).length;
            await deleteCategory(id, usageCount);
          }}
          nexusAdvisoryContext={nexusAdvisoryContext}
          transactions={lancamentos}
        />
      </ContentModal>

      <OnboardingOverlay
        step={step}
        onNext={handleOnboardingNext}
        onSkip={skip}
        onFinish={finish}
        onLaunch={handleOnboardingLaunch}
      />
    </div>
  );
};

const AppLayout: React.FC<AppLayoutProps> = (props) => (
  <ToastProvider>
    <AppLayoutInner {...props} />
  </ToastProvider>
);

export default AppLayout;
