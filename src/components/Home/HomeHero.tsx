import React, { useState } from 'react';
import { ArrowRight, Shield, TrendingUp, AlertTriangle, Smartphone } from 'lucide-react';

interface HomeHeroProps {
  isAuthenticated: boolean;
  onNavigate: (route: string) => void;
  onStartNow: () => void;
  isPrivacyMode: boolean;
  userMeta: any;
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  isAuthenticated,
  onNavigate,
  onStartNow,
  isPrivacyMode,
  userMeta,
}) => {
  // Mini simulador interativo na dobra para engajar o usuário imediatamente
  const [renda, setRenda] = useState<string>('5000');
  const [gastos, setGastos] = useState<string>('3500');
  const [dividas, setDividas] = useState<string>('1000');

  const numRenda = parseFloat(renda) || 0;
  const numGastos = parseFloat(gastos) || 0;
  const numDividas = parseFloat(dividas) || 0;

  // Filosofia do FPI: Saldo Livre Real = Renda - Gastos Essenciais - Provisão de Dívidas
  const saldoLivreReal = numRenda - numGastos - numDividas;
  const isDeficit = saldoLivreReal < 0;

  return (
    <section className="relative px-6 pt-24 pb-16 lg:pt-32 lg:pb-24 w-full z-10 font-sans bg-surface-secondary text-slate-700 overflow-hidden">
      {/* Background visual estilo Cockpit de Alta Performance */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-12 right-12 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center relative z-10">
        
        {/* Coluna Esquerda: A Promessa Soberana */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Organize seu dinheiro do mês
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-[4.5rem] font-extrabold text-slate-950 leading-[1.05] tracking-tight mb-6">
            Saiba quanto <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">sobra de verdade</span> no seu mês
          </h1>

          <p className="text-base md:text-lg text-slate-500 mb-8 leading-relaxed max-w-lg">
            O saldo da conta não é o dinheiro livre. O Finanças Pro Invest mostra o que sobra depois das contas do mês — e você começa <strong>grátis</strong>, registrando sua rotina sem limite.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button 
              onClick={onStartNow}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-[0_4px_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <span>Começar grátis no Controla</span>
              <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => onNavigate('download')}
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold px-6 py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto group"
            >
              <Smartphone size={18} className="text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>Baixar no Celular (APK)</span>
            </button>
          </div>

          <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-10 w-full">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              ✓ Grátis para começar
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              ✓ Lançamentos ilimitados
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              ✓ Planeje meses futuros
            </span>
          </div>
        </div>

        {/* Coluna Direita: O Cockpit Interativo */}
        <div className="w-full max-w-[540px] mx-auto lg:ml-auto">
          <div className="relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Simule seu mês</span>
              <div className="flex gap-1.5">
                <span className="h-1.5 w-1.5 bg-slate-300 rounded-full" />
                <span className="h-1.5 w-1.5 bg-slate-300 rounded-full" />
                <span className="h-1.5 w-1.5 bg-slate-300 rounded-full" />
              </div>
            </div>

            <div className="space-y-4">
              {/* Input 1: Renda */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 font-semibold">Quanto entra por mês (Receitas)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">R$</span>
                  <input
                    type="number"
                    value={renda}
                    onChange={(e) => setRenda(e.target.value)}
                    className="w-full bg-surface-secondary border border-slate-200 focus:border-blue-500/50 rounded-xl py-2.5 pl-9 pr-4 text-sm font-semibold text-slate-900 outline-none transition-colors"
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* Input 2: Custos Fixos */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 font-semibold">Gastos do mês (contas e despesas)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">R$</span>
                  <input
                    type="number"
                    value={gastos}
                    onChange={(e) => setGastos(e.target.value)}
                    className="w-full bg-surface-secondary border border-slate-200 focus:border-blue-500/50 rounded-xl py-2.5 pl-9 pr-4 text-sm font-semibold text-slate-900 outline-none transition-colors"
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* Input 3: Dívidas */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 font-semibold">Compromissos extras do mês</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">R$</span>
                  <input
                    type="number"
                    value={dividas}
                    onChange={(e) => setDividas(e.target.value)}
                    className="w-full bg-surface-secondary border border-slate-200 focus:border-blue-500/50 rounded-xl py-2.5 pl-9 pr-4 text-sm font-semibold text-slate-900 outline-none transition-colors"
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* Resultado: Saldo Livre Real */}
              <div className={`mt-6 p-5 rounded-xl border transition-all ${
                isDeficit 
                  ? 'bg-amber-50 border-amber-200' 
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Estimativa do que sobra
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    isDeficit ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {isDeficit ? 'Déficit' : 'Estável'}
                  </span>
                </div>
                
                <p className={`text-2xl md:text-3xl font-black font-mono tracking-tight my-1 ${
                  isDeficit ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  R$ {saldoLivreReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>

                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {isDeficit 
                    ? "Neste exemplo, as contas do mês consomem mais do que entra. Registrar sua rotina no Controla ajuda a enxergar isso cedo."
                    : "Neste exemplo, sobra dinheiro após as contas. No app, você acompanha isso mês a mês — grátis."}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};