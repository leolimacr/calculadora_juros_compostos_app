import React from 'react';
import { LayoutDashboard, Sparkles, Settings, ChevronRight, X, LogOut, ShieldCheck } from 'lucide-react';
import { auth } from '../firebase';
import { Browser } from '@capacitor/browser';

interface UserPanelProps {
  onClose: () => void;
  onNavigate: (tool: string) => void;
  userDisplayName?: string;
}

const UserPanel: React.FC<UserPanelProps> = ({ onClose, onNavigate, userDisplayName }) => {
  const firstName = userDisplayName?.split(' ')[0].toUpperCase() || 'INVESTIDOR';

  const handleDeepLink = (path: string) => {
    const appScheme = `financasproinvest://${path}`;
    window.location.href = appScheme;
    setTimeout(() => { 
        if (!document.hidden) Browser.open({ url: 'https://play.google.com/store/apps/details?id=com.financasproinvest.app', windowName: '_system' }); 
    }, 1500);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex justify-end font-sans">
      {/* Fundo com desfoque */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Painel Lateral */}
      <div className="relative w-[85%] max-w-[340px] bg-white h-full shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-300 flex flex-col">
        
        {/* Cabeçalho */}
        <div className="p-8 border-b border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-sky-600 uppercase tracking-[0.2em] mb-1">Bem-vindo de volta</p>
              <h2 className="text-slate-900 text-2xl font-black tracking-tight leading-none">
                Seja bem vindo, <span className="text-sky-600">{firstName}</span>!
              </h2>
            </div>
            <button onClick={onClose} className="p-2 bg-surface-secondary rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex-1 p-6 space-y-4">
          
          {/* BOTÃO GERENCIADOR */}
          <button 
            onClick={() => handleDeepLink('manager')}
            className="w-full group relative overflow-hidden rounded-2xl bg-white border border-amber-300 shadow-sm p-5 transition-all active:scale-95"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-lg shadow-amber-900/40">
                <LayoutDashboard size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <span className="block text-[10px] font-black uppercase text-amber-600 tracking-widest">App Nativo</span>
                <span className="block text-[16px] font-bold text-slate-900 uppercase tracking-tight">Gerenciador</span>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-amber-600 transition-colors" />
            </div>
          </button>

          {/* BOTÃO NEXUS IA */}
          <button 
            onClick={() => handleDeepLink('chat')}
            className="w-full group relative overflow-hidden rounded-2xl bg-white border border-sky-300 shadow-sm p-5 transition-all active:scale-95"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 text-white shadow-lg shadow-sky-900/40">
                <Sparkles size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <span className="block text-[10px] font-black uppercase text-sky-600/70 tracking-widest">Inteligência</span>
                <span className="block text-[16px] font-bold text-slate-900 uppercase tracking-tight">Nexus IA</span>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-sky-600 transition-colors" />
            </div>
          </button>

          {/* BOTÃO CONFIGURAÇÕES */}
          <button 
            onClick={() => { onNavigate('settings'); onClose(); }}
            className="w-full group flex items-center gap-4 p-5 rounded-2xl bg-surface-secondary border border-slate-200 hover:bg-slate-100 transition-all active:scale-95"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:text-slate-900 transition-colors">
              <Settings size={20} />
            </div>
            <span className="flex-1 text-left font-bold text-slate-700 uppercase text-sm tracking-wide">Configurações</span>
            <ChevronRight size={16} className="text-slate-400" />
          </button>
        </div>

        {/* RODAPÉ */}
        <div className="p-8 border-t border-slate-200 bg-slate-50">
          <button onClick={() => auth.signOut()} className="w-full flex items-center justify-center gap-2 p-3 text-red-500 font-black text-xs uppercase tracking-[0.2em] border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all">
            <LogOut size={16} /> Sair da Conta
          </button>
          <div className="mt-6 flex justify-center items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <ShieldCheck size={12} /> Ambiente Seguro
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPanel;