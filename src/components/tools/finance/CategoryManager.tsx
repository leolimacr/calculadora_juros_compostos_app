import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FolderOpen, Tag, Pencil, Check, RotateCcw } from 'lucide-react';

interface Category {
  id?: string;
  name: string;
  type: 'income' | 'expense';
}

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSave: (cat: Category) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ 
  isOpen, 
  onClose, 
  categories, 
  onSave, 
  onDelete 
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Limpa o formulário ao fechar ou resetar
  const resetForm = () => {
    setName('');
    setType('expense');
    setEditingId(null);
  };

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSave({ 
        id: editingId || undefined, 
        name: name.trim(), 
        type 
      });
      resetForm();
    } catch (error) {
      alert("Erro ao processar categoria.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (cat: Category) => {
    setName(cat.name);
    setType(cat.type);
    setEditingId(cat.id || null);
    // Rola para o topo do formulário para facilitar no mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
                <FolderOpen className="text-emerald-600" size={24} />
            </div>
            <div>
                <h3 className="text-slate-900 font-black text-lg leading-none">
                    {editingId ? 'Editar Categoria' : 'Categorias'}
                </h3>
                <p className="text-slate-500 text-xs mt-1 font-bold uppercase tracking-widest">
                    Personalize sua gestão
                </p>
            </div>
          </div>
          <button onClick={() => { resetForm(); onClose(); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        {/* FORMULÁRIO DINÂMICO (Adicionar ou Editar) */}
        <form onSubmit={handleSave} className={`p-6 border-b border-slate-200 transition-colors ${editingId ? 'bg-amber-50' : 'bg-white'}`}>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5 block">
                {editingId ? 'Novo Nome da Categoria' : 'Nome da Categoria'}
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Assinaturas, Mercado..."
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 shadow-sm"
                autoFocus
              />
            </div>
            
            <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase border transition-all ${type === 'expense' ? 'bg-red-50 border-red-300 text-red-600' : 'bg-white border-slate-300 text-slate-600'}`}
                >
                  Despesa
                </button>
                <button 
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase border transition-all ${type === 'income' ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'bg-white border-slate-300 text-slate-600'}`}
                >
                  Receita
                </button>
            </div>

            <div className="flex gap-2">
                {editingId && (
                    <button 
                        type="button" 
                        onClick={resetForm}
                        className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
                        title="Cancelar Edição"
                    >
                        <RotateCcw size={20} />
                    </button>
                )}
                <button 
                  type="submit" 
                  disabled={isSubmitting || !name}
                  className={`flex-1 py-3 rounded-xl font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                      editingId ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  {editingId ? <Check size={18}/> : <Plus size={18} />}
                  {editingId ? 'SALVAR ALTERAÇÃO' : 'ADICIONAR CATEGORIA'}
                </button>
            </div>
          </div>
        </form>

        {/* LISTA COM OPÇÕES DE EDITAR E EXCLUIR */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-white">
          {categories.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
                <Tag size={40} className="mx-auto mb-2" />
                <p className="text-xs font-bold uppercase">Nenhuma categoria cadastrada</p>
            </div>
          ) : (
            categories.sort((a,b) => a.name.localeCompare(b.name)).map((cat) => (
              <div key={cat.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${editingId === cat.id ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${cat.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm font-bold text-slate-800">{cat.name}</span>
                </div>
                
                <div className="flex gap-1">
                    {/* Botão Editar */}
                    <button 
                        onClick={() => startEdit(cat)}
                        className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                        title="Editar"
                    >
                        <Pencil size={16} />
                    </button>
                    
                    {/* Botão Excluir com Mensagem de Confirmação */}
                    <button 
                        onClick={() => {
                            if(window.confirm(`⚠️ ATENÇÃO: Deseja realmente excluir a categoria "${cat.name}"?`)) {
                                onDelete(cat.id!);
                            }
                        }}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Excluir"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;