import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase'; // Mantido o seu caminho exato
import { Home, Plus, Trash2, Landmark, PieChart, Pencil, X, Car } from 'lucide-react';

export interface PassiveAsset {
  id?: string;
  description: string;
  category: string;
  currentValue: number;
  observations?: string;
}

interface PassiveWealthManagerProps {
  userMeta: any;
}

export const PassiveWealthManager: React.FC<PassiveWealthManagerProps> = ({ userMeta }) => {
  const [assets, setAssets] = useState<PassiveAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados do Formulário
  const [currentAsset, setCurrentAsset] = useState<PassiveAsset>({ 
    description: '', 
    category: 'Imóveis', 
    currentValue: 0, 
    observations: '' 
  });
  const [displayValue, setDisplayValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Função para lidar com a digitação do valor financeiro (da direita para esquerda)
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value === '') {
      setDisplayValue('');
      setCurrentAsset(prev => ({ ...prev, currentValue: 0 }));
      return;
    }

    const numericValue = parseInt(value, 10) / 100;

    const formattedString = numericValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    setDisplayValue(formattedString);
    setCurrentAsset(prev => ({ ...prev, currentValue: numericValue }));
  };

  // Leitura de Dados (Subcoleção: passivos)
  useEffect(() => {
    if (!userMeta?.uid) {
      setIsLoading(false);
      return;
    }

    const assetsRef = collection(firestore, `users/${userMeta.uid}/passivos`);
    const q = query(assetsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedAssets: PassiveAsset[] = [];
      snapshot.forEach((doc) => {
        loadedAssets.push({ id: doc.id, ...doc.data() } as PassiveAsset);
      });
      setAssets(loadedAssets);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar passivos:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userMeta]);

  // Função Salvar (Criar ou Editar)
  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMeta?.uid || currentAsset.currentValue < 0 || currentAsset.description.trim() === '') return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        // MODO EDIÇÃO
        const assetRef = doc(firestore, `users/${userMeta.uid}/passivos`, editingId);
        await updateDoc(assetRef, {
          description: currentAsset.description,
          category: currentAsset.category,
          currentValue: currentAsset.currentValue,
          observations: currentAsset.observations || '',
        });

        const oldAsset = assets.find(a => a.id === editingId);
        const diff = currentAsset.currentValue - (oldAsset ? oldAsset.currentValue : 0);
        const currentTotal = assets.reduce((acc, curr) => acc + curr.currentValue, 0);
        const newTotalPatrimonioPassivo = currentTotal + diff;

        const userDocRef = doc(firestore, 'users', userMeta.uid);
        await setDoc(userDocRef, { resumoFinanceiro: { patrimonioPassivo: newTotalPatrimonioPassivo } }, { merge: true });
      } else {
        // MODO CRIAÇÃO
        const assetsRef = collection(firestore, `users/${userMeta.uid}/passivos`);
        await addDoc(assetsRef, {
          description: currentAsset.description,
          category: currentAsset.category,
          currentValue: currentAsset.currentValue,
          observations: currentAsset.observations || '',
        });

        const newTotalPatrimonioPassivo = assets.reduce((acc, curr) => acc + curr.currentValue, 0) + currentAsset.currentValue;

        const userDocRef = doc(firestore, 'users', userMeta.uid);
        await setDoc(userDocRef, { resumoFinanceiro: { patrimonioPassivo: newTotalPatrimonioPassivo } }, { merge: true });
      }

      handleCancelEdit();
    } catch (error) {
      console.error("Erro ao salvar passivo:", error);
      alert("Houve um erro ao salvar seu bem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função Iniciar Edição
  const handleEditClick = (asset: PassiveAsset) => {
    setCurrentAsset({ 
      description: asset.description, 
      category: asset.category, 
      currentValue: asset.currentValue,
      observations: asset.observations || ''
    });
    setDisplayValue(asset.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    if (asset.id) setEditingId(asset.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Função Cancelar Edição (ou Resetar Form)
  const handleCancelEdit = () => {
    setCurrentAsset({ description: '', category: 'Imóveis', currentValue: 0, observations: '' });
    setDisplayValue('');
    setEditingId(null);
  };

  // Função Excluir
  const handleDeleteAsset = async (assetId: string, assetValue: number) => {
    if (!userMeta?.uid || !assetId) return;

    const confirmDelete = window.confirm("Tem certeza que deseja excluir este bem?");
    if (!confirmDelete) return;

    try {
      const assetDocRef = doc(firestore, `users/${userMeta.uid}/passivos`, assetId);
      await deleteDoc(assetDocRef);

      const currentTotal = assets.reduce((acc, curr) => acc + curr.currentValue, 0);
      const newTotalPatrimonioPassivo = currentTotal - assetValue;

      const userDocRef = doc(firestore, 'users', userMeta.uid);
      await updateDoc(userDocRef, {
        "resumoFinanceiro.patrimonioPassivo": newTotalPatrimonioPassivo >= 0 ? newTotalPatrimonioPassivo : 0
      });

      if (editingId === assetId) {
        handleCancelEdit();
      }
    } catch (error) {
      console.error("Erro ao excluir passivo:", error);
      alert("Houve um erro ao tentar excluir o bem.");
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-8 animate-in fade-in duration-500 pb-32 bg-slate-50/95 rounded-[2.5rem] border border-slate-200 shadow-sm">
      {/* Cabeçalho */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Home size={24} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Patrimônio Passivo
          </h2>
        </div>
        <p className="text-slate-500 text-sm md:text-base max-w-2xl">
          Bens de valor que compõem sua riqueza consolidada. Registre aqui seus imóveis, veículos, terrenos e outros bens materiais.
        </p>
      </header>

      {/* Formulário */}
      <div className={`bg-white border ${editingId ? 'border-emerald-500/40 shadow-emerald-500/10' : 'border-slate-200'} rounded-2xl p-6 mb-8 shadow-sm transition-colors duration-300`}>        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editingId ? 'bg-emerald-100' : 'bg-emerald-100'}`}>
              {editingId ? <Pencil size={16} className="text-emerald-600" /> : <Plus size={16} className="text-emerald-600" />}
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {editingId ? 'Editando Bem' : 'Adicionar Novo Bem'}
            </h3>
          </div>
          {editingId && (
            <button type="button" onClick={handleCancelEdit} className="text-xs font-bold text-slate-400 hover:text-slate-900 flex items-center gap-1">
              <X size={14} /> Cancelar Edição
            </button>
          )}
        </div>

        <form onSubmit={handleSaveAsset} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          <div className="md:col-span-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Descrição do Bem (Ex: Casa na Praia, Honda Civic) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Digite a descrição..."
              value={currentAsset.description}
              onChange={(e) => setCurrentAsset({ ...currentAsset, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Categoria <span className="text-rose-500">*</span>
            </label>
            <select
              value={currentAsset.category}
              onChange={(e) => setCurrentAsset({ ...currentAsset, category: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors [&>option]:bg-white"
            >
              <option value="Imóveis">Imóveis</option>
              <option value="Veículos">Veículos</option>
              <option value="Terrenos">Terrenos / Lotes</option>
              <option value="Joias/Arte">Joias / Arte</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Observações <span className="text-slate-500 font-normal lowercase">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ano, placa, endereço..."
              value={currentAsset.observations}
              onChange={(e) => setCurrentAsset({ ...currentAsset, observations: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          <div className="md:col-span-3 flex flex-col gap-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0">
              Valor de Mercado (R$) <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative w-full">
                <span className="absolute left-4 top-[14px] text-slate-400 text-sm font-bold">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="0,00"
                  value={displayValue}
                  onChange={handleCurrencyChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`text-slate-950 font-black p-3 rounded-xl transition-all shadow-lg flex items-center justify-center min-w-[48px] ${
                  editingId ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-emerald-500 hover:bg-emerald-400'
                } disabled:bg-slate-700`}
                title={editingId ? 'Salvar Alterações' : 'Adicionar Bem'}
              >
                {editingId ? <Pencil size={20} /> : <Plus size={20} />}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Lista de Passivos */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Landmark size={20} className="text-slate-400" /> Seus Bens Registrados
          </h3>
          <span className="text-xs font-bold bg-slate-800/80 text-slate-300 px-3 py-1 rounded-full border border-slate-700/80">
            {assets.length} {assets.length === 1 ? 'bem' : 'bens'}
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-500 animate-pulse">Carregando seus bens...</div>
        ) : assets.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car size={24} className="text-emerald-400" />
            </div>
            <p className="text-slate-400 font-medium mb-2">Nenhum bem registrado ainda</p>
            <p className="text-slate-500 text-sm">Adicione seu primeiro imóvel ou veículo no formulário acima.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <div key={asset.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-500/50 transition-colors group relative overflow-hidden flex flex-col h-full shadow-sm">
            
                {/* Linha de cor por categoria */}
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/30" />                
                <div className="flex justify-between items-start mb-4 mt-2">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full mb-2 inline-block">                    
                      {asset.category}
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 line-clamp-1" title={asset.description}>{asset.description}</h4>
                  </div>
                  
                  {/* Botões de Ação */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEditClick(asset)} 
                      className="text-slate-500 hover:text-emerald-600 p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                      title="Editar Bem"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => asset.id && handleDeleteAsset(asset.id, asset.currentValue)} 
                      className="text-slate-500 hover:text-red-600 p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-red-50 hover:border-red-200 transition-colors"
                      title="Excluir Bem"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Observações */}
                <div className="flex-grow">
                  {asset.observations && (
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      {asset.observations}
                    </p>
                  )}
                </div>

                <div className="mt-auto pt-2 border-t border-slate-700/50">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Valor de Mercado</p>
                  <p className="text-2xl font-black text-slate-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.currentValue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PassiveWealthManager;
