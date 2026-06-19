import React from 'react';
import { TrendingUp, Calculator, BarChart3, BookOpen, ArrowRight } from 'lucide-react';

interface ExplorarDiscoveryStripProps {
  onNavigate: (tool: string) => void;
}

const ExplorarDiscoveryStrip: React.FC<ExplorarDiscoveryStripProps> = ({ onNavigate }) => {
  const items = [
    { id: 'tool-juros', label: 'Juros', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
    { id: 'tool-dividas', label: 'Dívidas', icon: Calculator, color: 'text-rose-600', bg: 'bg-rose-50/50' },
    { id: 'explorar', label: 'Mercado', icon: BarChart3, color: 'text-sky-600', bg: 'bg-sky-50/50' },
    { id: 'explorar', label: 'Cursos', icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50/50' },
  ];

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between px-2">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Explorar e Simular</h4>
      </div>
      
      <div className="flex items-center gap-5 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => onNavigate(item.id)}
            className="flex flex-col items-center gap-2.5 shrink-0 group active:scale-95 transition-all"
          >
            <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center border border-slate-100 group-hover:border-current/20 transition-all shadow-sm`}>
              <item.icon size={22} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight group-hover:text-slate-900 transition-colors">{item.label}</span>
          </button>
        ))}

        <button
          onClick={() => onNavigate('explorar')}
          className="flex flex-col items-center gap-2.5 shrink-0 group active:scale-95 transition-all"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200 group-hover:bg-slate-100 group-hover:text-slate-600 transition-all shadow-sm">
            <ArrowRight size={22} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight group-hover:text-slate-900 transition-colors whitespace-nowrap">Ver tudo</span>
        </button>
      </div>
    </div>
  );
};

export default ExplorarDiscoveryStrip;
