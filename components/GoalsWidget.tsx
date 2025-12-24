
import React, { useState } from 'react';
import { Goal } from '../types';
import { formatCurrency, maskCurrency } from '../utils/calculations';

interface GoalsWidgetProps {
  goals: Goal[];
  onAddGoal: (goal: Omit<Goal, 'id'>) => void;
  onUpdateGoal: (id: string, amount: number) => void;
  onDeleteGoal: (id: string) => void;
  isPrivacyMode?: boolean;
}

const GoalsWidget: React.FC<GoalsWidgetProps> = ({ goals, onAddGoal, onUpdateGoal, onDeleteGoal, isPrivacyMode = false }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', targetAmount: 0, currentAmount: 0, icon: '🎯' });

  const handleAdd = () => {
    if (!newGoal.name || newGoal.targetAmount <= 0) return;
    onAddGoal(newGoal);
    setNewGoal({ name: '', targetAmount: 0, currentAmount: 0, icon: '🎯' });
    setIsAdding(false);
  };

  const icons = ['🎯', '✈️', '🚗', '🏠', '💍', '💻', '🎓', '🏥', '🎸'];

  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg space-y-6 relative overflow-hidden">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="text-emerald-500">🏆</span> Metas & Sonhos
        </h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded transition-colors"
        >
          {isAdding ? 'Cancelar' : '+ Nova Meta'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-600 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex gap-2">
             <select 
               className="bg-slate-800 border border-slate-600 rounded-lg px-2"
               value={newGoal.icon}
               onChange={e => setNewGoal({...newGoal, icon: e.target.value})}
             >
               {icons.map(i => <option key={i} value={i}>{i}</option>)}
             </select>
             <input 
               placeholder="Nome da Meta (Ex: Viagem)" 
               className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
               value={newGoal.name}
               onChange={e => setNewGoal({...newGoal, name: e.target.value})}
             />
          </div>
          <div className="flex gap-2">
            <input 
               type="number"
               placeholder="Objetivo (R$)" 
               className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
               value={newGoal.targetAmount || ''}
               onChange={e => setNewGoal({...newGoal, targetAmount: +e.target.value})}
             />
             <input 
               type="number"
               placeholder="Já tenho (R$)" 
               className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
               value={newGoal.currentAmount || ''}
               onChange={e => setNewGoal({...newGoal, currentAmount: +e.target.value})}
             />
          </div>
          <button onClick={handleAdd} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-lg">
            Criar Meta
          </button>
        </div>
      )}

      <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
        {goals.length === 0 && !isAdding && (
          <p className="text-center text-xs text-slate-500 py-4">Nenhuma meta definida ainda.</p>
        )}
        
        {goals.map(goal => {
          const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          return (
            <div key={goal.id} className="group bg-slate-900/30 p-3 rounded-xl border border-slate-700 hover:border-emerald-500/30 transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{goal.icon}</span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-200">{goal.name}</h4>
                    <p className="text-[10px] text-slate-500">
                      {maskCurrency(goal.currentAmount, isPrivacyMode)} de {maskCurrency(goal.targetAmount, isPrivacyMode)}
                    </p>
                  </div>
                </div>
                <button onClick={() => onDeleteGoal(goal.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] font-bold text-emerald-400">{progress.toFixed(0)}%</span>
                <div className="flex gap-1">
                   <button 
                     onClick={() => onUpdateGoal(goal.id, goal.currentAmount + 100)}
                     className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-[10px] rounded text-white"
                   >+R$100</button>
                   <button 
                     onClick={() => onUpdateGoal(goal.id, goal.currentAmount + 1000)}
                     className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-[10px] rounded text-white"
                   >+1k</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GoalsWidget;
