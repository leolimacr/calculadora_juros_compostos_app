import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, CreditCard, RefreshCw, Check, Clock } from 'lucide-react';
import { addRecurringBill, getRecurringBills, updateRecurringBill, deleteRecurringBill } from '../../../services/billService';
import { RecurringBill, Category } from '../../../types';

interface RecurringBillManagerProps {
  isOpen: boolean;
  onClose: (newBills?: RecurringBill[]) => void;
  userId: string;
  categories: Category[];
}

const RecurringBillManager: React.FC<RecurringBillManagerProps> = ({ isOpen, onClose, userId, categories }) => {
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [dueDay, setDueDay] = useState<string>('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'fixed' | 'subscription'>('fixed');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadBills();
    }
    if (categories.length > 0 && !category) {
      setCategory(categories[0].name);
    }
  }, [isOpen, userId, categories]);

  const loadBills = async () => {
    setIsLoading(true);
    try {
      const data = await getRecurringBills(userId);
      setBills(data);
    } catch (error) {
      console.error("Erro ao carregar contas recorrentes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!name.trim() || !amount || !dueDay || !category) return;
    setIsAdding(true);
    try {
      await addRecurringBill(userId, {
        name: name.trim(),
        amount: Number(amount),
        dueDay: Number(dueDay),
        category,
        type,
        isActive: true
      });
      setName('');
      setAmount('');
      setDueDay('');
      await loadBills();
    } catch (error) {
      console.error("Erro ao adicionar conta recorrente:", error);
      alert("Erro ao salvar conta recorrente.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (billId: string) => {
    if (window.confirm("Deseja remover esta conta recorrente?")) {
      try {
        await deleteRecurringBill(userId, billId);
        await loadBills();
      } catch (error) {
        console.error("Erro ao excluir conta recorrente:", error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-primary w-full max-w-md rounded-4xl shadow-2xl border border-surface-elevated overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-surface-elevated flex items-center justify-between bg-surface-secondary/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
              <RefreshCw size={20} />
            </div>
            <h2 className="text-lg font-black text-text-primary uppercase tracking-tight">Assinaturas e Fixas</h2>
          </div>
          <button onClick={() => onClose(bills)} className="p-2 hover:bg-surface-elevated rounded-full transition-colors text-text-muted">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* NOTA EDUCATIVA (NOVO) */}
          <div className="flex gap-3 p-4 bg-brand-secondary/5 border border-brand-secondary/10 rounded-3xl">
            <div className="p-2 bg-brand-secondary/10 rounded-2xl text-brand-secondary h-fit">
              <Clock size={18} />
            </div>
            <p className="text-xxs font-medium text-text-secondary leading-relaxed">
              <span className="font-black text-brand-secondary uppercase tracking-widest block mb-1">Dica para contas variáveis</span>
              Para Luz, Água ou Gás, informe um <strong>valor médio</strong>. Isso permite ao Controla provisionar seu saldo. No dia do pagamento, você poderá ajustar para o valor real.
            </p>
          </div>

          {/* Formulário de Adição */}
          <div className="space-y-4 bg-surface-secondary/30 p-4 rounded-3xl border border-surface-elevated">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Novo Compromisso</p>
            
            <div className="flex bg-surface-primary p-1 rounded-2xl border border-surface-elevated mb-2">
              <button 
                onClick={() => setType('fixed')} 
                className={`flex-1 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${type === 'fixed' ? 'bg-surface-elevated text-text-primary shadow-soft' : 'text-text-muted'}`}
              >
                Conta Fixa
              </button>
              <button 
                onClick={() => setType('subscription')} 
                className={`flex-1 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${type === 'subscription' ? 'bg-surface-elevated text-text-primary shadow-soft' : 'text-text-muted'}`}
              >
                Assinatura
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nome (ex: Aluguel, Netflix)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-primary p-4 rounded-2xl text-text-primary font-medium outline-none border border-surface-elevated focus:border-brand-primary text-sm shadow-sm"
              />
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Valor Mensal</label>
                  <input
                    type="number"
                    placeholder="R$ 0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-surface-primary p-3 rounded-xl text-text-primary font-bold outline-none border border-surface-elevated focus:border-brand-primary text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Dia Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ex: 10"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full bg-surface-primary p-3 rounded-xl text-text-primary font-bold outline-none border border-surface-elevated focus:border-brand-primary text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-surface-primary p-3 rounded-xl text-text-primary font-bold outline-none border border-surface-elevated focus:border-brand-primary text-xs appearance-none"
                >
                  {categories.filter(c => c.type === 'expense').map(cat => (
                    <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAdd}
                disabled={isAdding || !name.trim() || !amount || !dueDay}
                className="w-full py-4 bg-brand-primary text-text-onBrand rounded-2xl shadow-brand-glow active:scale-95 disabled:opacity-50 transition-all font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Adicionar Compromisso
              </button>
            </div>
          </div>

          {/* Lista de Contas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between ml-1">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                Compromissos Cadastrados
              </p>
              {isLoading && <RefreshCw size={12} className="animate-spin text-text-muted" />}
            </div>
            
            {bills.length === 0 ? (
              <div className="text-center py-8 bg-surface-secondary/30 rounded-3xl border border-dashed border-surface-elevated">
                <p className="text-xxs text-text-muted font-bold uppercase tracking-widest leading-loose px-4">
                  Nenhuma conta fixa ou assinatura cadastrada.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {bills.map((bill) => (
                  <div key={bill.id} className="p-4 bg-surface-secondary rounded-3xl border border-surface-elevated group hover:border-text-muted/30 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${bill.type === 'subscription' ? 'bg-status-info/10 text-brand-secondary' : 'bg-brand-primary/10 text-brand-primary'}`}>
                        {bill.type === 'subscription' ? <Check size={16} /> : <Clock size={16} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-primary">{bill.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">Dia {bill.dueDay}</span>
                          <span className="text-[9px] font-bold text-text-muted opacity-30">•</span>
                          <span className="text-[9px] font-bold text-brand-primary uppercase tracking-tighter">
                            R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(bill.id)}
                      className="p-2 text-text-muted hover:text-status-danger hover:bg-status-danger/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-surface-secondary/50 border-t border-surface-elevated">
          <button
            onClick={() => onClose(bills)}
            className="w-full py-4 bg-surface-elevated text-text-primary font-black rounded-3xl uppercase text-xxs tracking-ultra-wide hover:bg-surface-secondary transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecurringBillManager;
