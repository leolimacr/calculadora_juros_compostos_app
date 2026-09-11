import { describe, it, expect } from 'vitest';
import { buildSovereignSnapshot, computeLaunchImpact, resolveObligationPressure } from '../../utils/calculations';

describe('buildSovereignSnapshot virtualImpact composition', () => {
  it('uses obligationPressure directly (card invoice + rotativo combined)', () => {
    const result = buildSovereignSnapshot({
      monthBalance: 5000,
      accumulatedBalance: 20000,
      accumulatedIncome: 50000,
      accumulatedExpenses: 30000,
      obligationPressure: 1500, // card invoice remaining (1000) + rotativo (500)
      commandMode: true,
      income: 5000,
      expenses: 3000,
      monthlyAport: 2000,
    });

    expect(result.obligationsDeduction).toBe(1500);
    expect(result.virtualImpact).toBe(1500);
  });

  it('handles zero obligationPressure', () => {
    const result = buildSovereignSnapshot({
      monthBalance: 5000,
      accumulatedBalance: 20000,
      accumulatedIncome: 50000,
      accumulatedExpenses: 30000,
      obligationPressure: 0,
      commandMode: true,
      income: 5000,
      expenses: 3000,
      monthlyAport: 2000,
    });

    expect(result.obligationsDeduction).toBe(0);
    expect(result.virtualImpact).toBe(0);
  });

  it('handles undefined obligationPressure as zero', () => {
    const result = buildSovereignSnapshot({
      monthBalance: 5000,
      accumulatedBalance: 20000,
      accumulatedIncome: 50000,
      accumulatedExpenses: 30000,
      commandMode: true,
      income: 5000,
      expenses: 3000,
      monthlyAport: 2000,
    });

    expect(result.obligationsDeduction).toBe(0);
    expect(result.virtualImpact).toBe(0);
  });
});

describe('buildSovereignSnapshot with exclusions', () => {
  const commonParams = {
    accumulatedIncome: 50000,
    accumulatedExpenses: 30000,
    income: 5000,
    expenses: 3000,
    monthlyAport: 2000,
    financialProfile: {
      monthlyIncome: 5000,
      colchaoInicialTarget: 5000,
      marcoZero: 2000,
      emergencyReserveTarget: 8000,
      emergencyReserveCurrent: 3000,
    },
  };

  it('subtracts exclusions from sovereignFreeBalance', () => {
    const colchaoShortfall = Math.max(0, 5000 - 2000);
    const reserveShortfall = Math.max(0, 8000 - 3000);
    const protectionShortfall = colchaoShortfall + reserveShortfall; // 3000 + 5000 = 8000
    const expectedFreeBalance = 15000 - 1000 - 500 - protectionShortfall - 1000; // with 1000 exclusions

    const result = buildSovereignSnapshot({
      ...commonParams,
      monthBalance: 2000,
      accumulatedBalance: 15000,
      obligationPressure: 1000,
      pendingBills: 500,
      commandMode: false,
      exclusions: 1000,
    });

    expect(result.sovereignFreeBalance).toBe(expectedFreeBalance);
    expect(result.protectionShortfall).toBe(protectionShortfall);
  });

  it('heroValue reflects exclusions in commandMode', () => {
    const colchaoShortfall = Math.max(0, 5000 - 2000);
    const reserveShortfall = Math.max(0, 8000 - 3000);
    const protectionShortfall = colchaoShortfall + reserveShortfall;
    const expectedFreeBalance = 15000 - 1000 - 500 - protectionShortfall - 1000;

    const result = buildSovereignSnapshot({
      ...commonParams,
      monthBalance: 2000,
      accumulatedBalance: 15000,
      obligationPressure: 1000,
      pendingBills: 500,
      commandMode: true,
      exclusions: 1000,
    });

    expect(result.heroValue).toBe(result.sovereignFreeBalance);
    expect(result.heroValue).toBe(expectedFreeBalance);
    expect(result.heroValue).not.toBe(result.monthBalance);
  });

  it('handles zero exclusions without changing behavior', () => {
    const colchaoShortfall = Math.max(0, 5000 - 2000);
    const reserveShortfall = Math.max(0, 8000 - 3000);
    const protectionShortfall = colchaoShortfall + reserveShortfall;
    const expectedFreeBalance = 15000 - 1000 - 500 - protectionShortfall;

    const result = buildSovereignSnapshot({
      ...commonParams,
      monthBalance: 2000,
      accumulatedBalance: 15000,
      obligationPressure: 1000,
      pendingBills: 500,
      commandMode: false,
      exclusions: 0,
    });

    expect(result.sovereignFreeBalance).toBe(expectedFreeBalance);
  });

  it('handles undefined exclusions as zero', () => {
    const colchaoShortfall = Math.max(0, 5000 - 2000);
    const reserveShortfall = Math.max(0, 8000 - 3000);
    const protectionShortfall = colchaoShortfall + reserveShortfall;
    const expectedFreeBalance = 15000 - 1000 - 500 - protectionShortfall;

    const result = buildSovereignSnapshot({
      ...commonParams,
      monthBalance: 2000,
      accumulatedBalance: 15000,
      obligationPressure: 1000,
      pendingBills: 500,
      commandMode: false,
    });

    expect(result.sovereignFreeBalance).toBe(expectedFreeBalance);
  });
});

