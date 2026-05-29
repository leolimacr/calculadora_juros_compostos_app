import React, { useState, useEffect } from 'react';
import { FolderPlus } from 'lucide-react';
import CategoryManager from './CategoryManager';
import CardManager from './CardManager';
import { Transaction, Category, CreditCard } from '../../../types';
import { NexusAdvisoryContext } from '../../../services/nexusInsightEngine';
import NexusInlineAdvisor from './NexusInlineAdvisor';
import { getCards } from '../../../services/cardService';
import { useAuth } from '../../../contexts/AuthContext';

interface TransactionFormProps {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<Transaction> | null;
  categories: Category[];
  onSaveCategory: (category: Category) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  nexusAdvisoryContext?: NexusAdvisoryContext;
  transactions: Transaction[];
}

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onSave, 
  onCancel, 
  initialData,  
  categories = [],
  onSaveCategory,
  onDeleteCategory,
  nexusAdvisoryContext,
  transactions
}) => {
  const { user } = useAuth();
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [type, setType] = useState<'income' | 'expense'>(initialData?.type || 'expense');
  const [category, setCategory] = useState(initialData?.category || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'money' | 'credit'>(initialData?.paymentMethod || 'money');
  const [cardId, setCardId] = useState<string>(initialData?.cardId || '');
  const [userCards, setUserCards] = useState<CreditCard[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Load user cards
  useEffect(() => {
    if (user?.uid) {
      getCards(user.uid)
        .then(cards => {
          const activeCards = cards.filter(c => c.isActive !== false);
          setUserCards(activeCards);
          
          // Auto-select if only one card exists and no card is currently selected
          if (activeCards.length === 1 && !cardId) {
            setCardId(activeCards[0].id);
          }
        })
        .catch(console.error);
    }
  }, [user?.uid]);

  // Sync state when initialData changes (modal reopen)
  useEffect(() => {
    setDescription(initialData?.description || '');
    setAmount(initialData?.amount || '');
    setType(initialData?.type || 'expense');
    setCategory(initialData?.category || '');
    setDate(initialData?.date || new Date().toISOString().split('T')[0]);
    setPaymentMethod(initialData?.paymentMethod || 'money');
    setCardId(initialData?.cardId || '');
  }, [initialData]);

  // Reset payment method and cardId when type is 'income'
  useEffect(() => {
    if (type === 'income') {
      setPaymentMethod('money');
      setCardId('');
    }
  }, [type]);

  // Reset cardId if paymentMethod is changed to 'money'
  useEffect(() => {
    if (paymentMethod === 'money') {
      setCardId('');
    }
  }, [paymentMethod]);

  // ✅ CORREÇÃO: Calcula dinamicamente a partir de `categories` (reativo e em tempo real)
  const currentCategoryList = categories
    .filter((c: Category) => c.type === type)
    .map((c: Category) => c.name);

  useEffect(() => {
    // Se for novo lançamento e não houver categoria pré-selecionada, pega a primeira da lista.
    if (!initialData?.id && !initialData?.category) {
      setCategory(currentCategoryList[0] || 'Outros');
    }
  }, [type, categories, initialData]);

  const handleCloseCardManager = (updatedCards?: CreditCard[]) => {
    if (updatedCards) setUserCards(updatedCards.filter(c => c.isActive !== false));
    setIsCardModalOpen(false);
  };

  const handleSave = async () => {
    const numericAmount = Number(amount);
    if (!description.trim()) return alert("Informe uma descrição para o lançamento.");
    if (!numericAmount || numericAmount <= 0) return alert("Informe um valor válido maior que zero.");
    if (!category) return alert("Selecione uma categoria.");
    
    // Validação de Cartão: Se for crédito, obriga a selecionar um cartão se houver cartões cadastrados
    if (paymentMethod === 'credit' && !cardId && userCards.length > 0) {
      return alert("Por favor, selecione qual cartão foi utilizado para este lançamento.");
    }
    
    setIsSaving(true);
    await onSave({ 
      id: initialData?.id,
      description: description.trim(), 
      amount: numericAmount, 
      type, 
      category, 
      date,
      paymentMethod,
      cardId: paymentMethod === 'credit' ? (cardId || null) : null
    });
  };

  return (
    <>
      <CategoryManager 
        isOpen={isCategoryModalOpen} 
        onClose={() => setIsCategoryModalOpen(false)} 
        categories={categories} 
        onSave={onSaveCategory} 
        onDelete={onDeleteCategory} 
      />
      <CardManager
        isOpen={isCardModalOpen}
        onClose={handleCloseCardManager}
        userId={user?.uid || ''}
        transactions={transactions}
      />
      <div className="space-y-4 p-2">
        <div className="flex bg-surface-elevated p-1 rounded-2xl border border-surface-elevated">
          <button onClick={() => setType('expense')} className={`flex-1 py-2 rounded-xl font-black uppercase text-xxs transition-all ${type === 'expense' ? 'bg-status-danger text-text-onBrand shadow-soft' : 'text-text-muted'}`}>Despesa</button>
          <button onClick={() => setType('income')} className={`flex-1 py-2 rounded-xl font-black uppercase text-xxs transition-all ${type === 'income' ? 'bg-brand-primary text-text-onBrand shadow-soft' : 'text-text-muted'}`}>Receita</button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xxs font-black text-text-muted uppercase ml-1">Valor</label>
            <input 
              type="text" 
              inputMode="numeric" 
              placeholder="R$ 0,00" 
              value={amount ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(amount)) : ''} 
              onChange={e => {
                const value = e.target.value.replace(/\D/g, '');
                setAmount(value ? Number(value) / 100 : '');
              }} 
              className="w-full bg-surface-primary p-4 rounded-2xl text-text-primary font-bold outline-none border border-surface-elevated focus:border-brand-primary" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-xxs font-black text-text-muted uppercase ml-1">Data</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-surface-primary p-4 rounded-2xl text-text-primary outline-none border border-surface-elevated focus:border-brand-primary text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xxs font-black text-text-muted uppercase ml-1">Descrição</label>
            <input type="text" placeholder="Ex: Aluguel, Supermercado..." value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-surface-primary p-4 rounded-2xl text-text-primary font-medium outline-none border border-surface-elevated focus:border-brand-primary" />
          </div>

          <div className="space-y-1">
            <label className="text-xxs font-black text-text-muted uppercase ml-1">Categoria</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-surface-primary p-4 rounded-2xl text-text-primary outline-none border border-surface-elevated focus:border-brand-primary appearance-none">
              {currentCategoryList.map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {type === 'expense' && (
          <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-xxs font-black text-text-muted uppercase ml-1">Meio de Pagamento</label>
                <div className="flex bg-surface-primary p-1 rounded-2xl border border-surface-elevated">
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('money')} 
                    className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${paymentMethod === 'money' ? 'bg-surface-elevated text-text-primary shadow-soft' : 'text-text-muted'}`}
                  >
                    Dinheiro
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('credit')} 
                    className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${paymentMethod === 'credit' ? 'bg-status-info/10 text-brand-secondary shadow-soft border border-brand-secondary/20' : 'text-text-muted'}`}
                  >
                    Cartão
                  </button>
                </div>
              </div>

              {paymentMethod === 'credit' && (
                <div className="space-y-1 animate-in fade-in slide-in-from-left-1 duration-200">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xxs font-black text-text-muted uppercase">Identificar Cartão</label>
                    <button 
                      type="button"
                      onClick={() => setIsCardModalOpen(true)}
                      className="text-[9px] font-black text-brand-primary uppercase tracking-widest hover:underline"
                    >
                      + Gerenciar
                    </button>
                  </div>
                  <select 
                    value={cardId} 
                    onChange={e => setCardId(e.target.value)} 
                    className="w-full bg-surface-primary p-4 rounded-2xl text-text-primary outline-none border border-surface-elevated focus:border-brand-primary appearance-none text-sm"
                  >
                    <option value="">{userCards.length > 1 ? 'Selecione o seu cartão...' : 'Cartão não identificado'}</option>
                    {userCards.map(card => (
                      <option key={card.id} value={card.id}>{card.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {paymentMethod === 'credit' && (
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider ml-1 mt-1">
                Gasto no crédito não altera o saldo agora.
              </p>
            )}
          </div>
        )}
        
        <button 
          type="button"
          onClick={() => setIsCategoryModalOpen(true)}
          className="mt-1 w-full py-3 rounded-2xl bg-surface-secondary hover:bg-brand-primary/10 border border-surface-elevated hover:border-brand-primary/30 text-text-secondary hover:text-brand-primary font-bold text-xxs uppercase tracking-ultra-wide transition-all flex items-center justify-center gap-2"
        >
          <FolderPlus size={16} />
          <span>Gerenciar Categorias</span>
        </button>

        <NexusInlineAdvisor 
          draft={{ amount: Number(amount), category, type }}
          context={nexusAdvisoryContext}
        />

        <div className="flex gap-3 pt-4">
          <button onClick={onCancel} className="flex-1 py-4 text-text-muted font-bold uppercase text-xxs tracking-ultra-wide">Cancelar</button>
          <button onClick={handleSave} disabled={isSaving} className="flex-1 py-4 bg-brand-primary text-text-onBrand rounded-3xl font-black uppercase text-xxs tracking-ultra-wide shadow-brand-glow active:scale-95 disabled:opacity-50">
              {isSaving ? 'Processando...' : initialData ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </div>
    </>
  );
};

export default TransactionForm;
