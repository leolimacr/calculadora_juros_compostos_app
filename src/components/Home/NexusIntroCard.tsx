import React, { useEffect, useState } from 'react';
import { Sparkles, X, ChevronRight, Cpu } from 'lucide-react';
import { NEXUS_COPY, getNexusIntroScope } from '../../theme/fpiVoiceGuide';

const DISMISS_KEY = 'fpi-nexus-intro-dismissed';

interface NexusIntroCardProps {
  effectiveTier: 'free' | 'pro' | 'premium';
  onOpenNexus: () => void;
}

const NexusIntroCard: React.FC<NexusIntroCardProps> = ({ effectiveTier, onOpenNexus }) => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === 'true';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch { /* quota */ }
    setDismissed(true);
  };

  const scopeText = getNexusIntroScope(effectiveTier);

  return (
    <div className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-50 via-white to-indigo-50 border border-sky-200/70 p-6 shadow-sm transition-all duration-500">
      <div className="absolute top-0 right-0 w-40 h-40 bg-sky-400/5 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row items-start gap-5">
        <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-md shadow-sky-500/20">
          <Cpu size={28} className="text-white" />
        </div>

        <div className="flex-1 space-y-3 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Sparkles size={14} className="text-sky-600" />
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-sky-700">
                  Novo
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {NEXUS_COPY.introTitle}
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="shrink-0 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              title="Dispensar"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            {NEXUS_COPY.introBody}
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-100/70 border border-sky-200 rounded-xl text-xs text-sky-800 font-semibold">
            <span>{scopeText}</span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={onOpenNexus}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-all active:scale-[0.97] shadow-sm"
            >
              <span>{NEXUS_COPY.introCtaOpen}</span>
              <ChevronRight size={14} />
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors px-2 py-1"
            >
              {NEXUS_COPY.introDismissLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NexusIntroCard;
