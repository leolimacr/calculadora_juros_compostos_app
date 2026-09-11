import React from 'react';
import { Crown } from 'lucide-react';

interface JornadaMetricsProps {
  stageName: string;
  effectiveTier: 'free' | 'pro' | 'premium';
  saldoRealTotal: number;
  colchaoTarget: number;
  patrimonioLiquido: number;
  activeDebtsCount: number;
  reserveTarget: number | null | undefined;
  formatCurrency: (val: number) => string;
  onNavigate: (tool: string) => void;
}

const JornadaMetrics: React.FC<JornadaMetricsProps> = ({
  stageName,
  effectiveTier,
  saldoRealTotal,
  colchaoTarget,
  patrimonioLiquido,
  activeDebtsCount,
  reserveTarget,
  formatCurrency,
}) => {
  const hasPremiumAccess = effectiveTier === 'premium';
  const hasProAccess = effectiveTier === 'pro' || effectiveTier === 'premium';

  const reserveDisplay = Math.min(saldoRealTotal, reserveTarget ?? 0);
  const colchaoDisplay = Math.max(0, Math.min(colchaoTarget, saldoRealTotal - (reserveTarget ?? 0)));

  return (
    <section className="relative overflow-hidden rounded-section bg-gradient-to-br from-white to-slate-50 border border-slate-200 border-l-4 border-l-indigo-500 p-5 md:p-6">
      <div className="relative space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700">
            Evolução
          </span>
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${
              hasPremiumAccess
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : hasProAccess
                  ? 'bg-sky-100 text-sky-700 border border-sky-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {hasPremiumAccess ? <Crown size={12} /> : null}
            Plano {effectiveTier === 'premium' ? 'Premium' : effectiveTier === 'pro' ? 'Pro' : 'Free'}
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black uppercase tracking-[0.2em]">
            Estágio: {stageName}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-surface-subtle border border-slate-200 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Reserva de Emergência</p>
            <p className="text-sm font-black text-slate-900">
              {reserveDisplay > 0 ? `Saldo atual ${formatCurrency(reserveDisplay)}` : '—'}
            </p>
            {reserveTarget != null && reserveTarget > 0 && (
              <p className="text-[10px] text-slate-500 mt-1">Meta {formatCurrency(reserveTarget)}</p>
            )}
          </div>
          <div className="rounded-2xl bg-surface-subtle border border-slate-200 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Colchão Emergencial</p>
            <p className="text-sm font-black text-slate-900">
              {colchaoDisplay > 0 ? `Saldo atual ${formatCurrency(colchaoDisplay)}` : '—'}
            </p>
            {colchaoTarget > 0 && (
              <p className="text-[10px] text-slate-500 mt-1">Meta {formatCurrency(colchaoTarget)}</p>
            )}
          </div>
          <div className="rounded-2xl bg-surface-subtle border border-slate-200 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Patrimônio líquido</p>
            <p className="text-sm font-black text-slate-900">
              {patrimonioLiquido !== 0 ? formatCurrency(patrimonioLiquido) : '—'}
            </p>
          </div>
          <div className="rounded-2xl bg-surface-subtle border border-slate-200 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Dívidas ativas</p>
            <p className="text-sm font-black text-slate-900">{activeDebtsCount > 0 ? activeDebtsCount : '—'}</p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default JornadaMetrics;
