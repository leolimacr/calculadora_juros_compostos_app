import { useWealthData } from '../../../hooks/useWealthData';
import React from 'react';
import AiAdvisor from './AiAdvisor';
import { useAuth } from '../../../contexts/AuthContext';
import { useFirebase } from '../../../hooks/useFirebase';
import { Capacitor } from '@capacitor/core';
import { History, ShieldAlert, Activity, Calculator, BrainCircuit } from 'lucide-react';

interface AiChatPageProps {
  onNavigate: (tool: string) => void;
  simulations?: any[];
  filteredTransactions: any[];
}

const AiChatPage: React.FC<AiChatPageProps> = ({
  onNavigate,
  simulations = [],
  filteredTransactions = []
}) => {
  const { user } = useAuth();
  const { userMeta } = useFirebase(user?.uid);
  const {
    assets,
    passives,
    goals: wealthGoals
  } = useWealthData();

  const isNative = Capacitor.isNativePlatform();
  const hasSimulations = simulations.length > 0;

  return (
    <div
      className={`mt-16 bg-slate-100 flex flex-col items-center justify-center p-0 md:p-4 overflow-hidden font-sans ${
        isNative ? 'h-[calc(100vh-190px)]' : 'h-[calc(100vh-64px)]'
      }`}
    >
      <div className="w-full max-w-7xl h-full flex flex-col md:flex-row gap-4">
        <div className="hidden lg:flex flex-col w-64 lg:w-80 p-6 space-y-6 animate-in slide-in-from-left duration-500 overflow-y-auto custom-scrollbar">
          <div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight mb-2">
              Nexus <span className="text-sky-600">AI</span>
            </h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
              Consultor Estratégico
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 text-sky-700 font-bold text-[10px] uppercase tracking-widest mb-2">
                <History size={14} /> Histórico
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Clique na 📁 para ver conversas anteriores.
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-[10px] uppercase tracking-widest mb-2">
                <ShieldAlert size={14} /> Aviso
              </div>
              <p className="text-slate-600 text-[10px] leading-relaxed italic">
                Nexus é uma IA. Verifique sempre informações cruciais.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-widest mb-1">
                <Activity size={14} className="animate-pulse" /> Nexus Online
              </div>

              <div className="space-y-2">
                <p className="text-slate-600 text-[11px]">
                  Olá, <span className="text-slate-900 font-bold">{userMeta?.nickname || 'Investidor'}</span>.
                </p>

                <div className="flex items-center gap-2 text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <BrainCircuit size={14} className="text-sky-600" />
                  <span>Memória: <strong>{filteredTransactions.length}</strong> itens.</span>
                </div>
              </div>

              {hasSimulations && (
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-sky-700 font-bold text-[9px] uppercase tracking-widest mb-2">
                    <Calculator size={12} /> Simulador Ativo
                  </div>

                  <div className="space-y-1">
                    {simulations.map((s, i) => (
                      <div
                        key={i}
                        className="text-[9px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-200 truncate"
                      >
                        {s.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto">
            <button
              onClick={() => onNavigate('manager')}
              className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              ← Painel
            </button>
          </div>
        </div>

        <div className="flex-grow h-full w-full relative">
          <div className="absolute inset-0 md:relative md:h-full bg-white border-0 md:border md:border-slate-200 md:rounded-3xl overflow-hidden shadow-xl">
            <AiAdvisor
              transactions={filteredTransactions}
              currentCalcResult={simulations}
              goals={wealthGoals}
              assets={assets}
              passives={passives}
              currentTool="chat_web"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChatPage;
