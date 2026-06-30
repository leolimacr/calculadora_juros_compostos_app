import React from 'react';
import { Sparkles, X, ChevronRight } from 'lucide-react';
import type { NexusInsight } from '../../services/nexusInsightEngine';
import NexusActionButton from './NexusActionButton';

interface NexusInsightCardProps {
  event: NexusInsight | null;
  userId: string;
  userPlan: 'free' | 'pro' | 'premium';
  onDismiss: (id: string) => void;
  onNavigate: (route: string) => void;
}

const NexusInsightCard: React.FC<NexusInsightCardProps> = ({
  event,
  userId,
  userPlan,
  onDismiss,
  onNavigate,
}) => {
  if (!event || !event.message) return null;

  return (
    <div className="group relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-200 p-8 shadow-card hover:shadow-floating transition-all duration-500 font-sans">
      {/* Background Decorativo Metálico */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="absolute top-0 right-0 p-4">
        <button
          onClick={() => onDismiss(event.id)}
          className="p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
        >
          <X size={18} />
        </button>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
        {/* Avatar do Nexus com Imagem Lifestyle - Mais proeminente */}
        <div className="shrink-0 relative">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] overflow-hidden border-2 border-emerald-500/30 shadow-floating group-hover:scale-105 transition-transform duration-500">
            <img 
              src="/assets/images/lifestyle/nexus-core.webp" 
              alt="Nexus Core" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
            <Sparkles size={14} className="text-white fill-white animate-pulse" />
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">Nexus • Consultor Inteligente</span>
              <div className="h-px w-12 bg-emerald-100" />
            </div>
            <h3 className="text-2xl font-black text-slate-950 tracking-tight leading-tight drop-shadow-sm">
              Análise de Trajetória
            </h3>
          </div>
          
          <p className="text-base text-slate-500 font-medium leading-relaxed max-w-2xl">
            {event.message.body}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            {event.message.ctaLabel && event.deepLink && (
              <button
                onClick={() => onNavigate(event.deepLink!)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-950 text-white text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-floating active:scale-95 group/btn"
              >
                <span>{event.message.ctaLabel}</span>
                <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            )}

            {event.action && (
              <NexusActionButton
                insight={event}
                userId={userId}
                userPlan={userPlan}
                onNavigate={onNavigate}
                onActionExecuted={() => {}}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NexusInsightCard;
