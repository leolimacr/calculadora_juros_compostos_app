import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import AppMobileDrawer from '../components/AppMobileDrawer';
import MobileBottomNav from '../components/MobileBottomNav';
import NotificationHub from '../components/NotificationHub';
import ContentModal from '../components/ContentModal';
import TransactionForm from '../components/tools/finance/TransactionForm';
import ToastContainer from '../components/Toast';
import type { useAppState } from '../hooks/useAppState';
import { useNavigation } from '../hooks/useNavigation';
import { useIsMobile } from '../hooks/useIsMobile';
import { useOnboarding } from '../hooks/useOnboarding';
import OnboardingOverlay from '../components/Onboarding/OnboardingOverlay';
import PageShell from './PageShell';
import type { NexusAdvisoryContext } from '../services/nexusInsightEngine';
import { useSovereignSnapshot } from '../hooks/useSovereignSnapshot';

import AppOnlyBlock from '../components/AppOnlyBlock';
import AppDesktopNav from '../components/AppDesktopNav';

interface AppLayoutProps {
  state: ReturnType<typeof useAppState>;
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ state }) => {
  const isMobile = useIsMobile();
  const { handleNavigate, currentTool } = useNavigation();
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
    isNative,
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
      isPremium: !!userMeta?.isPremium,
    };
  }, [lancamentos, userMeta, sovereign]);

  const { step, nextStep, skip, finish } = useOnboarding(lancamentos.length);

  const showDesktopNav = isAuthenticated && !isAppLocked;

  const handleOnboardingLaunch = () => {
    handleNavigate('controla');
    setTimeout(() => {
      openTransactionForm();
    }, 100);
  };

  const handleOnboardingNext = () => {
    if (step === 1) {
      handleNavigate('controla');
    }
    nextStep();
  };

  return (
    <div className="min-h-screen bg-surface-secondary text-text-primary flex flex-col font-sans">
      <AppHeader
        isAuthenticated={isAuthenticated}
        userMeta={userMeta}
        userDisplayName={user?.displayName?.split(' ')[0]}
        isPrivacyMode={isPrivacyMode}
        onTogglePrivacy={() => setIsPrivacyMode(!isPrivacyMode)}
        onLogout={handleLogout}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        isPro={state.isPro}
        isPremium={state.isPremium}
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
          onOpenNotifications={setIsNotificationsOpen}
        />
      )}

      <AppOnlyBlock isMobileBrowser={isMobileBrowser} hasBottomNav={isAuthenticated && !isAppLocked && isMobile} />

      <NotificationHub
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={handleNavigate}
      />

      <ContentModal
        isOpen={activeModal === 'transaction'}
        onClose={handleCloseModal}
        title={editingTransaction?.id ? 'Editar Lançamento' : 'Novo Lançamento'}
      >
        <TransactionForm
          initialData={editingTransaction}
          onSave={async (t: { id?: string; amount: number; linkedDebtId?: string; [key: string]: any }) => {
            const { id, ...rest } = t;
            const amount = Number(t.amount);
            const cleanData = { ...rest, amount } as Parameters<typeof saveLancamento>[0];
            if (id) cleanData.id = id;

            // Salva o lançamento (A lógica reativa agora vive no useTransactions)
            await saveLancamento(cleanData);
            handleCloseModal();
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

      <ToastContainer toasts={[]} removeToast={() => {}} />

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

export default AppLayout;
