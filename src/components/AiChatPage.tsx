import React from 'react';
import AiAdvisor from './AiAdvisor';
import { useAuth } from '../contexts/AuthContext';
import { useFirebase } from '../hooks/useFirebase';
import { Capacitor } from '@capacitor/core';
import { Sparkles, History, ShieldAlert, Activity, Calculator, BrainCircuit } from 'lucide-react';

interface AiChatPageProps {
  onNavigate: (tool: string) => void;
  simulations?: any[]; 
  filteredTransactions: any[]; 
}

const AiChatPage: React.FC<AiChatPageProps> = ({ onNavigate, simulations = [], filteredTransactions = [] }) => {
  const { user } = useAuth();
  const { userMeta } = useFirebase(user?.uid);
  const isNative = Capacitor.isNativePlatform();

  const hasSimulations = simulations.length > 0;

  return (
    <div className={`mt-16 bg-[#020617] flex flex-col items-center justify-center p-0 md:p-4 overflow-hidden font-sans ${isNative ? 'h-[calc(100vh-190px)]' : 'h-[calc(100vh-64px)]'}`}>
      <div className="w-full max-w-7xl h-full flex flex-col md:flex-row gap-4">
        
        <div className="hidden lg:flex flex-col w-64 lg:w-80 p-6 space-y-6 animate-in slide-in-from-left duration-500 overflow-y-auto custom-scrollbar">
            <div>
                <h1 className="text-3xl font-black text-white leading-tight mb-2">Nexus <span className="text-sky-500">AI</span></h1>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Consultor Estratégico</p>
            </div>
            <div className="space-y-4">
                <div className="p-4 bg-sky-500/5 border border-sky-500/10 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 text-sky-400 font-bold text-[10px] uppercase tracking-widest mb-2"><History size={14} /> Histórico</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">Clique na 📁 para ver conversas anteriores.</p>
                </div>
                <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 text-amber-500/80 font-bold text-[10px] uppercase tracking-widest mb-2"><ShieldAlert size={14} /> Aviso</div>
                    <p className="text-slate-400 text-[10px] leading-relaxed italic">Nexus é uma IA. Verifique sempre informações cruciais.</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-widest mb-1"><Activity size={14} className="animate-pulse" /> Nexus Online</div>
                    <div className="space-y-2">
                        <p className="text-slate-300 text-[11px]">Olá, <span className="text-white font-bold">{userMeta?.nickname || 'Investidor'}</span>.</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 bg-black/20 p-2 rounded-lg border border-slate-800"><BrainCircuit size={14} className="text-sky-500" /><span>Memória: <strong>{filteredTransactions.length}</strong> itens.</span></div>
                    </div>
                    {hasSimulations && (
                      <div className="pt-2 border-t border-slate-800">
                        <div className="flex items-center gap-2 text-sky-400 font-bold text-[9px] uppercase tracking-widest mb-2"><Calculator size={12} /> Simulador Ativo</div>
                        <div className="space-y-1">
                          {simulations.map((s, i) => (<div key={i} className="text-[9px] text-slate-500 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/30 truncate">{s.label}</div>))}
                        </div>
                      </div>
                    )}
                </div>
            </div>
            <div className="mt-auto"><button onClick={() => onNavigate('manager')} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">← Painel</button></div>
        </div>

        <div className="flex-grow h-full w-full relative">
            <div className="absolute inset-0 md:relative md:h-full bg-slate-900/50 border-0 md:border md:border-slate-800 md:rounded-3xl overflow-hidden shadow-2xl">
                 <AiAdvisor transactions={filteredTransactions} currentCalcResult={simulations} goals={[]} currentTool="chat_web" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default AiChatPage;