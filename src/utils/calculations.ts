import type { FinancialProfile } from '../types';

export type SovereignMode = 'rotina' | 'comando';

export interface SovereignMetrics {
  monthBalance: number;
  accumulatedBalance: number;
  projectedBalance: number;
  protectionBuffer: number;
  colchaoShortfall: number;
  reserveShortfall: number;
  protectionShortfall: number;
  sovereignFreeBalance: number;
  freedomDeficit: number;
}

export interface SovereignSnapshot extends SovereignMetrics {
  mode: SovereignMode;
  heroLabel: string;
  heroValue: number;
  leewayDays: number;
  freedomVelocity: number;
  income: number;
  expenses: number;
  accumulatedIncome: number;
  accumulatedExpenses: number;
  obligationsDeduction: number;
  totalCreditUsed?: number;
  totalDebtBalance?: number;
}

export interface SovereignBucketsBreakdown {
  marcoZero: number;
  reserve: number;
  livre: number;
  comprometido: number;
  freedomDeficit: number;
  structureInvaded: boolean;
  freedomVelocity: number;
  colchaoShortfall: number;
  reserveShortfall: number;
}

export function deriveSovereignBuckets(
  snapshot: Pick<SovereignSnapshot, 'sovereignFreeBalance' | 'obligationsDeduction' | 'freedomDeficit' | 'freedomVelocity' | 'colchaoShortfall' | 'reserveShortfall'>,
  marcoZero: number,
  reserveCurrent: number
): SovereignBucketsBreakdown {
  return {
    marcoZero,
    reserve: reserveCurrent,
    livre: Math.max(0, snapshot.sovereignFreeBalance),
    comprometido: snapshot.obligationsDeduction,
    freedomDeficit: snapshot.freedomDeficit,
    structureInvaded: snapshot.sovereignFreeBalance < 0,
    freedomVelocity: snapshot.freedomVelocity,
    colchaoShortfall: snapshot.colchaoShortfall,
    reserveShortfall: snapshot.reserveShortfall,
  };
}

export interface MonthFlow {
  income: number;
  expenses: number;
  realBalance: number;
  virtualImpact: number;
  cashExpenses: number;
  creditExpenses: number;
  virtualExpenses: number;
}

type TxLike = {
  type: string;
  amount: number;
  paymentMethod?: string;
  date: string;
  isVirtual?: boolean;
};

export function aggregateMonthFlow(
  transactions: TxLike[],
  year?: number,
  month?: number
): MonthFlow {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;
  const prefix = `${y}-${String(m).padStart(2, '0')}-`;

  let income = 0;
  let expenses = 0;
  let realBalance = 0;
  let virtualImpact = 0;
  let cashExpenses = 0;
  let creditExpenses = 0;
  let virtualExpenses = 0;

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    if (!t.date || !t.date.startsWith(prefix)) continue;

    const val = Number(t.amount) || 0;
    const isCredit = t.paymentMethod === 'credit';

    if (t.type === 'income') {
      income += val;
      realBalance += val;
    } else {
      expenses += val;
      if (t.isVirtual) {
        virtualImpact += val;
        virtualExpenses += val;
      } else if (isCredit) {
        creditExpenses += val;
      } else {
        realBalance -= val;
        cashExpenses += val;
      }
    }
  }

  return { income, expenses, realBalance, virtualImpact, cashExpenses, creditExpenses, virtualExpenses };
}

export function aggregateAllTimeFlow(transactions: TxLike[]): MonthFlow {
  let income = 0;
  let expenses = 0;
  let realBalance = 0;
  let virtualImpact = 0;
  let cashExpenses = 0;
  let creditExpenses = 0;
  let virtualExpenses = 0;

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    const val = Number(t.amount) || 0;
    const isCredit = t.paymentMethod === 'credit';

    if (t.type === 'income') {
      income += val;
      realBalance += val;
    } else {
      expenses += val;
      if (t.isVirtual) {
        virtualImpact += val;
        virtualExpenses += val;
      } else if (isCredit) {
        creditExpenses += val;
      } else {
        realBalance -= val;
        cashExpenses += val;
      }
    }
  }

  return { income, expenses, realBalance, virtualImpact, cashExpenses, creditExpenses, virtualExpenses };
}

export function getProtectionBuffer(financialProfile?: FinancialProfile): number {
  return (financialProfile?.marcoZero || 0) + (financialProfile?.emergencyReserveCurrent || 0);
}

export function getColchaoShortfall(fp?: FinancialProfile): number {
  return Math.max(0, (fp?.colchaoInicialTarget || 0) - (fp?.marcoZero || 0));
}

