import React from 'react';
import { Sparkles, X, ChevronRight } from 'lucide-react';
import { NexusInsight } from '../../services/nexusInsightEngine';
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
    <div className="rounded-[2rem] border border-slate-200 border-l-4 border-l-sky-500 bg-white p-6 shadow-sm relative overflow-hidden group animate-in slide-in-from-top duration-500">
      <div className="absolute top-0 right-0 p-3">
        <button
          onClick={() => onDismiss(event.id)}
          className="p-1.5 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-full transition-all"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="flex items-start gap-4">
        <div className="mt-0.5 bg-sky-500 p-2.5 rounded-2xl shadow-lg shadow-sky-100 text-white">
          <Sparkles size={20} />
        </div>
        <div className="flex-1">
          <h3 className="text-[10px] font-black text-sky-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            Inteligência Nexus
          </h3>
          <p className="text-sm font-bold text-slate-900 leading-relaxed max-w-2xl">
            {event.message.body}
          </p>
          {event.message.ctaLabel && event.deepLink && (
            <button
              onClick={() => onNavigate(event.deepLink!)}
              className="mt-4 text-[10px] font-bold text-sky-700 uppercase tracking-widest hover:underline flex items-center gap-1.5 transition-all"
            >
              {event.message.ctaLabel} <ChevronRight size={14} className="mt-px" />
            </button>
          )}

          {event.action && (
            <NexusActionButton
              insight={event}
              userId={userId}
              userPlan={userPlan}
              onNavigate={onNavigate}
              onActionExecuted={() => console.log(`Ação ${event.action?.type} executada para o insight ${event.id}`)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NexusInsightCard;
