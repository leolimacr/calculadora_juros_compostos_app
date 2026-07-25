import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { CreditCard, Clock, Receipt, Eye, Check, X, Loader, ChevronDown } from 'lucide-react';
import type { QueryClient } from '@tanstack/react-query';
import { maskCurrency } from '../../../../utils/calculations';
import type { FaturaDetalhe, LancamentoFuturoInfo } from '../../../../utils/calculations';
import { getLocalDateString } from '../../../../utils/dateHelpers';
import { payInvoice } from '../../../../services/payInvoiceService';
import ComposicaoDrawer, { type ComposicaoItem } from './ComposicaoDrawer';

interface SaldoAjustavelCardProps {
  isPrivacyMode: boolean;
  saldoReal: number;
  saldoComExclusoes: number;
  faturasFechadas: FaturaDetalhe[];
  faturasAbertas: FaturaDetalhe[];
  gastosFuturosMes: LancamentoFuturoInfo[];
  contasFuturasMes: LancamentoFuturoInfo[];
  userId: string;
  queryClient: QueryClient;
}

type CheckState = Record<string, boolean>;

const SaldoAjustavelCard: React.FC<SaldoAjustavelCardProps> = ({
  isPrivacyMode,
  saldoReal,
  saldoComExclusoes,
  faturasFechadas,
  faturasAbertas,
  gastosFuturosMes,
  contasFuturasMes,
  userId,
  queryClient,
}) => {
  const LS_KEY = 'fpi-dash-usar-saldo-exclusoes';
  const [usarSaldoComExclusoes, setUsarSaldoComExclusoes] = useState(() => localStorage.getItem(LS_KEY) === 'true');
  const saldoBase = usarSaldoComExclusoes ? saldoComExclusoes : saldoReal;
  const [checked, setChecked] = useState<CheckState>(() => {
    const init: CheckState = {};
    for (const f of faturasFechadas) {
      init[`fat-${f.cardId}-${f.periodEnd}`] = true;
    }
    return init;
  });

  const [drawerItem, setDrawerItem] = useState<ComposicaoItem | null>(null);
  const [payingFaturaKey, setPayingFaturaKey] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState(getLocalDateString());
  const [isPaying, setIsPaying] = useState(false);

  const toggle = useCallback((key: string) => {
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const temParceladas = useMemo(() => {
    return faturasAbertas.some(f =>
      f.transacoes.some(t => t.installments != null && t.installments > 1)
    );
  }, [faturasAbertas]);

  const [faturasAbertasExpanded, setFaturasAbertasExpanded] = useState(false);

  const handleSelectAllAbertas = useCallback(() => {
    setChecked(prev => {
      const allChecked = faturasAbertas.every(f => !!prev[`fat-${f.cardId}-${f.periodEnd}`]);
      const next = { ...prev };
      for (const f of faturasAbertas) {
        next[`fat-${f.cardId}-${f.periodEnd}`] = !allChecked;
      }
      return next;
    });
  }, [faturasAbertas]);

  const [contasFuturasExpanded, setContasFuturasExpanded] = useState(false);

  const handleSelectAllContas = useCallback(() => {
    setChecked(prev => {
      const allChecked = contasFuturasMes.every(c => !!prev[`con-${c.id}`]);
      const next = { ...prev };
      for (const c of contasFuturasMes) {
        next[`con-${c.id}`] = !allChecked;
      }
      return next;
    });
  }, [contasFuturasMes]);

  useEffect(() => { localStorage.setItem(LS_KEY, String(usarSaldoComExclusoes)); }, [usarSaldoComExclusoes]);

  const fmt = (n: number) => (isPrivacyMode ? '••••••' : maskCurrency(n));

  const totalDeducoes = useMemo(() => {
    let total = 0;

    for (const f of faturasFechadas) {
      if (checked[`fat-${f.cardId}-${f.periodEnd}`]) total += f.remainingAmount;
    }
    for (const f of faturasAbertas) {
      if (checked[`fat-${f.cardId}-${f.periodEnd}`]) total += f.remainingAmount;
    }
    for (const g of gastosFuturosMes) {
      if (checked[`gas-${g.id}`]) total += g.amount;
    }
    for (const c of contasFuturasMes) {
      if (checked[`con-${c.id}`]) total += c.amount;
    }

    return total;
  }, [faturasFechadas, faturasAbertas, gastosFuturosMes, contasFuturasMes, checked]);

  const saldoAjustado = saldoBase - totalDeducoes;
  const isNegativo = saldoAjustado < 0;

  const abrirComposicao = useCallback((item: ComposicaoItem) => {
    setDrawerItem(item);
  }, []);

  const handleStartPayment = useCallback((key: string) => {
    setPayingFaturaKey(key);
    setPaymentDate(getLocalDateString());
    setIsPaying(false);
  }, []);

  const handleCancelPayment = useCallback(() => {
    setPayingFaturaKey(null);
    setIsPaying(false);
  }, []);

  const handleConfirmPayment = useCallback(async (fatura: FaturaDetalhe) => {
    if (!userId || isPaying) return;
    setIsPaying(true);
    const invoiceId = `${fatura.cardId}_${fatura.periodEnd}`;
    await payInvoice({
      userId,
      cardId: fatura.cardId,
      cardName: fatura.cardName,
      amount: fatura.remainingAmount,
      date: paymentDate,
      invoiceId,
      periodEnd: fatura.periodEnd,
      queryClient,
    });
    setIsPaying(false);
    setPayingFaturaKey(null);
  }, [userId, paymentDate, queryClient, isPaying]);

  return (
    <>
      <div className="bg-surface-primary border border-surface-elevated rounded-4xl p-5 shadow-card">
        {/* Saldo Atual (fixo no topo) */}
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide">
              Saldo Ajustável
            </p>
            <p className="text-[10px] text-text-muted font-medium leading-relaxed mt-0.5">
              Marque o que deseja abater do saldo atual.
            </p>
          </div>
          <p className="text-2xl font-black tabular-nums tracking-tight text-text-primary">
            {fmt(saldoBase)}
          </p>
        </div>

        {/* Checkbox usar saldo com exclusões */}
        <label className="flex items-center gap-2 cursor-pointer group mb-3 pb-3 border-b border-surface-elevated">
          <input
            type="checkbox"
            checked={usarSaldoComExclusoes}
            onChange={() => setUsarSaldoComExclusoes((p) => !p)}
            className="h-3.5 w-3.5 rounded border-surface-elevated text-brand-primary focus:ring-brand-primary/30"
          />
          <span className="text-[10px] leading-snug text-text-muted group-hover:text-text-primary transition-colors">
            Usar o Saldo Atual (com exclusões)
          </span>
        </label>

        {/* Seção: Faturas Fechadas */}
        <div className="mb-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2 flex items-center gap-1.5">
            <CreditCard size={12} />
            Faturas fechadas (não pagas)
          </p>
          {faturasFechadas.length > 0 ? (
            <div className="space-y-1">
              {faturasFechadas.map(f => {
                const key = `fat-${f.cardId}-${f.periodEnd}`;
                const isChecked = !!checked[key];
                const isPayingThis = payingFaturaKey === key;
                const isOverdue = new Date(f.dueDate.replace(/-/g, '/')) < new Date();
                return (
                  <div key={key}>
                    <div
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border transition-all cursor-pointer hover:shadow-sm ${
                        isOverdue
                          ? isChecked
                            ? 'bg-red-100 border-red-400'
                            : 'bg-red-50/40 border-red-300/60'
                          : isChecked
                            ? 'bg-red-50 border-red-200'
                            : 'bg-surface-secondary border-surface-elevated opacity-70'
                      }`}
                      onClick={() => abrirComposicao({ tipo: 'fatura', dados: f })}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(key)}
                        onClick={e => e.stopPropagation()}
                        className={`w-4 h-4 rounded cursor-pointer shrink-0 ${
                          isOverdue
                            ? 'border-red-400 text-red-600 focus:ring-red-500'
                            : 'border-slate-300 text-red-500 focus:ring-red-400'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate flex items-center gap-1.5 ${
                          isOverdue
                            ? isChecked ? 'text-red-800' : 'text-red-700'
                            : isChecked ? 'text-red-700' : 'text-text-muted'
                        }`}>
                          {isOverdue && (
                            <span className="inline-block px-1.5 py-0.5 rounded-md bg-red-200 text-[8px] font-black uppercase tracking-wider text-red-800 leading-none">
                              Vencida
                            </span>
                          )}
                          {f.cardName}
                        </p>
                        <p className={`text-[9px] mt-0.5 ${
                          isOverdue
                            ? isChecked ? 'text-red-600' : 'text-red-500'
                            : isChecked ? 'text-red-500' : 'text-text-muted'
                        }`}>
                          Venceu em {new Date(f.dueDate.replace(/-/g, '/')).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <p className={`text-sm font-black tabular-nums shrink-0 ${
                        isOverdue
                          ? isChecked ? 'text-red-700' : 'text-red-600'
                          : isChecked ? 'text-red-600' : 'text-text-muted'
                      }`}>
                        {fmt(f.remainingAmount)}
                      </p>
                      <Eye size={14} className="text-text-muted shrink-0" />
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); handleStartPayment(key); }}
                        className="text-[8px] font-black text-brand-primary uppercase tracking-widest hover:underline shrink-0 whitespace-nowrap"
                      >
                        Pagar Agora
                      </button>
                    </div>

                    {isPayingThis && (
                      <div className="mt-2 p-3 bg-surface-secondary rounded-2xl border border-surface-elevated space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center gap-3">
                          <label className="text-[10px] font-bold text-text-muted shrink-0">
                            Data do pagamento
                          </label>
                          <input
                            type="date"
                            value={paymentDate}
                            max={getLocalDateString()}
                            onChange={e => setPaymentDate(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-xl border border-surface-elevated bg-surface-primary text-xs font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isPaying}
                            onClick={() => handleConfirmPayment(f)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-text-onBrand text-[9px] font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-all active:scale-95 disabled:opacity-50"
                          >
                            {isPaying ? (
                              <Loader size={12} className="animate-spin" />
                            ) : (
                              <Check size={12} />
                            )}
                            Confirmar Pagamento
                          </button>
                          <button
                            type="button"
                            disabled={isPaying}
                            onClick={handleCancelPayment}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-surface-elevated text-text-muted text-[9px] font-black uppercase tracking-widest hover:bg-surface-secondary transition-all active:scale-95 disabled:opacity-50"
                          >
                            <X size={12} />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-text-muted font-medium italic pl-1">
              Nenhuma fatura fechada pendente.
            </p>
          )}
        </div>

        {/* Seção: Faturas Abertas */}
        <div className="mb-3">
          <div
            className={`flex items-center gap-1.5 mb-2 ${temParceladas ? 'cursor-pointer select-none' : ''}`}
            onClick={() => temParceladas && setFaturasAbertasExpanded(p => !p)}
          >
            {temParceladas && (
              <ChevronDown
                size={12}
                className={`text-text-muted transition-transform ${faturasAbertasExpanded ? '' : '-rotate-90'}`}
              />
            )}
            <input
              type="checkbox"
              checked={faturasAbertas.length > 0 && faturasAbertas.every(f => !!checked[`fat-${f.cardId}-${f.periodEnd}`])}
              onChange={handleSelectAllAbertas}
              onClick={e => e.stopPropagation()}
              className="h-3.5 w-3.5 rounded border-surface-elevated text-amber-500 focus:ring-amber-400/30 shrink-0"
            />
            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
              <CreditCard size={12} />
              Faturas abertas (em curso)
            </p>
            {faturasAbertas.length > 0 && (
              <span className="text-[8px] font-bold text-text-muted ml-auto">
                {faturasAbertas.length} {faturasAbertas.length === 1 ? 'fatura' : 'faturas'}
              </span>
            )}
          </div>

          {(!temParceladas || faturasAbertasExpanded) && (
            faturasAbertas.length > 0 ? (
              <div className="space-y-1">
                {faturasAbertas.map(f => {
                  const key = `fat-${f.cardId}-${f.periodEnd}`;
                  const isChecked = !!checked[key];
                  const isPayingThis = payingFaturaKey === key;
                  return (
                    <div key={key}>
                      <div
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border transition-all cursor-pointer hover:shadow-sm ${
                          isChecked
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-surface-secondary border-surface-elevated opacity-70'
                        }`}
                        onClick={() => abrirComposicao({ tipo: 'fatura', dados: f })}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggle(key)}
                          onClick={e => e.stopPropagation()}
                          className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate flex items-center gap-1.5 ${isChecked ? 'text-amber-700' : 'text-text-muted'}`}>
                            <span className="inline-block px-1.5 py-0.5 rounded-md bg-amber-100 text-[8px] font-black uppercase tracking-wider text-amber-700 leading-none">
                              Fecha {new Date(f.periodEnd.replace(/-/g, '/')).toLocaleDateString('pt-BR')}
                            </span>
                            {f.cardName}
                          </p>
                          <p className={`text-[9px] mt-0.5 ${isChecked ? 'text-amber-500' : 'text-text-muted'}`}>
                            Vence {new Date(f.dueDate.replace(/-/g, '/')).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <p className={`text-sm font-black tabular-nums shrink-0 ${isChecked ? 'text-amber-600' : 'text-text-muted'}`}>
                          {fmt(f.remainingAmount)}
                        </p>
                        <Eye size={14} className="text-text-muted shrink-0" />
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); handleStartPayment(key); }}
                          className="text-[8px] font-black text-brand-primary uppercase tracking-widest hover:underline shrink-0 whitespace-nowrap"
                        >
                          Pagar Agora
                        </button>
                      </div>

                      {isPayingThis && (
                        <div className="mt-2 p-3 bg-surface-secondary rounded-2xl border border-surface-elevated space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="flex items-center gap-3">
                            <label className="text-[10px] font-bold text-text-muted shrink-0">
                              Data do pagamento
                            </label>
                            <input
                              type="date"
                              value={paymentDate}
                              max={getLocalDateString()}
                              onChange={e => setPaymentDate(e.target.value)}
                              className="flex-1 px-3 py-2 rounded-xl border border-surface-elevated bg-surface-primary text-xs font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isPaying}
                              onClick={() => handleConfirmPayment(f)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-text-onBrand text-[9px] font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-all active:scale-95 disabled:opacity-50"
                            >
                              {isPaying ? (
                                <Loader size={12} className="animate-spin" />
                              ) : (
                                <Check size={12} />
                              )}
                              Confirmar Pagamento
                            </button>
                            <button
                              type="button"
                              disabled={isPaying}
                              onClick={handleCancelPayment}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-surface-elevated text-text-muted text-[9px] font-black uppercase tracking-widest hover:bg-surface-secondary transition-all active:scale-95 disabled:opacity-50"
                            >
                              <X size={12} />
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[10px] text-text-muted font-medium italic pl-1">
                Nenhuma fatura aberta no momento.
              </p>
            )
          )}
        </div>

        {/* Seção: Gastos futuros no mês */}
        <div className="mb-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2 flex items-center gap-1.5">
            <Clock size={12} />
            Gastos futuros deste mês
          </p>
          {gastosFuturosMes.length > 0 ? (
            <div className="space-y-1 mb-2">
              {gastosFuturosMes.map(g => {
                const key = `gas-${g.id}`;
                const isChecked = !!checked[key];
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl border transition-all cursor-pointer hover:shadow-sm ${
                      isChecked
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-surface-secondary border-surface-elevated opacity-70'
                    }`}
                    onClick={() => abrirComposicao({ tipo: 'gasto-futuro', dados: g })}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(key)}
                      onClick={e => e.stopPropagation()}
                      className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${isChecked ? 'text-amber-700' : 'text-text-muted'}`}>
                        {g.description || 'Sem descrição'}
                      </p>
                      <p className={`text-[9px] mt-0.5 ${isChecked ? 'text-amber-500' : 'text-text-muted'}`}>
                        {new Date(g.date.replace(/-/g, '/')).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <p className={`text-sm font-black tabular-nums shrink-0 ${isChecked ? 'text-amber-600' : 'text-text-muted'}`}>
                      {fmt(g.amount)}
                    </p>
                    <Eye size={14} className="text-text-muted shrink-0" />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-text-muted font-medium italic pl-1">
              Nenhum gasto futuro previsto neste mês.
            </p>
          )}
        </div>

        {/* Seção: Contas recorrentes a vencer */}
        <div className="mb-3">
          <div
            className={`flex items-center gap-1.5 mb-2 ${contasFuturasMes.length > 2 ? 'cursor-pointer select-none' : ''}`}
            onClick={() => contasFuturasMes.length > 2 && setContasFuturasExpanded(p => !p)}
          >
            {contasFuturasMes.length > 2 && (
              <ChevronDown
                size={12}
                className={`text-text-muted transition-transform ${contasFuturasExpanded ? '' : '-rotate-90'}`}
              />
            )}
            <input
              type="checkbox"
              checked={contasFuturasMes.length > 0 && contasFuturasMes.every(c => !!checked[`con-${c.id}`])}
              onChange={handleSelectAllContas}
              onClick={e => e.stopPropagation()}
              className="h-3.5 w-3.5 rounded border-surface-elevated text-purple-500 focus:ring-purple-400/30 shrink-0"
            />
            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
              <Receipt size={12} />
              Contas recorrentes a vencer
            </p>
            {contasFuturasMes.length > 0 && (
              <span className="text-[8px] font-bold text-text-muted ml-auto">
                {contasFuturasMes.length} {contasFuturasMes.length === 1 ? 'conta' : 'contas'}
              </span>
            )}
          </div>

          {(contasFuturasMes.length <= 2 || contasFuturasExpanded) && (
            contasFuturasMes.length > 0 ? (
              <div className="space-y-1">
                {contasFuturasMes.map(c => {
                  const key = `con-${c.id}`;
                  const isChecked = !!checked[key];
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl border transition-all cursor-pointer hover:shadow-sm ${
                        isChecked
                          ? 'bg-purple-50 border-purple-200'
                          : 'bg-surface-secondary border-surface-elevated opacity-70'
                      }`}
                      onClick={() => abrirComposicao({ tipo: 'conta-futura', dados: c })}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(key)}
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4 rounded border-slate-300 text-purple-500 focus:ring-purple-400 cursor-pointer shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${isChecked ? 'text-purple-700' : 'text-text-muted'}`}>
                          {c.description}
                        </p>
                        <p className={`text-[9px] mt-0.5 ${isChecked ? 'text-purple-500' : 'text-text-muted'}`}>
                          Dia {new Date(c.date.replace(/-/g, '/')).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </p>
                      </div>
                      <p className={`text-sm font-black tabular-nums shrink-0 ${isChecked ? 'text-purple-600' : 'text-text-muted'}`}>
                        {fmt(c.amount)}
                      </p>
                      <Eye size={14} className="text-text-muted shrink-0" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[10px] text-text-muted font-medium italic pl-1">
                Não há nenhuma conta recorrente a vencer neste mês.
              </p>
            )
          )}
        </div>

        {/* Total Ajustado */}
        <div className="border-t border-surface-elevated pt-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-ultra-wide text-text-primary">
                Saldo Ajustado
              </p>
              <p className="text-[9px] text-text-muted font-medium mt-0.5">
                {isNegativo
                  ? 'Após as deduções, seu saldo fica negativo.'
                  : 'O que sobra após abater os itens marcados.'}
              </p>
            </div>
            <p
              className={`text-2xl font-black tabular-nums tracking-tight ${
                isNegativo ? 'text-status-danger' : 'text-text-primary'
              }`}
            >
              {isPrivacyMode ? '••••••' : maskCurrency(saldoAjustado)}
            </p>
          </div>
        </div>
      </div>

      <ComposicaoDrawer
        isOpen={drawerItem !== null}
        onClose={() => setDrawerItem(null)}
        item={drawerItem}
      />
    </>
  );
};

export default SaldoAjustavelCard;