export function getReserveShortfall(fp?: FinancialProfile): number {
  return Math.max(0, (fp?.emergencyReserveTarget || 0) - (fp?.emergencyReserveCurrent || 0));
}

export function getTotalShortfall(fp?: FinancialProfile): number {
  return getColchaoShortfall(fp) + getReserveShortfall(fp);
}

export function computeSovereignMetrics(
  monthBalance: number,
  virtualImpact: number,
  pendingBills: number,
  accumulatedBalance: number,
  financialProfile?: FinancialProfile
): SovereignMetrics {
  const colchaoShortfall = getColchaoShortfall(financialProfile);
  const reserveShortfall = getReserveShortfall(financialProfile);
  const protectionShortfall = colchaoShortfall + reserveShortfall;
  const protectionBuffer = getProtectionBuffer(financialProfile);
  const projectedBalance = monthBalance - virtualImpact - pendingBills;
  const sovereignFreeBalance = accumulatedBalance - virtualImpact - pendingBills - protectionShortfall;
  const freedomDeficit = sovereignFreeBalance < 0 ? Math.abs(sovereignFreeBalance) : 0;

  return {
    monthBalance,
    accumulatedBalance,
    projectedBalance,
    protectionBuffer,
    colchaoShortfall,
    reserveShortfall,
    protectionShortfall,
    sovereignFreeBalance,
    freedomDeficit,
  };
}

export interface BuildSovereignSnapshotParams {
  monthBalance: number;
  accumulatedBalance: number;
  accumulatedIncome: number;
  accumulatedExpenses: number;
  virtualImpact?: number;
  pendingBills?: number;
  financialProfile?: FinancialProfile;
  commandMode: boolean;
  monthlyExpenses?: number;
  monthlyAport?: number;
  income?: number;
  expenses?: number;
  rotativoDebtBalance?: number;
}

export function buildSovereignSnapshot(params: BuildSovereignSnapshotParams): SovereignSnapshot {
  const virtualImpact = (params.virtualImpact ?? 0) + (params.rotativoDebtBalance ?? 0);
  const pendingBills = params.pendingBills ?? 0;
  const income = params.income ?? 0;
  const expenses = params.expenses ?? params.monthlyExpenses ?? 0;

  const metrics = computeSovereignMetrics(
    params.monthBalance,
    virtualImpact,
    pendingBills,
    params.accumulatedBalance,
    params.financialProfile
  );

  const mode: SovereignMode = params.commandMode ? 'comando' : 'rotina';
  const heroValue = mode === 'comando' ? metrics.sovereignFreeBalance : params.monthBalance;

  const dailyCost = expenses / 30;
  const leewayDays = calculateLeewayDays(metrics.sovereignFreeBalance, dailyCost);
  const freedomVelocity = calculateFreedomVelocity(
    params.monthlyAport ?? Math.max(0, income - expenses),
    expenses
  );

  const heroLabel = mode === 'comando' ? 'Disponibilidade Real' : 'Dinheiro do Mês';

  return {
    ...metrics,
    mode,
    heroLabel,
    heroValue,
    leewayDays,
    freedomVelocity,
    income,
    expenses,
    accumulatedIncome: params.accumulatedIncome,
    accumulatedExpenses: params.accumulatedExpenses,
    obligationsDeduction: virtualImpact + pendingBills,
  };
}

export interface LaunchImpactPreview {
  delta: number;
  percent: number;
  targetLabel: string;
  newValue: number;
}

export function computeLaunchImpact(
  snapshot: SovereignSnapshot,
  draftAmount: number,
  draftType: 'income' | 'expense',
  paymentMethod: 'money' | 'credit' = 'money'
): LaunchImpactPreview | null {
  if (draftAmount <= 0) return null;

  let balanceDelta = 0;
  if (draftType === 'income') {
    balanceDelta = draftAmount;
  } else if (paymentMethod !== 'credit') {
    balanceDelta = -draftAmount;
  } else {
    return null;
  }

  const heroAfter = snapshot.heroValue + balanceDelta;

  const baseValue = snapshot.heroValue;
  const newValue = heroAfter;
  const delta = newValue - baseValue;
  const percent =
    baseValue !== 0
      ? (delta / Math.abs(baseValue)) * 100
      : delta !== 0
        ? delta > 0
          ? 100
          : -100
        : 0;
  const targetLabel = snapshot.heroLabel.toLowerCase();

  return {
    delta,
    percent,
    targetLabel,
    newValue,
  };
}


export const calculateLeewayDays = (
  sovereignBalance: number,
  dailyCost: number
): number => {
  if (dailyCost <= 0) return 0;
  const days = Math.floor(sovereignBalance / dailyCost);
  return days > 0 ? days : 0;
};

