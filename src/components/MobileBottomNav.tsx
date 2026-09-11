import React from 'react';
import { Plus, House, Compass, Menu, CalendarDays } from 'lucide-react';
import { useNavigation } from '../hooks/useNavigation';
import type { Transaction } from '../types';

interface MobileBottomNavProps {
  onOpenMore: () => void;
  onAdd: (initialData?: Partial<Transaction>) => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenMore,
  onAdd,
}) => {
  const { currentTool, handleNavigate } = useNavigation();

  const centralSubTools = new Set([
    'chat',
    'minhas-dividas',
    'passivos',
    'investimentos',
    'metas',
  ]);

  const isCentralActive = currentTool === 'central' || currentTool === 'home' || centralSubTools.has(currentTool);
  const isControlaActive = currentTool === 'manager';
  const isAgendaActive = currentTool === 'agenda';
  const isExplorarActive = currentTool.startsWith('tool-') || currentTool === 'explorar';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[90] md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-10px_30px_rgba(15,23,42,0.08)]">
      <div className="mx-auto max-w-lg px-6 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        <div className="flex items-end justify-between">
          <button
            onClick={() => handleNavigate('central')}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-1.5 py-2 transition-all active:scale-95 group ${
              isCentralActive ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${isCentralActive ? 'bg-emerald-400/10' : ''}`}>
              <House size={24} strokeWidth={isCentralActive ? 2.5 : 2} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">
              Central
            </span>
          </button>

          <button
            onClick={() => handleNavigate('manager')}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-1.5 py-2 transition-all active:scale-95 group ${
              isControlaActive ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${isControlaActive ? 'bg-emerald-400/10' : ''}`}>
              <img
                src="/assets/images/brand/icone_controla210726.png"
                alt=""
                className="w-11 h-11 rounded-xl object-cover block"
              />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">
              Controla
            </span>
          </button>

          <div className="relative -top-5 mx-2">
            <button
              onClick={() => onAdd()}
              className="flex flex-col items-center justify-center gap-1 transition-transform active:scale-90 group/launch"
              title="Novo Lançamento"
            >
              <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 border-[4px] border-white ring-1 ring-slate-200 relative overflow-hidden">
                <Plus size={28} strokeWidth={3} className="relative z-10" />
                <img 
                  src="/assets/images/brand/icone_controla210726.png" 
                  alt="" 
                  className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover/launch:scale-110 transition-transform duration-500" 
                />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-1">
                Lançar
              </span>
            </button>
          </div>

          <button
            onClick={() => handleNavigate('agenda')}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-1.5 py-2 transition-all active:scale-95 group ${
              isAgendaActive ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${isAgendaActive ? 'bg-emerald-400/10' : ''}`}>
              <CalendarDays size={24} strokeWidth={isAgendaActive ? 2.5 : 2} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">
              Agenda
            </span>
          </button>

          <button
            onClick={() => handleNavigate('explorar')}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-1.5 py-2 transition-all active:scale-95 ${
              isExplorarActive ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${isExplorarActive ? 'bg-emerald-400/10' : ''}`}>
              <Compass size={24} strokeWidth={isExplorarActive ? 2.5 : 2} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                Explorar
              </span>
            </button>

          <button
            onClick={onOpenMore}
            className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1.5 py-2 transition-all active:scale-95 group text-slate-500 hover:text-slate-700"
          >
            <div className="p-1 rounded-lg transition-all">
              <Menu size={24} strokeWidth={2} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">
              Mais
            </span>
          </button>
          </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;
