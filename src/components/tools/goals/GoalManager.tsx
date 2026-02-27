import React, { useState, useEffect } from 'react';
import { useGoals } from '../../../hooks/useGoals';
import { Goal, Frequencia } from '../../../services/goalService';
import { Timestamp } from 'firebase/firestore';
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  Pencil, 
  X, 
  Calendar,
  Bell,
  Mail,
  BellRing,
  CheckCircle,
  Circle
} from 'lucide-react';

interface GoalManagerProps {
  userMeta: any; // deve conter uid
}

const GoalManager: React.FC<GoalManagerProps> = ({ userMeta }) => {
  const userId = userMeta?.uid;
  const { goals, loading, error, addGoal, editGoal, removeGoal } = useGoals(userId);

  // Estado do formulário
  const [formData, setFormData] = useState<Partial<Goal>>({
    nome: '',
    valor: 0,
    frequencia: 'mensal',
    diasPersonalizado: undefined,
    dataInicio: Timestamp.now(),
    ativa: true,
    lembretes: {
      cincoDias: true,
      vespera: true,
      dia: true,
      canal: 'email',
    },
  });
  const [displayValor, setDisplayValor] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formatar valor monetário
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setDisplayValor('');
      setFormData(prev => ({ ...prev, valor: 0 }));
      return;
    }
    const numericValue = parseInt(value, 10) / 100;
    setDisplayValor(numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setFormData(prev => ({ ...prev, valor: numericValue }));
  };

  // Manipular mudanças nos campos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLembreteChange = (field: keyof Goal['lembretes'], checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      lembretes: {
        ...(prev.lembretes || { cincoDias: false, vespera: false, dia: false, canal: 'email' }),
        [field]: checked,
      },
    }));
  };

  const handleCanalChange = (canal: 'email' | 'push' | 'ambos') => {
    setFormData(prev => ({
      ...prev,
      lembretes: {
        ...(prev.lembretes || { cincoDias: false, vespera: false, dia: false, canal: 'email' }),
        canal,
      },
    }));
  };

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      nome: '',
      valor: 0,
      frequencia: 'mensal',
      diasPersonalizado: undefined,
      dataInicio: Timestamp.now(),
      ativa: true,
      lembretes: {
        cincoDias: true,
        vespera: true,
        dia: true,
        canal: 'email',
      },
    });
    setDisplayValor('');
    setEditingId(null);
  };

  // Carregar dados para edição
  const handleEdit = (goal: Goal) => {
    setFormData({
      nome: goal.nome,
      valor: goal.valor,
      frequencia: goal.frequencia,
      diasPersonalizado: goal.diasPersonalizado,
      dataInicio: goal.dataInicio,
      ativa: goal.ativa,
      lembretes: goal.lembretes,
    });
    setDisplayValor(goal.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setEditingId(goal.id || null);
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert('Usuário não autenticado');
      return;
    }
    if (!formData.valor || formData.valor <= 0) {
      alert('Valor do aporte deve ser maior que zero');
      return;
    }
    if (!formData.nome) {
      alert('Dê um nome para sua meta');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        // Editar
        await editGoal(editingId, formData);
      } else {
        // Criar
        await addGoal(formData as any);
      }
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      alert('Erro ao salvar meta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Excluir meta
  const handleDelete = async (goalId: string) => {
    if (!userId) return;
    if (window.confirm('Tem certeza que deseja excluir esta meta?')) {
      try {
        await removeGoal(goalId);
        if (editingId === goalId) resetForm();
      } catch (error) {
        alert('Erro ao excluir meta');
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Cabeçalho */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <TrendingUp size={24} className="text-indigo-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Metas de Aporte
          </h2>
        </div>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl">
          Defina metas de aporte regulares para acelerar sua liberdade financeira. Acompanhe seu progresso e receba lembretes.
        </p>
      </header>

      {/* Formulário */}
      <div className={`bg-slate-900/50 backdrop-blur-md border ${editingId ? 'border-amber-500/50 shadow-amber-500/10' : 'border-slate-800'} rounded-2xl p-6 mb-8 shadow-lg transition-colors duration-300`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editingId ? 'bg-amber-500/20' : 'bg-indigo-500/20'}`}>
              {editingId ? <Pencil size={16} className="text-amber-400" /> : <Plus size={16} className="text-indigo-400" />}
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {editingId ? 'Editando Meta' : 'Nova Meta de Aporte'}
            </h3>
          </div>
          {editingId && (
            <button onClick={resetForm} className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1">
              <X size={14} /> Cancelar
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome da Meta */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Nome da Meta (ex: "Aposentadoria", "Viagem dos Sonhos")
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome || ''}
                onChange={handleChange}
                placeholder="Dê um nome para sua meta"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                required
              />
            </div>

            {/* Valor do Aporte */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Valor do Aporte (R$)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-[14px] text-slate-400 text-sm font-bold">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={displayValor}
                  onChange={handleValorChange}
                  placeholder="0,00"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Frequência */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Frequência
              </label>
              <select
                name="frequencia"
                value={formData.frequencia}
                onChange={handleChange}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors [&>option]:bg-slate-800"
              >
                <option value="semanal">Semanal</option>
                <option value="quinzenal">Quinzenal</option>
                <option value="mensal">Mensal</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </div>

            {/* Dias personalizado (se aplicável) */}
            {formData.frequencia === 'personalizado' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  A cada quantos dias?
                </label>
                <input
                  type="number"
                  name="diasPersonalizado"
                  value={formData.diasPersonalizado || ''}
                  onChange={handleChange}
                  min="1"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  required
                />
              </div>
            )}

            {/* Data de Início */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Data do Primeiro Aporte
              </label>
              <input
                type="date"
                name="dataInicio"
                value={formData.dataInicio ? new Date(formData.dataInicio.seconds * 1000).toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  setFormData(prev => ({ ...prev, dataInicio: Timestamp.fromDate(date) }));
                }}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                required
              />
            </div>

            {/* Ativa */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="ativa"
                  checked={formData.ativa}
                  onChange={(e) => setFormData(prev => ({ ...prev, ativa: e.target.checked }))}
                  className="w-4 h-4 text-indigo-500 bg-slate-800 border-slate-700 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-white">Meta ativa</span>
              </label>
            </div>
          </div>

          {/* Lembretes */}
          <div className="border-t border-slate-800 pt-6">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Bell size={16} className="text-slate-400" /> Lembretes
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.lembretes?.cincoDias || false}
                    onChange={(e) => handleLembreteChange('cincoDias', e.target.checked)}
                    className="w-4 h-4 text-indigo-500 bg-slate-800 border-slate-700 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-white">Lembrar 5 dias antes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.lembretes?.vespera || false}
                    onChange={(e) => handleLembreteChange('vespera', e.target.checked)}
                    className="w-4 h-4 text-indigo-500 bg-slate-800 border-slate-700 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-white">Lembrar na véspera</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.lembretes?.dia || false}
                    onChange={(e) => handleLembreteChange('dia', e.target.checked)}
                    className="w-4 h-4 text-indigo-500 bg-slate-800 border-slate-700 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-white">Lembrar no dia</span>
                </label>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Canal de notificação
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="canal"
                      value="email"
                      checked={formData.lembretes?.canal === 'email'}
                      onChange={() => handleCanalChange('email')}
                      className="w-4 h-4 text-indigo-500 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                    />
                    <Mail size={14} className="text-slate-400" />
                    <span className="text-sm text-white">E-mail</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="canal"
                      value="push"
                      checked={formData.lembretes?.canal === 'push'}
                      onChange={() => handleCanalChange('push')}
                      className="w-4 h-4 text-indigo-500 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                    />
                    <BellRing size={14} className="text-slate-400" />
                    <span className="text-sm text-white">Push</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="canal"
                      value="ambos"
                      checked={formData.lembretes?.canal === 'ambos'}
                      onChange={() => handleCanalChange('ambos')}
                      className="w-4 h-4 text-indigo-500 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-white">Ambos</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Botão de submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-xl font-black text-white transition-all shadow-lg flex items-center gap-2 ${
                editingId 
                  ? 'bg-amber-500 hover:bg-amber-400' 
                  : 'bg-indigo-500 hover:bg-indigo-400'
              } disabled:bg-slate-700 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <>Salvando...</>
              ) : (
                <>
                  {editingId ? <Pencil size={18} /> : <Plus size={18} />}
                  {editingId ? 'Salvar Alterações' : 'Criar Meta'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Metas */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar size={20} className="text-slate-400" /> Suas Metas
          </h3>
          <span className="text-xs font-bold bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
            {goals.length} {goals.length === 1 ? 'meta' : 'metas'}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 animate-pulse">Carregando suas metas...</div>
        ) : goals.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp size={24} className="text-slate-500" />
            </div>
            <p className="text-slate-400 font-medium mb-2">Nenhuma meta definida</p>
            <p className="text-slate-500 text-sm">Crie sua primeira meta de aporte no formulário acima.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => {
              const proximoAporte = calcularProximoAporte({
                dataInicio: goal.dataInicio,
                frequencia: goal.frequencia,
                diasPersonalizado: goal.diasPersonalizado,
              });
              const diasRestantes = diasAteProximoAporte(proximoAporte);

              return (
                <div key={goal.id} className={`bg-slate-800/40 backdrop-blur-md border rounded-xl p-5 hover:border-slate-600 transition-colors group relative overflow-hidden ${
                  goal.ativa ? 'border-slate-700/50' : 'border-slate-700/30 opacity-70'
                }`}>
                  {/* Indicador de status */}
                  <div className={`absolute top-0 left-0 w-full h-1 ${
                    goal.ativa ? 'bg-emerald-500' : 'bg-slate-500'
                  }`} />

                  <div className="flex justify-between items-start mb-4 mt-2">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-white line-clamp-1">{goal.nome || 'Meta sem nome'}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-slate-900/50 text-slate-300 px-2 py-1 rounded-full border border-slate-700">
                          {goal.frequencia === 'semanal' && 'Semanal'}
                          {goal.frequencia === 'quinzenal' && 'Quinzenal'}
                          {goal.frequencia === 'mensal' && 'Mensal'}
                          {goal.frequencia === 'personalizado' && `A cada ${goal.diasPersonalizado} dias`}
                        </span>
                        {!goal.ativa && (
                          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-slate-600">
                            Pausada
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Botões de Ação */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(goal)} 
                        className="text-slate-400 hover:text-amber-400 p-2 rounded-lg bg-slate-900/30 hover:bg-amber-400/10 transition-colors"
                        title="Editar Meta"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => goal.id && handleDelete(goal.id)} 
                        className="text-slate-400 hover:text-red-400 p-2 rounded-lg bg-slate-900/30 hover:bg-red-400/10 transition-colors"
                        title="Excluir Meta"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Valor do aporte</p>
                      <p className="text-2xl font-black text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.valor)}
                      </p>
                    </div>

                    {goal.ativa && proximoAporte && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Próximo aporte</p>
                          <p className="text-sm font-bold text-white">
                            {proximoAporte.toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className={`text-right ${
                          diasRestantes !== null && diasRestantes <= 0 ? 'text-emerald-400' : 
                          diasRestantes !== null && diasRestantes <= 5 ? 'text-amber-400' : 'text-slate-400'
                        }`}>
                          <p className="text-[10px] font-bold uppercase">Faltam</p>
                          <p className="text-lg font-black">
                            {diasRestantes !== null ? (diasRestantes <= 0 ? 'Hoje' : `${diasRestantes} dias`) : '-'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Importar funções utilitárias
import { calcularProximoAporte, diasAteProximoAporte } from '../../../utils/dateHelpers';

export default GoalManager;