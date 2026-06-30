import React from 'react';
import type { StageInfo } from '../../services/sovereignMap';

interface SovereignMapCardProps {
  stage: StageInfo;
  onNavigate?: (tool: string) => void;
}

const STAGE_COLORS: Record<string, string> = {
  'indefinido': 'bg-slate-50 border-slate-200 text-slate-500',
  'pressao': 'bg-red-50 border-red-200 text-red-700',
  'colchao-incompleto': 'bg-amber-50 border-amber-200 text-amber-700',
  'estavel': 'bg-emerald-50 border-emerald-200 text-emerald-700',
  'solido': 'bg-sky-50 border-sky-200 text-sky-700',
  'expansao': 'bg-indigo-50 border-indigo-200 text-indigo-700',
};

const SovereignMapCard: React.FC<SovereignMapCardProps> = ({ stage, onNavigate }) => {
  const colorClass = STAGE_COLORS[stage.id] || STAGE_COLORS['indefinido'];

  return (
    <div className={`rounded-[2rem] shadow-card border p-5 ${colorClass}`}>
      <div className="mb-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Leitura de Posição
        </h3>
      </div>

      <p className="text-lg font-black tracking-tight mb-2">
        {stage.name}
      </p>

      <p className="text-sm leading-relaxed text-slate-600 mb-3">
        {stage.explanation}
      </p>

      {stage.blockers.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
            Fatores limitantes
          </p>
          <ul className="space-y-1">
            {stage.blockers.map((b, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-current border-opacity-20 pt-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
          Próximo passo
        </p>
        <p className="text-sm font-semibold">
          {stage.nextStep}
        </p>
      </div>

      {onNavigate && stage.numericStage >= 4 && (
        <button
          type="button"
          onClick={() => onNavigate('investimentos')}
          className="mt-4 w-full text-sm font-bold py-2.5 px-4 rounded-xl bg-white/60 hover:bg-white/90 transition-colors"
        >
          Explorar alocação
        </button>
      )}
    </div>
  );
};

export default SovereignMapCard;
