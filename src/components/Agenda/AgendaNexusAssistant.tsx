import React, { FormEvent, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Info,
  MapPin,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  useAgendaNexus,
  type AgendaNexusProposal,
} from '../../hooks/useAgendaNexus';

interface AgendaNexusAssistantProps {
  className?: string;
  onCommitted?: () => void;
  onUndone?: () => void;
  onClose?: () => void;
  autoFocusCommand?: boolean;
}

function displayValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function formatDate(value?: string): string | null {
  if (!value) return null;
  const parts = value.split('-');
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatRecurrence(proposal: AgendaNexusProposal): string | null {
  const recurrence = proposal.recurrence;
  if (!recurrence || typeof recurrence !== 'object') return null;
  const freq = typeof recurrence.freq === 'string' ? recurrence.freq : null;
  if (!freq) return null;
  const labels: Record<string, string> = {
    daily: 'Todos os dias',
    weekly: 'Toda semana',
    monthly: 'Todo mês',
  };
  return labels[freq] ?? freq;
}

function formatWarning(warning: unknown): string {
  if (typeof warning === 'string') return warning;
  if (warning && typeof warning === 'object') {
    const item = warning as { message?: unknown; type?: unknown };
    return String(item.message ?? item.type ?? 'Alerta na agenda');
  }
  return 'Alerta na agenda';
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
      <span className="mt-0.5 shrink-0 text-sky-600">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        <p className="break-words text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function ListNotice({ title, items, tone = 'slate' }: { title: string; items: string[]; tone?: 'slate' | 'amber' | 'rose' }) {
  if (items.length === 0) return null;
  const colors = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    rose: 'border-rose-200 bg-rose-50 text-rose-800',
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[tone]}`}>
      <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
        <Info size={13} aria-hidden="true" />
        {title}
      </p>
      <ul className="space-y-1 text-xs leading-relaxed">
        {items.map((item, index) => <li key={`${item}-${index}`}>• {item}</li>)}
      </ul>
    </div>
  );
}

export default function AgendaNexusAssistant({ className = '', onCommitted, onUndone, onClose, autoFocusCommand = false }: AgendaNexusAssistantProps) {
  const nexus = useAgendaNexus();
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmingRef = useRef(false);
  const previousStageRef = useRef(nexus.stage);

  useEffect(() => {
    if (previousStageRef.current !== 'success' && nexus.stage === 'success') onCommitted?.();
    if (previousStageRef.current !== 'undone' && nexus.stage === 'undone') onUndone?.();
    previousStageRef.current = nexus.stage;
  }, [nexus.stage, onCommitted, onUndone]);

  useEffect(() => {
    if (nexus.stage === 'clarify' || nexus.stage === 'cancelled') inputRef.current?.focus();
  }, [nexus.stage]);

  useEffect(() => {
    if (autoFocusCommand) inputRef.current?.focus();
  }, [autoFocusCommand]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const command = input.trim();
    if (!command || nexus.isLoading) return;
    await nexus.interpret({ prompt: command });
  };

  const handleCorrect = () => {
    confirmingRef.current = false;
    nexus.cancel();
    inputRef.current?.focus();
  };

  const handleConfirm = async () => {
    if (confirmingRef.current || !canConfirm) return;
    confirmingRef.current = true;
    try {
      await nexus.commit();
    } finally {
      confirmingRef.current = false;
    }
  };

  const proposal = nexus.proposal;
  const warnings = Array.isArray(proposal?.warnings)
    ? proposal.warnings.map(formatWarning)
    : [];
  const missing = nexus.missing;
  const ambiguous = nexus.ambiguous;
  const assumptions = nexus.assumptions.map((assumption) => String(assumption.note ?? assumption.field ?? 'Suposição aplicada'));
  const canConfirm = nexus.stage === 'done'
    && Boolean(proposal)
    && proposal?.intent === 'create'
    && proposal?.action === 'create_commitment'
    && !nexus.isLoading;
  const showProposal = Boolean(proposal) && ['done', 'committing', 'success', 'partial', 'error', 'undone'].includes(nexus.stage);
  const startDate = formatDate(proposal?.firstDate);
  const endDate = formatDate(proposal?.lastDate);
  const title = displayValue(proposal?.title);
  const startTime = displayValue(proposal?.startTime);
  const endTime = displayValue(proposal?.endTime);
  const recurrence = proposal ? formatRecurrence(proposal) : null;
  const location = displayValue(proposal?.location);
  const notes = displayValue(proposal?.notes);
  const participants = Array.isArray(proposal?.participants) ? proposal.participants.join(', ') : null;

  return (
    <section className={`w-full overflow-hidden rounded-3xl border border-sky-200 bg-white shadow-sm ${className}`} aria-labelledby="agenda-nexus-title">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-sky-50/70 p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-sky-200 bg-white p-2.5 text-sky-700 shadow-sm">
            <Sparkles size={19} aria-hidden="true" />
          </div>
          <div>
            <h2 id="agenda-nexus-title" className="text-sm font-black uppercase tracking-widest text-slate-900">Nexus na Agenda</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">Descreva o compromisso. Eu organizo os dados antes de qualquer alteração.</p>
          </div>
        </div>
         {(onClose || (nexus.stage !== 'idle' && nexus.stage !== 'cancelled')) && (
           <button type="button" onClick={() => { nexus.reset(); onClose?.(); }} className="rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-slate-900" aria-label="Fechar Nexus na Agenda">
            <X size={17} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="space-y-4 p-5 md:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="agenda-nexus-command" className="sr-only">Comando para o Nexus</label>
          <input
            ref={inputRef}
            id="agenda-nexus-command"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={nexus.isLoading}
            placeholder="Ex.: reunião toda terça, às 17h, até novembro"
            className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={!input.trim() || nexus.isLoading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 text-xs font-black uppercase tracking-widest text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={15} aria-hidden="true" />
            Enviar
          </button>
        </form>

        {nexus.isLoading && (
          <div className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs font-bold text-sky-800" role="status" aria-live="polite">
            <span className="flex gap-1" aria-hidden="true">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-500" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-500 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-500 [animation-delay:300ms]" />
            </span>
            {nexus.progressMessage ?? 'Nexus analisando…'}
          </div>
        )}

        {nexus.stage === 'cancelled' && <p className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600" role="status">Operação cancelada. Você pode escrever uma nova solicitação.</p>}

        {nexus.stage === 'clarify' && (
          <div className="space-y-3" role="status" aria-live="polite">
            <ListNotice title="Faltam informações" items={missing} />
            <ListNotice title="Preciso esclarecer" items={ambiguous} tone="amber" />
          </div>
        )}

        {showProposal && proposal && (
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5" aria-label="Proposta do Nexus">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CalendarDays size={17} className="text-sky-600" aria-hidden="true" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Revise antes de confirmar</h3>
            </div>
            {proposal.summary && <p className="rounded-2xl bg-sky-50 p-4 text-sm font-semibold leading-relaxed text-sky-900">{proposal.summary}</p>}
            <div className="grid gap-2 sm:grid-cols-2">
              {title && <SummaryRow icon={<MessageCircle size={15} />} label="Compromisso" value={title} />}
              {startDate && <SummaryRow icon={<CalendarDays size={15} />} label="Data inicial" value={startDate} />}
              {endDate && endDate !== startDate && <SummaryRow icon={<CalendarDays size={15} />} label="Data final" value={endDate} />}
              {startTime && <SummaryRow icon={<Clock3 size={15} />} label={endTime ? 'Horário' : 'Início'} value={endTime ? `${startTime} às ${endTime}` : startTime} />}
              {recurrence && <SummaryRow icon={<RotateCcw size={15} />} label="Recorrência" value={recurrence} />}
              {typeof proposal.occurrenceCount === 'number' && <SummaryRow icon={<CalendarDays size={15} />} label="Ocorrências" value={String(proposal.occurrenceCount)} />}
              {location && <SummaryRow icon={<MapPin size={15} />} label="Local" value={location} />}
              {participants && <SummaryRow icon={<Users size={15} />} label="Participantes" value={participants} />}
              {notes && <SummaryRow icon={<Info size={15} />} label="Observações" value={notes} />}
            </div>
            <ListNotice title="Suposições" items={assumptions} />
            <ListNotice title="Conflitos ou duplicidades encontrados" items={warnings} tone="amber" />
            <ListNotice title="Dados pendentes" items={missing} tone="amber" />
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
               <button type="button" onClick={() => { nexus.cancel(); onClose?.(); }} disabled={nexus.isLoading} className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">Cancelar</button>
              <button type="button" onClick={handleCorrect} disabled={nexus.isLoading} className="rounded-xl border border-sky-200 px-4 py-3 text-xs font-black uppercase tracking-widest text-sky-700 transition hover:bg-sky-50 disabled:opacity-50">Corrigir</button>
              {canConfirm && <button type="button" onClick={() => void handleConfirm()} disabled={!canConfirm || confirmingRef.current} className="rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Confirmar criação</button>}
            </div>
          </div>
        )}

        {nexus.stage === 'committing' && <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-800" role="status" aria-live="polite">Confirmando a criação na Agenda…</p>}
        {nexus.stage === 'success' && <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status"><CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" /><div><p className="font-black">Compromisso criado com sucesso.</p><p className="mt-1 text-xs">A criação foi registrada na sua Agenda.</p>{nexus.canUndo && <button type="button" onClick={() => void nexus.undo()} className="mt-3 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-black uppercase tracking-widest text-emerald-800 hover:bg-emerald-100">Desfazer</button>}</div></div>}
        {nexus.stage === 'undone' && <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700" role="status">A criação foi desfeita.</p>}
        {nexus.stage === 'partial' && <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert"><AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" /><div><p className="font-black">Operação parcialmente concluída.</p><p className="mt-1 text-xs">Alguns compromissos podem ter sido criados. É necessária reconciliação antes de tentar novamente.</p>{nexus.error && <p className="mt-2 text-xs">{nexus.error}</p>}</div></div>}
        {nexus.stage === 'error' && nexus.error && <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800" role="alert">{nexus.error}</p>}
      </div>
    </section>
  );
}
