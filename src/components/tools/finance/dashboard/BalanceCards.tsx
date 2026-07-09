import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { DISPONIBILIDADE_REAL } from '../../../../theme/fpiVoiceGuide';

interface BalanceCardsProps {
  isPrivacyMode: boolean;
  commandMode: boolean;
  hasHistoryAccess: boolean;
  stats: {
    balance: number;
    income: number;
    expenses: number;
    cashExpenses: number;
    creditExpenses: number;
    virtualExpenses: number;
    accumulatedBalance: number;
    accumulatedIncome: number;
    accumulatedExpenses: number;
    accumulatedCashExpenses: number;
    accumulatedCreditExpenses: number;
    accumulatedVirtualExpenses: number;
    creditTransactions?: Array<{
      id: string;
      description: string;
      amount: number;
      date: string;
      paymentMethod: string;
      isVirtual: boolean;
      cardName: string;
    }>;
  };
  totalPendingBills: number;
  totalOutstandingCredit: number;
  projectedBalance: number;
  freeBalance: number;
  activeInvoices?: Array<{
    cardId: string;
    cardName: string;
    total: number;
    periodStart: string;
    periodEnd: string;
    dueDate: string;
    storedStatus?: string | null;
    storedRemaining?: number;
    storedPaidAmount?: number;
    transactions?: Array<{
      id: string;
      description?: string;
      amount?: number | string;
      date: string;
      installments?: number;
      currentInstallment?: number;
    }>;
  }>;
  periodLabel?: string;
  freedomDeficit?: number;
  protectionBuffer?: number;
  leewayDays?: number;
}

