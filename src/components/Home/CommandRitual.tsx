import React, { useEffect, useMemo, useState } from 'react';
import type { StageInfo } from '../../services/sovereignMap';

interface HasTitle {
  message: { title: string; body?: string };
}

interface RitualMetrics {
  freeBalance: number;
  shortfall: number;
  launchCount: number;
  date: number;
}

interface CommandRitualProps {
  stage: StageInfo;
  event: HasTitle | null;
  onNavigate: (route: string) => void;
  freeBalance: number;
  shortfall: number;
  launchCount: number;
}

const STAGE_LABEL: Record<string, string> = {
  'indefinido': 'Indefinido',
  'pressao': 'Pressão',
  'colchao-incompleto': 'Colchão Incompleto',
  'estavel': 'Estável',
  'solido': 'Sólido',
  'expansao': 'Expansão',
};

const COMMAND_ACTIONS: Record<string, { label: string; route: string } | null> = {
  'indefinido': { label: 'Lançar movimentação', route: 'transaction-form' },
  'pressao': { label: 'Revisar fluxo', route: 'manager' },
  'colchao-incompleto': { label: 'Ajustar proteção', route: 'central' },
  'estavel': { label: 'Revisar orçamento', route: 'manager' },
  'solido': { label: 'Alocar capital', route: 'investimentos' },
  'expansao': { label: 'Estruturar alocação', route: 'investimentos' },
};

const RITUAL_KEY = 'fpi-comando-prev-stage';
const METRICS_KEY = 'fpi-comando-prev-metrics';

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

const CommandRitual: React.FC<CommandRitualProps> = ({ stage, event, onNavigate, freeBalance, shortfall, launchCount }) => {
  // Frozen baseline captured synchronously on first render — never changes mid-session
  const [metricsBaseline] = useState<RitualMetrics | null>(() => {
    try {
      const raw = localStorage.getItem(METRICS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.date === 'number') return parsed as RitualMetrics;
      }
    } catch { /* ignore */ }
    return null;
  });

  // Frozen previous stage ID captured synchronously on first render
  const [prevStageId] = useState<string | null>(() => {
    try { return localStorage.getItem(RITUAL_KEY); }
    catch { return null; }
  });

  // Save current snapshot as baseline for the NEXT session — runs once on mount only
  useEffect(() => {
    try {
      localStorage.setItem(RITUAL_KEY, stage.id);
      const data: RitualMetrics = { freeBalance, shortfall, launchCount, date: Date.now() };
      localStorage.setItem(METRICS_KEY, JSON.stringify(data));
    } catch { /* quota */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deltaText = prevStageId && prevStageId !== stage.id
    ? `${STAGE_LABEL[prevStageId] || prevStageId} → ${STAGE_LABEL[stage.id]}`
    : null;

  const attentionLine = useMemo(() => {
    if (event?.message?.title) return event.message.title;
    if (stage.blockers.length > 0) return stage.blockers[0];
    if (stage.id === 'indefinido') return 'Você ainda não registrou movimentações suficientes. Continue para ativar o Mapa de Soberania.';
    return null;
  }, [event, stage.blockers, stage.id]);

  const action = COMMAND_ACTIONS[stage.id];

  const continuityLine = useMemo(() => {
    if (!metricsBaseline) return null;

    const prev = metricsBaseline;
    const msSince = Date.now() - prev.date;
    const daysSince = Math.floor(msSince / (1000 * 60 * 60 * 24));

    if (daysSince === 0 && prev.launchCount === launchCount) return 'Sessão retomada hoje';

    const deltas: string[] = [];
    const freeDelta = freeBalance - prev.freeBalance;
    if (Math.abs(freeDelta) >= 50) {
      deltas.push(`${freeDelta > 0 ? '+' : ''}${fmtCurrency(freeDelta)} na folga`);
    }
    const shortfallDelta = prev.shortfall - shortfall;
    if (shortfallDelta >= 50) {
      deltas.push(`proteção avançou ${fmtCurrency(shortfallDelta)}`);
    }
    const launchDelta = launchCount - prev.launchCount;
    if (launchDelta >= 1) {
      deltas.push(`${launchDelta} ${launchDelta === 1 ? 'novo lançamento' : 'novos lançamentos'}`);
    }

    const prefix = daysSince === 0 ? 'Hoje' : `Desde ${daysSince}d`;
    if (deltas.length > 0) return `${prefix}: ${deltas.join(' · ')}`;
    if (daysSince > 0) return `${prefix}: sem alterações relevantes`;
    return null;
  }, [metricsBaseline, freeBalance, shortfall, launchCount]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">
        SEU COMANDO
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-slate-500 w-14 shrink-0">Posição</span>
          <span className="text-sm font-bold text-slate-900">{stage.name}</span>
          {deltaText && (
            <span className="text-xs text-slate-500 ml-1">{deltaText}</span>
          )}
        </div>

        {continuityLine && (
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-500 w-14 shrink-0">Histórico</span>
            <span className="text-xs text-slate-500">{continuityLine}</span>
          </div>
        )}

        {attentionLine && (
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-500 w-14 shrink-0">Atenção</span>
            <span className="text-sm text-slate-700">{attentionLine}</span>
          </div>
        )}

        <div className="flex items-baseline gap-2">
          <span className="text-xs text-slate-500 w-14 shrink-0">Comando</span>
          <span className="text-sm font-semibold text-slate-800">{stage.nextStep}</span>
        </div>
      </div>

      {action && (
        <button
          type="button"
          onClick={() => onNavigate(action.route)}
          className="mt-4 w-full text-sm font-bold py-2.5 px-4 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default CommandRitual;
