import React, { useState, useEffect } from 'react';

const TransactionForm: React.FC<any> = ({ onSave, onCancel, expenseCategories, incomeCategories, onUpdateExpenseCategories, onUpdateIncomeCategories }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  // Garante que sempre tenha uma categoria selecionada
  const [category, setCategory] = useState(expenseCategories[0] || 'Outros');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  
  const [isCreating, setIsCreating] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isSaving, setIsSaving] = useState(false); // Feedback visual

  // Atualiza a categoria padrão quando muda o tipo (Despesa/Receita)
  useEffect(() => {
    if (type === 'expense') setCategory(expenseCategories[0] || 'Outros');
    else setCategory(incomeCategories[0] || 'Outros');
  }, [type, expenseCategories, incomeCategories]);

  const handleSaveClick = async () => {
    // 1. Valida Descrição
    if (!description.trim()) {
      alert("Por favor, digite uma descrição.");
      return;
    }

    // 2. Valida Valor (Trata vírgula e ponto)
    const cleanAmount = amount.toString().replace(',', '.');
    const numericAmount = parseFloat(cleanAmount);

    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      alert("Por favor, digite um valor válido (Ex: 10.50).");
      return;
    }

    setIsSaving(true); // Trava o botão para não duplicar

    try {
      let finalCat = category;
      
      // 3. Lógica de Nova Categoria
      if (isCreating && newCatName.trim()) {
          finalCat = newCatName.trim();
          if (type === 'expense') onUpdateExpenseCategories((prev: any) => [...prev, finalCat]);
          else onUpdateIncomeCategories((prev: any) => [...prev, finalCat]);
      }

      // 4. Envia para o App.tsx salvar
      await onSave({ 
          description, 
          amount: numericAmount, 
          type, 
          category: finalCat, 
          date 
      });
      // O App.tsx fecha o modal, então não precisamos setar false aqui
    } catch (error) {
      alert("Erro ao processar dados.");
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-2 animate-in slide-in-from-bottom">
      {/* Botões de Tipo */}
      <div className="flex bg-slate-800 p-1.5 rounded-2xl">
        <button 
          onClick={() => setType('expense')} 
          className={`flex-1 py-3 rounded-xl font-black uppercase tracking-wide transition-all ${type === 'expense' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-500'}`}
        >
          Despesa
        </button>
        <button 
          onClick={() => setType('income')} 
          className={`flex-1 py-3 rounded-xl font-black uppercase tracking-wide transition-all ${type === 'income' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500'}`}
        >
          Receita
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor (R$)</label>
            <input 
                type="number" 
                inputMode="decimal"
                placeholder="0.00" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-white text-xl font-bold outline-none focus:border-emerald-500" 
            />
        </div>
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Data</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-emerald-500 text-sm" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Descrição</label>
        <input type="text" placeholder="Ex: Supermercado..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-emerald-500" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-end">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Categoria</label>
            {!isCreating && <button onClick={() => setIsCreating(true)} className="text-[10px] text-emerald-400 font-bold hover:underline">+ Nova</button>}
        </div>
        
        {isCreating ? (
            <div className="flex gap-2">
                <input type="text" autoFocus placeholder="Nome da categoria" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="flex-1 bg-slate-800 border border-emerald-500 p-4 rounded-2xl text-white outline-none" />
                <button onClick={() => setIsCreating(false)} className="bg-slate-700 px-4 rounded-2xl text-white">✕</button>
            </div>
        ) : (
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-white outline-none appearance-none">
            {(type === 'expense' ? expenseCategories : incomeCategories).map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
        )}
      </div>

      <div className="flex gap-4 pt-2">
        <button onClick={onCancel} className="flex-1 py-4 text-slate-500 font-bold hover:text-white">Cancelar</button>
        <button 
            onClick={handleSaveClick}
            disabled={isSaving}
            className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-900/20 active:scale-95 transition-all disabled:opacity-50"
        >
            {isSaving ? 'SALVANDO...' : 'SALVAR'}
        </button>
      </div>
    </div>
  );
};
export default TransactionForm;