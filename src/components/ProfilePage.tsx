import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';
import { Settings, LogOut, Crown, Zap, User } from 'lucide-react';

interface ProfilePageProps {
  onNavigateHome: () => void;
  onNavigate?: (route: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigateHome, onNavigate }) => {
  const { user, logout } = useAuth();
  const { role } = useSubscriptionAccess();

  const planLabel = role === 'premium' ? 'Premium' : role === 'pro' ? 'Pro' : 'Gratuito';
  const planIcon =
    role === 'premium' ? <Crown size={14} className="text-amber-500" /> :
    role === 'pro' ? <Zap size={14} className="text-sky-500" /> : null;
  const planStyle =
    role === 'premium' ? 'bg-amber-50 border-amber-200 text-amber-700' :
    role === 'pro' ? 'bg-sky-50 border-sky-200 text-sky-700' :
    'bg-slate-100 border-slate-200 text-slate-500';

  const initial = user?.displayName?.[0] ?? user?.email?.[0] ?? '?';

  return (
    <div className="w-full max-w-sm mx-auto px-4 pt-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Avatar + info */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-tr from-sky-500 to-emerald-500 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-lg mb-4">
          {initial.toUpperCase()}
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          {user?.displayName || 'Sem nome'}
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">{user?.email}</p>
        <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-widest ${planStyle}`}>
          {planIcon} Plano {planLabel}
        </div>
      </div>

      {/* Ações */}
      <div className="space-y-3">
        {onNavigate && (
          <button
            onClick={() => onNavigate('settings')}
            className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                <Settings size={18} className="text-slate-600" />
              </div>
              <span className="text-sm font-bold text-slate-800">Configurações</span>
            </div>
            <Settings size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
          </button>
        )}

        {role === 'free' && onNavigate && (
          <button
            onClick={() => onNavigate('pricing')}
            className="w-full flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm hover:bg-emerald-100 transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Crown size={18} className="text-emerald-600" />
              </div>
              <div className="text-left">
                <span className="text-sm font-black text-emerald-800 block">Fazer upgrade</span>
                <span className="text-[10px] text-emerald-600 font-medium">Desbloqueie o Nexus completo</span>
              </div>
            </div>
            <Crown size={14} className="text-emerald-400 group-hover:text-emerald-600 transition-colors" />
          </button>
        )}

        <button
          onClick={() => { logout(); onNavigateHome(); }}
          className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-red-200 hover:bg-red-50 transition-all active:scale-[0.98] group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 group-hover:bg-red-100 rounded-xl flex items-center justify-center transition-colors">
              <LogOut size={18} className="text-slate-500 group-hover:text-red-500 transition-colors" />
            </div>
            <span className="text-sm font-bold text-slate-700 group-hover:text-red-600 transition-colors">Sair da conta</span>
          </div>
        </button>

        <button
          onClick={onNavigateHome}
          className="w-full text-center text-slate-400 hover:text-slate-600 py-3 font-medium text-sm transition-colors"
        >
          Voltar
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;