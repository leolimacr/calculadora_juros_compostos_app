import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, addDoc, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase'; // Mantido o seu caminho exato
import { Building2, Plus, Trash2, Landmark, PieChart, Pencil, X, Car, LayoutGrid, List, ShieldCheck, HelpCircle, ArrowRight } from 'lucide-react';
import { useWealthData } from '../../../hooks/useWealthData';
import { useWealthHistory } from '../../../hooks/useWealthHistory';

export interface PassiveAsset {
  id?: string;
  description: string;
  category: string;
  currentValue: number;
  observations?: string;
}

interface PassiveWealthManagerProps {
  userId: string | undefined;
}

export const PassiveWealthManager: React.FC<PassiveWealthManagerProps> = ({ userId }) => {
  const [assets, setAssets] = useState<PassiveAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Confirmaçío de Saldos
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { patrimonioLiquido, totalAssets, totalDebts } = useWealthData();
  const { saveSnapshot, isSaving } = useWealthHistory(userId);

  const handleConfirmSaldos = async () => {
    try {
      await saveSnapshot({
        totalNetWorth: patrimonioLiquido,
        totalAssets: totalAssets,
        totalDebts: totalDebts,
        module: 'property'
      });
      setShowConfirmModal(false);
      alert('Valores patrimoniais confirmados com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao confirmar valores.');
    }
  };

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('passive_wealth_view_mode') as 'grid' | 'list') || 'grid';
  });

  // Tooltip state
  const [showViewTooltip, setShowViewTooltip] = useState(false);

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
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const assetsRef = collection(firestore, `users/${userId}/passivos`);
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
  }, [userId]);

  // Função Salvar (Criar ou Editar)
  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || currentAsset.currentValue < 0 || currentAsset.description.trim() === '') return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        // MODO EDIÇÃO
        const assetRef = doc(firestore, `users/${userId}/passivos`, editingId);
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

        const userDocRef = doc(firestore, 'users', userId);
        await setDoc(userDocRef, { resumoFinanceiro: { patrimonioPassivo: newTotalPatrimonioPassivo } }, { merge: true });
      } else {
        // MODO CRIAÇÃO
        const assetsRef = collection(firestore, `users/${userId}/passivos`);
        await addDoc(assetsRef, {
          description: currentAsset.description,
          category: currentAsset.category,
          currentValue: currentAsset.currentValue,
          observations: currentAsset.observations || '',
        });

        const newTotalPatrimonioPassivo = assets.reduce((acc, curr) => acc + curr.currentValue, 0) + currentAsset.currentValue;

        const userDocRef = doc(firestore, 'users', userId);
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

  const toggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('passive_wealth_view_mode', mode);
  };

  // Função Excluir
  const handleDeleteAsset = async (assetId: string, assetValue: number) => {
    if (!userId || !assetId) return;

    const confirmDelete = window.confirm("Tem certeza que deseja excluir este bem?");
    if (!confirmDelete) return;

    try {
      const assetDocRef = doc(firestore, `users/${userId}/passivos`, assetId);
      await deleteDoc(assetDocRef);

      const currentTotal = assets.reduce((acc, curr) => acc + curr.currentValue, 0);
      const newTotalPatrimonioPassivo = currentTotal - assetValue;

      const userDocRef = doc(firestore, 'users', userId);
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

  const totalBens = assets.reduce((acc, asset) => acc + (asset.currentValue || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-8 animate-in fade-in duration-500 pb-32 bg-slate-50/95 rounded-[2.5rem] border border-slate-200 shadow-sm">
      {/* Cabeçalho */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Building2 size={24} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Bens Patrimoniais
          </h2>
        </div>
        <p className="text-slate-500 text-sm md:text-base max-w-2xl">
          Registre aqui os bens reais que compõem seu patrimônio consolidado, como imóveis, veículos, terrenos e outros itens de maior valor.
        </p>
      </header>

      {/* Formulário */}
      <div className={`bg-white border ${editingId ? 'border-emerald-500/40 shadow-emerald-500/10' : 'border-slate-200'} rounded-2xl p-6 mb-8 shadow-sm transition-colors duration-300`}>        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100`}>
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Landmark size={20} className="text-slate-400" /> Seus Bens Registrados
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            {/* VIEW SWITCHER */}
            <div className="relative flex bg-slate-200/50 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => toggleViewMode('grid')}
                onMouseEnter={() => setShowViewTooltip(true)}
                onMouseLeave={() => setShowViewTooltip(false)}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => toggleViewMode('list')}
                onMouseEnter={() => setShowViewTooltip(true)}
                onMouseLeave={() => setShowViewTooltip(false)}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List size={16} />
              </button>

              {/* Tooltip Educativo */}
              {showViewTooltip && (
                <div className="absolute bottom-full mb-2 right-0 z-50 w-48 p-3 bg-slate-800 text-white rounded-xl shadow-xl animate-in fade-in zoom-in duration-200 pointer-events-none">
                  <p className="text-[10px] leading-tight font-medium">
                    <span className="font-black text-emerald-400 uppercase tracking-widest block mb-1">Dica de Visualização</span>
                    {viewMode === 'grid' 
                      ? 'Mude para lista para uma visão mais compacta e organizada em linhas.' 
                      : 'Mude para blocos para uma visão mais visual e destacada de cada bem.'}
                  </p>
                </div>
              )}
            </div>

            <span className="text-xs font-bold bg-slate-800/80 text-slate-300 px-3 py-1 rounded-full border border-slate-700/80">
              {assets.length} {assets.length === 1 ? 'bem' : 'bens'}
            </span>
            <span className="text-xs font-black bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
              Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBens)}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-500 animate-pulse">Carregando seus bens...</div>
        ) : assets.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car size={24} className="text-emerald-400" />
            </div>
            <p className="text-slate-400 font-medium mb-2">Nenhum bem registrado ainda</p>
            <p className="text-slate-500 text-sm">Adicione seu primeiro bem patrimonial no formulário acima e comece a consolidar sua visão de patrimônio.</p>
          </div>
        ) : viewMode === 'grid' ? (
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
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bem / Categoria</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{asset.description}</span>
                          <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">{asset.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500 italic">{asset.observations || '—'}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-black text-slate-900">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.currentValue)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleEditClick(asset)} 
                            className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button 
                            onClick={() => asset.id && handleDeleteAsset(asset.id, asset.currentValue)} 
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* RITUAL DE VALIDAÇÃO (MOVIDO PARA O FINAL) */}
      <div className="mt-12 mb-8 group relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-200 p-8 shadow-soft">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-500 text-white rounded-[2rem] shadow-emerald-500/20 shadow-lg">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">Ritual de Governança</h3>
              <p className="text-sm text-slate-500 font-medium">Confirme se seus bens estão com valores atualizados.</p>
            </div>
          </div>
          <button
            onClick={() => setShowConfirmModal(true)}
            className="flex items-center gap-3 px-8 py-4 bg-brand-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-all shadow-brand-glow active:scale-95"
          >
            Validar Valor de Mercado
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-5 bg-emerald-50 text-emerald-600 rounded-[2rem] mb-2">
                <HelpCircle size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Validar Valores?</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Você confirma que os valores cadastrados para seus bens (Imóveis, Veículos, Terrenos, etc.) refletem o valor de mercado atual?
                <br/><br/>
                <span className="text-brand-primary font-bold italic">Isso garantirá a precisão da sua Evolução Patrimonial total.</span>
              </p>
              
              <div className="flex flex-col w-full gap-3 pt-4">
                <button
                  onClick={handleConfirmSaldos}
                  disabled={isSaving}
                  className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? 'Salvando...' : 'Sim, Confirmar Valores'}
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassiveWealthManager;
