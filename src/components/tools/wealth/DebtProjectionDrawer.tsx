import React, { useState, useMemo } from 'react';
import { X, TrendingDown, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';
import { projectDebt } from '../../../services/debt/debt.projection';
import type { DebtItem } from '../../../services/debt';

interface DebtProjectionDrawerProps {
  debt: DebtItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirmAmortization: (amount: number) => void;
}

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export const DebtProjectionDrawer: React.FC<DebtProjectionDrawerProps> = ({ 
  debt, 
  isOpen, 
  onClose, 
  onConfirmAmortization 
}) => {
  const [extraPayment, setExtraPayment] = useState<number>(0);

  const projection = useMemo(() => projectDebt({
    debt,
    extraPayment,
    scenario: debt.tipo === 'Cartão rotativo' ? 'rotativo' : 'price' // simplificação inicial do MVP
  }), [debt, extraPayment]);

  const baseProjection = useMemo(() => projectDebt({
    debt,
    extraPayment: 0,
    scenario: debt.tipo === 'Cartão rotativo' ? 'rotativo' : 'price'
  }), [debt]);

  if (!isOpen) return null;

  const savedMonths = (baseProjection.rows.length || 0) - (projection.rows.length || 0);
  const savedInterest = (baseProjection.totalInterest || 0) - (projection.totalInterest || 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-slate-950">Projeção: {debt.nome}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
        </div>

        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 mb-6">
          <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest mb-1">Impacto ao acelerar quitação</p>
          <div className="flex gap-4">
            <div>
              <p className="text-2xl font-black text-rose-600">{Math.max(0, savedMonths)}</p>
              <p className="text-[10px] text-rose-800 font-bold uppercase">Meses a menos</p>
            </div>
            <div>
              <p className="text-2xl font-black text-rose-600">{formatCurrency(Math.max(0, savedInterest))}</p>
              <p className="text-[10px] text-rose-800 font-bold uppercase">Economia em juros</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor extra mensal</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">R$</span>
              <input
                type="number"
                value={extraPayment || ''}
                onChange={e => setExtraPayment(Number(e.target.value))}
                className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-500 transition-all text-sm font-black"
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <button
              onClick={() => onConfirmAmortization(extraPayment)}
              className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-rose-500 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck size={16} /> Registrar pagamento extra
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};