
import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency, maskCurrency } from '../utils/calculations';

interface GameState {
  month: number;
  balance: number;
  investments: number;
  happiness: number;
  logs: LogEntry[];
  gameOver: boolean;
  victory: boolean;
}

interface LogEntry {
  month: number;
  message: string;
  type: 'info' | 'success' | 'danger' | 'warning';
}

interface MiniGameProps {
  isPrivacyMode?: boolean;
}

const EVENTS = [
  { text: "O carro quebrou! Mecânico caro.", cost: 800, happy: -15, type: 'danger', icon: '🚗' },
  { text: "Canal no dente de emergência.", cost: 600, happy: -10, type: 'danger', icon: '🦷' },
  { text: "Aniversário de amigo, gastou no bar.", cost: 300, happy: 15, type: 'warning', icon: '🎉' },
  { text: "Crise global! Ações caíram 15%.", cost: 0, happy: -20, investmentMult: 0.85, type: 'danger', icon: '📉' },
  { text: "Bull Market! Ações subiram 15%!", cost: 0, happy: 10, investmentMult: 1.15, type: 'success', icon: '🚀' },
  { text: "Promoção de pizza da semana.", cost: 80, happy: 5, type: 'warning', icon: '🍕' },
  { text: "Achou dinheiro no bolso da calça antiga.", cost: -100, happy: 5, type: 'success', icon: '🍀' },
];

