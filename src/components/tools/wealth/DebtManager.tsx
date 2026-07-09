import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useFirebase } from '../../../hooks/useFirebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { eventBus } from '../../../core/orchestration/event-bus';
import { createDomainEvent, EVENT_TYPES } from '../../../core/orchestration/domainEvents';
import type { DebtCreatedEvent, DebtUpdatedEvent, DebtAmortizedEvent, DebtDeletedEvent } from '../../../core/orchestration/domainEvents';
import {
  Plus, Trash2, Pencil, X, Check,
  CreditCard, Sparkles, HelpCircle,
  TrendingUp, ShieldCheck, Target,
  LayoutGrid, List, History, ChevronRight,
  ArrowLeft, AlertCircle, Trophy, PartyPopper,
  ArrowRight, BookOpen, Wallet
} from 'lucide-react';
import { PresenceEventService } from '../../../services/PresenceEventService';
import { DebtProjectionDrawer } from './DebtProjectionDrawer';
import { DebtUpgradeModal } from './DebtUpgradeModal';
import { DebtNexusFeed } from './DebtNexusFeed';
import { useWealthData } from '../../../hooks/useWealthData';
import { useWealthHistory } from '../../../hooks/useWealthHistory';
import { useEntitlement } from '../../../hooks/useEntitlement';
import { useSovereignSnapshot } from '../../../hooks/useSovereignSnapshot';
import { useDebtAdvisor } from '../../../hooks/useDebtAdvisor';
import { useTransactions } from '../../../hooks/useTransactions';
import { fetchCurrentSelicRate } from '../buy-cash-or-installments/selicService';
import { DebtPlanSimulator } from '../DebtPlanSimulator';
import type { DebtCommand } from '../../../services/debt/advisor.types';
import { useDebts, amortizeDebts } from '../../../services/debt';
import type { DebtItem } from '../../../services/debt';
import { revertRotativoConversion, settleRotativoConversion, amortizeRotativoDebt } from '../../../services/rotativoService';
import { hasInterestBeenAppliedThisMonth, computeRotativoMonthlyInterest } from '../../../services/rotativo.math';
import { rankDebts, computeMonthlyImpact } from '../../../services/debt/debt.math';
import { MANUAL_DEBT_TYPES, MANUAL_DEBT_TYPE_OPTIONS } from '../../../services/debt/debt.constants';
import { FPI_COPY } from '../../../theme/fpiVoiceGuide';
import { useToast } from '../../../contexts/ToastContext';
import { RotativoInterestReport } from './RotativoInterestReport';

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
  lancamentos: any[];
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

const STRIPE_COLORS: Record<string, string> = {
  [MANUAL_DEBT_TYPES.ROTATIVO]: 'bg-rose-500',
  [MANUAL_DEBT_TYPES.PESSOAL]: 'bg-orange-400',
  [MANUAL_DEBT_TYPES.FINANCIAMENTO]: 'bg-blue-500',
  [MANUAL_DEBT_TYPES.CHEQUE_ESPECIAL]: 'bg-red-600',
  [MANUAL_DEBT_TYPES.CONSIGNADO]: 'bg-teal-500',
  [MANUAL_DEBT_TYPES.OUTRO]: 'bg-slate-400',
};

const EMPTY_FORM: DebtItem = {
  nome: '',
  tipo: 'Empréstimo pessoal',
  saldoDevedor: 0,
  taxaMensal: 0,
  parcelasRestantes: 0,
  valorParcela: 0,
  dataVencimento: null,
  proposito: ''
};

