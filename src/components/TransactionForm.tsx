import React, { useState, useEffect } from 'react';
import { FolderPlus } from 'lucide-react';
import CategoryManager from './CategoryManager';

const TransactionForm: React.FC<any> = ({ 
  onSave, 
  onCancel, 
  expenseCategories, 
  incomeCategories, 
  onUpdateExpenseCategories, 
  onUpdateIncomeCategories,
  initialData,  
  categories = [],
  onSaveCategory,
  onDeleteCategory
}) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [type, setType] = useState<'income' | 'expense'>(initialData?.type || 'expense');
  const [category, setCategory] = useState(initialData?.category || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // ✅ CORREÇÃO: Calcula dinamicamente a partir de `categories` (reativo e em tempo real)
  const currentCategoryList = categories
    .filter(c => c.type === type)
    .map(c => c.name);

  useEffect(() => {
    // Se estiver editando, mantém a categoria do item. Se for novo, pega a primeira da lista.
    if (!initialData) {
      setCategory(currentCategoryList[0] || 'Outros');
    }
  }, [type, categories]);

  const handleSave = async () => {
    if (!description || !amount) return alert("Preencha todos os campos");
    setIsSaving(true);
    await onSave({ 
      id: initialData?.id,
      description, 
      amount: Number(amount), 
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
        <div className="flex bg-slate-800 p-1 rounded-xl">
          <button onClick={() => setType('expense')} className={`flex-1 py-2 rounded-lg font-black uppercase text-xs transition-all ${type === 'expense' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-500'}`}>Despesa</button>
          <button onClick={() => setType('income')} className={`flex-1 py-2 rounded-lg font-black uppercase text-xs transition-all ${type === 'income' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500'}`}>Receita</button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Valor (R$)</label>
            <input type="number" inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-slate-800 p-4 rounded-xl text-white font-bold outline-none border border-slate-700 focus:border-sky-500" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Data</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-800 p-4 rounded-xl text-white outline-none border border-slate-700 focus:border-sky-500 text-sm" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Descrição</label>
          <input type="text" placeholder="Ex: Aluguel, Supermercado..." value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-800 p-4 rounded-xl text-white font-medium outline-none border border-slate-700 focus:border-sky-500" />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Categoria</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-800 p-4 rounded-xl text-white outline-none border border-slate-700 focus:border-sky-500 appearance-none">
            {currentCategoryList.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <button 
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="mt-2 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-emerald-400 font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <FolderPlus size={16} />
            <span>Gerenciar Categorias</span>
          </button>
        </div>

        <div className="flex gap-3 pt-4">
          <button onClick={onCancel} className="flex-1 py-4 text-slate-500 font-bold uppercase text-xs tracking-widest">Cancelar</button>
          <button onClick={handleSave} disabled={isSaving} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 disabled:opacity-50">
              {isSaving ? 'Processando...' : initialData ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </div>
    </>
  );
};

export default TransactionForm;
