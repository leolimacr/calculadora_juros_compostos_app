import React, { useState, useEffect, useMemo } from 'react';
import { useFirebase } from '../../../hooks/useFirebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import {
  Plus, Trash2, Pencil, X, Check,
  CreditCard, Sparkles, HelpCircle,
  TrendingUp, ShieldCheck, Target,
  LayoutGrid, List, History, ChevronRight,
  ArrowLeft, AlertCircle, Trophy, PartyPopper,
  ArrowRight, BookOpen, Wallet
} from 'lucide-react';
import { PresenceEventService } from '../../../services/PresenceEventService';
import { DebtPlanSimulator } from '../DebtPlanSimulator';
import { useWealthData } from '../../../hooks/useWealthData';
import { useWealthHistory } from '../../../hooks/useWealthHistory';
import { fetchCurrentSelicRate } from '../buy-cash-or-installments/selicService';
import {
  DebtItem,
  useDebts,
  amortizeDebts
} from '../../../services/debt';


// ... (the rest of the UI code will be updated to consume the new service/hooks)

interface SavedDebtPlan {
  id: string;
  title: string;
  planMarkdown: string;
  createdAt?: any;
  updatedAt?: any;
}

interface DebtManagerProps {
  userId: string | undefined;
  userMeta: any;
  lancamentos: Array<{
    id: string;
    type: 'income' | 'expense';
    date: string;
    description: string;
    category: string;
    amount: number;
  }>;
  onNavigate?: (route: string) => void;
  isSyncing?: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const fixMojibake = (text?: string) => {
  if (!text) return '';

  return text
    .replace(/Plano de quitao/g, 'Plano de quitação')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã£/g, 'ã')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã /g, 'à')
    .replace(/Ã¢/g, 'â')
    .replace(/Ãª/g, 'ê')
    .replace(/Ã©/g, 'é')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãµ/g, 'õ')
    .replace(/Ãº/g, 'ú')
    .replace(/â€“/g, '—')
    .replace(/â€"/g, '—')
    .normalize('NFC');
};

// Função "HP12c" para calcular o CET (Taxa Interna de Retorno mensal)
const calculateCET = (pv: number, n: number, pmt: number): number => {
  if (pv <= 0 || n <= 0 || pmt <= 0 || (pmt * n) <= pv) return 0;
  let low = 0, high = 100; // Até 100% ao mês
  for (let i = 0; i < 50; i++) {
    let mid = (low + high) / 2;
    let rate = mid / 100;
    // Fórmula de Prestação (Tabela Price): PMT = PV * [i(1+i)^n] / [(1+i)^n - 1]
    let pmtCalc = (pv * rate) / (1 - Math.pow(1 + rate, -n));
    if (pmtCalc > pmt) high = mid;
    else low = mid;
  }
  return low;
};

const DEBT_TYPES = [
  'Cartão rotativo',
  'Empréstimo pessoal',
  'Financiamento',
  'Cheque especial',
  'Crédito consignado',
  'Outro',
];

const STRIPE_COLORS: Record<string, string> = {
  'Cartão rotativo': 'bg-rose-500',
  'Empréstimo pessoal': 'bg-orange-400',
  'Financiamento': 'bg-blue-500',
  'Cheque especial': 'bg-red-600',
  'Crédito consignado': 'bg-teal-500',
  'Outro': 'bg-slate-400',
};

const EMPTY_FORM: DebtItem = {
  nome: '',
  tipo: 'Cartão rotativo',
  saldoDevedor: 0,
  taxaMensal: 0,
  parcelasRestantes: 0,
  valorParcela: 0,
  dataVencimento: null,
  proposito: ''
};