export const DebtManager: React.FC<DebtManagerProps> = ({ userId, userMeta, onNavigate }) => {
  const { effectiveTier } = useEntitlement();
  const isPro = effectiveTier !== 'free';
  const { addToast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState<{title: string, description: string} | null>(null);
  
  const { transactions } = useTransactions(userId);
  const sovereign = useSovereignSnapshot(transactions, userMeta);
  
  const { data: debtsData, isLoading } = useDebts(userId);
  const debts = debtsData || [];
  
  const commands = useDebtAdvisor(debts, sovereign);

  const { saveFinancialProfile } = useFirebase(userId); 
  const { totalAssets, totalInvestments, totalProperty, patrimonioLiquido, totalDebts: realTotalDebts } = useWealthData();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { saveSnapshot, isSaving: isSavingSnapshot } = useWealthHistory(userId);

  const [showSimulator, setShowSimulator] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DebtItem>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDebtForProjection, setSelectedDebtForProjection] = useState<DebtItem | null>(null);
  const [savedPlans, setSavedPlans] = useState<SavedDebtPlan[]>([]);
  const [selicRate, setSelicRate] = useState<number>(10.75);
  const [applyingInterestId, setApplyingInterestId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentSelicRate().then(rate => setSelicRate(rate || 10.75));
  }, []);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(firestore, 'users', userId, 'nexusDebtPlans'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    return onSnapshot(q, (snap) => {
      const plans = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedDebtPlan));
      setSavedPlans(plans);
    });
  }, [userId]);

  const handleCommandAction = (cmd: DebtCommand) => {
    if (cmd.action === 'open_projection' && cmd.metadata?.debtId) {
      const debt = debts.find(d => d.id === cmd.metadata.debtId);
      if (debt) setSelectedDebtForProjection(debt);
    } else if (cmd.action === 'open_validation') {
      setShowConfirmModal(true);
    } else if (cmd.action === 'open_crisis_mode') {
      onNavigate && onNavigate('controla');
    }
  };

  const handleAmortizeExtra = (amount: number) => {
      alert(`Fluxo para registrar pagamento de R$ ${amount} disparado!`);
      setSelectedDebtForProjection(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!isPro && debts.length >= 3 && !editingId) {
        setShowUpgradeModal({
          title: "Limite de dívidas atingido",
          description: "Sua estratégia de desalavancagem está ficando robusta. Assine o plano Pro para cadastrar dívidas ilimitadas e desbloquear o motor de quitação acelerada."
        });
        return;
    }

    setIsSubmitting(true);
    try {
      const debtData = {
        ...form,
        saldoDevedor: Math.max(0, form.saldoDevedor || 0),
        valorParcela: Math.max(0, form.valorParcela || 0),
        parcelasRestantes: Math.max(0, form.parcelasRestantes || 0),
        updatedAt: new Date(),
        proposito: form.proposito || ''
      };

      if (editingId) {
        const previousDebt = debts.find(d => d.id === editingId);
        await updateDoc(doc(firestore, 'users', userId, 'dividas', editingId), debtData);

        if (previousDebt?.originType === 'rotativo_cartao' && (form.saldoDevedor || 0) <= 0) {
          await settleRotativoConversion(userId, { ...previousDebt, ...debtData } as DebtItem);
        }

        await eventBus.publish(createDomainEvent<DebtUpdatedEvent['payload']>(
          'debt',
          EVENT_TYPES.debt.updated,
          {
            debtId: editingId,
            userId,
            previousDebt: previousDebt || null,
            changes: debtData,
          },
          'DebtManager.handleSave'
        ));
      } else {
        const newRef = await addDoc(collection(firestore, 'users', userId, 'dividas'), {
          ...debtData,
          createdAt: new Date()
        });
        await eventBus.publish(createDomainEvent<DebtCreatedEvent['payload']>(
          'debt',
          EVENT_TYPES.debt.created,
          {
            debt: { ...debtData, id: newRef.id } as DebtItem,
            userId,
          },
          'DebtManager.handleSave'
        ));
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      addToast(
        editingId
          ? 'Dívida atualizada. Continue monitorando sua evolução.'
          : 'Dívida cadastrada. O Nexus pode traçar uma estratégia de quitação.',
        'success'
      );
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
    const previousDebt = debts.find(d => d.id === id);

    if (previousDebt?.originType === 'rotativo_cartao') {
      await revertRotativoConversion(userId, previousDebt);
      addToast('Dívida rotativa revertida. A fatura original foi restaurada.', 'info');
      return;
    }

    await deleteDoc(doc(firestore, 'users', userId, 'dividas', id));
    if (previousDebt) {
      await eventBus.publish(createDomainEvent<DebtDeletedEvent['payload']>(
        'debt',
        EVENT_TYPES.debt.deleted,
        {
          debtId: id,
          userId,
          previousDebt,
        },
        'DebtManager.handleDelete'
      ));
    }
  };

  const handleApplyInterest = async (debt: DebtItem) => {
    if (!userId || !debt.id) return;
    setApplyingInterestId(debt.id);
    try {
      const result = await amortizeRotativoDebt(userId, debt);
      if (result.success) {
        addToast(`Juros de ${formatCurrency(result.interest || 0)} aplicados com sucesso. Novo saldo: ${formatCurrency(result.newSaldo || 0)}`, 'success');
      } else {
        addToast(result.error || 'Erro ao aplicar juros', 'error');
      }
    } catch {
      addToast('Erro ao aplicar juros', 'error');
    } finally {
      setApplyingInterestId(null);
    }
  };

  const handleAmortizeAll = async () => {
    if (!userId) return;
    if (!window.confirm("Isso irá abater UMA parcela de todas as suas dívidas ativas. Deseja continuar?")) return;

    const affectedDebts = debts.filter(d => d.saldoDevedor > 0 && d.parcelasRestantes > 0 && d.originType !== 'rotativo_cartao');
    const snapshots = affectedDebts.map(d => ({
      debtId: d.id!,
      valorParcela: d.valorParcela,
      previousSaldo: d.saldoDevedor,
      previousParcelas: d.parcelasRestantes,
    }));

    try {
      await amortizeDebts(userId);
      
      for (const snap of snapshots) {
        const newSaldo = Math.max(0, snap.previousSaldo - snap.valorParcela);
        const newParcelas = snap.previousParcelas - 1;
        await eventBus.publish(createDomainEvent<DebtAmortizedEvent['payload']>(
          'debt',
          EVENT_TYPES.debt.amortized,
          {
            debtId: snap.debtId,
            userId,
            amount: snap.valorParcela,
            previousSaldo: snap.previousSaldo,
            newSaldo,
            previousParcelas: snap.previousParcelas,
            newParcelas,
          },
          'DebtManager.handleAmortizeAll'
        ));
      }

      alert("Dívidas amortizadas com sucesso! Não esqueça de validar o saldo devedor final.");
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

  const totalSaldo = debts.reduce((acc, d) => acc + (d.saldoDevedor || 0), 0);
  const totalParcelas = debts.reduce((acc, d) => acc + (d.valorParcela || 0), 0);

  const criticalDebt = useMemo(() => {
    if (debts.length === 0) return null;
    return [...debts].sort((a, b) => (b.taxaMensal || 0) - (a.taxaMensal || 0))[0];
  }, [debts]);

  const rankings = useMemo(() => rankDebts(debts, sovereign?.heroValue), [debts, sovereign?.heroValue]);
  const topDebtId = rankings[0]?.debt?.id;

  const location = useLocation();
  const highlightDebtId = (location.state as any)?.highlightDebtId;

  useEffect(() => {
    if (!highlightDebtId) return;
    const targetRanking = rankings.find(r => r.debt.id === highlightDebtId);
    if (targetRanking) {
      const el = document.getElementById(`debt-${highlightDebtId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setSelectedDebtForProjection(targetRanking.debt);
    }
    window.history.replaceState({}, '');
  }, [highlightDebtId]);

  const totalRemainingParcelas = useMemo(() => {
    return debts.reduce((acc, d) => acc + (d.parcelasRestantes || 0), 0);
  }, [debts]);

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
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-200/60 p-8 md:p-12 shadow-floating group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.05),transparent_50%)]" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="space-y-4 flex-1">
            <div className="flex flex-col gap-4">
              {onNavigate && (
                <button
                  onClick={() => onNavigate('home')}
                  className="w-fit flex items-center gap-2 text-slate-500 hover:text-rose-700 transition-all font-black uppercase text-[10px] tracking-[0.2em]"
                >
                  <ArrowLeft size={14} /> Voltar
                </button>
              )}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm w-fit">
                <ShieldCheck size={14} />
                Estratégia de Desalavancagem
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tight leading-[1.1]">
              Sua rota de <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-500">liberdade total.</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-xl leading-relaxed font-medium">
              Encare suas dívidas com estratégia e não com medo. Mapeie cada juro e deixe o Nexus traçar o caminho mais curto para sua paz financeira.
            </p>
          </div>
          <div className="hidden lg:block w-80 h-56 shrink-0 relative animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="w-full h-full rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-card relative group-hover:scale-[1.02] transition-transform duration-500">
              <img src="/assets/images/lifestyle/debt-freedom.webp" alt="Liberdade" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-3 -left-3 bg-white px-5 py-2.5 rounded-2xl shadow-floating border border-slate-100 flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 tracking-tighter">Nexus Debt Shield</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feed de Comandos Nexus */}
      <DebtNexusFeed commands={commands} onAction={handleCommandAction} />

      {/* Bloco de Jornada de Progresso */}
      {debts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-1">Evolução da Jornada</p>
                  <h3 className="text-2xl font-black italic">Rumo ao Colchão Inicial</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Saldo Remanescente</p>
                  <p className="text-xl font-black">{formatCurrency(totalSaldo)}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span>Início da Estratégia</span>
                  <span>Liberdade Real</span>
                </div>
                <div className="h-4 bg-slate-800 rounded-full overflow-hidden p-1 border border-slate-700/50">
                   <div className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full shadow-[0_0_15px_rgba(225,29,72,0.4)]" style={{ width: '15%' }} /> 
                </div>
                <p className="text-[11px] text-slate-500 font-medium italic">O Finanças Pro Invest está monitorando {totalRemainingParcelas} parcelas em aberto.</p>
              </div>
            </div>
          </div>
          {criticalDebt && (
            <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-8 flex flex-col justify-between group hover:bg-rose-100/50 transition-all">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-200"><AlertCircle size={18} /></div>
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Dívida mais Crítica</span>
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-1">{criticalDebt.nome}</h4>
                <p className="text-xs text-slate-500 font-medium">Esta dívida possui a maior taxa de juros ({criticalDebt.taxaMensal}%/mês).</p>
              </div>
              <button onClick={() => setSelectedDebtForProjection(criticalDebt)} className="mt-6 w-full py-4 bg-white border border-rose-200 text-rose-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                Atacar esta dívida
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
          <History size={16} /> {showHistory ? 'Ocultar Estratégias' : 'Ver Estratégias Salvas'}
        </button>
        <button onClick={() => setShowSimulator(true)} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
          <Sparkles size={16} className="text-amber-400" /> Simular Estratégia
        </button>
      </div>

      {showHistory && savedPlans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-top-4 duration-300">
          {savedPlans.map(plan => (
            <div key={plan.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between group hover:border-sky-300 transition-all">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4"><BookOpen size={20} /></div>
                <h4 className="text-sm font-black text-slate-900 mb-1">{fixMojibake(plan.title)}</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Gerado em {plan.createdAt?.toDate ? plan.createdAt.toDate().toLocaleDateString('pt-BR') : 'Recente'}</p>
              </div>
              <button onClick={() => alert("Abrindo visualização...")} className="mt-6 w-full py-3 rounded-xl bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest group-hover:bg-sky-600 group-hover:text-white transition-all flex items-center justify-center gap-2">
                 Abrir Estratégia <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulário */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-xl text-slate-600">{editingId ? <Pencil size={20} /> : <Plus size={20} />}</div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{editingId ? 'Editar Dívida' : 'Cadastrar Nova Dívida'}</h3>
          </div>
          {editingId && (
            <button onClick={() => { setForm(EMPTY_FORM); setEditingId(null); }} className="text-xs font-black text-slate-500 hover:text-rose-500 uppercase tracking-widest flex items-center gap-1 transition-colors">
              <X size={14} /> Cancelar
            </button>
          )}
        </div>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dívida</label>
              <input type="text" required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-rose-500 transition-all text-sm font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as any })} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-rose-500 transition-all text-sm font-bold outline-none">
                {MANUAL_DEBT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Saldo</label>
              <input type="number" step="0.01" required value={form.saldoDevedor || ''} onChange={e => setForm({ ...form, saldoDevedor: Number(e.target.value) })} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-rose-500 transition-all text-sm font-bold" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Juros (% a.m.)</label>
              <input type="number" step="0.01" required value={form.taxaMensal || ''} onChange={e => setForm({ ...form, taxaMensal: Number(e.target.value) })} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-rose-500 transition-all text-sm font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Parcela</label>
              <input type="number" step="0.01" required value={form.valorParcela || ''} onChange={e => setForm({ ...form, valorParcela: Number(e.target.value) })} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-rose-500 transition-all text-sm font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Restantes</label>
              <input type="number" required value={form.parcelasRestantes || ''} onChange={e => setForm({ ...form, parcelasRestantes: Number(e.target.value) })} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-rose-500 transition-all text-sm font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dia Vencimento</label>
              <input type="number" value={form.dataVencimento || ''} onChange={e => setForm({ ...form, dataVencimento: e.target.value })} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-rose-500 transition-all text-sm font-bold" />
            </div>
          </div>
          <textarea value={form.proposito || ''} onChange={e => setForm({ ...form, proposito: e.target.value })} className="w-full px-6 py-4 rounded-2xl border border-slate-200 transition-all text-sm font-medium min-h-[100px] resize-none" placeholder="Propósito..." />
          <button type="submit" disabled={isSubmitting} className="w-full py-5 rounded-2xl bg-rose-600 text-white font-black uppercase tracking-widest text-xs hover:bg-rose-500 transition-all disabled:opacity-50">
            {isSubmitting ? 'Salvando...' : editingId ? 'Atualizar Dívida' : 'Salvar Nova Dívida'}
          </button>
        </form>
      </div>

      {/* Lista */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Sua Lista</h3>
          <div className="flex bg-slate-100 p-1 rounded-xl">
             <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><LayoutGrid size={16} /></button>
             <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><List size={16} /></button>
          </div>
        </div>

        {debts.length === 0 ? (
          <div className="bg-slate-50 border border-dashed rounded-[3rem] p-20 text-center">Vazio</div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rankings.map(ranking => {
              const debt = ranking.debt;
              const isTopPriority = debt.id === topDebtId;
              return (
                  <div key={debt.id} id={`debt-${debt.id}`} className={`bg-white border rounded-[2.5rem] p-7 shadow-sm group relative overflow-hidden flex flex-col h-full ${debt.id === highlightDebtId ? 'ring-2 ring-amber-400 border-amber-300 shadow-amber-100/50' : 'border-slate-200'}`}>
                    <div className={`absolute top-0 left-0 w-full h-2 ${STRIPE_COLORS[debt.tipo] || 'bg-slate-400'}`} />
                    <div className="flex justify-between items-start mb-6 mt-2">
                      <div>
                        <span className="text-[9px] font-black text-slate-500 uppercase">{debt.tipo}</span>
                        <h4 className="text-lg font-black text-slate-900">
                          {debt.nome}
                          {isTopPriority && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-100 border border-amber-200 text-[8px] font-black text-amber-700 uppercase tracking-widest">
                              Prioridade #1
                            </span>
                          )}
                        </h4>
                        {(() => {
                          const impact = computeMonthlyImpact(debt);
                          if (impact <= 0) return null;
                          const label = debt.originType === 'rotativo_cartao'
                            ? `Juros: ${formatCurrency(impact)}/mês`
                            : `Parcela: ${formatCurrency(impact)}/mês`;
                          if (isTopPriority) {
                            return (
                              <p className="mt-1 text-[11px] font-black text-amber-600 tracking-tight">
                                🔥 Impacto: {label}
                              </p>
                            );
                          }
                          return (
                            <p className="mt-0.5 text-[9px] text-slate-500 font-medium">
                              {label}
                            </p>
                          );
                        })()}
                        {debt.originType === 'rotativo_cartao' && (
                          <div className="mt-1.5 space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-100 border border-rose-200 text-[9px] font-black text-rose-700 uppercase tracking-widest">
                              Rotativo
                            </span>
                            {debt.taxaMensal > 0 && (
                              <div className="space-y-0.5 pt-1">
                                <p className="text-[9px] text-slate-500 font-bold">
                                  Taxa: {debt.taxaMensal}% a.m.
                                </p>
                                <p className="text-[9px] text-slate-500 font-bold">
                                  Juro mensal: {formatCurrency(computeRotativoMonthlyInterest(debt.saldoDevedor, debt.taxaMensal))}
                                </p>
                                {hasInterestBeenAppliedThisMonth(debt.lastInterestAppliedAt) ? (
                                  <p className="text-[8px] text-emerald-600 font-black uppercase tracking-wider">
                                    Juros deste mês já aplicados
                                  </p>
                                ) : (
                                  <div className="flex items-center gap-2 pt-1">
                                    <p className="text-[8px] text-amber-600 font-black uppercase tracking-wider">
                                      Pode aplicar juros
                                    </p>
                                    <button
                                      onClick={() => handleApplyInterest(debt)}
                                      disabled={applyingInterestId === debt.id}
                                      className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[8px] font-black uppercase tracking-wider hover:bg-amber-600 disabled:opacity-50 transition-all active:scale-95"
                                    >
                                      {applyingInterestId === debt.id ? 'Aplicando...' : 'Aplicar'}
                                    </button>
                                  </div>
                                )}
                                {debt.lastInterestAppliedAt && (
                                  <p className="text-[7px] text-slate-500 font-medium pt-0.5">
                                    Última aplicação em {new Date(debt.lastInterestAppliedAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                                  </p>
                                )}
                              </div>
                            )}
                            {!debt.taxaMensal && (
                              <p className="text-[8px] text-slate-500 font-medium pt-0.5">
                                Configure a taxa de juros no gerenciador de cartões
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => setSelectedDebtForProjection(debt)} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:text-emerald-600 transition-all border border-slate-100"><TrendingUp size={16} /></button>
                    <button onClick={() => handleEdit(debt)} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:text-sky-600 transition-all border border-slate-100"><Pencil size={16} /></button>
                    <button onClick={() => debt.id && handleDelete(debt.id)} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:text-rose-600 transition-all border border-slate-100"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="mt-auto pt-6 border-t border-slate-100">
                  <h3 className="text-2xl font-black text-slate-900">{formatCurrency(debt.saldoDevedor)}</h3>
                </div>
              </div>
            );
          })}
          </div>
        ) : (
          <div className="bg-white border rounded-[2.5rem] overflow-hidden shadow-sm">
             <table className="w-full text-left">
               <tbody className="divide-y divide-slate-50">
                  {rankings.map(ranking => {
                    const debt = ranking.debt;
                    const isTopPriority = debt.id === topDebtId;
                    return (
                     <tr key={debt.id} id={`debt-${debt.id}`} className={`hover:bg-slate-50/50 group ${debt.id === highlightDebtId ? 'bg-amber-50/50 ring-2 ring-amber-400 ring-inset' : ''}`}>
                       <td className="px-8 py-5 font-black text-slate-900">
                          <div className="flex flex-col">
                            <span>
                              {debt.nome}
                              {isTopPriority && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-100 border border-amber-200 text-[8px] font-black text-amber-700 uppercase tracking-widest">
                                  Prioridade #1
                                </span>
                              )}
                              {debt.originType === 'rotativo_cartao' && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-md bg-rose-100 border border-rose-200 text-[8px] font-black text-rose-700 uppercase tracking-widest">
                                  Rotativo
                                </span>
                              )}
                            </span>
                            {(() => {
                              const impact = computeMonthlyImpact(debt);
                              if (impact <= 0) return null;
                              const label = debt.originType === 'rotativo_cartao'
                                ? `Juros: ${formatCurrency(impact)}/mês`
                                : `Parcela: ${formatCurrency(impact)}/mês`;
                              if (isTopPriority) {
                                return (
                                  <span className="text-[10px] font-black text-amber-600 mt-0.5">
                                    🔥 Impacto: {label}
                                  </span>
                                );
                              }
                              return (
                                <span className="text-[8px] text-slate-500 font-medium mt-0.5">
                                  {label}
                                </span>
                              );
                            })()}
                            {debt.originType === 'rotativo_cartao' && debt.taxaMensal > 0 && (
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[9px] text-slate-500 font-medium">
                                  {debt.taxaMensal}% a.m. · {formatCurrency(computeRotativoMonthlyInterest(debt.saldoDevedor, debt.taxaMensal))}/mês
                                </span>
                                {hasInterestBeenAppliedThisMonth(debt.lastInterestAppliedAt) ? (
                                  <span className="text-[8px] text-emerald-600 font-black uppercase tracking-wider">
                                    Juros aplicados
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[8px] text-amber-600 font-black uppercase tracking-wider">
                                      Pode aplicar
                                    </span>
                                    <button
                                      onClick={() => handleApplyInterest(debt)}
                                      disabled={applyingInterestId === debt.id}
                                      className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[8px] font-black uppercase tracking-wider hover:bg-amber-600 disabled:opacity-50 transition-all active:scale-95"
                                    >
                                      {applyingInterestId === debt.id ? 'Aplicando...' : 'Aplicar'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                         </div>
                       </td>
                     <td className="px-8 py-5 text-right font-black text-rose-600">{formatCurrency(debt.saldoDevedor)}</td>
                     <td className="px-8 py-5">
                       <button onClick={() => handleEdit(debt)} className="p-2 text-slate-500 hover:text-sky-600"><Pencil size={14} /></button>
                       <button onClick={() => debt.id && handleDelete(debt.id)} className="p-2 text-slate-500 hover:text-rose-600"><Trash2 size={14} /></button>
                     </td>
                    </tr>
                  );
                })}
               </tbody>
             </table>
          </div>
        )}
      </div>

      <div className="mt-12 rounded-[3rem] bg-white border border-slate-200 p-10 flex flex-col md:flex-row items-center justify-between gap-10">
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Ritual de Governança</h3>
        <div className="flex gap-4">
          <button onClick={handleAmortizeAll} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase hover:bg-slate-800 transition-all">Abater Parcela</button>
          <button onClick={() => setShowConfirmModal(true)} className="px-10 py-4 bg-brand-primary text-white rounded-2xl text-[11px] font-black uppercase hover:bg-brand-primary/90 transition-all">Validar Dívidas</button>
        </div>
      </div>

      <RotativoInterestReport userId={userId} />

      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95">
             <h3 className="text-2xl font-black text-center mb-6">Validar Estratégia?</h3>
             <div className="flex flex-col gap-3">
               <button onClick={handleConfirmSaldos} disabled={isSavingSnapshot} className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black uppercase hover:bg-brand-primary/90 transition-all">Confirmar</button>
               <button onClick={() => setShowConfirmModal(false)} className="w-full py-5 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase hover:bg-slate-100 transition-all">Cancelar</button>
             </div>
          </div>
        </div>
      )}

      {selectedDebtForProjection && (
          <DebtProjectionDrawer debt={selectedDebtForProjection} isOpen={!!selectedDebtForProjection} onClose={() => setSelectedDebtForProjection(null)} onConfirmAmortization={handleAmortizeExtra} />
      )}

      {showUpgradeModal && (
        <DebtUpgradeModal isOpen={!!showUpgradeModal} onClose={() => setShowUpgradeModal(null)} onUpgrade={() => onNavigate && onNavigate('upgrade')} title={showUpgradeModal.title} description={showUpgradeModal.description} />
      )}
    </div>
  );
};

export default DebtManager;
