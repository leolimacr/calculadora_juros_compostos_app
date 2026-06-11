import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import OnboardingWizard from '../components/OnboardingWizard';
import NexusBriefingView from '../components/tools/nexus/NexusBriefingView';
import {
  FireCalculatorTool,
  CompoundInterestTool,
  InflationTool,
  RentVsFinanceTool,
  DebtOptimizerTool,
  DividendsTool,
  BuyCashOrInstallInvestTool,
} from '../components/tools';
import AuthLogin from '../components/Auth/AuthLogin';
import AuthRegister from '../components/Auth/AuthRegister';
import PricingPage from '../components/PricingPage';
import SettingsPage from '../components/SettingsPage';
import PublicHome from '../components/PublicHome';
import SecurityLock from '../components/SecurityLock';
import { getArticleById } from '../components/Public/Articles';
import ActiveWealthManager from '../components/tools/wealth/ActiveWealthManager';
import { PassiveWealthManager } from '../components/tools/wealth/PassiveWealthManager';
import { DebtManager } from '../components/tools/wealth/DebtManager';
import GoalManager from '../components/tools/goals/GoalManager';
import { TermsPage } from '../components/TermsPage';
import { PrivacyPage } from '../components/PrivacyPage';
import CentralHub from '../components/CentralHub';
import LoggedInHomePanel from '../components/Home/LoggedInHomePanel';
import AppCockpit from '../components/Home/AppCockpit';
import { ExplorarHub } from '../components/ExplorarHub';
import AppLayout from '../layouts/AppLayout';
import PublicLayout from '../layouts/PublicLayout';
import { useAppState } from '../hooks/useAppState';
import { useNavigation } from '../hooks/useNavigation';
import { courseRoutes, CourseRoutesShell } from './courseRoutes';
import { useTransactionsContext } from '../contexts/TransactionsContext';
import { useDebtContext } from '../contexts/DebtContext';
import { useFinanceContext } from '../contexts/FinanceContext';
import { ControlaPage } from '../components/tools/finance/ControlaPage';
import AppLoadingScreen from '../components/AppLoadingScreen';

interface AppRoutesProps {
  state: ReturnType<typeof useAppState>;
}