const BalanceCards: React.FC<BalanceCardsProps> = ({
  isPrivacyMode,
  commandMode,
  hasHistoryAccess,
  stats,
  totalPendingBills,
  totalOutstandingCredit,
  projectedBalance,
  periodLabel = '',
  activeInvoices = [],
}) => {
  const [showComposition, setShowComposition] = useState(false);
  const [showCreditDetails, setShowCreditDetails] = useState(false);
  const [showCreditBreakdown, setShowCreditBreakdown] = useState(false);
  const showAllTime = hasHistoryAccess;

  const displayBalance = showAllTime ? stats.accumulatedBalance : stats.balance;
  const isNegative = displayBalance < 0;
  const afterCredit = displayBalance - totalOutstandingCredit;
  const afterCreditNegative = afterCredit < 0;

  const fmt = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

  return (
    <div className="bg-surface-primary border border-surface-elevated rounded-4xl p-5 shadow-soft flex flex-col md:grid md:grid-cols-2 gap-6">
      <div className="flex flex-col">
        <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 items-baseline mt-4 pl-6">
          {/* Row 1: Saldo Atual */}
          <div className="flex flex-col gap-0.5">
            <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide">{DISPONIBILIDADE_REAL.saldoAtualLabel}</p>
            <p className="text-[10px] text-text-muted font-medium">{showAllTime ? DISPONIBILIDADE_REAL.saldoAtualHelp : 'Saldo do mês atual — resultado de todas as receitas e despesas deste mês.'}</p>
            {showAllTime && (
              <button
                type="button"
                onClick={() => setShowComposition(!showComposition)}
                className="flex items-center gap-1 text-[9px] font-bold text-text-muted hover:text-text-secondary transition-colors mt-0.5 self-start"
                aria-expanded={showComposition}
              >
                <span>{showComposition ? 'Recolher composição' : 'Ver composição'}</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${showComposition ? 'rotate-180' : ''}`}
                />
              </button>
            )}
          </div>
          <h2 className={`text-right text-3xl font-black tabular-nums tracking-tight ${isNegative ? 'text-status-danger' : 'text-text-primary'}`}>
            {isPrivacyMode ? '••••••' : fmt(displayBalance)}
          </h2>

          {/* Row 2: Expandable composition — logo abaixo do toggle, antes da dedução */}
          {showAllTime && showComposition && (
            <div className="col-span-2 mt-1 mb-1 rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">{DISPONIBILIDADE_REAL.composicaoTitle}</p>
              <div className="flex justify-between text-[12px]">
                <span className="text-slate-500">Receitas totais</span>
                <span className="font-black text-brand-primary tabular-nums">{isPrivacyMode ? '••••' : fmt(stats.accumulatedIncome)}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-slate-500">− Saídas (dinheiro)</span>
                <span className="font-black text-red-600 tabular-nums">−{isPrivacyMode ? '••••' : fmt(stats.accumulatedCashExpenses)}</span>
              </div>
              <div className="border-t border-slate-100 pt-1.5 flex justify-between text-[12px] font-black">
                <span className="text-slate-700">= Saldo atual</span>
                <span className={`tabular-nums ${displayBalance >= 0 ? 'text-text-primary' : 'text-status-danger'}`}>
                  {isPrivacyMode ? '••••' : fmt(displayBalance)}
                </span>
              </div>
            </div>
          )}

          {/* Row 3 + 4: dedução do cartão e resultado (apenas se houver fatura pendente) */}
          {totalOutstandingCredit > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowCreditDetails((prev) => !prev)}
                className="col-span-2 grid grid-cols-subgrid text-left"
                aria-label="Expandir detalhes das faturas"
                aria-expanded={showCreditDetails}
              >
                <span className="text-xs text-text-muted font-normal leading-relaxed flex items-center gap-1">
                  {DISPONIBILIDADE_REAL.saldoAtualCreditCard}
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${showCreditDetails ? 'rotate-180' : ''}`}
                  />
                </span>
                <span className="text-right text-base font-medium text-red-600 tabular-nums">− {isPrivacyMode ? '••••' : fmt(totalOutstandingCredit)}</span>
              </button>

              {showCreditDetails && (
                <div className="col-span-2 rounded-2xl bg-slate-50 border border-slate-100 p-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  {activeInvoices.length === 0 ? (
                    <div className="text-sm text-text-secondary text-center py-4">
                      Nenhuma fatura ativa encontrada.
                    </div>
                  ) : (
                    <>
                      {/* Aggregate summary per card */}
                      <div className="space-y-2 mb-4">
                        {activeInvoices
                          .filter((inv) => inv.storedStatus !== 'paid')
                          .map((inv) => {
                            const amt = Math.max(0, inv.storedRemaining || inv.total || 0);
                            return (
                              <div key={inv.cardId} className="flex justify-between text-[12px]">
                                <span className="text-slate-600 font-medium">{inv.cardName}</span>
                                <span className="font-black text-text-primary tabular-nums">{fmt(amt)}</span>
                              </div>
                            );
                          })}
                        <div className="border-t border-slate-100 pt-2 flex justify-between text-[12px] font-black">
                          <span className="text-slate-700">{DISPONIBILIDADE_REAL.totalEmAberto}</span>
                          <span className="text-red-600 tabular-nums">{fmt(totalOutstandingCredit)}</span>
                        </div>
                      </div>

                      {/* Per-card transaction details with lighter weight */}
                      <div className="space-y-4">
                        {activeInvoices.map((invoice) => (
                          <section key={`${invoice.cardId}-${invoice.periodEnd}`} className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">{invoice.cardName}</p>
                                <p className="text-[10px] text-text-muted mt-0.5">
                                  Período {new Date(invoice.periodStart.replace(/-/g, '/')).toLocaleDateString('pt-BR')} a {new Date(invoice.periodEnd.replace(/-/g, '/')).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Vencimento</p>
                                <p className="text-[10px] font-black text-text-primary mt-0.5">{new Date(invoice.dueDate.replace(/-/g, '/')).toLocaleDateString('pt-BR')}</p>
                              </div>
                            </div>

                            <div className="space-y-1">
                              {(invoice.transactions || []).length > 0 ? (
                                invoice.transactions!.map((t) => (
                                  <div key={t.id} className="flex items-start justify-between gap-4 py-1.5">
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium text-text-primary truncate">{t.description || 'Sem descrição'}</p>
                                      <p className="text-[9px] text-text-muted">{new Date(t.date.replace(/-/g, '/')).toLocaleDateString('pt-BR')}</p>
                                      {t.installments && t.installments > 1 && (
                                        <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary mt-0.5">
                                          {t.currentInstallment}/{t.installments} parcelas
                                        </p>
                                      )}
                                    </div>
                                    <p className="text-xs font-black text-text-primary shrink-0">
                                      {isPrivacyMode ? '••••' : `R$ ${Number(t.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-[10px] text-text-muted py-2">Nenhum lançamento encontrado neste período.</p>
                              )}
                            </div>
                          </section>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              <span className="text-xs text-text-muted font-medium leading-relaxed pt-1.5 border-t border-gray-200">{DISPONIBILIDADE_REAL.saldoAtualAfterCredit}</span>
              <span className={`text-right text-base font-semibold tabular-nums pt-1.5 border-t border-gray-200 ${afterCreditNegative ? 'text-status-danger' : 'text-text-primary'}`}>
                = {isPrivacyMode ? '••••' : fmt(Math.max(0, afterCredit))}
              </span>
              <p className="col-start-2 text-[8px] text-text-muted font-medium mt-0 leading-tight text-right">{DISPONIBILIDADE_REAL.saldoMaisConservador}</p>
            </>
          )}
        </div>

        {/* Mobile: decomposição Entradas/Saídas/Saldo — visível logo após o saldo, antes do cartão */}
        <div className="flex flex-col gap-3 mt-4 md:hidden">
          {periodLabel && (
            <>
              <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide">Resumo de {periodLabel}</p>
              <p className="text-[10px] text-text-muted font-medium -mt-2">{DISPONIBILIDADE_REAL.movimentacaoPeriodoHelp}</p>
            </>
          )}
          <div className="flex justify-between items-center">
            <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide">{DISPONIBILIDADE_REAL.entradasLabel}</p>
            <p className="text-lg font-black text-brand-primary tabular-nums">
              {isPrivacyMode ? '••••' : fmt(stats.income)}
            </p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide">{DISPONIBILIDADE_REAL.saidasDinheiroLabel}</p>
            <p className="text-lg font-black text-red-600 tabular-nums">
              {isPrivacyMode ? '••••' : fmt(stats.cashExpenses)}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setShowCreditBreakdown((prev) => !prev)}
              className="flex justify-between items-center w-full text-left"
              aria-expanded={showCreditBreakdown}
              aria-label="Ver detalhamento das compras no crédito"
            >
              <span className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide flex items-center gap-1">
                {DISPONIBILIDADE_REAL.comprasCreditoMes}
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${showCreditBreakdown ? 'rotate-180' : ''}`}
                />
              </span>
              <p className="text-lg font-black text-text-muted tabular-nums">
                {isPrivacyMode ? '••••' : fmt(stats.creditExpenses + stats.virtualExpenses)}
              </p>
            </button>

            {showCreditBreakdown && stats.creditTransactions && stats.creditTransactions.length > 0 && (
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                  <span>{stats.creditTransactions.length} {stats.creditTransactions.length === 1 ? 'compra' : 'compras'} no crédito no período</span>
                  <span className="font-black text-text-primary tabular-nums">{fmt(stats.creditExpenses + stats.virtualExpenses)}</span>
                </div>
                <div className="border-t border-slate-100" />
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {stats.creditTransactions.map((t) => (
                    <div key={t.id} className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-text-primary truncate">{t.description}</p>
                        <p className="text-[9px] text-text-muted">
                          {new Date(t.date.replace(/-/g, '/')).toLocaleDateString('pt-BR')}
                          {t.cardName ? ` · ${t.cardName}` : ''}
                        </p>
                      </div>
                      <p className="text-[11px] font-black text-text-primary tabular-nums shrink-0">
                        {isPrivacyMode ? '••••' : fmt(t.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-surface-elevated pt-2 flex justify-between items-center">
            <p className="text-text-muted text-xs font-black uppercase tracking-ultra-wide">{DISPONIBILIDADE_REAL.saldoMesLabel}</p>
            <p className={`text-lg font-black tabular-nums ${stats.balance >= 0 ? 'text-text-primary' : 'text-status-danger'}`}>
              {isPrivacyMode ? '••••' : fmt(stats.balance)}
            </p>
          </div>
        </div>

        <p className="text-[9px] text-text-muted font-medium mt-2 leading-relaxed md:hidden">
          {DISPONIBILIDADE_REAL.saldoConsideraApenas}
        </p>

        {/* Projected remainder after pending bills */}
        {!commandMode && totalPendingBills > 0 && !isPrivacyMode && (
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight mt-2">
            O que sobra após as contas:{' '}
            <span className={projectedBalance >= 0 ? 'text-brand-primary' : 'text-status-danger'}>
              {fmt(projectedBalance)}
            </span>
          </p>
        )}
      </div>

      {/* Desktop: coluna direita — decomposição mensal */}
      <div className="hidden md:flex md:flex-col md:gap-3 md:border-l md:border-surface-elevated md:pl-6">
        {periodLabel && (
          <>
            <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide">Resumo de {periodLabel}</p>
            <p className="text-[10px] text-text-muted font-medium -mt-2">{DISPONIBILIDADE_REAL.movimentacaoPeriodoHelp}</p>
          </>
        )}
        <div className="flex justify-between items-center">
          <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide">{DISPONIBILIDADE_REAL.entradasLabel}</p>
          <p className="text-lg font-black text-brand-primary tabular-nums">
            {isPrivacyMode ? '••••' : fmt(stats.income)}
          </p>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide">{DISPONIBILIDADE_REAL.saidasDinheiroLabel}</p>
          <p className="text-lg font-black text-red-600 tabular-nums">
            {isPrivacyMode ? '••••' : fmt(stats.cashExpenses)}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setShowCreditBreakdown((prev) => !prev)}
            className="flex justify-between items-center w-full text-left"
            aria-expanded={showCreditBreakdown}
            aria-label="Ver detalhamento das compras no crédito"
          >
            <span className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide flex items-center gap-1">
              {DISPONIBILIDADE_REAL.comprasCreditoMes}
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${showCreditBreakdown ? 'rotate-180' : ''}`}
              />
            </span>
            <p className="text-lg font-black text-text-muted tabular-nums">
              {isPrivacyMode ? '••••' : fmt(stats.creditExpenses + stats.virtualExpenses)}
            </p>
          </button>
          <p className="text-[8px] text-text-muted font-medium leading-tight">{DISPONIBILIDADE_REAL.comprasCreditoHelp}</p>

          {showCreditBreakdown && stats.creditTransactions && stats.creditTransactions.length > 0 && (
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>{stats.creditTransactions.length} {stats.creditTransactions.length === 1 ? 'compra' : 'compras'} no crédito no período</span>
                <span className="font-black text-text-primary tabular-nums">{fmt(stats.creditExpenses + stats.virtualExpenses)}</span>
              </div>
              <div className="border-t border-slate-100" />
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {stats.creditTransactions.map((t) => (
                  <div key={t.id} className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-text-primary truncate">{t.description}</p>
                      <p className="text-[9px] text-text-muted">
                        {new Date(t.date.replace(/-/g, '/')).toLocaleDateString('pt-BR')}
                        {t.cardName ? ` · ${t.cardName}` : ''}
                      </p>
                    </div>
                    <p className="text-[11px] font-black text-text-primary tabular-nums shrink-0">
                      {isPrivacyMode ? '••••' : fmt(t.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-surface-elevated pt-3 flex justify-between items-center">
          <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide">{DISPONIBILIDADE_REAL.saldoMesLabel}</p>
          <p className={`text-lg font-black tabular-nums ${stats.balance >= 0 ? 'text-text-primary' : 'text-status-danger'}`}>
            {isPrivacyMode ? '••••' : fmt(stats.balance)}
          </p>
        </div>
        <p className="text-[9px] text-text-muted font-medium mt-1 leading-relaxed">
          {DISPONIBILIDADE_REAL.saldoConsideraApenas}
        </p>
      </div>
    </div>
  );
};

export default BalanceCards;