const MiniGame: React.FC<MiniGameProps> = ({ isPrivacyMode = false }) => {
  const [game, setGame] = useState<GameState>({
    month: 1,
    balance: 2000,
    investments: 0,
    happiness: 60,
    logs: [{ month: 1, message: "Bem-vindo ao Simulador! Seu objetivo é sobreviver 12 meses sem falir e mantendo a sanidade.", type: 'info' }],
    gameOver: false,
    victory: false
  });

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [game.logs]);

  const nextTurn = (action: 'invest' | 'spend' | 'save') => {
    if (game.gameOver) return;

    let newBalance = game.balance;
    let newInvestments = game.investments;
    let newHappiness = game.happiness;
    let turnLog: LogEntry[] = [];

    // Salário mensal
    newBalance += 3500; 

    // Ação do jogador
    if (action === 'invest') {
      const amount = 1500;
      if (newBalance >= amount) {
        newBalance -= amount;
        newInvestments += amount;
        turnLog.push({ month: game.month, message: `Você investiu ${formatCurrency(amount)}.`, type: 'success' });
      } else {
        turnLog.push({ month: game.month, message: "Tentou investir mas não tinha saldo suficiente!", type: 'warning' });
      }
    } else if (action === 'spend') {
      newBalance -= 800;
      newHappiness += 15;
      turnLog.push({ month: game.month, message: "Você gastou R$ 800 em experiências e lazer.", type: 'warning' });
    } else {
      turnLog.push({ month: game.month, message: "Você decidiu apenas guardar dinheiro na conta.", type: 'info' });
    }

    // Custo de vida fixo
    newBalance -= 1500; // Aluguel, comida basica, etc

    // Evento aleatório (50% de chance)
    if (Math.random() > 0.3) {
      const evt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      if (evt.cost > 0) newBalance -= evt.cost;
      if (evt.cost < 0) newBalance -= evt.cost; // Ganho de dinheiro (custo negativo)
      newHappiness += evt.happy;
      if (evt.investmentMult) newInvestments *= evt.investmentMult;
      
      turnLog.push({ month: game.month, message: `Evento: ${evt.icon} ${evt.text}`, type: evt.type as any });
    }

    // Degradação natural da felicidade se só trabalhar
    if (action !== 'spend') newHappiness -= 5;

    // Juros sobre investimentos (1% a.m.)
    const returns = newInvestments * 0.01;
    newInvestments += returns;

    // Limites
    newHappiness = Math.min(100, Math.max(0, newHappiness));

    // Checagem Fim de Jogo
    if (newBalance < 0) {
      setGame({ 
        ...game, 
        logs: [...game.logs, ...turnLog, { month: game.month, message: "GAME OVER: Você ficou endividado e o banco tomou seus bens!", type: 'danger' }], 
        gameOver: true, 
        victory: false,
        balance: newBalance,
        investments: newInvestments,
        happiness: newHappiness
      });
      return;
    }

    if (newHappiness <= 0) {
        setGame({ 
          ...game, 
          logs: [...game.logs, ...turnLog, { month: game.month, message: "GAME OVER: Burnout! Você entrou em depressão profunda.", type: 'danger' }], 
          gameOver: true, 
          victory: false,
          balance: newBalance,
          investments: newInvestments,
          happiness: newHappiness
        });
        return;
      }

    if (game.month === 12) {
      setGame({ 
        ...game, 
        logs: [...game.logs, ...turnLog, { month: 12, message: "VITÓRIA! Você sobreviveu ao ano financeiro!", type: 'success' }], 
        gameOver: true, 
        victory: true,
        month: 12, 
        balance: newBalance, 
        investments: newInvestments, 
        happiness: newHappiness 
      });
      return;
    }

    setGame({
      month: game.month + 1,
      balance: newBalance,
      investments: newInvestments,
      happiness: newHappiness,
      logs: [...game.logs, ...turnLog],
      gameOver: false,
      victory: false
    });
  };

  const reset = () => {
    setGame({
      month: 1,
      balance: 2000,
      investments: 0,
      happiness: 60,
      logs: [{ month: 1, message: "Nova simulação iniciada. Boa sorte!", type: 'info' }],
      gameOver: false,
      victory: false
    });
  };

  const getHappinessColor = (val: number) => {
      if (val > 70) return 'bg-emerald-500';
      if (val > 30) return 'bg-yellow-500';
      return 'bg-red-500';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-10 text-4xl">📅</div>
           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tempo</span>
           <div>
             <span className="text-3xl font-black text-white">{game.month}</span>
             <span className="text-sm text-slate-500 font-medium">/ 12 Meses</span>
           </div>
           <div className="w-full bg-slate-700 h-1.5 mt-3 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${(game.month / 12) * 100}%` }}></div>
           </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-10 text-4xl">💰</div>
           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Caixa Disponível</span>
           <span className={`text-2xl font-black tracking-tight ${game.balance < 0 ? 'text-red-500' : 'text-emerald-400'}`}>
             {maskCurrency(game.balance, isPrivacyMode)}
           </span>
           <span className="text-[10px] text-slate-500 mt-1">Liquidez Imediata</span>
        </div>

        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-10 text-4xl">📈</div>
           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Patrimônio Investido</span>
           <span className="text-2xl font-black text-indigo-400 tracking-tight">
             {maskCurrency(game.investments, isPrivacyMode)}
           </span>
           <span className="text-[10px] text-slate-500 mt-1">Rendendo juros compostos</span>
        </div>

        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-10 text-4xl">❤️</div>
           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Bem-estar Mental</span>
           <div className="flex items-end gap-2">
             <span className="text-2xl font-black text-white">{game.happiness.toFixed(0)}%</span>
           </div>
           <div className="w-full bg-slate-700 h-2 mt-3 rounded-full overflow-hidden">
              <div className={`${getHappinessColor(game.happiness)} h-full transition-all duration-500`} style={{ width: `${game.happiness}%` }}></div>
           </div>
           {game.happiness < 30 && <span className="text-[10px] text-red-400 font-bold mt-1 animate-pulse">Cuidado! Risco de Burnout.</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Interface */}
        <div className="lg:col-span-2 bg-slate-800 rounded-3xl border border-slate-700 shadow-xl overflow-hidden flex flex-col h-[500px]">
          <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Diário de Bordo
            </h3>
            <span className="text-xs text-slate-500 uppercase font-bold">Simulação em Tempo Real</span>
          </div>
          
          <div className="flex-grow p-6 overflow-y-auto custom-scrollbar space-y-3 bg-[#020617]/30">
            {game.logs.map((log, i) => (
              <div key={i} className={`p-3 rounded-xl border text-sm animate-in slide-in-from-left-2 duration-300 ${
                log.type === 'success' ? 'bg-emerald-900/10 border-emerald-500/20 text-emerald-300' :
                log.type === 'danger' ? 'bg-red-900/10 border-red-500/20 text-red-300' :
                log.type === 'warning' ? 'bg-orange-900/10 border-orange-500/20 text-orange-300' :
                'bg-slate-800 border-slate-700 text-slate-300'
              }`}>
                <span className="text-xs font-bold opacity-50 mr-2 uppercase">Mês {log.month}</span>
                {log.message}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>

          <div className="p-6 bg-slate-900 border-t border-slate-700">
            {!game.gameOver ? (
              <div className="grid grid-cols-3 gap-4">
                <button 
                  onClick={() => nextTurn('invest')} 
                  className="group relative overflow-hidden bg-indigo-600 hover:bg-indigo-500 p-4 rounded-xl text-left transition-all hover:scale-[1.02] shadow-lg shadow-indigo-900/20"
                >
                  <div className="relative z-10">
                    <span className="block text-2xl mb-1">📈</span>
                    <span className="block font-bold text-white text-sm">Investir</span>
                    <span className="block text-[10px] text-indigo-200">-R$ 1.500</span>
                  </div>
                  <div className="absolute right-0 bottom-0 opacity-10 text-6xl transform translate-y-2 translate-x-2">💼</div>
                </button>

                <button 
                  onClick={() => nextTurn('save')} 
                  className="group relative overflow-hidden bg-slate-700 hover:bg-slate-600 p-4 rounded-xl text-left transition-all hover:scale-[1.02] border border-slate-600"
                >
                  <div className="relative z-10">
                    <span className="block text-2xl mb-1">🛡️</span>
                    <span className="block font-bold text-white text-sm">Poupar</span>
                    <span className="block text-[10px] text-slate-300">Guardar no Banco</span>
                  </div>
                  <div className="absolute right-0 bottom-0 opacity-10 text-6xl transform translate-y-2 translate-x-2">🏦</div>
                </button>

                <button 
                  onClick={() => nextTurn('spend')} 
                  className="group relative overflow-hidden bg-orange-600 hover:bg-orange-500 p-4 rounded-xl text-left transition-all hover:scale-[1.02] shadow-lg shadow-orange-900/20"
                >
                  <div className="relative z-10">
                    <span className="block text-2xl mb-1">🎉</span>
                    <span className="block font-bold text-white text-sm">Viver</span>
                    <span className="block text-[10px] text-orange-200">+Felicidade / -R$ 800</span>
                  </div>
                  <div className="absolute right-0 bottom-0 opacity-10 text-6xl transform translate-y-2 translate-x-2">🍹</div>
                </button>
              </div>
            ) : (
              <button onClick={reset} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/40 transition-all transform hover:scale-[1.01] uppercase tracking-widest text-sm">
                🔄 Reiniciar Simulação
              </button>
            )}
          </div>
        </div>

        {/* Side Panel: Objectives */}
        <div className="space-y-6">
           <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-3xl border border-slate-700 shadow-xl">
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-xl">🎯</span> Objetivos
              </h4>
              <ul className="space-y-4">
                <li className={`flex items-center gap-3 p-3 rounded-xl border ${game.balance >= 0 ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-red-900/10 border-red-500/30'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${game.balance >= 0 ? 'bg-emerald-500 text-slate-900' : 'bg-red-500 text-white'}`}>
                    {game.balance >= 0 ? '✓' : '!'}
                  </div>
                  <span className="text-sm text-slate-300">Não ficar no vermelho</span>
                </li>
                <li className={`flex items-center gap-3 p-3 rounded-xl border ${game.happiness > 0 ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-red-900/10 border-red-500/30'}`}>
                   <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${game.happiness > 0 ? 'bg-emerald-500 text-slate-900' : 'bg-red-500 text-white'}`}>
                    {game.happiness > 0 ? '✓' : '!'}
                  </div>
                  <span className="text-sm text-slate-300">Manter a sanidade</span>
                </li>
                 <li className={`flex items-center gap-3 p-3 rounded-xl border ${game.month === 12 ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-slate-800 border-slate-600'}`}>
                   <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${game.month === 12 ? 'bg-emerald-500 text-slate-900' : 'bg-slate-600 text-slate-400'}`}>
                    {game.month === 12 ? '✓' : '3'}
                  </div>
                  <span className="text-sm text-slate-300">Sobreviver 12 meses</span>
                </li>
              </ul>
           </div>

           {game.gameOver && (
             <div className={`p-6 rounded-3xl border shadow-2xl animate-in zoom-in duration-500 ${game.victory ? 'bg-emerald-600 border-emerald-400' : 'bg-red-600 border-red-400'}`}>
                <div className="text-center text-white">
                  <span className="text-5xl block mb-2">{game.victory ? '🏆' : '💀'}</span>
                  <h3 className="text-2xl font-black uppercase mb-1">{game.victory ? 'Sucesso!' : 'Falência'}</h3>
                  <p className="text-sm opacity-90 mb-4">{game.logs[game.logs.length - 1].message}</p>
                  <div className="bg-black/20 rounded-xl p-3 text-left space-y-1">
                     <div className="flex justify-between text-xs font-bold opacity-80">
                       <span>Saldo Final:</span>
                       <span>{maskCurrency(game.balance, isPrivacyMode)}</span>
                     </div>
                     <div className="flex justify-between text-xs font-bold opacity-80">
                       <span>Patrimônio:</span>
                       <span>{maskCurrency(game.investments, isPrivacyMode)}</span>
                     </div>
                  </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default MiniGame;
