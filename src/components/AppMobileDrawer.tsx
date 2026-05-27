import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Settings,
  X,
  LogOut,
  ChevronRight,
  CreditCard,
  Compass,
} from 'lucide-react';
import { UserMeta } from '../types';
import { useNavigation } from '../hooks/useNavigation';

interface AppMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  userMeta: UserMeta | null | undefined;
  userDisplayName?: string | null;
  onLogout: () => void;
  onOpenCourse: () => void;
}

const AppMobileDrawer: React.FC<AppMobileDrawerProps> = ({
  isOpen,
  onClose,
  isAuthenticated,
  userMeta,
  userDisplayName,
  onLogout,
  onOpenCourse,
}) => {
  const { handleNavigate } = useNavigation();
  if (!isOpen) return null;

  const displayName = isAuthenticated
    ? userMeta?.nickname || userDisplayName || 'Investidor'
    : 'Visitante';

  const go = (tool: string) => {
    onClose();
    if (isAuthenticated) handleNavigate(tool);
    else handleNavigate('login');
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-72 max-w-[85%] h-full bg-[#020617] border-l border-white/5 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500 mb-1">
              Menu Principal
            </span>
            <span className="text-sm font-black text-white truncate max-w-[180px] uppercase tracking-tight">
              {displayName}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 px-4 py-6 flex flex-col gap-4 overflow-y-auto">
          <button
            onClick={() => go('manager')}
            className="w-full group relative p-px rounded-2xl bg-gradient-to-b from-amber-500/40 to-transparent transition-all active:scale-95 shadow-lg shadow-amber-950/20"
          >
            <div className="bg-[#0f172a] rounded-[15px] p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-lg">
                <LayoutDashboard size={20} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left leading-tight">
                <span className="block text-[9px] font-black text-amber-500 uppercase tracking-widest mb-0.5">
                  App Nativo
                </span>
                <span className="block text-[13px] font-bold text-white uppercase tracking-tight">
                  Controla
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-amber-400" />
            </div>
          </button>

          <button
            onClick={() => go('minhas-dividas')}
            className="w-full group relative p-px rounded-2xl bg-gradient-to-b from-rose-500/40 to-transparent transition-all active:scale-95 shadow-lg shadow-rose-950/20"
          >
            <div className="bg-[#0f172a] rounded-[15px] p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-lg">
                <CreditCard size={20} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left leading-tight">
                <span className="block text-[9px] font-black text-rose-400 uppercase tracking-widest mb-0.5">
                  Gestão
                </span>
                <span className="block text-[13px] font-bold text-white uppercase tracking-tight">
                  Minhas Dívidas
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-rose-400" />
            </div>
          </button>

          <button
            onClick={() => go('chat')}
            className="w-full group relative p-px rounded-2xl bg-gradient-to-b from-sky-500/40 to-transparent transition-all active:scale-95 shadow-lg shadow-sky-950/20"
          >
            <div className="bg-[#0f172a] rounded-[15px] p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 text-white shadow-lg">
                <Sparkles size={20} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left leading-tight">
                <span className="block text-[9px] font-black text-sky-500 uppercase tracking-widest mb-0.5">
                  Inteligência
                </span>
                <span className="block text-[13px] font-bold text-white uppercase tracking-tight">
                  Nexus IA
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-sky-400" />
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              if (isAuthenticated) onOpenCourse();
              else handleNavigate('login');
            }}
            className="w-full group relative p-px rounded-2xl bg-gradient-to-b from-emerald-500/40 to-transparent transition-all active:scale-95 shadow-lg shadow-emerald-950/20 mb-4"
          >
            <div className="bg-[#0f172a] rounded-[15px] p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg">
                <Sparkles size={20} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left leading-tight">
                <span className="block text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">
                  Novo Curso
                </span>
                <span className="block text-[13px] font-bold text-white uppercase tracking-tight">
                  Sair das Dívidas
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-emerald-400" />
            </div>
          </button>

          <button
            onClick={() => go('settings')}
            className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all active:scale-95 text-left group"
          >
            <div className="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:text-white transition-colors">
              <Settings size={18} />
            </div>
            <span className="flex-1 text-[13px] font-bold text-slate-300 uppercase tracking-widest">
              Configurações
            </span>
            <ChevronRight size={16} className="text-slate-700" />
          </button>

          <button
            onClick={() => go('test-explorar')}
            className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all active:scale-95 text-left group"
          >
            <div className="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:text-emerald-400 transition-colors">
              <Compass size={18} />
            </div>
            <span className="flex-1 text-[13px] font-bold text-slate-300 uppercase tracking-widest">
              Explorar
            </span>
            <ChevronRight size={16} className="text-slate-700" />
          </button>
        </div>

        {isAuthenticated && (
          <div className="p-6 border-t border-white/5 bg-slate-950/30">
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/20 text-red-500 text-[11px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all"
            >
              <LogOut size={16} /> Sair da Conta
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppMobileDrawer;
