import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PendingObligations, { formatCycleDate, invoiceGridClass } from './PendingObligations';

describe('formatCycleDate', () => {
  it('formata DD/MM de data válida', () => {
    expect(formatCycleDate('2026-10-14')).toBe('14/10');
  });

  it('retorna null para data ausente (nunca "Invalid Date")', () => {
    expect(formatCycleDate(undefined)).toBeNull();
    expect(formatCycleDate(null)).toBeNull();
    expect(formatCycleDate('')).toBeNull();
  });

  it('retorna null para data inválida', () => {
    expect(formatCycleDate('não-é-data')).toBeNull();
  });
});

describe('invoiceGridClass', () => {
  it('1 fatura: coluna única com largura controlada', () => {
    expect(invoiceGridClass(1)).toContain('grid-cols-1');
    expect(invoiceGridClass(1)).toContain('md:max-w-md');
    expect(invoiceGridClass(1)).not.toContain('lg:grid-cols-3');
  });

  it('2 faturas: 2 colunas a partir do tablet, sem 3ª trilha no desktop', () => {
    expect(invoiceGridClass(2)).toContain('md:grid-cols-2');
    expect(invoiceGridClass(2)).not.toContain('lg:grid-cols-3');
  });

  it('3+ faturas: até 3 colunas no desktop', () => {
    expect(invoiceGridClass(3)).toContain('lg:grid-cols-3');
    expect(invoiceGridClass(5)).toContain('lg:grid-cols-3');
  });

  it('zero faturas: classe de coluna única', () => {
    expect(invoiceGridClass(0)).toContain('grid-cols-1');
  });
});

const baseProps = {
  pendingBills: [],
  recurringBills: [],
  safeTransactions: [],
  isPrivacyMode: false,
  onOpenForm: vi.fn(),
  onNavigate: vi.fn(),
};

describe('PendingObligations (render)', () => {
  it('não renderiza "Invalid Date" com fatura sem data; mostra mensagem neutra', () => {
    render(
      <PendingObligations
        {...baseProps}
        activeInvoices={[{ cardId: 'c1', cardName: 'Cartão X', total: 100, dueDate: undefined }]}
      />
    );
    expect(document.body.textContent).not.toContain('Invalid Date');
    expect(screen.getByText('Vencimento a definir')).toBeDefined();
  });

  it('renderiza título do painel e subgrupo de faturas', () => {
    render(
      <PendingObligations
        {...baseProps}
        activeInvoices={[{ cardId: 'c1', cardName: 'Cartão X', total: 100, dueDate: '2026-10-14' }]}
      />
    );
    expect(screen.getByText('Obrigações do mês')).toBeDefined();
    expect(screen.getByText('Faturas do ciclo')).toBeDefined();
    expect(screen.getByText('em 14/10')).toBeDefined();
  });

  it('retorna null sem faturas, pendentes e recorrentes', () => {
    const { container } = render(<PendingObligations {...baseProps} activeInvoices={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('toggle de recorrentes expande e colapsa com aria-expanded', () => {
    render(
      <PendingObligations
        {...baseProps}
        activeInvoices={[]}
        recurringBills={[{ id: 'b1', name: 'Luz', amount: 50, dueDay: 10, isActive: true, category: 'Casa' }]}
      />
    );
    const toggle = screen.getByText('Contas Fixas Recorrentes').closest('button');
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle!);
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
  });
});
