
import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import ContentModal from './ContentModal';

interface TransactionFormProps {
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
  expenseCategories: string[];
  incomeCategories: string[];
  onUpdateExpenseCategories: (cats: string[]) => void;
  onUpdateIncomeCategories: (cats: string[]) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onSave, 
  onCancel,
  expenseCategories,
  incomeCategories,
  onUpdateExpenseCategories,
  onUpdateIncomeCategories
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(type === 'expense' ? expenseCategories[0] : incomeCategories[0]);
  const [amount, setAmount] = useState<number>(0);

  // States for new category creation
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📁');
  
  // State for category manager modal
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  const handleCategoryChange = (val: string) => {
    if (val === '✨ Criar Nova Categoria...') {
      setIsCreatingNew(true);
      setCategory(categories[0]);
    } else {
      setCategory(val);
    }
  };

  const saveNewCategory = () => {
    if (!newCategoryName.trim()) return;
    const fullName = `${newCategoryIcon} ${newCategoryName.trim()}`;
    if (type === 'expense') {
      onUpdateExpenseCategories([...expenseCategories, fullName]);
    } else {
      onUpdateIncomeCategories([...incomeCategories, fullName]);
    }
    setCategory(fullName);
    setIsCreatingNew(false);
    setNewCategoryName('');
  };

  const deleteCategory = (catToDelete: string) => {
    if (confirm(`Deseja realmente excluir a categoria "${catToDelete}"?`)) {
      if (type === 'expense') {
        onUpdateExpenseCategories(expenseCategories.filter(c => c !== catToDelete));
      } else {
        onUpdateIncomeCategories(incomeCategories.filter(c => c !== catToDelete));
      }
      if (category === catToDelete) {
        setCategory(type === 'expense' ? expenseCategories[0] : incomeCategories[0]);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || amount <= 0) return;
    onSave({ type, date, description, category, amount });
  };

  const placeholderText = type === 'expense' 
    ? "Ex: Supermercado, Aluguel..." 
    : "Ex: Salário, Freelance...";

  return (
    <div className="max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-700">
        <div className={`${type === 'expense' ? 'bg-orange-600' : 'bg-emerald-600'} p-6 text-white transition-colors duration-300`}>
          <h2 className="text-xl font-bold">Novo Lançamento</h2>
          <p className="opacity-80 text-sm">Preencha os dados do fluxo</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Tabs */}
          <div className="bg-slate-900 p-1 rounded-xl flex gap-1 border border-slate-700">
            <button
              type="button"
              onClick={() => { setType('expense'); setCategory(expenseCategories[0]); setIsCreatingNew(false); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-slate-700 text-orange-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setCategory(incomeCategories[0]); setIsCreatingNew(false); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'income' ? 'bg-slate-700 text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Receita
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">📅</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
              <input
                type="text"
                placeholder={placeholderText}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-slate-600"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
              
              {!isCreatingNew ? (
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="✨ Criar Nova Categoria..." className="font-bold text-emerald-400">✨ Criar Nova Categoria...</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-900 rounded-xl border border-emerald-900 space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="flex gap-2">
                    <select 
                      value={newCategoryIcon}
                      onChange={(e) => setNewCategoryIcon(e.target.value)}
                      className="bg-slate-800 border border-slate-600 text-white p-2 rounded-lg text-lg"
                    >
                      {['📁', '🏠', '🛒', '🚗', '🍕', '💊', '🎓', '🎬', '👕', '📱', '🧹', '💳', '📈', '🛍️', '💰', '💸', '🏷️', '🌐', '✨', '🔥', '💎', '💡'].map(i => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Nome da categoria"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-grow px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={saveNewCategory}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg"
                    >
                      Salvar
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsCreatingNew(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              <button 
                type="button"
                onClick={() => setIsManagerOpen(true)}
                className="text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 transition-colors pl-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Gerenciar Categorias
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value))}
                  className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-600 rounded-xl text-xl font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${type === 'expense' ? 'bg-orange-600' : 'bg-emerald-600'}`}
          >
            {type === 'expense' ? 'Confirmar Despesa' : 'Confirmar Receita'}
          </button>
        </form>
      </div>

      {/* Modal Gerenciador de Categorias */}
      <ContentModal 
        isOpen={isManagerOpen} 
        onClose={() => setIsManagerOpen(false)} 
        title={`Categorias: ${type === 'expense' ? 'Despesas' : 'Receitas'}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400 mb-4 italic">
            Gerencie as categorias disponíveis para seus lançamentos.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map(cat => (
              <div key={cat} className="flex items-center justify-between p-3 bg-slate-800 border border-slate-700 rounded-xl group hover:border-emerald-500/50 transition-colors">
                <span className="font-semibold text-slate-300">{cat}</span>
                <button 
                  type="button"
                  onClick={() => deleteCategory(cat)}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button 
            type="button"
            onClick={() => { setIsManagerOpen(false); setIsCreatingNew(true); }}
            className="w-full mt-6 py-3 border-2 border-dashed border-slate-700 text-slate-400 font-bold rounded-xl hover:border-emerald-500 hover:text-emerald-400 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span> Adicionar Nova
          </button>
        </div>
      </ContentModal>
    </div>
  );
};

export default TransactionForm;