export const calculateFreedomVelocity = (
  monthlyAport: number,
  monthlyFixedCost: number
): number => {
  if (monthlyFixedCost <= 0) return 0;
  const velocity = (monthlyAport / monthlyFixedCost) * 30;
  return parseFloat(velocity.toFixed(1));
};

export const calculateCompoundInterest = () => ({ total: 0 });

export const maskCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

/* ─── Real Cash Balance (Card 1 — Saldo Atual) ─── */

export interface FaturaDetalhe {
  cardName: string;
  cardId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  total: number;
  remainingAmount: number;
  tipo: 'aberta' | 'fechada';
  transacoes: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
    installments?: number;
    currentInstallment?: number;
    installmentId?: string;
  }>;
}

export interface LancamentoFuturoInfo {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export interface CashBalanceResult {
  saldoReal: number;
  totalReceitas: number;
  totalDespesasAVista: number;
  receitasMes: number;
  despesasMes: number;
  faturasFechadas: FaturaDetalhe[];
  faturasAbertas: FaturaDetalhe[];
  gastosFuturosMes: LancamentoFuturoInfo[];
  contasFuturasMes: LancamentoFuturoInfo[];
}

export function calculateRealCashBalance(
  transactions: TxLike[],
  storedInvoices: Array<{
    cardId: string;
    periodStart: string;
    periodEnd: string;
    dueDate: string;
    total: number;
    status: string;
    paidAmount: number;
    remainingAmount: number;
    id?: string;
  }>,
  userCards: Array<{
    id: string;
    name: string;
    closingDay?: number;
    dueDay?: number;
  }>,
  recurringBills: Array<{
    id: string;
    name: string;
    amount: number;
    dueDay: number;
    isActive: boolean;
    category: string;
  }>,
  refDate?: Date
): CashBalanceResult {
  const hoje = refDate ?? new Date();
  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  const currentYear = hoje.getFullYear();
  const currentMonth = hoje.getMonth() + 1;

  // Último dia do mês atual
  const ultimoDia = new Date(currentYear, currentMonth, 0).getDate();
  const mesEnd = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

  let saldoReal = 0;
  let totalReceitas = 0;
  let totalDespesasAVista = 0;
  let receitasMes = 0;
  let despesasMes = 0;
  const monthPrefix = hojeStr.slice(0, 7);

  // Card 1: Saldo real = receitas - despesas à vista (data <= hoje)
  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    if (!t.date || t.date > hojeStr) continue;
    const val = Number(t.amount) || 0;
    if (t.type === 'income') {
      saldoReal += val;
      totalReceitas += val;
      if (t.date.startsWith(monthPrefix)) receitasMes += val;
    } else if (t.paymentMethod !== 'credit' && !t.isVirtual) {
      saldoReal -= val;
      totalDespesasAVista += val;
      if (t.date.startsWith(monthPrefix)) despesasMes += val;
    }
  }

  /* ─── Faturas ─── */
  const faturasMap = new Map<string, FaturaDetalhe>();

  // 1. Faturas armazenadas não pagas (Firebase)
  for (const si of storedInvoices) {
    if (si.status === 'paid') continue;
    if (si.remainingAmount <= 0) continue;
    const cardName = userCards.find(c => c.id === si.cardId)?.name || 'Cartão';
    const key = `${si.cardId}-${si.periodEnd}`;
    const fechada = si.periodEnd < hojeStr;
    faturasMap.set(key, {
      cardName,
      cardId: si.cardId,
      periodStart: si.periodStart,
      periodEnd: si.periodEnd,
      dueDate: si.dueDate,
      total: si.total,
      remainingAmount: si.remainingAmount,
      tipo: fechada ? 'fechada' : 'aberta',
      transacoes: [],
    });
  }

