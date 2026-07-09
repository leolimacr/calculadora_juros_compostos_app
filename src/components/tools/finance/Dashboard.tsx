import React, { useMemo } from 'react';
import { RefreshCw, Plus, ChevronUp, ChevronDown, PiggyBank, X, CreditCard } from 'lucide-react';

// Hooks e Componentes Originais Reutilizados
import FilterBar from './FilterBar';
import CategoryManager from './CategoryManager';
import RecurringBillManager from './RecurringBillManager';
import CardManager from './CardManager';
import BudgetSetupSheet from './BudgetSetupSheet';
import BudgetStatusCard from './BudgetStatusCard';
import BudgetExceededBanner from './BudgetExceededBanner';
import { calcBudgetProgress } from '../../../services/budgetMath';

// Subcomponentes Refatorados
import { useDashboardState } from './dashboard/useDashboardState';
import DashboardSkeleton from './dashboard/DashboardSkeleton';
import DashboardHeader from './dashboard/DashboardHeader';
import BalanceCards from './dashboard/BalanceCards';
import PendingObligations from './dashboard/PendingObligations';
import DashboardCharts from './dashboard/DashboardCharts';
import TransactionList from './dashboard/TransactionList';
import CategorySummaryPanel from './dashboard/CategorySummaryPanel';
import AveragesAnalysisPanel from './dashboard/AveragesAnalysisPanel';
import RecurringIntroModal from './dashboard/RecurringIntroModal';
import CalibrationInviteBanner from './dashboard/CalibrationInviteBanner';
import CommandCalibration from '../nexus/CommandCalibration';
import { seedPersonaFromIntent } from '../../../services/personaService';
import { getFlowLabels } from '../../../theme/fpiVoiceGuide';
import PaywallModal from '../../PaywallModal';