describe('resolveObligationPressure - helper puro', () => {
  it('soma invoices (stored ou computed - paid) + rotativo', () => {
    const r = resolveObligationPressure(
      [
        { computedTotal: 1000, paidAmount: 200, storedRemaining: 800, rotativoConverted: false },
        { computedTotal: 500, paidAmount: 0, storedRemaining: null, rotativoConverted: false },
      ],
      300
    );
    expect(r).toBe(800 + 500 + 300);
  });

  it('rotativoConverted zera a linha', () => {
    const r = resolveObligationPressure(
      [{ computedTotal: 1000, paidAmount: 0, storedRemaining: 900, rotativoConverted: true }],
      100
    );
    expect(r).toBe(100);
  });

  it('sem storedRemaining usa computed - paid (com floor 0)', () => {
    const r = resolveObligationPressure(
      [{ computedTotal: 400, paidAmount: 500, storedRemaining: null, rotativoConverted: false }],
      0
    );
    expect(r).toBe(0);
  });

  it('sem sources, retorna só rotativo', () => {
    expect(resolveObligationPressure([], 750)).toBe(750);
    expect(resolveObligationPressure([], 0)).toBe(0);
  });
});

describe('computeLaunchImpact - crédito retorna null (sem impacto imediato no caixa)', () => {
  const baseSnapshot = buildSovereignSnapshot({
    monthBalance: 2000,
    accumulatedBalance: 15000,
    accumulatedIncome: 50000,
    accumulatedExpenses: 30000,
    obligationPressure: 500,
    pendingBills: 200,
    commandMode: false,
    income: 5000,
    expenses: 3000,
    monthlyAport: 2000,
  });

  it('despesa no crédito retorna null', () => {
    expect(computeLaunchImpact(baseSnapshot, 100, 'expense', 'credit')).toBeNull();
  });

  it('despesa no dinheiro retorna preview negativo', () => {
    const p = computeLaunchImpact(baseSnapshot, 100, 'expense', 'money');
    expect(p).not.toBeNull();
    expect(p!.delta).toBe(-100);
  });

  it('receita retorna preview positivo', () => {
    const p = computeLaunchImpact(baseSnapshot, 250, 'income', 'money');
    expect(p).not.toBeNull();
    expect(p!.delta).toBe(250);
  });
});

describe('sovereignFreeBalance canonical truth', () => {
  const commonParams = {
    accumulatedIncome: 50000,
    accumulatedExpenses: 30000,
    income: 5000,
    expenses: 3000,
    monthlyAport: 2000,
    financialProfile: {
      monthlyIncome: 5000,
      colchaoInicialTarget: 5000,
      marcoZero: 2000,
      emergencyReserveTarget: 8000,
      emergencyReserveCurrent: 3000,
    },
  };

  it('heroValue equals sovereignFreeBalance in commandMode', () => {
    const result = buildSovereignSnapshot({
      ...commonParams,
      monthBalance: 2000,
      accumulatedBalance: 15000,
      obligationPressure: 1000,
      pendingBills: 500,
      commandMode: true,
    });

    expect(result.heroValue).toBe(result.sovereignFreeBalance);
    expect(result.heroValue).not.toBe(result.monthBalance);
  });

  it('heroValue equals monthBalance in rotina mode', () => {
    const result = buildSovereignSnapshot({
      ...commonParams,
      monthBalance: 2000,
      accumulatedBalance: 15000,
      obligationPressure: 1000,
      pendingBills: 500,
      commandMode: false,
    });

    expect(result.heroValue).toBe(result.monthBalance);
    expect(result.heroValue).not.toBe(result.sovereignFreeBalance);
  });

  it('sovereignFreeBalance formula: accumulated - virtualImpact - pendingBills - protectionShortfall', () => {
    const colchaoShortfall = Math.max(0, 5000 - 2000);
    const reserveShortfall = Math.max(0, 8000 - 3000);
    const protectionShortfall = colchaoShortfall + reserveShortfall; // 3000 + 5000 = 8000
    const expectedFreeBalance = 15000 - 1000 - 500 - protectionShortfall; // 15000 - 1000 - 500 - 8000 = 5500

    const result = buildSovereignSnapshot({
      ...commonParams,
      monthBalance: 2000,
      accumulatedBalance: 15000,
      obligationPressure: 1000,
      pendingBills: 500,
      commandMode: false,
    });

    expect(result.sovereignFreeBalance).toBe(expectedFreeBalance);
    expect(result.protectionShortfall).toBe(protectionShortfall);
  });
});