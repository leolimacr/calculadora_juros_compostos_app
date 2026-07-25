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

  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

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

  return (
    <div className={`bg-surface-primary border border-surface-elevated rounded-4xl p-5 shadow-card space-y-4 ${sectionBorder}`}>
      {/* SEÇÃO DE FATURAS */}
      {activeInvoices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              className="bg-surface-primary border border-surface-elevated p-4 rounded-3xl shadow-soft flex items-center gap-4 group cursor-pointer hover:border-brand-secondary/40 hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className="p-3 bg-brand-secondary/10 rounded-2xl text-brand-secondary group-hover:scale-110 transition-transform">
                <CardIcon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-muted text-[10px] font-black uppercase tracking-widest truncate">
                  Fatura do ciclo • {inv.cardName}
                </p>
                <h3 className="text-lg font-black text-text-primary mt-0.5">
                  {isPrivacyMode ? '••••' : `R$ ${fmt(inv.total)}`}
                </h3>
                <p className="text-xxs font-bold text-text-muted uppercase tracking-tighter mt-1">
                  Sai da folga do mês em {new Date(inv.dueDate?.replace(/-/g, '/') || '').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SEÇÃO DE CONTAS RECORRENTES */}
      {recurringBills.length > 0 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setBillsExpanded((prev) => !prev)}
            className="w-full flex items-center justify-between gap-3 py-2.5 border-b border-surface-elevated hover:border-brand-primary/30 transition-colors group"
            aria-expanded={billsExpanded}
          >
            <div className="flex items-center gap-2.5">
              <Clock size={15} className="text-text-muted group-hover:text-brand-primary transition-colors" />
              <p className="text-[11px] font-black uppercase tracking-ultra-wide text-text-muted group-hover:text-text-primary transition-colors">
                Contas Fixas Recorrentes
              </p>
              <span className="text-[10px] font-bold text-text-muted bg-surface-elevated/60 px-2 py-0.5 rounded-lg">
                {pendingBills.length} pendente{pendingBills.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {pendingBills.length > 0 && (
                <span className="text-xs font-black text-text-muted">
                  {isPrivacyMode ? '••••' : `R$ ${fmt(pendingBills.reduce((s, b) => s + b.amount, 0))}`}
                </span>
              )}
              <ChevronDown
                size={14}
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
                  rowStyle = 'bg-surface-secondary/50 border-surface-elevated/50 opacity-60';
                  iconStyle = 'bg-surface-elevated/50 text-text-muted';
                  statusBadgeStyle = 'text-text-muted bg-surface-elevated/70';
                } else if (paid) {
                  rowStyle = 'bg-status-success/5 border-status-success/20';
                  iconStyle = 'bg-status-success/10 text-status-success';
                  statusBadgeStyle = 'text-status-success bg-status-success/10';
                } else if (dueDay < today) {
                  rowStyle = 'bg-status-danger/5 border-status-danger/20';
                  iconStyle = 'bg-status-danger/10 text-status-danger';
                  statusBadgeStyle = 'text-status-danger bg-status-danger/10';
                } else {
                  rowStyle = 'bg-surface-primary border-surface-elevated hover:border-brand-primary/30';
                  iconStyle = 'bg-brand-primary/10 text-brand-primary';
                  statusBadgeStyle = 'text-amber-600 bg-amber-50';
                }

                return (
                  <div key={bill.id} className={`flex items-center gap-3 rounded-2xl border p-3.5 transition-colors ${rowStyle}`}>
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
                          className="p-1.5 bg-surface-secondary hover:bg-brand-primary/10 text-brand-primary rounded-xl transition-colors shadow-sm"
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
