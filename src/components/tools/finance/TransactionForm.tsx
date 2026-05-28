import React, { useState, useEffect } from 'react';
import { FolderPlus } from 'lucide-react';
import CategoryManager from './CategoryManager';
import { Transaction, Category } from '../../../types';
import { NexusAdvisoryContext } from '../../../services/nexusInsightEngine';
import NexusInlineAdvisor from './NexusInlineAdvisor';

interface TransactionFormProps {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<Transaction> | null;
  categories: Category[];
  onSaveCategory: (category: Category) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  nexusAdvisoryContext?: NexusAdvisoryContext;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onSave, 
  onCancel, 
  initialData,  
  categories = [],
  onSaveCategory,
  onDeleteCategory,
  nexusAdvisoryContext
}) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [type, setType] = useState<'income' | 'expense'>(initialData?.type || 'expense');
  const [category, setCategory] = useState(initialData?.category || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Sync state when initialData changes (modal reopen)
  useEffect(() => {
    setDescription(initialData?.description || '');
    setAmount(initialData?.amount || '');
    setType(initialData?.type || 'expense');
    setCategory(initialData?.category || '');
    setDate(initialData?.date || new Date().toISOString().split('T')[0]);
  }, [initialData]);

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
  const handleSave = async () => {
    const numericAmount = Number(amount);
    if (!description.trim()) return alert("Informe uma descrição para o lançamento.");
    if (!numericAmount || numericAmount <= 0) return alert("Informe um valor válido maior que zero.");
    if (!category) return alert("Selecione uma categoria.");
    
    setIsSaving(true);
    await onSave({ 
      id: initialData?.id,
      description: description.trim(), 
      amount: numericAmount, 
      type, 
      category, 
      date 
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

        <div className="space-y-1">
          <label className="text-xxs font-black text-text-muted uppercase ml-1">Descrição</label>
          <input type="text" placeholder="Ex: Aluguel, Supermercado..." value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-surface-primary p-4 rounded-2xl text-text-primary font-medium outline-none border border-surface-elevated focus:border-brand-primary" />
        </div>

        <div className="space-y-1">
          <label className="text-xxs font-black text-text-muted uppercase ml-1">Categoria</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-surface-primary p-4 rounded-2xl text-text-primary outline-none border border-surface-elevated focus:border-brand-primary appearance-none">
            {currentCategoryList.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <button 
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="mt-2 w-full py-3 rounded-2xl bg-surface-secondary hover:bg-brand-primary/10 border border-surface-elevated hover:border-brand-primary/30 text-text-secondary hover:text-brand-primary font-bold text-xxs uppercase tracking-ultra-wide transition-all flex items-center justify-center gap-2"
          >
            <FolderPlus size={16} />
            <span>Gerenciar Categorias</span>
          </button>
        </div>

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
