import React from 'react';
import { CreditCard as CardIcon, Clock, Check } from 'lucide-react';

interface PendingObligationsProps {
  activeInvoices: any[];
  pendingBills: any[];
  isPrivacyMode: boolean;
  onOpenForm: (initialData?: any) => void;
}

const PendingObligations: React.FC<PendingObligationsProps> = ({
  activeInvoices,
  pendingBills,
  isPrivacyMode,
  onOpenForm,
}) => {
  if (activeInvoices.length === 0 && pendingBills.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* SEÇÃO DE FATURAS */}
      {activeInvoices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeInvoices.map((inv) => (
            <div key={inv.cardId} className="bg-surface-primary border border-surface-elevated p-4 rounded-3xl shadow-soft flex items-center gap-4 group">
              <div className="p-3 bg-brand-secondary/10 rounded-2xl text-brand-secondary group-hover:scale-110 transition-transform">
                <CardIcon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-muted text-[10px] font-black uppercase tracking-widest truncate">
                  Fatura do ciclo • {inv.cardName}
                </p>
                <h3 className="text-lg font-black text-text-primary mt-0.5">
                  {isPrivacyMode ? '••••' : `R$ ${inv.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </h3>
                <p className="text-xxs font-bold text-text-muted uppercase tracking-tighter mt-1">
                  Sai da folga do mês em {new Date(inv.dueDate?.replace(/-/g, '/') || '').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SEÇÃO DE CONTAS PENDENTES */}
      {pendingBills.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingBills.map((bill) => (
            <div key={bill.id} className="bg-surface-primary border border-surface-elevated p-4 rounded-3xl shadow-soft flex items-center gap-4 group">
              <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary group-hover:scale-110 transition-transform">
                <Clock size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-muted text-[10px] font-black uppercase tracking-widest truncate">
                  {bill.type === 'fixed' ? 'Conta Fixa' : 'Assinatura'} • Dia {bill.dueDay}
                </p>
                <h3 className="text-lg font-black text-text-primary mt-0.5 truncate">
                  {bill.name}
                </h3>
                <p className={`text-sm font-black mt-1 ${bill.amount > 0 ? 'text-text-primary' : 'text-brand-primary'}`}>
                  {isPrivacyMode ? '••••' : `R$ ${bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </p>
              </div>
              <div className="hidden group-hover:block animate-in fade-in slide-in-from-right-1">
                <button 
                  onClick={() => onOpenForm({ 
                    type: 'expense', 
                    category: bill.category, 
                    amount: bill.amount, 
                    description: bill.name,
                    date: new Date().toISOString().split('T')[0],
                    autoFocusAmount: true
                  })}
                  className="p-2 bg-surface-secondary hover:bg-brand-primary/10 text-brand-primary rounded-xl transition-colors shadow-sm"
                  title="Pagar agora"
                >
                  <Check size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingObligations;
