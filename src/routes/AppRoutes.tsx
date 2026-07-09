import React, { useCallback, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import OnboardingWizard from '../components/OnboardingWizard';
import AuthLogin from '../components/Auth/AuthLogin';
import AuthRegister from '../components/Auth/AuthRegister';
import PublicHome from '../components/PublicHome';
import SecurityLock from '../components/SecurityLock';
import { getArticleById } from '../components/Public/Articles';
import AppLoadingScreen from '../components/AppLoadingScreen';
import DashboardSkeleton from '../components/tools/finance/dashboard/DashboardSkeleton';
import PublicLayout from '../layouts/PublicLayout';
import FeatureGate from '../components/FeatureGate';
import PremiumUpgradePrompt from '../components/PremiumUpgradePrompt';
import { useNavigation } from '../hooks/useNavigation';
import { useEntitlement } from '../hooks/useEntitlement';
import { courseRoutes, CourseRoutesShell } from './courseRoutes';
import { useTransactionsContext } from '../contexts/TransactionsContext';
import { useDebtContext } from '../contexts/DebtContext';
import { useFinanceContext } from '../contexts/FinanceContext';
import { useWealthData } from '../hooks/useWealthData';
import { lazy } from 'react';

const AppLayout = lazy(() => import('../layouts/AppLayout'));
const AppCockpit = lazy(() => import('../components/Home/AppCockpit'));
const CentralHub = lazy(() => import('../components/CentralHub'));
const ExplorarHub = lazy(() => import('../components/ExplorarHub').then((mod) => ({ default: mod.ExplorarHub })));
const ControlaPage = lazy(() => import('../components/tools/finance/ControlaPage').then((mod) => ({ default: mod.ControlaPage })));
const AiAdvisor = lazy(() => import('../components/tools/nexus/AiAdvisor'));
const PricingPage = lazy(() => import('../components/PricingPage'));
const SettingsPage = lazy(() => import('../components/SettingsPage'));
const ActiveWealthManager = lazy(() => import('../components/tools/wealth/ActiveWealthManager').then((mod) => ({ default: mod.ActiveWealthManager })));
const PassiveWealthManager = lazy(() => import('../components/tools/wealth/PassiveWealthManager').then((mod) => ({ default: mod.PassiveWealthManager })));
const DebtManager = lazy(() => import('../components/tools/wealth/DebtManager').then((mod) => ({ default: mod.DebtManager })));
const GoalManager = lazy(() => import('../components/tools/goals/GoalManager'));
const FireCalculatorTool = lazy(() => import('../components/tools/FireCalculatorTool').then((mod) => ({ default: mod.FireCalculatorTool })));
const CompoundInterestTool = lazy(() => import('../components/tools/CompoundInterestTool').then((mod) => ({ default: mod.CompoundInterestTool })));
const InflationTool = lazy(() => import('../components/tools/InflationTool').then((mod) => ({ default: mod.InflationTool })));
const RentVsFinanceTool = lazy(() => import('../components/tools/RentVsFinanceTool').then((mod) => ({ default: mod.RentVsFinanceTool })));
const DebtOptimizerTool = lazy(() => import('../components/tools/DebtOptimizerTool').then((mod) => ({ default: mod.DebtOptimizerTool })));
const DividendsTool = lazy(() => import('../components/tools/DividendsTool').then((mod) => ({ default: mod.DividendsTool })));
const BuyCashOrInstallInvestTool = lazy(() => import('../components/tools/buy-cash-or-installments/BuyCashOrInstallInvestTool'));
const TermsPage = lazy(() => import('../components/TermsPage').then((mod) => ({ default: mod.TermsPage })));
const PrivacyPage = lazy(() => import('../components/PrivacyPage').then((mod) => ({ default: mod.PrivacyPage })));

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
  const wealthData = useWealthData();

  const [loadingTime, setLoadingTime] = React.useState(0);
  const allReady = bridgeReady && debtBridgeReady && financeBridgeReady;

  // Para de incrementar quando allReady ou após 1s — evita re-renders perpétuos
  React.useEffect(() => {
    if (allReady) return;

    const timer = setInterval(() => {
      setLoadingTime(prev => {
        if (prev >= 1000) {
          clearInterval(timer);
          return prev;
        }
        return prev + 100;
      });
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, [allReady]);
  const anyConnected = txConnected || debtConnected || financeConnected;

  // Debounce de 2s para o banner "Modo Offline" — evita flicker em atrasos transitórios
  const [showStale, setShowStale] = React.useState(false);
  React.useEffect(() => {
    if (allReady || !anyConnected) {
      setShowStale(false);
      return;
    }
    const id = setTimeout(() => setShowStale(true), 2000);
    return () => clearTimeout(id);
  }, [allReady, anyConnected]);

  // CARREGAMENTO MÍNIMO (Correção #1)
  // Libera assim que as bridges conectarem ou após 1s (timeout de segurança)
  
  const showFullLoading = !allReady && loadingTime < 1000;

  const { effectiveTier } = useEntitlement();
  const isPro = effectiveTier !== 'free';
  const isPremium = effectiveTier === 'premium';

  const {
    handleNavigate,
    handleAuthSuccess,
    homeKey,
    currentTool
  } = useNavigation();

  const handleTogglePrivacy = useCallback(() => {
    state.setIsPrivacyMode((prev: boolean) => !prev);
  }, [state.setIsPrivacyMode]);

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
    isAppLocked,
    storedPin,
    handleUnlockSuccess,
    isPrivacyMode,
    setActiveModal,
    setOnboardingDismissed,
    routerNavigate,
    handleEditTransaction,
    getAiContextTransactions,
  } = state;

  // Hook moved above to maintain consistent order

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
              <Navigate to="/app/home" replace />
            ) : (
              <React.Suspense fallback={<AppLoadingScreen />}>
                <PublicHome
                  key={homeKey}
                  onNavigate={handleNavigate}
                  onStartNow={() => handleNavigate('register')}
                  isAuthenticated={isAuthenticated}
                  userEmail={user?.email}
                  userMeta={userMeta}
                  isPrivacyMode={isPrivacyMode}
                />
              </React.Suspense>
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

        <Route path="/termos" element={<React.Suspense fallback={<AppLoadingScreen />}><TermsPage /></React.Suspense>} />
        <Route path="/privacidade" element={<React.Suspense fallback={<AppLoadingScreen />}><PrivacyPage /></React.Suspense>} />

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
            <React.Suspense fallback={<AppLoadingScreen />}>
              <AppLayout state={state}>
                <Outlet />
              </AppLayout>
            </React.Suspense>
          </ProtectedRoute>
        }
      >
        <Route 
          path="home" 
          element={
            isAuthenticated && userMetaLoaded && userMeta?.onboardingCompleted === false ? (
              <div className="min-h-screen bg-surface-primary flex items-center justify-center px-4">
                <OnboardingWizard userId={user!.uid} onComplete={() => setOnboardingDismissed(true)} />
              </div>
            ) : (
              <React.Suspense fallback={<DashboardSkeleton />}>
                <AppCockpit
                  transactions={state.lancamentos}
                  isPrivacyMode={state.isPrivacyMode}
                  onNavigate={(tool, state) => handleNavigate(tool, state)}
                  onOpenForm={state.openTransactionForm}
                  userMeta={userMeta}
                  isSyncing={state.isSyncing}
                />
              </React.Suspense>
            )
          } 
        />

        <Route
          path="controla"
          element={
            <Suspense fallback={<DashboardSkeleton />}>
              <ControlaPage
                transactions={lancamentos}
                isLoading={state.isLoading || (lancamentos.length === 0 && !txConnected)}
                userMetaLoading={state.userMetaLoading}
                isSyncing={state.isSyncing}
                isStale={showStale}
                categories={categories}
                onDeleteTransaction={deleteLancamento}
                onNavigate={handleNavigate}
                onOpenForm={state.openTransactionForm}
                onSaveCategory={saveCategory}
                onDeleteCategory={deleteCategory}
                userMeta={userMeta}
                isPremium={isPro || isPremium}
                isPrivacyMode={isPrivacyMode}
                onTogglePrivacy={handleTogglePrivacy}
                onEditTransaction={handleEditTransaction}
                fetchMonth={state.fetchMonth}
              />
            </Suspense>
          }
        />

        <Route 
          path="central" 
          element={
            <React.Suspense fallback={<DashboardSkeleton />}>
              <CentralHub
                lancamentos={lancamentos}
                userMeta={userMeta}
                onNavigate={handleNavigate}
              />
            </React.Suspense>
          } 
        />

        <Route path="explorar" element={<React.Suspense fallback={<DashboardSkeleton />}><ExplorarHub onNavigate={handleNavigate} routerNavigate={routerNavigate} /></React.Suspense>} />

        <Route 
          path="ia" 
          element={
            <React.Suspense fallback={<DashboardSkeleton />}>
              <AiAdvisor
                transactions={state.getAiContextTransactions()}
                currentCalcResult={[]}
                goals={wealthData.goals}
                assets={wealthData.assets}
                passives={wealthData.passives}
                debts={wealthData.debts}
                currentTool={currentTool}
              />
            </React.Suspense>
          } 
        />

        <Route path="mais" element={<React.Suspense fallback={<DashboardSkeleton />}><SettingsPage onBack={() => handleNavigate('home')} /></React.Suspense>} />
        
        <Route path="mais/pricing" element={<React.Suspense fallback={<DashboardSkeleton />}><PricingPage /></React.Suspense>} />

        <Route 
          path="investimentos" 
          element={
            <FeatureGate
              featureKey="investments"
              fallback={
                <PremiumUpgradePrompt
                  title="Investimentos"
                  description="Acompanhe sua carteira, alocação e evolução patrimonial com o módulo de investimentos do Premium."
                  onNavigate={handleNavigate}
                />
              }
            >
              <ActiveWealthManager 
                userId={user?.uid}
                onNavigate={handleNavigate} 
              />
            </FeatureGate>
          } 
        />
        <Route
          path="passivos"
          element={
            <FeatureGate
              featureKey="passives"
              fallback={
                <PremiumUpgradePrompt
                  title="Patrimônio e Passivos"
                  description="Organize bens, passivos e visão patrimonial completa — recurso exclusivo do Premium."
                  onNavigate={handleNavigate}
                />
              }
            >
              <PassiveWealthManager userId={user?.uid} />
            </FeatureGate>
          }
        />
        <Route 
          path="minhas-dividas" 
          element={
            <FeatureGate
              featureKey="debts"
              fallback={
                <PremiumUpgradePrompt
                  title="Minhas Dívidas"
                  description="Estratégia de quitação, projeções e acompanhamento inteligente das suas dívidas — disponível no Premium."
                  onNavigate={handleNavigate}
                />
              }
            >
              <DebtManager
                userId={user?.uid}
                userMeta={userMeta}
                lancamentos={lancamentos}
                onNavigate={handleNavigate}
                isSyncing={state.isSyncing}
              />
            </FeatureGate>
          } 
        />
        <Route path="metas" element={<React.Suspense fallback={<DashboardSkeleton />}><GoalManager userId={user?.uid} userMeta={userMeta} /></React.Suspense>} />

        {/* FERRAMENTAS */}
        <Route path="ferramentas/fire" element={<React.Suspense fallback={<DashboardSkeleton />}><FireCalculatorTool onNavigate={handleNavigate} isAuthenticated={isAuthenticated} /></React.Suspense>} />
        <Route path="ferramentas/juros" element={<React.Suspense fallback={<DashboardSkeleton />}><CompoundInterestTool onNavigate={handleNavigate} isAuthenticated={isAuthenticated} /></React.Suspense>} />
        <Route path="ferramentas/inflacao" element={<React.Suspense fallback={<DashboardSkeleton />}><InflationTool onNavigate={handleNavigate} isAuthenticated={isAuthenticated} /></React.Suspense>} />
        <Route path="ferramentas/alugar" element={<React.Suspense fallback={<DashboardSkeleton />}><RentVsFinanceTool onNavigate={handleNavigate} isAuthenticated={isAuthenticated} /></React.Suspense>} />
        <Route path="ferramentas/dividas" element={<React.Suspense fallback={<DashboardSkeleton />}><DebtOptimizerTool onNavigate={handleNavigate} isAuthenticated={isAuthenticated} /></React.Suspense>} />
        <Route path="ferramentas/dividendos" element={<React.Suspense fallback={<DashboardSkeleton />}><DividendsTool onNavigate={handleNavigate} isAuthenticated={isAuthenticated} /></React.Suspense>} />
        <Route 
          path="ferramentas/compra-avista-parcelado" 
          element={
            <React.Suspense fallback={<DashboardSkeleton />}><BuyCashOrInstallInvestTool onNavigate={handleNavigate} /></React.Suspense>
          } 
        />
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default React.memo(AppRoutes);