const Dashboard: React.FC<any> = (props) => {
  const state = useDashboardState(props);
  const voice = getFlowLabels(state.commandMode);

  if (state.showSkeleton) {
    return <DashboardSkeleton />;
  }

  const budgetProgress = useMemo(
    () => (state.currentBudget ? calcBudgetProgress(state.currentBudget, state.safeTransactions) : null),
    [state.currentBudget, state.safeTransactions],
  );

  const totalOutstandingCredit = state.activeInvoices.reduce(
    (sum, inv: any) => {
      if (inv.storedStatus === 'paid') return sum;
      return sum + Math.max(0, inv.storedRemaining || inv.total || 0);
    }, 0
  );

  // BalanceCards, DashboardCharts, CategorySummaryPanel são usados diretamente
  // sem memo-aninhado — o React.memo na exportação do Dashboard já protege a subárvore

  if (state.showSkeleton) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="dashboard-root">
      <CategoryManager 
        isOpen={state.isCategoryModalOpen} 
        onClose={() => state.setIsCategoryModalOpen(false)} 
        categories={state.categories} 
        onSave={state.onSaveCategory} 
        onDelete={state.onDeleteCategory}
        commandMode={state.commandMode}
      />

      {/* SYNC BANNER */}
      {state.isStale && (
        <div className="flex items-center justify-between gap-4 px-6 py-3 bg-amber-50 border border-amber-100 rounded-3xl animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
              <RefreshCw size={16} className="animate-spin" />
            </div>
            <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
              Modo Offline / Sincronizando: Alguns dados podem estar desatualizados
            </p>
          </div>
          <span className="text-[8px] font-bold text-amber-500 uppercase px-2 py-1 bg-white rounded-lg border border-amber-100">
            Somente Leitura
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-14 md:pt-6 pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 bg-surface-secondary rounded-5xl border border-surface-elevated shadow-card">
        
        {/* Cabeçalho superior */}
        <DashboardHeader
          showBackToTools={state.showBackToTools}
          onNavigate={state.onNavigate}
          periodLabel={state.periodLabel}
          streak={state.streak}
          monthlyConsistency={state.monthlyConsistency}
          isMobile={state.isMobile}
          isPrivacyMode={state.isPrivacyMode}
          onTogglePrivacy={state.onTogglePrivacy}
          onOpenForm={state.onOpenForm}
          handleRecurringButtonClick={state.handleRecurringButtonClick}
        />

        {/* Cartões de saldo de topo */}
        {state.showCalibrationOffer && (
          <CalibrationInviteBanner
            title={state.calibrationInviteCopy.title}
            body={state.calibrationInviteCopy.body}
            onStart={state.handleStartCalibration}
            onDefer={state.handleDeferCalibration}
            onDismiss={state.handleDismissCalibrationInvite}
          />
        )}

        <BalanceCards
          isPrivacyMode={state.isPrivacyMode}
          commandMode={state.commandMode}
          hasHistoryAccess={state.hasHistoryAccess}
          stats={state.stats}
          totalPendingBills={state.totalPendingBills}
          totalOutstandingCredit={totalOutstandingCredit}
          projectedBalance={state.projectedBalance}
          freeBalance={state.stats.freeBalance}
          activeInvoices={state.activeInvoices}
          periodLabel={state.periodLabel}
        />

        {/* Obrigações pendentes (Contas fixas e faturas ativas) */}
        <PendingObligations
          activeInvoices={state.activeInvoices}
          pendingBills={state.pendingBills}
          recurringBills={state.recurringBills}
          safeTransactions={state.safeTransactions}
          isPrivacyMode={state.isPrivacyMode}
          onOpenForm={state.onOpenForm}
          onNavigate={state.onNavigate}
        />

        {/* Orçamento do Mês — Card de progresso ou CTA de criação */}
        {!state.isFirstAccess && !state.budgetLoading && state.currentBudget && (
          <>
            <BudgetStatusCard
              budget={state.currentBudget}
              transactions={state.safeTransactions}
              onEdit={() => state.setIsBudgetSetupOpen(true)}
            />
            <BudgetExceededBanner
              progress={budgetProgress}
              onEdit={() => state.setIsBudgetSetupOpen(true)}
            />
          </>
        )}
        {!state.isFirstAccess && !state.budgetLoading && !state.currentBudget && (
          <div className="bg-surface-primary border border-surface-elevated rounded-4xl p-5 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-secondary/10 rounded-2xl text-brand-secondary flex-shrink-0">
                <PiggyBank size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-text-primary uppercase tracking-ultra-wide mb-0.5">
                  Orçamento do Mês
                </p>
                <p className="text-xxs text-text-secondary font-medium leading-relaxed">
                  Defina limites de gastos por categoria e acompanhe seu progresso em tempo real.
                </p>
              </div>
              <button
                onClick={() => state.setIsBudgetSetupOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-3xl font-black text-xxs uppercase tracking-ultra-wide bg-brand-primary text-text-onBrand hover:bg-brand-primary/90 transition-all active:scale-95 shadow-brand-glow flex-shrink-0"
              >
                <Plus size={14} />
                Criar
              </button>
            </div>
          </div>
        )}

        {/* Painel educativo ou Estado de primeiro acesso */}
        {state.isFirstAccess ? (
          state.userMetaLoading && state.userMeta == null ? (
            <div className="py-16 px-6 bg-surface-primary border border-dashed border-brand-primary/30 rounded-4xl text-center animate-pulse">
              <div className="w-16 h-16 bg-surface-secondary rounded-3xl border border-surface-elevated mx-auto mb-5" />
              <div className="h-5 w-56 bg-surface-secondary rounded-full mx-auto mb-3" />
              <div className="h-4 w-72 max-w-full bg-surface-secondary rounded-full mx-auto mb-2" />
              <div className="h-4 w-64 max-w-full bg-surface-secondary rounded-full mx-auto mb-6" />
              <div className="h-12 w-40 bg-surface-secondary rounded-3xl mx-auto" />
            </div>
          ) : (
            <div className="py-16 px-6 bg-surface-primary border border-dashed border-brand-primary/30 rounded-4xl text-center">
              <div className="w-16 h-16 bg-surface-secondary rounded-3xl border border-surface-elevated flex items-center justify-center mx-auto mb-5">
                <Plus size={28} className="text-brand-primary" />
              </div>
              <p className="text-text-primary font-black text-lg mb-2">
                {state.userMeta?.isFirstSession ? 'Aqui você não olha só o saldo da conta.' : 'Seu painel está em branco'}
              </p>
              <p className="text-text-secondary text-sm max-w-sm mx-auto leading-relaxed mb-6">
                {state.userMeta?.isFirstSession ? voice.firstLaunchHint : voice.emptyLaunchHint}
              </p>
              <button
                onClick={state.onOpenForm}
                className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-text-onBrand font-black text-xxs uppercase tracking-ultra-wide px-6 py-3 rounded-3xl transition-all active:scale-95 shadow-brand-glow"
              >
                <Plus size={14} /> {voice.registerCta}
              </button>
            </div>
          )
        ) : (
          /* Seção de Gráficos */
          <DashboardCharts
            categoryStats={state.categoryStats}
            stats={state.stats}
            commandMode={state.commandMode}
          />
        )}

        {/* Filtros e Lista Histórica de Lançamentos */}
        {!state.isFirstAccess && (
          <div className="space-y-6">
            <div className="space-y-3">
              <FilterBar 
                selectedCategories={state.selectedCategories} 
                setSelectedCategories={state.setSelectedCategories}
                typeFilter={state.typeFilter}
                setTypeFilter={state.setTypeFilter}
                categories={state.categoryNames}
                viewMode={state.viewMode}
                setViewMode={state.setViewMode}
                changeDate={state.changeDate}
                periodLabel={state.periodLabel}
                onExportPDF={state.handleExportPDF}
                startDate={state.startDate}
                endDate={state.endDate}
                setStartDate={state.setStartDate}
                setEndDate={state.setEndDate}
                onOpenCategoryManager={() => state.setIsCategoryModalOpen(true)}
                onDateSelect={state.handleDateSelect}
                sortMode={state.sortMode}
                setSortMode={state.setSortMode}
                searchQuery={state.searchQuery}
                setSearchQuery={state.setSearchQuery}
                commandMode={state.commandMode}
                historyLocked={state.historyLocked}
                currentMonthStartIso={state.currentMonthStartIso}
              />

              {/* Banner de filtro ativo por cartão */}
              {state.filterCardId && (
                <div className="flex items-center justify-between gap-3 px-5 py-3 bg-brand-secondary/10 border border-brand-secondary/20 rounded-3xl animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-brand-secondary/20 rounded-xl text-brand-secondary shrink-0">
                      <CreditCard size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xxs font-black text-text-muted uppercase tracking-ultra-wide">
                        Fatura
                      </p>
                      <p className="text-sm font-black text-text-primary truncate">
                        {state.filterCardName}
                      </p>
                      {state.filterPeriodStart && state.filterPeriodEnd && (
                        <p className="text-xxs font-bold text-text-muted mt-0.5">
                          {new Date(state.filterPeriodStart.replace(/-/g, '/')).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a {new Date(state.filterPeriodEnd.replace(/-/g, '/')).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={state.handleClearCardFilter}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/80 hover:bg-white text-text-muted hover:text-status-danger font-black text-[10px] uppercase tracking-widest border border-surface-elevated transition-all active:scale-95 shrink-0"
                  >
                    <X size={14} />
                    Limpar filtro
                  </button>
                </div>
              )}

              {/* Toggle de exibição */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
                <button
                  type="button"
                  onClick={() => state.setShowTransactions(!state.showTransactions)}
                  className={`flex items-center justify-center gap-2 px-5 py-3 rounded-3xl text-xxs font-black uppercase tracking-ultra-wide border transition-all active:scale-95 w-full sm:w-auto ${
                    state.showTransactions
                      ? 'bg-surface-elevated border-surface-elevated text-text-secondary hover:bg-surface-secondary'
                      : 'bg-status-success/10 border-brand-primary/30 text-brand-primary hover:bg-status-success/20'
                  }`}
                >
                  {state.showTransactions ? 'Recolher lançamentos' : 'Mostrar lançamentos'}
                  {state.showTransactions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                <div className="text-xxs font-bold text-text-muted uppercase tracking-ultra-wide text-center sm:text-right">
                  {state.filtered.length} lançamento{state.filtered.length !== 1 ? 's' : ''}{state.showTransactions ? '' : ' oculto(s)'}
                </div>
              </div>

              <TransactionList
                transactions={state.filtered}
                visibleCount={state.visibleCount}
                setVisibleCount={state.setVisibleCount}
                showTransactions={state.showTransactions}
                setShowTransactions={state.setShowTransactions}
                onDelete={state.onDeleteTransaction}
                onEdit={state.onEditTransaction}
                isPrivacyMode={state.isPrivacyMode}
                isStale={state.isStale}
              />
            </div>

            {/* Painel de Resumo por Categoria */}
            <CategorySummaryPanel 
              categorySummary={state.categorySummary} 
              categoryTransactionsMap={state.categoryTransactionsMap} 
              isPrivacyMode={state.isPrivacyMode}
              commandMode={state.commandMode}
            />

            {/* Painel de Análise de Médias */}
            <AveragesAnalysisPanel 
              userUid={state.user?.uid} 
              isReady={state.isReady} 
              safeTransactions={state.historyVisibleTransactions} 
              isPrivacyMode={state.isPrivacyMode} 
              hasHistoryAccess={state.hasHistoryAccess}
              onHistoryBlocked={() => state.setShowHistoryPaywall(true)}
            />

            {/* Somatório Final do Resultado do Período */}
            {state.filtered.length > 0 && (
              <div className="bg-surface-primary border border-surface-elevated rounded-3xl p-5 mt-4 shadow-soft">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xxs font-black text-text-muted uppercase tracking-ultra-wide">Resultado dos filtros</span>
                    <span className="text-xxs text-text-secondary">({state.filtered.length} lançamento{state.filtered.length !== 1 ? 's' : ''})</span>
                  </div>
                  <div className="flex items-center gap-6">
                    {(() => {
                      let totalIncome = 0;
                      let totalExpense = 0;
                      state.filtered.forEach((t: any) => {
                        const val = Number(t?.amount) || 0;
                        if (t?.type === 'income') totalIncome += val;
                        else totalExpense += val;
                      });
                      const net = totalIncome - totalExpense;

  return (
                        <>
                          {totalIncome > 0 && (
                            <div className="text-center">
                              <p className="text-xxs font-black text-text-muted uppercase mb-1">{voice.income}</p>
                              <p className="text-sm font-black text-brand-primary">  
                                {state.isPrivacyMode ? '••••' : `R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                              </p>
                            </div>
                          )}
                          {totalExpense > 0 && (
                            <div className="text-center">
                              <p className="text-xxs font-black text-text-muted uppercase mb-1">{voice.expense}</p>
                              <p className="text-sm font-black text-status-danger">  
                                {state.isPrivacyMode ? '••••' : `R$ ${totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                              </p>
                            </div>
                          )}
                          <div className="text-center border-l border-surface-elevated pl-6">
                            <p className="text-xxs font-black text-text-muted uppercase mb-1">Total</p>
                            <p className={`text-lg font-black ${net >= 0 ? 'text-brand-primary' : 'text-status-danger'}`}>
                              {state.isPrivacyMode ? '••••' : `R$ ${net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modais de Gerenciamento secundários */}
      <RecurringBillManager 
        isOpen={state.isRecurringBillModalOpen} 
        onClose={() => {
          state.setIsRecurringBillModalOpen(false);
        }} 
        userId={state.user?.uid || ''} 
        categories={state.categories}
      />

      <CardManager
        isOpen={state.isCardModalOpen}
        onClose={() => {
          state.setIsCardModalOpen(false);
          state.setFocusedCardId(null);
        }}
        userId={state.user?.uid || ''}
        transactions={state.safeTransactions}
        onEditTransaction={state.onEditTransaction}
        focusedCardId={state.focusedCardId}
        contextualReason={state.cardManagerReason ?? undefined}
      />

      {/* Modal Educativo Mobile */}
      <RecurringIntroModal
        isOpen={state.showIntro}
        dontShowFor15Days={state.dontShowFor15Days}
        setDontShowFor15Days={state.setDontShowFor15Days}
        onConfirm={state.handleConfirmIntro}
      />

      {state.showCalibrationModal && state.user?.uid && (
        <CommandCalibration
          userId={state.user.uid}
          initialAnswers={seedPersonaFromIntent(state.userMeta?.onboardingPersona || 'geral')}
          onComplete={state.handleCalibrationComplete}
          onClose={() => state.setShowCalibrationModal(false)}
        />
      )}

      <PaywallModal
        open={state.showHistoryPaywall}
        onClose={() => state.setShowHistoryPaywall(false)}
        feature="historico completo"
      />

      <BudgetSetupSheet
        isOpen={state.isBudgetSetupOpen}
        onClose={() => state.setIsBudgetSetupOpen(false)}
        userId={state.user?.uid || ''}
        categories={state.categories}
        transactions={state.safeTransactions}
        monthlyIncome={state.userMeta?.financialProfile?.monthlyIncome || state.stats.income || 0}
        onSaved={() => state.setIsBudgetSetupOpen(false)}
      />
    </div>
  );
};

export default React.memo(Dashboard);
