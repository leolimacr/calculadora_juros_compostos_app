import React from 'react';
import AiAdvisor from './AiAdvisor';
import { useAuth } from '../contexts/AuthContext';
import { useFirebase } from '../hooks/useFirebase';
import { Sparkles, History, ShieldAlert, Activity } from 'lucide-react';

const AiChatPage: React.FC<{ onNavigate: (tool: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { lancamentos, userMeta } = useFirebase(user?.uid);

  return (
    <div className="mt-16 h-[calc(100vh-64px)] bg-[#020617] flex flex-col items-center justify-center p-0 md:p-4 overflow-hidden font-sans">
      
      <div className="w-full max-w-7xl h-full flex flex-col md:flex-row gap-4">
        
        {/* Lado Esquerdo: Sidebar Informativo */}
        <div className="hidden md:flex flex-col w-64 lg:w-80 p-6 space-y-6 animate-in slide-in-from-left duration-500 overflow-y-auto custom-scrollbar">
            <div>
                <h1 className="text-3xl font-black text-white leading-tight mb-2">
                  Nexus <span className="text-sky-500">AI</span>
                </h1>
                <p className="text-slate-400 text-xs font-medium">
                  Consultor de Inteligência Financeira
                </p>
            </div>

            <div className="space-y-4">
                {/* 1. Caixa de Histórico */}
                <div className="p-4 bg-sky-500/5 border border-sky-500/10 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 text-sky-400 font-bold text-[10px] uppercase tracking-widest mb-2">
                        <History size={14} /> Histórico de Conversas
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                        Para ver suas conversas anteriores, clique no ícone da **pasta 📁** no topo do chat.
                    </p>
                </div>

                {/* 2. ✅ NOVA CAIXA: AVISO DE SEGURANÇA (Solicitado) */}
                <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 text-amber-500/80 font-bold text-[10px] uppercase tracking-widest mb-2">
                        <ShieldAlert size={14} /> Aviso Importante
                    </div>
                    <p className="text-slate-400 text-[10px] leading-relaxed italic">
                        O Nexus é uma inteligência artificial e pode cometer erros. Verifique informações importantes. Nenhuma fala constitui recomendação direta de investimento.
                    </p>
                </div>

                {/* 3. Caixa de Sistema Ativo */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-widest mb-1">
                        <Activity size={14} className="animate-pulse" /> Sistema Ativo
                    </div>
                    <p className="text-slate-300 text-[11px]">
                        Analisando {lancamentos.length} lançamentos de <span className="text-white font-bold">{userMeta?.nickname || 'sua conta'}</span>.
                    </p>
                </div>
            </div>

            <div className="mt-auto space-y-2">
                <button 
                    onClick={() => onNavigate('manager')}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95"
                >
                    ← Voltar ao Gerenciador
                </button>
                <p className="text-[9px] text-slate-600 text-center uppercase tracking-tighter">
                    Finanças Pro Invest © 2026
                </p>
            </div>
        </div>

        {/* Lado Direito: Chat Principal */}
        <div className="flex-grow h-full w-full relative">
            <div className="absolute inset-0 md:relative md:h-full bg-slate-900/50 border-0 md:border md:border-slate-800 md:rounded-3xl overflow-hidden shadow-2xl">
                 <AiAdvisor 
                    transactions={lancamentos} 
                    currentCalcResult={null} 
                    goals={[]} 
                    currentTool="chat_web"
                  />
            </div>
        </div>

      </div>
    </div>
  );
};

export default AiChatPage;