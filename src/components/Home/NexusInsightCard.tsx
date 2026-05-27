import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { NexusEvent } from '../../hooks/useNexusEvents';

interface NexusInsightCardProps {
  event: NexusEvent | null;
  onDismiss: (id: string) => void;
  onNavigate: (route: string) => void;
}

const NexusInsightCard: React.FC<NexusInsightCardProps> = ({
  event,
  onDismiss,
  onNavigate,
}) => {
  if (!event || !event.message) return null;

  return (
    <div className="rounded-[1.75rem] border border-sky-100 bg-sky-50/50 p-5 shadow-sm relative overflow-hidden group animate-in slide-in-from-top duration-500">
      <div className="absolute top-0 right-0 p-2">
        <button
          onClick={() => onDismiss(event.id)}
          className="p-1 text-sky-400 hover:text-sky-600 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      
      <div className="flex items-start gap-3">
        <div className="mt-0.5 bg-sky-500 p-1.5 rounded-lg shadow-sm shadow-sky-200">
          <Sparkles size={14} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-[10px] font-black text-sky-900 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            Insight do Nexus
          </h3>
          <p className="text-xs font-bold text-sky-800 leading-relaxed">
            {event.message.body}
          </p>
          {event.message.ctaLabel && event.deepLink && (
            <button
              onClick={() => onNavigate(event.deepLink!)}
              className="mt-3 text-[10px] font-black text-sky-600 uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              {event.message.ctaLabel} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NexusInsightCard;