export const DebtManager: React.FC<DebtManagerProps> = ({ userId, userMeta, lancamentos, onNavigate, isSyncing }) => {
  const { saveFinancialProfile } = useFirebase(userId); 
  const { totalAssets, totalInvestments, totalProperty, totalPassives, patrimonioLiquido, totalDebts: realTotalDebts } = useWealthData();

  const [isCalculating, setIsCalculating] = useState(true);
  const { data: debtsData, isLoading, isSyncing: debtsSyncing } = useDebts(userId);
  const debts = debtsData || [];

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { saveSnapshot, isSaving: isSavingSnapshot } = useWealthHistory(userId);

  const [showSimulator, setShowSimulator] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DebtItem>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showHistory, setShowHistory] = useState(false);
  const [savedPlans, setSavedPlans] = useState<SavedDebtPlan[]>([]);
  const [selicRate, setSelicRate] = useState<number>(10.75);

  useEffect(() => {
    fetchCurrentSelicRate().then(rate => setSelicRate(rate || 10.75));
  }, []);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(firestore, 'users', userId, 'nexusDebtPlans'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      const plans = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedDebtPlan));
      setSavedPlans(plans);
    });
  }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setIsSubmitting(true);

    try {
      const debtData = {
        ...form,
        updatedAt: new Date(),
        proposito: form.proposito || ''
      };

      if (editingId) {
        await updateDoc(doc(firestore, 'users', userId, 'dividas', editingId), debtData);
      } else {
        await addDoc(collection(firestore, 'users', userId, 'dividas'), {
          ...debtData,
          createdAt: new Date()
        });
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar dívida.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (debt: DebtItem) => {
    setForm({ ...debt, proposito: debt.proposito || '' });
    setEditingId(debt.id || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!userId || !window.confirm("Excluir esta dívida?")) return;
    await deleteDoc(doc(firestore, 'users', userId, 'dividas', id));
  };

  const handleAmortizeAll = async () => {
    if (!userId) return;
    if (!window.confirm("Isso irá abater UMA parcela de todas as suas dívidas ativas. Deseja continuar?")) return;

    try {
      await amortizeDebts(userId);
      alert("Dívidas amortizadas com sucesso! Não esqueça de validar o saldo final.");
    } catch (err) {
      console.error(err);
      alert("Erro ao amortizar dívidas.");
    }
  };

  const handleConfirmSaldos = async () => {
    try {
      await saveSnapshot({
        totalNetWorth: patrimonioLiquido,
        totalAssets: totalAssets,
        totalInvestments: totalInvestments,
        totalProperty: totalProperty,
        totalDebts: realTotalDebts,
        module: 'debts'
      });
      setShowConfirmModal(false);
      alert("Dívidas validadas com sucesso!");
    } catch (err) {
      console.error(err);
    }
  };

  const totalSaldo = debts.reduce((acc, d) => acc + d.saldoDevedor, 0);
  const totalParcelas = debts.reduce((acc, d) => acc + d.valorParcela, 0);

  if (showSimulator && userId) {
    return (
      <DebtPlanSimulator 
        userId={userId} 
        onBack={() => setShowSimulator(false)} 
        userMeta={userMeta}
        selicRate={selicRate}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          {onNavigate && (
            <button
              onClick={() => onNavigate('home')}
              className="mb-4 flex items-center gap-2 text-slate-500 hover:text-sky-700 transition-all font-black uppercase text-[10px] tracking-[0.2em]"
            >
              <ArrowLeft size={14} /> Voltar
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
              <CreditCard size={28} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Minhas Dívidas</h2>
          </div>
          <p className="text-slate-500 font-medium">Mapeie seus débitos para que o Nexus crie sua estratégia de saída.</p>
        </div>

        <div className="flex items-center gap-3">
           <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            <History size={16} /> {showHistory ? 'Ocultar Planos' : 'Ver Planos Salvos'}
          </button>
          <button
            onClick={() => setShowSimulator(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
          >
            <Sparkles size={16} className="text-amber-400" /> Simular Estratégia
          </button>
        </div>
      </header>

      {showHistory && savedPlans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-top-4 duration-300">
          {savedPlans.map(plan => (
            <div key={plan.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between group hover:border-sky-300 transition-all">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
                  <BookOpen size={20} />
                </div>
                <h4 className="text-sm font-black text-slate-900 mb-1">{fixMojibake(plan.title)}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Gerado em {plan.createdAt?.toDate ? plan.createdAt.toDate().toLocaleDateString('pt-BR') : 'Recente'}
                </p>
              </div>
              <button 
                onClick={() => {
                   // Implementar visualização do plano salvo
                   alert("Abrindo visualização do plano...");
                }}
                className="mt-6 w-full py-3 rounded-xl bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest group-hover:bg-sky-600 group-hover:text-white transition-all flex items-center justify-center gap-2"
              >
                Abrir Plano <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulário de Dívida */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
              {editingId ? <Pencil size={20} /> : <Plus size={20} />}
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              {editingId ? 'Editar Dívida' : 'Cadastrar Nova Dívida'}
            </h3>
          </div>
          {editingId && (
            <button onClick={() => { setForm(EMPTY_FORM); setEditingId(null); }} className="text-xs font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest flex items-center gap-1 transition-colors">
              <X size={14} /> Cancelar
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">O que é a dívida?</label>
              <input
                type="text"
                required
                placeholder="Ex: Cartão Nubank, Empréstimo Caixa"
                value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all text-sm font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Débito</label>
              <select
                value={form.tipo}
                onChange={e => setForm({ ...form, tipo: e.target.value })}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-500 transition-all text-sm font-bold outline-none"
              >
                {DEBT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Saldo Devedor Atual</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">R$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={form.saldoDevedor || ''}
                  onChange={e => setForm({ ...form, saldoDevedor: Number(e.target.value) })}
                  className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-500 transition-all text-sm font-black"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Juros Mensal (%)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={form.taxaMensal || ''}
                onChange={e => setForm({ ...form, taxaMensal: Number(e.target.value) })}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-500 transition-all text-sm font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor da Parcela</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">R$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={form.valorParcela || ''}
                  onChange={e => setForm({ ...form, valorParcela: Number(e.target.value) })}
                  className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-500 transition-all text-sm font-bold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Parcelas Restantes</label>
              <input
                type="number"
                required
                placeholder="Ex: 12"
                value={form.parcelasRestantes || ''}
                onChange={e => setForm({ ...form, parcelasRestantes: Number(e.target.value) })}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-500 transition-all text-sm font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vencimento (Dia)</label>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="Ex: 10"
                value={form.dataVencimento || ''}
                onChange={e => setForm({ ...form, dataVencimento: e.target.value })}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-500 transition-all text-sm font-bold"
              />
            </div>
          </div>

          {/* CAMPO PROPÓSITO (NEXUS) */}
          <div className="p-5 bg-rose-50/30 rounded-[2rem] border border-rose-100/50">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-rose-700 uppercase tracking-[0.2em]">
                Propósito desta Dívida
                <div className="group relative">
                  <HelpCircle size={14} className="text-rose-400 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-3 w-72 p-4 bg-slate-900 text-white text-[11px] font-medium leading-relaxed rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-2xl border border-slate-800">
                    <p className="font-black text-rose-400 mb-2 uppercase tracking-widest text-left">Por que o Finanças Pro Invest pede o Propósito?</p>
                    <p className="text-left">Para o Nexus ser seu consultor de verdade, ele precisa saber o 'porquê' desta dívida. Se for um financiamento de 'Casa Própria', ele focará em amortização de longo prazo. Se for um 'Erro de Percurso', ele priorizará a quitação acelerada para recuperar sua paz.</p>
                    <p className="mt-3 text-slate-400 italic text-left border-t border-slate-800 pt-2">Ex: "Financiamento do meu primeiro lar." ou "Imprevisto de saúde na família."</p>
                  </div>
                </div>
              </label>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-rose-100 shadow-sm">
                 <Sparkles size={10} className="text-rose-500" />
                 <span className="text-[9px] font-black text-rose-600 uppercase tracking-tighter">Inteligência Nexus</span>
              </div>
            </div>
            <textarea
              value={form.proposito || ''}
              onChange={e => setForm({ ...form, proposito: e.target.value })}
              className="w-full px-6 py-4 rounded-2xl border border-rose-100/50 focus:ring-4 focus:ring-rose-500/5 focus:border-rose-400 transition-all text-sm font-medium bg-white/50 min-h-[100px] resize-none placeholder:text-slate-300"
              placeholder="O que esta dívida representa para você hoje? Qual a história dela?"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 rounded-2xl bg-rose-600 text-white font-black uppercase tracking-widest text-xs hover:bg-rose-500 transition-all shadow-lg shadow-rose-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isSubmitting ? 'Salvando...' : editingId ? <><Pencil size={18} /> Atualizar Dívida</> : <><Plus size={18} /> Salvar Nova Dívida</>}
          </button>
        </form>
      </div>

      {/* Resumo Rápido */}
      {debts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex items-center gap-6 group hover:border-rose-200 transition-all">
            <div className="p-5 bg-rose-50 text-rose-600 rounded-[2rem] group-hover:bg-rose-600 group-hover:text-white transition-all">
              <TrendingUp size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Saldo Devedor Total</p>
              <h3 className="text-3xl font-black text-slate-900">{formatCurrency(totalSaldo)}</h3>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex items-center gap-6 group hover:border-orange-200 transition-all">
            <div className="p-5 bg-orange-50 text-orange-600 rounded-[2rem] group-hover:bg-orange-600 group-hover:text-white transition-all">
              <Wallet size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Comprometimento Mensal</p>
              <h3 className="text-3xl font-black text-slate-900">{formatCurrency(totalParcelas)}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Dívidas */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
             <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Sua Lista de Débitos</h3>
             <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black">{debts.length} {debts.length === 1 ? 'Dívida' : 'Dívidas'}</span>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
             <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}><LayoutGrid size={16} /></button>
             <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}><List size={16} /></button>
          </div>
        </div>

        {debts.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[3rem] p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-white rounded-[2.5rem] shadow-sm flex items-center justify-center mx-auto mb-6">
               <Trophy size={40} className="text-amber-400" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Zero Dívidas no Radar!</h3>
            <p className="text-slate-500 max-w-sm mx-auto font-medium">Se você não tem dívidas, parabéns! Use o Controla para manter esse recorde e a Central para crescer seu patrimônio.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {debts.map(debt => (
              <div key={debt.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden flex flex-col h-full">
                <div className={`absolute top-0 left-0 w-full h-2 ${STRIPE_COLORS[debt.tipo] || 'bg-slate-400'}`} />
                
                <div className="flex justify-between items-start mb-6 mt-2">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{debt.tipo}</span>
                    <h4 className="text-lg font-black text-slate-900 leading-tight">{debt.nome}</h4>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleEdit(debt)} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-all border border-slate-100"><Pencil size={16} /></button>
                    <button onClick={() => debt.id && handleDelete(debt.id)} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-100"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="flex-grow space-y-4 mb-6">
                  {debt.proposito && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Propósito</p>
                      <p className="text-xs text-slate-600 font-medium italic">"{debt.proposito}"</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-50">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Taxa Mensal</p>
                      <p className="text-sm font-black text-slate-900">{debt.taxaMensal}%</p>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-50">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Vencimento</p>
                      <p className="text-sm font-black text-slate-900">Dia {debt.dataVencimento || '—'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Devedor</p>
                     <p className="text-[10px] font-black text-rose-500 uppercase">{debt.parcelasRestantes}x de {formatCurrency(debt.valorParcela)}</p>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">{formatCurrency(debt.saldoDevedor)}</h3>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dívida / Tipo</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Propósito</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Juros</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Parcelas</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo Devedor</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {debts.map(debt => (
                    <tr key={debt.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-3">
                            <div className={`w-1.5 h-8 rounded-full ${STRIPE_COLORS[debt.tipo] || 'bg-slate-400'}`} />
                            <div>
                               <p className="text-sm font-black text-slate-900">{debt.nome}</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase">{debt.tipo}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-5 max-w-xs">
                        <p className="text-xs text-slate-500 font-medium italic line-clamp-1">{debt.proposito || '—'}</p>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-600">{debt.taxaMensal}% <span className="text-[10px] text-slate-400">/mês</span></td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-900 text-right">{debt.parcelasRestantes}x <span className="text-[10px] text-slate-400">de {formatCurrency(debt.valorParcela)}</span></td>
                      <td className="px-8 py-5 text-right font-black text-rose-600">{formatCurrency(debt.saldoDevedor)}</td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center gap-2">
                           <button onClick={() => handleEdit(debt)} className="p-2 text-slate-400 hover:text-sky-600 transition-all"><Pencil size={14} /></button>
                           <button onClick={() => debt.id && handleDelete(debt.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-all"><Trash2 size={14} /></button>
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

      {/* RITUAL DE GOVERNANÇA (DÍVIDAS) */}
      <div className="mt-12 group relative overflow-hidden rounded-[3rem] bg-white border border-slate-200 p-10 shadow-soft">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl -mr-40 -mt-40" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-emerald-500 text-white rounded-[2.5rem] shadow-xl shadow-emerald-500/20">
              <ShieldCheck size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight">Ritual de Governança</h3>
              <p className="text-slate-500 font-medium mt-1">Valide se seus saldos devedores refletem a realidade de hoje.</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <button
              onClick={handleAmortizeAll}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
            >
              Abater Parcela do Mês
            </button>
            <button
              onClick={() => setShowConfirmModal(true)}
              className="flex items-center justify-center gap-3 px-10 py-4 bg-brand-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-all shadow-brand-glow active:scale-95"
            >
              Validar Dívidas Atuais
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO (DÍVIDAS) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-6 bg-rose-50 text-rose-600 rounded-[2.5rem]">
                <HelpCircle size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Validar Dívidas?</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Você confirma que os saldos devedores e parcelas cadastrados estão atualizados?
                  <br/><br/>
                  <span className="text-rose-600 font-bold italic">O Finanças Pro Invest usa essa confirmação para recalcular sua saúde financeira global.</span>
                </p>
              </div>
              
              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={handleConfirmSaldos}
                  disabled={isSavingSnapshot}
                  className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  {isSavingSnapshot ? 'Salvando...' : 'Confirmar integridade'}
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full py-5 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Ainda não
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtManager;
