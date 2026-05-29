import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import AppMobileDrawer from '../components/AppMobileDrawer';
import MobileBottomNav from '../components/MobileBottomNav';
import ContentModal from '../components/ContentModal';
import TransactionForm from '../components/tools/finance/TransactionForm';
import ToastContainer from '../components/Toast';
import { useAppState } from '../hooks/useAppState';
import { useNavigation } from '../hooks/useNavigation';
import { useIsMobile } from '../hooks/useIsMobile';
import { useOnboarding } from '../hooks/useOnboarding';
import OnboardingOverlay from '../components/Onboarding/OnboardingOverlay';
import PageShell from './PageShell';
import { NexusAdvisoryContext } from '../services/nexusInsightEngine';

import AppOnlyBlock from '../components/AppOnlyBlock';

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

  const nexusAdvisoryContext = React.useMemo((): NexusAdvisoryContext | undefined => {
    if (!lancamentos) return undefined;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const monthTransactions = lancamentos.filter(t => {
      const [y, m] = t.date.split('-').map(Number);
      return y === currentYear && m === currentMonth;
    });

    const currentMonthBalance = monthTransactions.reduce(
      (acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount),
      0
    );

    const categorySpending = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return {
      currentMonthBalance,
      categorySpending,
      isPremium: !!userMeta?.isPremium,
    };
  }, [lancamentos, userMeta]);

  const { step, nextStep, skip, finish } = useOnboarding(lancamentos.length);

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
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
      />

      <main className="flex-1 overflow-y-auto">
        <PageShell currentTool={currentTool}>
          <Outlet />
        </PageShell>
      </main>

      <AppMobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isAuthenticated={isAuthenticated}
        userMeta={userMeta}
        userDisplayName={user?.displayName}
        onLogout={handleLogout}
        onOpenCourse={() => routerNavigate('/curso/dividas')}
      />

      {isNative && isAuthenticated && !isAppLocked && isMobile && (
        <MobileBottomNav
          onOpenMore={() => handleNavigate('settings')}
          onAdd={openTransactionForm}
        />
      )}

      <AppOnlyBlock isMobileBrowser={isMobileBrowser} />

      <ContentModal
        isOpen={activeModal === 'transaction'}
        onClose={handleCloseModal}
        title={editingTransaction?.id ? 'Editar Lançamento' : 'Novo Lançamento'}
      >
        <TransactionForm
          initialData={editingTransaction}
          onSave={async (t: { id?: string; amount: number; [key: string]: unknown }) => {
            const { id, ...rest } = t;
            const cleanData = { ...rest, amount: Number(t.amount) } as Parameters<
              typeof saveLancamento
            >[0];
            if (id) cleanData.id = id;
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
