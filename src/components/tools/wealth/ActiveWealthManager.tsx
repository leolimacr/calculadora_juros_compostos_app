import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase'; // Ajuste o caminho se necessário
import { TrendingUp, Plus, Trash2, Wallet, PieChart, Pencil, X } from 'lucide-react';

export interface ActiveAsset {
  id?: string;
  name: string;
  category: string;
  currentValue: number;
}

interface ActiveWealthManagerProps {
  userId: string | undefined;
  onNavigate?: (route: string) => void;
}

export const ActiveWealthManager: React.FC<ActiveWealthManagerProps> = ({ userId, onNavigate }) => {
  const [assets, setAssets] = useState<ActiveAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados do Formulário
  const [currentAsset, setCurrentAsset] = useState<ActiveAsset>({ name: '', category: 'Renda Fixa', currentValue: 0 });
  const [displayValue, setDisplayValue] = useState<string>(''); // Novo: Guarda a string formatada (ex: "1.500,00")
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Função para lidar com a digitação do valor financeiro (da direita para esquerda)
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Pega o valor digitado e remove tudo que não é número
    let value = e.target.value.replace(/\D/g, '');
    
    // Se o usuário apagar tudo, reseta para vazio/zero
    if (value === '') {
      setDisplayValue('');
      setCurrentAsset(prev => ({ ...prev, currentValue: 0 }));
      return;
    }

    // 2. Transforma a string em um número flutuante (dividindo por 100 para criar os centavos)
    const numericValue = parseInt(value, 10) / 100;

    // 3. Formata para o padrão brasileiro (1.500,00) apenas para exibição
    const formattedString = numericValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // 4. Salva a string formatada para a tela e o número real para o Firebase
    setDisplayValue(formattedString);
    setCurrentAsset(prev => ({ ...prev, currentValue: numericValue }));
  };

  // Leitura de Dados
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const assetsRef = collection(firestore, `users/${userId}/ativos`);
    const q = query(assetsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedAssets: ActiveAsset[] = [];
      snapshot.forEach((doc) => {
        loadedAssets.push({ id: doc.id, ...doc.data() } as ActiveAsset);
      });
      setAssets(loadedAssets);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar ativos:", error);
      setIsLoading(false);
    });

    // Registra que o usuário revisou o patrimônio agora
    setDoc(
      doc(firestore, 'users', userId),
      { lastWealthReviewAt: new Date().toISOString() },
      { merge: true }
    ).catch(() => {});

    return () => unsubscribe();
  }, [userId]);

  // Função Salvar (Criar ou Editar)
  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || currentAsset.currentValue < 0 || currentAsset.name.trim() === '') return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        // MODO EDIÇÃO
        const assetRef = doc(firestore, `users/${userId}/ativos`, editingId);
        await updateDoc(assetRef, {
          name: currentAsset.name,
          category: currentAsset.category,
          currentValue: currentAsset.currentValue,
        });

        const oldAsset = assets.find(a => a.id === editingId);
        const diff = currentAsset.currentValue - (oldAsset ? oldAsset.currentValue : 0);
        const currentTotal = assets.reduce((acc, curr) => acc + curr.currentValue, 0);
        const newTotalPatrimonioAtivo = currentTotal + diff;

        const userDocRef = doc(firestore, 'users', userId);
        await setDoc(userDocRef, { resumoFinanceiro: { patrimonioAtivo: newTotalPatrimonioAtivo } }, { merge: true });
      } else {
        // MODO CRIAÇÃO
        const assetsRef = collection(firestore, `users/${userId}/ativos`);
        await addDoc(assetsRef, {
          name: currentAsset.name,
          category: currentAsset.category,
          currentValue: currentAsset.currentValue,
        });

        const newTotalPatrimonioAtivo = assets.reduce((acc, curr) => acc + curr.currentValue, 0) + currentAsset.currentValue;

        const userDocRef = doc(firestore, 'users', userId);
        await setDoc(userDocRef, { resumoFinanceiro: { patrimonioAtivo: newTotalPatrimonioAtivo } }, { merge: true });
      }

      // Reseta formulário
      setCurrentAsset({ name: '', category: 'Renda Fixa', currentValue: 0 });
      setEditingId(null);
    } catch (error) {
      console.error("Erro ao salvar ativo:", error);
      alert("Houve um erro ao salvar seu investimento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função Iniciar Edição
  const handleEditClick = (asset: ActiveAsset) => {
    setCurrentAsset({ name: asset.name, category: asset.category, currentValue: asset.currentValue });
    // Ao clicar em editar, já formata o valor para a máscara da tela
    setDisplayValue(asset.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    if (asset.id) setEditingId(asset.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Função Cancelar Edição (ou Resetar Form)
  const handleCancelEdit = () => {
    setCurrentAsset({ name: '', category: 'Renda Fixa', currentValue: 0 });
    setDisplayValue(''); // Limpa o campo visual também
    setEditingId(null);
  };

  // Função Excluir
  const handleDeleteAsset = async (assetId: string, assetValue: number) => {
    if (!userId || !assetId) return;

    const confirmDelete = window.confirm("Tem certeza que deseja excluir este investimento?");
    if (!confirmDelete) return;

    try {
      const assetDocRef = doc(firestore, `users/${userId}/ativos`, assetId);
      await deleteDoc(assetDocRef);

      const currentTotal = assets.reduce((acc, curr) => acc + curr.currentValue, 0);
      const newTotalPatrimonioAtivo = currentTotal - assetValue;

      const userDocRef = doc(firestore, 'users', userId);
      await updateDoc(userDocRef, {
        "resumoFinanceiro.patrimonioAtivo": newTotalPatrimonioAtivo >= 0 ? newTotalPatrimonioAtivo : 0
      });

      if (editingId === assetId) {
        handleCancelEdit();
      }
    } catch (error) {
      console.error("Erro ao excluir ativo:", error);
      alert("Houve um erro ao tentar excluir o investimento.");
    }
  };

  const totalInvestido = assets.reduce((acc, asset) => acc + (asset.currentValue || 0), 0);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Cabeçalho */}
      <header className="mb-8">
        {onNavigate && (
          <button
            onClick={() => { onNavigate('home'); setTimeout(() => { document.getElementById('secao-ferramentas')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100); }}
            className="mb-4 flex items-center gap-2 text-slate-500 hover:text-sky-700 transition-all font-black uppercase text-[10px] tracking-[0.2em]"
          >
            ← Voltar
          </button>
        )}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <TrendingUp size={24} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Investimentos
          </h2>
        </div>
        <p className="text-slate-600 text-sm md:text-base max-w-2xl">
          Registre aqui seus ativos financeiros. Essa é a camada que mostra o capital que já está trabalhando por você.
        </p>
      </header>

      {/* Formulário */}
      <div
        className={`bg-white/95 backdrop-blur-md border ${
          editingId ? 'border-amber-300 shadow-amber-200/40' : 'border-slate-200'
        } rounded-2xl p-6 mb-8 shadow-sm transition-colors duration-300`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editingId ? 'bg-amber-100' : 'bg-emerald-100'}`}>
              {editingId ? <Pencil size={16} className="text-amber-600" /> : <Plus size={16} className="text-emerald-600" />}
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {editingId ? 'Editando Investimento' : 'Adicionar Novo Investimento'}
            </h3>
          </div>
          {editingId && (
            <button
              onClick={handleCancelEdit}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <X size={14} /> Cancelar Edição
            </button>
          )}
        </div>

        <form onSubmit={handleSaveAsset} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              Nome do Ativo (Ex: Tesouro Selic, HGLG11)
            </label>
            <input
              type="text"
              required
              placeholder="Digite o nome..."
              value={currentAsset.name}
              onChange={(e) => setCurrentAsset({ ...currentAsset, name: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Categoria
            </label>
            <select
              value={currentAsset.category}
              onChange={(e) => setCurrentAsset({ ...currentAsset, category: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors [&>option]:bg-white"
            >
              <option value="Renda Fixa">Renda Fixa</option>
              <option value="Ações">Ações (Brasil)</option>
              <option value="FIIs">Fundos Imobiliários</option>
              <option value="Exterior">Exterior (Stocks/REITs)</option>
              <option value="Cripto">Criptomoedas</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0">
              Valor Total (R$)
            </label>
            <div className="flex gap-2">			  <div className="relative w-full">
                <span className="absolute left-4 top-[14px] text-slate-500 text-sm font-bold">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="0,00"
                  value={displayValue}
                  onChange={handleCurrencyChange}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`text-slate-950 font-black p-3 rounded-xl transition-all shadow-lg flex items-center justify-center min-w-[48px] ${
                  editingId ? 'bg-amber-500 hover:bg-amber-400' : 'bg-emerald-500 hover:bg-emerald-400'
                } disabled:bg-slate-700`}
                title={editingId ? 'Salvar Alterações' : 'Adicionar Ativo'}
              >
                {editingId ? <Pencil size={20} /> : <Plus size={20} />}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Lista de Ativos */}
      <div className="mt-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet size={20} className="text-emerald-500" /> Sua Carteira de Investimentos
          </h3>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
              {assets.length} {assets.length === 1 ? 'ativo' : 'ativos'}
            </span>
            <span className="text-xs font-black bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
              Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInvestido)}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-600 animate-pulse">Carregando sua carteira...</div>
        ) : assets.length === 0 ? (
          <div className="py-14 px-6 bg-emerald-50 border border-dashed border-emerald-200 rounded-2xl text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <PieChart size={24} className="text-emerald-600" />
            </div>
            <p className="text-slate-800 font-black text-base mb-1">Carteira ainda vazia</p>
            <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed mb-5">
              Adicione seus investimentos aqui em cima — Tesouro Direto, FIIs, ações, cripto. Esses dados alimentam sua visão de carteira e dão contexto melhor para as próximas camadas da Central.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all active:scale-95"
            >
              <Plus size={14} /> Adicionar primeiro ativo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <div key={asset.id} className="bg-white backdrop-blur-md border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors group relative overflow-hidden shadow-sm">
                <div className={`absolute top-0 left-0 w-full h-1 ${
                  asset.category === 'Renda Fixa' ? 'bg-sky-500' : 
                  asset.category === 'Ações' ? 'bg-emerald-500' : 
                  asset.category === 'FIIs' ? 'bg-indigo-500' : 
                  asset.category === 'Exterior' ? 'bg-purple-500' : 
                  asset.category === 'Cripto' ? 'bg-amber-500' : 'bg-slate-500'
                }`} />

                <div className="flex justify-between items-start mb-4 mt-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md mb-2 inline-block border border-slate-200">
                      {asset.category}
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 line-clamp-1">{asset.name}</h4>
                  </div>
                  
                  {/* Botões de Ação */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditClick(asset)}
                      className="text-slate-500 hover:text-amber-600 p-2 rounded-lg bg-slate-100 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 transition-colors"
                      title="Editar Ativo"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => asset.id && handleDeleteAsset(asset.id, asset.currentValue)}
                      className="text-slate-500 hover:text-red-600 p-2 rounded-lg bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-colors"
                      title="Excluir Ativo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Valor Atual</p>
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

export default ActiveWealthManager;
