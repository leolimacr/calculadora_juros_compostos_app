import { describe, it, expect } from 'vitest';
import { buildSovereignSnapshot } from '../../utils/calculations';

describe('buildSovereignSnapshot with rotativoDebtBalance', () => {
  it('adds rotativoDebtBalance to virtualImpact for sovereignFreeBalance deduction', () => {
    const result = buildSovereignSnapshot({
      monthBalance: 5000,
      accumulatedBalance: 20000,
      accumulatedIncome: 50000,
      accumulatedExpenses: 30000,
      virtualImpact: 1000,
      rotativoDebtBalance: 500,
      commandMode: true,
      income: 5000,
      expenses: 3000,
      monthlyAport: 2000,
    });

    expect(result.obligationsDeduction).toBe(1000 + 500);
  });

  it('handles zero rotativoDebtBalance without changing behavior', () => {
    const result = buildSovereignSnapshot({
      monthBalance: 5000,
      accumulatedBalance: 20000,
      accumulatedIncome: 50000,
      accumulatedExpenses: 30000,
      virtualImpact: 1000,
      rotativoDebtBalance: 0,
      commandMode: true,
      income: 5000,
      expenses: 3000,
      monthlyAport: 2000,
    });

    expect(result.obligationsDeduction).toBe(1000);
  });

  it('handles undefined rotativoDebtBalance as zero', () => {
    const result = buildSovereignSnapshot({
      monthBalance: 5000,
      accumulatedBalance: 20000,
      accumulatedIncome: 50000,
      accumulatedExpenses: 30000,
      virtualImpact: 1000,
      commandMode: true,
      income: 5000,
      expenses: 3000,
      monthlyAport: 2000,
    });

    expect(result.obligationsDeduction).toBe(1000);
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
      virtualImpact: 1000,
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
      virtualImpact: 1000,
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
      virtualImpact: 1000,
      pendingBills: 500,
      commandMode: false,
    });

    expect(result.sovereignFreeBalance).toBe(expectedFreeBalance);
    expect(result.protectionShortfall).toBe(protectionShortfall);
  });
});