  // 2. Período atual de cada cartão (se ainda não estiver no map)
  for (const card of userCards) {
    if (!card.closingDay || !card.dueDay) continue;

    const currentDay = hoje.getDate();
    const m = hoje.getMonth();
    const y = hoje.getFullYear();

    let y1, m1, d1, y2, m2, d2, dy, dm, dd;

    if (currentDay > card.closingDay) {
      y1 = y; m1 = m; d1 = card.closingDay + 1;
      y2 = m === 11 ? y + 1 : y; m2 = (m + 1) % 12; d2 = card.closingDay;
      dy = y2; dm = m2; dd = card.dueDay;
      if (dd < d2) { dm = (dm + 1) % 12; if (dm === 0) dy++; }
    } else {
      y1 = m === 0 ? y - 1 : y; m1 = (m - 1 + 12) % 12; d1 = card.closingDay + 1;
      y2 = y; m2 = m; d2 = card.closingDay;
      dy = y2; dm = m2; dd = card.dueDay;
      if (dd < d2) { dm = (dm + 1) % 12; if (dm === 0) dy++; }
    }

    const ps = `${y1}-${String(m1 + 1).padStart(2, '0')}-${String(d1).padStart(2, '0')}`;
    const pe = `${y2}-${String(m2 + 1).padStart(2, '0')}-${String(d2).padStart(2, '0')}`;
    const ddStr = `${dy}-${String(dm + 1).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    const key = `${card.id}-${pe}`;

    if (!faturasMap.has(key)) {
      const cardTxs = [];
      for (let i = 0; i < transactions.length; i++) {
        const t = transactions[i];
        if ((t as any).cardId === card.id && t.type === 'expense' && t.date >= ps && t.date <= pe) {
          cardTxs.push({
            id: (t as any).id || '',
            description: (t as any).description || '',
            amount: Number(t.amount) || 0,
            date: t.date,
            installments: (t as any).installments,
            currentInstallment: (t as any).currentInstallment,
            installmentId: (t as any).installmentId,
          });
        }
      }
      const total = Math.round(cardTxs.reduce((s, t) => s + t.amount, 0) * 100) / 100;
      if (total > 0) {
        const fechada = pe < hojeStr;
        faturasMap.set(key, {
          cardName: card.name,
          cardId: card.id,
          periodStart: ps,
          periodEnd: pe,
          dueDate: ddStr,
          total,
          remainingAmount: total,
          tipo: fechada ? 'fechada' : 'aberta',
          transacoes: cardTxs,
        });
      }
    }
  }

  // Preencher transações das faturas armazenadas que não foram computadas
  for (const [, fat] of faturasMap) {
    if (fat.transacoes.length === 0) {
      const txs = [];
      for (let i = 0; i < transactions.length; i++) {
        const t = transactions[i];
        if ((t as any).cardId === fat.cardId && t.type === 'expense' && t.date >= fat.periodStart && t.date <= fat.periodEnd) {
          txs.push({
            id: (t as any).id || '',
            description: (t as any).description || '',
            amount: Number(t.amount) || 0,
            date: t.date,
            installments: (t as any).installments,
            currentInstallment: (t as any).currentInstallment,
            installmentId: (t as any).installmentId,
          });
        }
      }
      fat.transacoes = txs;
    }
  }

  const faturasFechadas: FaturaDetalhe[] = [];
  const faturasAbertas: FaturaDetalhe[] = [];
  for (const fat of faturasMap.values()) {
    if (fat.tipo === 'fechada') faturasFechadas.push(fat);
    else faturasAbertas.push(fat);
  }

  /* ─── Gastos futuros no mês (à vista, data > hoje) ─── */
  const gastosFuturosMes: LancamentoFuturoInfo[] = [];
  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    if (t.date > hojeStr && t.date <= mesEnd && t.type === 'expense' && t.paymentMethod !== 'credit' && !t.isVirtual) {
      gastosFuturosMes.push({
        id: (t as any).id || '',
        description: (t as any).description || '',
        amount: Number(t.amount) || 0,
        date: t.date,
      });
    }
  }

  /* ─── Contas futuras no mês ─── */
  const contasFuturasMes: LancamentoFuturoInfo[] = [];
  for (let i = 0; i < recurringBills.length; i++) {
    const bill = recurringBills[i];
    if (!bill.isActive) continue;

    // Verifica se já foi paga neste mês
    let jaPaga = false;
    for (let j = 0; j < transactions.length; j++) {
      const t = transactions[j];
      if (t.type === 'expense' && (t as any).isBillPayment && (t as any).linkedRecurringBillId === bill.id) {
        if (t.date >= `${currentYear}-${String(currentMonth).padStart(2, '0')}-01` && t.date <= hojeStr) {
          jaPaga = true;
          break;
        }
      }
    }
    if (jaPaga) continue;

    const billDay = bill.dueDay;
    // Garantir que o dia não ultrapasse o último dia do mês
    const safeDay = billDay > ultimoDia ? ultimoDia : billDay;
    const billDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
    // Mas verificamos com o dia original se é futuro
    const billDateOrig = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(billDay).padStart(2, '0')}`;
    // Se o dia original é futuro OU o dia ajustado é futuro
    if (billDateOrig > hojeStr && billDate <= mesEnd) {
      contasFuturasMes.push({
        id: bill.id,
        description: bill.name,
        amount: bill.amount,
        date: billDate,
      });
    }
  }

  return {
    saldoReal,
    totalReceitas,
    totalDespesasAVista,
    receitasMes,
    despesasMes,
    faturasFechadas,
    faturasAbertas,
    gastosFuturosMes,
    contasFuturasMes,
  };
}
