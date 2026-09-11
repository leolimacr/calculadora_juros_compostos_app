import { useState } from 'react';
import { CreditCard as CardIcon, Clock, Check, ChevronDown, Circle, CircleCheckBig, Ban } from 'lucide-react';
import { getLocalDateString } from '../../../../utils/dateHelpers';
import { isBillPaid } from '../../../../utils/invoiceUtils';

interface PendingObligationsProps {
  activeInvoices: any[];
  pendingBills: any[];
  recurringBills: any[];
  safeTransactions: any[];
  isPrivacyMode: boolean;
  onOpenForm: (initialData?: any) => void;
  onNavigate?: (tool: string, state?: any) => void;
}

/** Formata DD/MM de forma segura: data ausente/inválida retorna null (nunca "Invalid Date"). */
export function formatCycleDate(dueDate: string | undefined | null): string | null {
  if (!dueDate) return null;
  const parsed = new Date(dueDate.replace(/-/g, '/'));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/** Grade de faturas pelo volume, sem trilhas vazias. Exportada para testes. */
export function invoiceGridClass(count: number): string {
  if (count <= 1) return 'grid grid-cols-1 md:max-w-md gap-4';
  if (count === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-4';
  return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
}

const PendingObligations: React.FC<PendingObligationsProps> = ({
  activeInvoices,
  pendingBills,
  recurringBills,
  safeTransactions,
  isPrivacyMode,
  onOpenForm,
  onNavigate,
}) => {
  const [billsExpanded, setBillsExpanded] = useState(false);

  if (activeInvoices.length === 0 && pendingBills.length === 0 && recurringBills.length === 0) return null;

  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const hasPendencies = activeInvoices.length > 0 || pendingBills.length > 0;
  const anyOverdue = activeInvoices.some(inv => {
    if (!inv.dueDate || inv.storedStatus === 'paid') return false;
    return new Date(inv.dueDate.replace(/-/g, '/')) < new Date();
  }) || recurringBills.some(b => {
    if (b.isActive === false) return false;
    if (isBillPaid(b, safeTransactions)) return false;
    return (b.dueDay || 31) < new Date().getDate();
  });

  const sectionBorder = anyOverdue
    ? 'border-l-4 border-l-status-danger/40'
    : hasPendencies
      ? 'border-l-4 border-l-brand-accent/40'
      : '';

  const invoiceCount = activeInvoices.length;
  // Grade pelo volume, sem trilhas vazias (ver invoiceGridClass).
  const gridClass = invoiceGridClass(invoiceCount);

  return (
    <div className={`bg-surface-primary border border-slate-200 rounded-panel p-5 shadow-panel space-y-4 ${sectionBorder}`}>
      <div>
        <h2 className="text-sm font-black text-text-primary tracking-tight">Obrigações do mês</h2>
        <p className="text-[11px] text-text-muted font-medium mt-0.5">
          Faturas do ciclo e contas fixas recorrentes
        </p>
      </div>
      {/* SEÇÃO DE FATURAS */}
      {invoiceCount > 0 && (
        <div className="space-y-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-1">
            Faturas do ciclo
          </p>
          <div className={gridClass}>
          {activeInvoices.map((inv) => (
            <div
              key={inv.cardId}
              role="button"
              tabIndex={0}
              onClick={() => {
                onNavigate?.('manager', { openCards: true, focusedCardId: inv.cardId });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onNavigate?.('manager', { openCards: true, focusedCardId: inv.cardId });
                }
              }}
              className="bg-surface-subtle border border-slate-200 p-4 rounded-section flex items-center gap-4 group cursor-pointer hover:border-slate-300 transition-all active:scale-[0.98]"
            >
              <div className="p-3 bg-brand-secondary/10 rounded-2xl text-brand-secondary group-hover:scale-110 transition-transform">
                <CardIcon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-muted text-[10px] font-black uppercase tracking-widest truncate">
                  {inv.cardName}
                </p>
                <h3 className="text-lg font-black text-text-primary mt-0.5 tabular-nums break-words">
                  {isPrivacyMode ? '••••' : `R$ ${fmt(inv.total)}`}
                </h3>
                {formatCycleDate(inv.dueDate) ? (
                  <p className="text-[11px] font-bold text-text-muted mt-1">
                    Sai da folga do mês{' '}
                    <span className="font-black text-slate-700">
                      em {formatCycleDate(inv.dueDate)}
                    </span>
                  </p>
                ) : (
                  <p className="text-[11px] font-medium text-text-muted mt-1">
                    Vencimento a definir
                  </p>
                )}
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* SEÇÃO DE CONTAS RECORRENTES */}
      {recurringBills.length > 0 && (
        <div className={`space-y-3 ${invoiceCount > 0 ? 'border-t border-slate-200 pt-4' : ''}`}>
          <button
            type="button"
            onClick={() => setBillsExpanded((prev) => !prev)}
            className="w-full flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3 border-b border-surface-elevated hover:border-brand-primary/30 transition-colors group min-h-[44px]"
            aria-expanded={billsExpanded}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Clock size={15} className="text-text-muted group-hover:text-brand-primary transition-colors shrink-0" />
              <p className="text-[11px] font-black uppercase tracking-ultra-wide text-text-muted group-hover:text-text-primary transition-colors">
                Contas Fixas Recorrentes
              </p>
              <span className="text-[10px] font-bold text-text-muted bg-surface-elevated/60 px-2 py-0.5 rounded-lg whitespace-nowrap">
                {pendingBills.length} pendente{pendingBills.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {pendingBills.length > 0 && (
                <span className="text-xs font-black text-text-muted tabular-nums whitespace-nowrap">
                  {isPrivacyMode ? '••••' : `R$ ${fmt(pendingBills.reduce((s, b) => s + b.amount, 0))}`}
                </span>
              )}
              <ChevronDown
                size={16}
                className={`text-text-muted transition-transform duration-200 ${billsExpanded ? 'rotate-180' : ''}`}
              />
            </div>
          </button>

          {billsExpanded && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              {[...recurringBills]
                .sort((a, b) => {
                  const today = new Date().getDate();
                  const aPaid = !a.isActive ? false : isBillPaid(a, safeTransactions);
                  const bPaid = !b.isActive ? false : isBillPaid(b, safeTransactions);
                  if ((b.dueDay || 31) !== (a.dueDay || 31)) return (b.dueDay || 31) - (a.dueDay || 31);
                  return (aPaid ? 1 : 0) - (bPaid ? 1 : 0);
                })
                .map((bill) => {
                const paid = isBillPaid(bill, safeTransactions);
                const inactive = !bill.isActive;
                const today = new Date().getDate();
                const dueDay = bill.dueDay || 31;

                let statusLabel: string;
                let statusIcon: React.ReactNode;
                if (inactive) {
                  statusLabel = 'Inativa';
                  statusIcon = <Ban size={10} />;
                } else if (paid) {
                  statusLabel = 'Paga';
                  statusIcon = <CircleCheckBig size={10} />;
                } else if (dueDay === today) {
                  statusLabel = 'Vencendo hoje';
                  statusIcon = <Circle size={10} />;
                } else if (dueDay > today) {
                  statusLabel = 'A vencer';
                  statusIcon = <Circle size={10} />;
                } else {
                  statusLabel = 'Vencida - Não paga';
                  statusIcon = <Circle size={10} />;
                }

                let rowStyle: string;
                let iconStyle: string;
                let statusBadgeStyle: string;
                if (inactive) {
                  rowStyle = 'bg-surface-secondary/50 border-surface-elevated/50';
                  iconStyle = 'bg-surface-elevated/50 text-text-muted';
                  statusBadgeStyle = 'text-text-muted bg-surface-elevated/70';
                } else if (paid) {
                  rowStyle = 'bg-status-success/5 border-status-success/20';
                  iconStyle = 'bg-status-success/10 text-action-primaryDark';
                  statusBadgeStyle = 'text-action-primaryDark bg-status-success/10';
                } else if (dueDay < today) {
                  rowStyle = 'bg-status-danger/5 border-status-danger/20';
                  iconStyle = 'bg-status-danger/10 text-action-dangerDark';
                  statusBadgeStyle = 'text-action-dangerDark bg-status-danger/10';
                } else {
                  rowStyle = 'bg-surface-subtle border-slate-200 hover:border-slate-300';
                  iconStyle = 'bg-brand-primary/10 text-action-primaryDark';
                  statusBadgeStyle = 'text-amber-700 bg-amber-50';
                }

                return (
                  <div key={bill.id} className={`flex items-center gap-3 rounded-item border p-3.5 transition-colors ${rowStyle}`}>
                    <div className={`p-2 rounded-xl shrink-0 ${iconStyle}`}>
                      {bill.type === 'subscription' ? <Check size={16} /> : <Clock size={16} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                          Dia {bill.dueDay} • {bill.type === 'fixed' ? 'Conta Fixa' : 'Assinatura'}
                        </p>
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg ${statusBadgeStyle}`}>
                          {statusIcon} {statusLabel}
                        </span>
                      </div>
                      <p className="text-sm font-black text-text-primary mt-0.5 truncate">{bill.name}</p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <p className={`text-sm font-black ${inactive ? 'text-text-muted' : 'text-text-primary'}`}>
                        {isPrivacyMode ? '••••' : `R$ ${fmt(bill.amount)}`}
                      </p>
                      {!inactive && !paid && (
                        <button
                          onClick={() => onOpenForm({
                            type: 'expense',
                            category: bill.category,
                            amount: bill.amount,
                            description: bill.name,
                            date: getLocalDateString(),
                            autoFocusAmount: true,
                          })}
                          className="p-1.5 bg-surface-secondary hover:bg-brand-primary/10 text-action-primaryDark rounded-xl transition-colors shadow-sm"
                          title="Pagar agora"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => setBillsExpanded(false)}
                className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-ultra-wide text-text-muted hover:text-text-primary transition-colors border border-dashed border-surface-elevated rounded-2xl hover:border-brand-primary/30"
              >
                <ChevronDown size={14} className="rotate-180" />
                Recolher
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PendingObligations;
