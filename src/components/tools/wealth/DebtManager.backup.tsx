import React, { useState, useEffect } from 'react';
import {
  collection, query, onSnapshot,
  addDoc, doc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '../../../hooks/useFirebase';
import {
  Plus, Trash2, Pencil, X,
  CreditCard, Sparkles, HelpCircle,
  TrendingUp, ShieldCheck, Target, Info
} from 'lucide-react';
import { DebtPlanSimulator } from '../DebtPlanSimulator';

export interface DebtItem {
  id?: string;
  nome: string;
  tipo: string;
  saldoDevedor: number;
  taxaMensal: number;
  parcelasRestantes: number;
  valorParcela: number;
  createdAt?: any;
}

interface DebtManagerProps {
  userMeta: any;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

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
};

export const DebtManager: React.FC<DebtManagerProps> = ({ userMeta }) => {
  const navigate = useNavigate();
  const { saveFinancialProfile } = useFirebase(userMeta?.uid); // <-- Passando o UID para o hook

  // 1. Estados Gerais e CRUD
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCetInfo, setShowCetInfo] = useState(false);
  const [form, setForm] = useState<DebtItem>(EMPTY_FORM);
  const [displaySaldo, setDisplaySaldo] = useState('');
  const [displayParcela, setDisplayParcela] = useState('');

  // 2. Estados do Guia de Fôlego (Método Guiado)
  const [setupStep, setSetupStep] = useState(0); 
  const [tempIncome, setTempIncome] = useState<number>(0);
  const [displayTempIncome, setDisplayTempIncome] = useState('');
  const [tempStability, setTempStability] = useState<'stable' | 'normal' | 'volatile' | null>(null);
  const [tempReserveMonths, setTempReserveMonths] = useState<number>(6);
  const [tempCurrentReserve, setTempCurrentReserve] = useState<number>(0);
  const [displayTempCurrentReserve, setDisplayTempCurrentReserve] = useState('');

  // 3. Efeito para controlar a exibição do guia
    useEffect(() => {
    // Só dispara o passo 1 automaticamente se for a primeira vez (step === 0)
    // e se realmente não existir o perfil.
    // Se o userMeta carregou, mas o perfil não existe, abre o guia
    if (userMeta && !userMeta.financialProfile && setupStep === 0) {
      setSetupStep(1);
    }
  }, [userMeta?.financialProfile]); // Agora ele só vigia o perfil, não o step.
  // 4. Auto-cálculo do CET (HP12c style)
  useEffect(() => {
    const { saldoDevedor, parcelasRestantes, valorParcela } = form;
    // Só calcula se tivermos os 3 pilares: PV, n e PMT
    if (saldoDevedor > 0 && parcelasRestantes > 0 && valorParcela > 0) {
      const cet = calculateCET(saldoDevedor, parcelasRestantes, valorParcela);
      
      // Evita loops infinitos de estado: só atualiza se a mudança for significativa (> 0.01%)
      if (Math.abs(cet - form.taxaMensal) > 0.01) {
        setForm(prev => ({ ...prev, taxaMensal: Number(cet.toFixed(2)) }));
      }
    }
  }, [form.saldoDevedor, form.parcelasRestantes, form.valorParcela, form.taxaMensal]);
  // 4. Firestore listener
  useEffect(() => {
    if (!userMeta?.uid) { setIsLoading(false); return; }
    const ref = collection(firestore, `users/${userMeta.uid}/dividas`);
    const unsub = onSnapshot(
      query(ref),
      (snap) => {
        const loaded: DebtItem[] = [];
        snap.forEach((d) => loaded.push({ id: d.id, ...d.data() } as DebtItem));
        setDebts(loaded);
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );
    return () => unsub();
  }, [userMeta]);

  // 5. Helper de Input com Máscara (Versão Polimórfica)
  const handleCurrencyInput = (
    raw: string,
    setDisplay: (v: string) => void,
    target: 'saldoDevedor' | 'valorParcela' | ((val: number) => void),
  ) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      setDisplay('');
      if (typeof target === 'function') {
        target(0);
      } else {
        setForm((prev) => ({ ...prev, [target]: 0 }));
      }
      return;
    }
    const numeric = parseInt(digits, 10) / 100;
    setDisplay(numeric.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    
    if (typeof target === 'function') {
      target(numeric);
    } else {
      setForm((prev) => ({ ...prev, [target]: numeric }));
    }
  };  
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setDisplaySaldo('');
    setDisplayParcela('');
    setEditingId(null);
  };

  // ─── CRUD ────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (
        !userMeta?.uid ||
        !form.nome.trim() ||
        form.saldoDevedor <= 0 ||
        form.taxaMensal <= 0 ||
        form.parcelasRestantes <= 0 ||
        !form.valorParcela ||          // <-- NOVA TRAVA: Parcela não pode ser vazia
        form.valorParcela <= 0         // <-- NOVA TRAVA: Parcela tem que ser maior que zero
      ) {
        alert('Preencha todos os campos corretamente. O valor da parcela é essencial para o Nexus montar seu plano.');
        return;
      }
      setIsSubmitting(true);
      try {
        const data = {
          nome: form.nome.trim(),
          tipo: form.tipo,
          saldoDevedor: form.saldoDevedor,
          taxaMensal: form.taxaMensal,
          parcelasRestantes: form.parcelasRestantes,
          valorParcela: form.valorParcela, // <-- Removemos o '?? null'
        };
      if (editingId) {
        await updateDoc(doc(firestore, `users/${userMeta.uid}/dividas`, editingId), data);
      } else {
        await addDoc(collection(firestore, `users/${userMeta.uid}/dividas`), {
          ...data,
          createdAt: new Date(),
        });
      }
      resetForm();
    } catch (err) {
      console.error('Erro ao salvar dívida:', err);
      alert('Houve um erro ao salvar a dívida.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (debt: DebtItem) => {
    setForm({ ...debt });
    setDisplaySaldo(
      debt.saldoDevedor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    );
    setDisplayParcela(
      debt.valorParcela
        ? debt.valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '',
    );
    if (debt.id) setEditingId(debt.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!userMeta?.uid) return;
    if (!window.confirm('Tem certeza que deseja excluir esta dívida?')) return;
    try {
      await deleteDoc(doc(firestore, `users/${userMeta.uid}/dividas`, id));
      if (editingId === id) resetForm();
    } catch (err) {
      console.error('Erro ao excluir dívida:', err);
    }
  };

  // ─── Nexus CTA ───────────────────────────────────────────────────────────
  const [showDebtPlan, setShowDebtPlan] = useState(false);

  const handleNexusCTA = () => {
    setShowDebtPlan(true);
    setTimeout(() => {
      document.getElementById('nexus-debt-plan')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const totalSaldo = debts.reduce((acc, d) => acc + d.saldoDevedor, 0);
  console.log("DEBUG Nexus:", { profile: userMeta?.financialProfile, step: setupStep });
  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* SEÇÃO DE PERFIL FINANCEIRO (MÉTODO GUIADO) */}
      {userMeta?.financialProfile && setupStep <= 0 ? (
        // CARD DE RESUMO (Feedback visual após salvar)
        <div className="mb-8 bg-white border border-teal-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between animate-in fade-in duration-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 rounded-xl">
              <TrendingUp size={24} className="text-teal-600" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-0.5">Renda Mensal</p>
              <h3 className="text-xl font-black text-slate-900">{formatCurrency(userMeta.financialProfile.monthlyIncome)}</h3>
            </div>
          </div>

          {/* BLOCO: Estabilidade */}
          <div className="flex flex-col items-center justify-center px-6 border-l border-slate-100">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-2">Estabilidade</p>
            {(() => {
              const target = userMeta.financialProfile.emergencyReserveTarget;
              const isEstavel = target <= 4;
              const isVolatil = target >= 12;
              return (
                <span className={`text-xs font-black uppercase tracking-wide px-3 py-1 rounded-full ${
                  isEstavel ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-200' :
                  isVolatil ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' :
                             'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                }`}>
                  {isEstavel ? '🟢 Estável' : isVolatil ? '🔴 Volátil' : '🟡 Regular'}
                </span>
              );
            })()}
          </div>

          <div className="flex items-center gap-4 hidden-placeholder">
          </div>
          <div className="flex-1 w-full border-l border-slate-100 pl-6 hidden md:block">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Status da Reserva</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-500 h-full transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (userMeta.financialProfile.emergencyReserveCurrent / (userMeta.financialProfile.monthlyIncome * userMeta.financialProfile.emergencyReserveTarget)) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-600">
                {Math.round((userMeta.financialProfile.emergencyReserveCurrent / (userMeta.financialProfile.monthlyIncome * userMeta.financialProfile.emergencyReserveTarget)) * 100)}%
              </span>
            </div>
          </div>
          <button onClick={() => setSetupStep(1)} className="p-2 text-slate-300 hover:text-teal-600 transition-colors">
            <Pencil size={18} />
          </button>
        </div>
      ) : setupStep > 0 ? (
        // CARD DE SETUP (Aparece se for novo ou se clicar em Editar)
        <div className="mb-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg animate-in zoom-in duration-300">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Sparkles size={24} className="text-white" />
            </div>
            <div className="flex-1">
              {setupStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold italic">Passo 1: Qual sua renda mensal líquida?</h3>
                  <p className="text-teal-50 text-sm leading-relaxed">O Nexus usa esse dado para calcular o quanto você realmente pode usar para quitar dívidas sem passar sufoco.</p>
                  <div className="relative max-w-xs">
                    <span className="absolute left-4 top-[13px] text-teal-200 font-bold">R$</span>
                    <input
                      type="text"
                      placeholder="0,00"
                      className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-teal-200 focus:outline-none focus:bg-white/20 transition-all"
                      value={displayTempIncome}
                      onChange={(e) => handleCurrencyInput(e.target.value, setDisplayTempIncome, (val) => setTempIncome(val))}
                    />
                  </div>
                  <button 
                    disabled={tempIncome <= 0}
                    onClick={() => setSetupStep(2)}
                    className="bg-white text-teal-600 px-6 py-2 rounded-lg font-bold hover:bg-teal-50 transition-colors disabled:opacity-50"
                  >
                    Próximo
                  </button>
                </div>
              )}

              {setupStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold italic">O que é a Reserva de Emergência?</h3>
                  <p className="text-teal-50 text-sm leading-relaxed">É o seu <strong>balão de oxigênio</strong>. Ter um valor guardado evita que você faça novas dívidas em imprevistos. É a base da sua paz.</p>
                  <p className="font-semibold text-sm pt-2">Como é a estabilidade da sua fonte de renda hoje?</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button onClick={() => { setTempStability('stable'); setTempReserveMonths(4); setSetupStep(3); }} className="bg-white/10 hover:bg-white/20 p-4 rounded-xl border border-white/10 text-left text-sm transition-all group">
                      <ShieldCheck size={18} className="mb-2 text-teal-200 group-hover:text-white" />
                      <div className="font-bold">Estável</div>
                      <div className="text-[10px] text-teal-100">Ex: Concursado, Aposentado</div>
                    </button>
                    <button onClick={() => { setTempStability('normal'); setTempReserveMonths(6); setSetupStep(3); }} className="bg-white/10 hover:bg-white/20 p-4 rounded-xl border border-white/10 text-left text-sm transition-all group">
                      <TrendingUp size={18} className="mb-2 text-teal-200 group-hover:text-white" />
                      <div className="font-bold">Regular</div>
                      <div className="text-[10px] text-teal-100">Ex: CLT / Empresa Privada</div>
                    </button>
                    <button onClick={() => { setTempStability('volatile'); setTempReserveMonths(12); setSetupStep(3); }} className="bg-white/10 hover:bg-white/20 p-4 rounded-xl border border-white/10 text-left text-sm transition-all group">
                      <Target size={18} className="mb-2 text-teal-200 group-hover:text-white" />
                      <div className="font-bold">Volátil</div>
                      <div className="text-[10px] text-teal-100">Ex: Autônomo, Empresário</div>
                    </button>
                  </div>
                </div>
              )}

              {setupStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold italic">Definindo sua meta</h3>
                  <p className="text-teal-50 text-sm leading-relaxed">Sugerimos <strong>{tempReserveMonths} meses</strong> de custo de vida. Você decide o que te traz paz.</p>
                  <div className="flex items-center gap-4 py-2">
                    <input 
                      type="range" min="1" max="24" step="1" 
                      value={tempReserveMonths} 
                      onChange={(e) => setTempReserveMonths(Number(e.target.value))}
                      className="flex-1 accent-white h-2 bg-teal-400 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-2xl font-black min-w-[100px] text-center">{tempReserveMonths} meses</span>
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-xs text-teal-100 mb-2 italic">Já possui algum valor guardado hoje?</p>
                    <div className="relative max-w-xs mb-4">
                      <span className="absolute left-4 top-[11px] text-teal-200 font-bold">R$</span>
                      <input
                        type="text"
                        placeholder="0,00"
                        className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-teal-200 focus:outline-none focus:bg-white/20 transition-all text-sm font-medium"
                        value={displayTempCurrentReserve}
                        onChange={(e) => handleCurrencyInput(e.target.value, setDisplayTempCurrentReserve, (val) => setTempCurrentReserve(val))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button 
                      onClick={async () => {
                        await saveFinancialProfile({
                          monthlyIncome: tempIncome,
                          emergencyReserveTarget: tempReserveMonths,
                          emergencyReserveCurrent: tempCurrentReserve
                        });
                        setSetupStep(-1);
                      }}
                      className="bg-white text-teal-600 px-8 py-2.5 rounded-xl font-bold hover:bg-teal-50 transition-colors shadow-md text-sm"
                    >
                      Salvar Perfil Financeiro
                    </button>
                    <button onClick={() => setSetupStep(2)} className="text-teal-100 text-xs underline px-2">Voltar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // CARD DE RESUMO (Feedback visual permanente)
        userMeta?.financialProfile && (
          <div className="mb-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
                <TrendingUp size={24} className="text-teal-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Renda Mensal</p>
                  {/* Mostra o badge baseado nos meses da meta */}
                  <span className="text-[9px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter">
                    {userMeta.financialProfile.emergencyReserveTarget <= 4 ? 'Estável' : 
                     userMeta.financialProfile.emergencyReserveTarget >= 12 ? 'Volátil' : 'Regular'}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900">{formatCurrency(userMeta.financialProfile.monthlyIncome)}</h3>
              </div>
            </div>

            <div className="h-px w-full md:h-12 md:w-px bg-slate-100" />

            <div className="flex-1 w-full">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Reserva de Emergência</p>
                  <p className="text-[10px] text-slate-400">Meta sugerida: {userMeta.financialProfile.emergencyReserveTarget} meses</p>
                </div>
                <p className="text-xs font-black text-slate-700">
                  {userMeta.financialProfile.monthlyIncome > 0 
                    ? Math.round((userMeta.financialProfile.emergencyReserveCurrent / (userMeta.financialProfile.monthlyIncome * userMeta.financialProfile.emergencyReserveTarget)) * 100) 
                    : 0}%
                </p>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-500 h-full transition-all duration-1000" 
                  style={{ width: `${Math.min(100, userMeta.financialProfile.monthlyIncome > 0 ? (userMeta.financialProfile.emergencyReserveCurrent / (userMeta.financialProfile.monthlyIncome * userMeta.financialProfile.emergencyReserveTarget)) * 100 : 0)}%` }}
                />
              </div>
            </div>

            <button 
              onClick={() => {
                const p = userMeta.financialProfile;
                setTempIncome(p.monthlyIncome);
                setDisplayTempIncome(p.monthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
                setTempReserveMonths(p.emergencyReserveTarget);
                setTempCurrentReserve(p.emergencyReserveCurrent);
                setDisplayTempCurrentReserve(p.emergencyReserveCurrent.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
                setSetupStep(1);
              }}
              className="p-2 text-slate-300 hover:text-teal-600 transition-colors"
              title="Editar Perfil Financeiro"
            >
              <Pencil size={18} />
            </button>
          </div>
        )
      )}
      {/* Cabeçalho */}
      
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
            <CreditCard size={24} className="text-rose-500" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Minhas Dívidas
          </h2>
        </div>
        <p className="text-slate-500 text-sm md:text-base max-w-2xl">
          Cadastre todas as suas dívidas. Com esses dados, o Nexus consegue montar um plano real de quitação.
        </p>
      </header>

      {/* Formulário */}
      <div
        className={`bg-white border ${
          editingId ? 'border-amber-300 shadow-[0_0_0_4px_rgba(251,191,36,0.08)]' : 'border-slate-200'
        } rounded-2xl p-6 mb-8 shadow-sm transition-all duration-300`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editingId ? 'bg-amber-50' : 'bg-teal-50'}`}>
              {editingId
                ? <Pencil size={16} className="text-amber-500" />
                : <Plus size={16} className="text-teal-600" />}
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {editingId ? 'Editando dívida' : 'Adicionar dívida'}
            </h3>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
            >
              <X size={14} /> Cancelar edição
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">

          {/* Nome */}
          <div className="md:col-span-5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Nome da dívida <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Cartão Nubank, Empréstimo Caixa"
              value={form.nome}
              onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
            />
          </div>

          {/* Tipo */}
          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Tipo <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.tipo}
              onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
            >
              {DEBT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Saldo devedor */}
          <div className="md:col-span-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Saldo devedor atual <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-[13px] text-slate-400 text-sm font-bold pointer-events-none">R$</span>
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="0,00"
                value={displaySaldo}
                onChange={(e) => handleCurrencyInput(e.target.value, setDisplaySaldo, 'saldoDevedor')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
              />
            </div>
          </div>
          {/* Taxa / CET (Calculado Automaticamente via HP12c) */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-1 mb-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Taxa / CET mensal <span className="text-teal-600 font-normal lowercase">(automático)</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCetInfo((v) => !v)}
                  className="text-slate-400 hover:text-teal-600 transition-colors ml-1"
                  aria-label="O que é CET?"
                >
                  <HelpCircle size={13} />
                </button>
                {showCetInfo && (
                  <div className="absolute left-0 top-6 z-20 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-xs text-slate-600 leading-relaxed animate-in fade-in zoom-in duration-200">
                    <p className="font-bold text-slate-800 mb-1 text-sm">O que é CET?</p>
                    <p className="mb-2">
                      É o <strong>custo real da sua dívida</strong>. O app calcula isso automaticamente cruzando o saldo, o prazo e o valor da sua parcela.
                    </p>
                    <p className="mb-2 italic text-teal-600 font-medium">
                      Nota: O Nexus usa esta taxa calculada para priorizar qual dívida você deve quitar primeiro.
                    </p>
                    <button
                      onClick={() => setShowCetInfo(false)}
                      className="mt-3 text-teal-600 font-bold text-[10px] uppercase tracking-wide"
                    >
                      Entendido ✓
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={form.taxaMensal > 0 ? `${form.taxaMensal}% a.m.` : 'Aguardando dados...'}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 text-sm font-bold cursor-not-allowed transition-all"
              />
              <div className="absolute right-3 top-[12px] flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm pointer-events-none">
                <span className="text-[9px] text-teal-600 font-black uppercase tracking-tighter">HP12c Mode</span>
              </div>
            </div>
            <p className="mt-1 text-[9px] text-slate-400 italic">
              * Calculado com base no saldo, parcelas e valor pago.
            </p>
          </div>
          {/* Parcelas restantes */}
          <div className="md:col-span-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Parcelas restantes <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder="Ex: 24"
              value={form.parcelasRestantes || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, parcelasRestantes: parseInt(e.target.value) || 0 }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
            />
          </div>
          {/* Valor da parcela (obrigatório para o Nexus) */}
          <div className="md:col-span-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Valor da parcela <span className="text-red-500 font-normal lowercase">(obrigatório)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-[13px] text-slate-400 text-sm font-bold pointer-events-none">R$</span>
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="0,00"
                value={displayParcela}
                onChange={(e) => handleCurrencyInput(e.target.value, setDisplayParcela, 'valorParcela')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-400 leading-tight">
              O Nexus precisa deste valor para calcular seu fôlego financeiro.
            </p>
          </div>
          {/* Submit */}
          <div className="md:col-span-12 flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 ${
                editingId
                  ? 'bg-amber-500 hover:bg-amber-400 text-white'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              {editingId
                ? <><Pencil size={15} /> Salvar alterações</>
                : <><Plus size={15} /> Adicionar dívida</>}
            </button>
          </div>
        </form>
      </div>

      {/* Lista */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Dívidas cadastradas
            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full border border-slate-200">
              {debts.length} {debts.length === 1 ? 'dívida' : 'dívidas'}
            </span>
          </h3>
          {debts.length > 0 && (
            <p className="text-sm font-black text-slate-800">
              Total em dívidas:{' '}
              <span className="text-rose-600">{formatCurrency(totalSaldo)}</span>
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse text-sm">
            Carregando dívidas...
          </div>
        ) : debts.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium mb-1">Nenhuma dívida cadastrada</p>
            <p className="text-slate-400 text-sm">Adicione sua primeira dívida no formulário acima.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {debts.map((debt) => (
              <div
                key={debt.id}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-md transition-all group relative overflow-hidden flex flex-col"
              >
                <div className={`absolute top-0 left-0 w-full h-1 ${STRIPE_COLORS[debt.tipo] ?? 'bg-slate-400'}`} />

                <div className="flex justify-between items-start mb-4 mt-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border border-slate-100 px-2 py-1 rounded-md mb-2 inline-block">
                      {debt.tipo}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 truncate">{debt.nome}</h4>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => handleEdit(debt)}
                      className="text-slate-400 hover:text-amber-500 p-2 rounded-lg hover:bg-amber-50 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => debt.id && handleDelete(debt.id)}
                      className="text-slate-400 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-grow">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo devedor</span>
                    <span className="text-base font-black text-rose-600">{formatCurrency(debt.saldoDevedor)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Taxa mensal</span>
                    <span className="text-sm font-bold text-slate-700">{debt.taxaMensal}% a.m.</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parcelas restantes</span>
                    <span className="text-sm font-bold text-slate-700">{debt.parcelasRestantes}x</span>
                  </div>
                  {debt.valorParcela ? (
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parcela</span>
                      <span className="text-sm font-bold text-slate-700">{formatCurrency(debt.valorParcela)}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Nexus — aparece quando há pelo menos 1 dívida cadastrada */}
      {debts.length > 0 && (
        <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-slate-50 p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-teal-800 flex items-center gap-2">
              <Sparkles size={16} className="text-teal-600" />
              Suas dívidas estão prontas para análise.
            </p>
            <p className="text-sm text-slate-600">
              Quer que o Nexus monte seu plano de quitação com base nesses dados reais?
            </p>
          </div>
          <button
            onClick={handleNexusCTA}
            className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition-colors whitespace-nowrap shadow-sm"
          >
            <Sparkles size={15} />
            Gerar meu plano com o Nexus
          </button>
        </div>
      )}

      {/* ── NEXUS DEBT PLAN (inline) ── */}
      {showDebtPlan && (
        <div id="nexus-debt-plan">
          <DebtPlanSimulator
            dividas={debts.map(d => ({
              id: d.id ?? d.nome,
              nome: d.nome,
              saldoAtual: d.saldoDevedor,
              taxaJurosMes: d.taxaMensal,
              ...(d.valorParcela ? { parcelaMensal: d.valorParcela } : {}),
            }))}
            simulacao={{
              totalDividas: debts.reduce((acc, d) => acc + d.saldoDevedor, 0),
              prazoEstimadoQuitacaoAtual: debts.length > 0
                ? Math.max(...debts.map(d => d.parcelasRestantes))
                : 0,
              ...(userMeta?.financialProfile?.monthlyIncome
                ? { rendaMensalEstimada: userMeta.financialProfile.monthlyIncome }
                : {}),
            }}
            usuarioPerfil="endividado_iniciante"
            perfilContexto={userMeta?.financialProfile ? {
              estabilidade:
                userMeta.financialProfile.emergencyReserveTarget <= 4 ? 'estavel' :
                userMeta.financialProfile.emergencyReserveTarget >= 12 ? 'volatil' : 'regular',
              reservaAtual: userMeta.financialProfile.emergencyReserveCurrent ?? 0,
              metaReservaEmMeses: userMeta.financialProfile.emergencyReserveTarget ?? 6,
            } : undefined}
          />
        </div>
      )}

    </div>
  );
};

export default DebtManager;
