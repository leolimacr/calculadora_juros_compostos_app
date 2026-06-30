import React from 'react';
import { Brain, X } from 'lucide-react';

interface Props {
  title: string;
  body: string;
  onStart: () => void;
  onDefer: () => void;
  onDismiss?: () => void;
}

const CalibrationInviteBanner: React.FC<Props> = ({ title, body, onStart, onDefer, onDismiss }) => (
  <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
    <div className="flex items-start gap-4">
      <div className="p-2.5 rounded-xl bg-violet-100 text-violet-700 shrink-0">
        <Brain size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xxs font-black uppercase tracking-ultra-wide text-violet-700 mb-1">Nexus</p>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Dispensar convite"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <h3 className="text-base font-black text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">{body}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onStart}
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xxs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
          >
            Calibrar agora
          </button>
          <button
            type="button"
            onClick={onDefer}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xxs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Depois
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default CalibrationInviteBanner;