const ProtectedRoute = ({ 
  isAuthenticated, 
  children 
}: { 
  isAuthenticated: boolean; 
  children: React.ReactNode 
}) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppRoutes: React.FC<AppRoutesProps> = ({ state }) => {
  const { bridgeReady, hasConnectedAtLeastOnce: txConnected } = useTransactionsContext();
  const { debtBridgeReady, hasConnectedAtLeastOnce: debtConnected } = useDebtContext();
  const { financeBridgeReady, hasConnectedAtLeastOnce: financeConnected } = useFinanceContext();

  const [loadingTime, setLoadingTime] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => setLoadingTime(prev => prev + 100), 100);
    return () => clearInterval(timer);
  }, []);

  const allReady = bridgeReady && debtBridgeReady && financeBridgeReady;
  const anyConnected = txConnected || debtConnected || financeConnected;

  // ESCALONAMENTO DE CARREGAMENTO (Ponto 4 do refinamento)
  // T0-T3s: AppLoadingScreen (ideal)
  // T3s-T7s: Se tiver cache, libera. Se nío, continua loading.
  // T > 7s: Timeout / Erro (ou libera com o que tiver)
  
  const showFullLoading = !allReady && (
    loadingTime < 3000 || 
    (!anyConnected && loadingTime < 7000)
  );

  const { 
    handleNavigate, 
    handleAuthSuccess, 
    homeKey 
  } = useNavigation();

  if (state.isAuthenticated && showFullLoading) {
    return <AppLoadingScreen loadingTime={loadingTime} />;
  }

  const {
    user,
    isAuthenticated,
    lancamentos,
    categories,
    deleteLancamento,
    saveCategory,
    deleteCategory,
    userMeta,
    userMetaLoaded,
    usagePercentage,
    isLimitReached,
    isPro,
    isPremium,
    isAppLocked,
    storedPin,
    handleUnlockSuccess,
    isPrivacyMode,
    setIsPrivacyMode,
    setActiveModal,
    setOnboardingDismissed,
    routerNavigate,
    handleEditTransaction,
    getAiContextTransactions,
  } = state;

  if (isAppLocked && isAuthenticated && storedPin) {
    return (
      <SecurityLock storedPin={storedPin} useBiometrics={false} onSuccess={handleUnlockSuccess} />
    );
  }

  return (
    <Routes>
      {/* REDIRECTS LEGADOS */}
      <Route path="/dashboard" element={<Navigate to="/app/controla" replace />} />

      {/* ROTAS PÚBLICAS (COM HEADER) */}
      <Route element={<PublicLayout />}>
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Navigate to={state.isMobileBrowser ? "/app/explorar" : "/app/home"} replace />
            ) : (
              <PublicHome
                key={homeKey}
                onNavigate={handleNavigate}
                onStartNow={() => handleNavigate('register')}
                isAuthenticated={isAuthenticated}
                userEmail={user?.email}
                userMeta={userMeta}
                isPrivacyMode={isPrivacyMode}
              />
            )
          } 
        />

        <Route 
          path="/login" 
          element={<AuthLogin
              onSuccess={handleAuthSuccess}
              onSwitchToRegister={() => handleNavigate('register')}
            />} 
        />

        <Route 
          path="/register" 
          element={<AuthRegister
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={() => handleNavigate('login')}
            />} 
        />

        <Route path="/termos" element={<TermsPage />} />
        <Route path="/privacidade" element={<PrivacyPage />} />

        {/* ARTIGOS */}
        <Route path="/artigos/investir-2026" element={(() => {
            const article = getArticleById('investir-2026');
            if (!article) return <Navigate to="/" />;
            const ArticleComponent = article.component;
            return <ArticleComponent onNavigate={handleNavigate} />;
        })()} />
      </Route>

      {/* CURSOS */}
      <Route 
        path="/curso/*" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <CourseRoutesShell>
              <Routes>{courseRoutes}</Routes>
            </CourseRoutesShell>
          </ProtectedRoute>
        } 
      />

      {/* APP SHELL (ROTAS AUTENTICADAS COM LAYOUT COMPLETO) */}
      <Route 
        path="/app" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AppLayout state={state}>
              <Outlet />
            </AppLayout>
          </ProtectedRoute>
        }
      >
        <Route 
          path="home" 
          element={
            state.isMobileBrowser ? (
              <Navigate to="/app/explorar" replace />
            ) : (
              isAuthenticated && userMetaLoaded && userMeta?.onboardingCompleted === false ? (
                <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
                  <OnboardingWizard userId={user!.uid} onComplete={() => setOnboardingDismissed(true)} />
                </div>
              ) : (
                  <AppCockpit
                    transactions={state.lancamentos}
                    isPrivacyMode={state.isPrivacyMode}
                    onNavigate={(tool, state) => handleNavigate(tool, state)}
                    userMeta={userMeta}
                    isPremium={isPremium}
                    isPro={isPro}
                    isSyncing={state.isSyncing}
                  />
              )
            )
          } 
        />

        <Route
          path="controla"
          element={
            <ControlaPage
              transactions={lancamentos}
              isLoading={state.isLoading || (lancamentos.length === 0 && !txConnected)}
              isSyncing={state.isSyncing}
              isStale={!allReady && anyConnected}
              categories={categories}
              onDeleteTransaction={deleteLancamento}
              onNavigate={handleNavigate}
              onOpenForm={state.openTransactionForm}
              onSaveCategory={saveCategory}
              onDeleteCategory={deleteCategory}
              userMeta={userMeta}
              usagePercentage={usagePercentage}
              isPremium={isPro || isPremium}
              isLimitReached={isLimitReached}
              onShowPaywall={() => setActiveModal('paywall')}
              isPrivacyMode={isPrivacyMode}
              onTogglePrivacy={() => setIsPrivacyMode((prev) => !prev)}
              onEditTransaction={handleEditTransaction}
              fetchMonth={state.fetchMonth}
            />
          }
        />

        <Route 
          path="central" 
          element={
            <CentralHub
              isPro={isPro}
              isPremium={isPremium}
              lancamentos={lancamentos}
              userMeta={userMeta}
              onNavigate={handleNavigate}
            />
          } 
        />

        <Route path="explorar" element={<ExplorarHub onNavigate={handleNavigate} routerNavigate={routerNavigate} />} />

        <Route 
          path="ia" 
          element={
            <NexusBriefingView
              transactions={lancamentos}
              goals={[]}
              assets={state.assets}
              passives={state.passives}
              debts={state.debts}
            />
          } 
        />

        <Route path="mais" element={<SettingsPage onBack={() => handleNavigate('home')} />} />
        
        <Route 
          path="mais/pricing" 
          element={
            <PricingPage
              onNavigate={handleNavigate}
              currentPlan={isPremium ? 'premium' : isPro ? 'pro' : 'free'}
              onBack={() => handleNavigate('home')}
              isAuthenticated={isAuthenticated}
              userId={user?.uid}
            />
          } 
        />

        <Route 
          path="investimentos" 
          element={
            <ActiveWealthManager 
              userId={user?.uid}
              onNavigate={handleNavigate} 
            />
          } 
        />
        <Route path="passivos" element={<PassiveWealthManager userId={user?.uid} />} />
        <Route 
          path="minhas-dividas" 
          element={
            <DebtManager
              userId={user?.uid}
              userMeta={userMeta}
              lancamentos={lancamentos}
              onNavigate={handleNavigate}
              isSyncing={state.isSyncing}
            />
          } 
        />
        <Route path="metas" element={<GoalManager userId={user?.uid} userMeta={userMeta} />} />

        {/* FERRAMENTAS */}
        <Route path="ferramentas/fire" element={<FireCalculatorTool onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />} />
        <Route path="ferramentas/juros" element={<CompoundInterestTool onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />} />
        <Route path="ferramentas/inflacao" element={<InflationTool onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />} />
        <Route path="ferramentas/alugar" element={<RentVsFinanceTool onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />} />
        <Route path="ferramentas/dividas" element={<DebtOptimizerTool onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />} />
        <Route path="ferramentas/dividendos" element={<DividendsTool onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />} />
        <Route 
          path="ferramentas/compra-avista-parcelado" 
          element={
            <BuyCashOrInstallInvestTool onNavigate={handleNavigate} />
          } 
        />
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
