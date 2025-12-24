
import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency, maskCurrency } from '../utils/calculations';
import { GameState, GameEvent, GameLog } from '../types';
import ContentModal from './ContentModal';
import Breadcrumb from './Breadcrumb';

interface MiniGameProps {
  isPrivacyMode?: boolean;
  navigateToHome?: () => void;
}

const EVENTS: GameEvent[] = [
  // Mês 1-4: Fase Inicial (Adaptação)
  {
    id: 'e1',
    title: 'Cliente Atrasado',
    description: 'Seu principal cliente atrasou o pagamento da fatura. Você precisa cobrir as contas.',
    icon: '⏳',
    type: 'setback',
    choices: [
      { text: 'Usar Reserva (-R$ 800)', effect: (s) => ({ balance: s.balance - 800, happiness: s.happiness - 5 }) },
      { text: 'Pedir Empréstimo (Juros altos)', effect: (s) => ({ balance: s.balance + 500, happiness: s.happiness - 15, incomeRate: s.incomeRate * 0.95 }) }
    ]
  },
  {
    id: 'e2',
    title: 'Job Extra Urgente',
    description: 'Apareceu um projeto para o fim de semana. Paga bem, mas vai custar seu descanso.',
    icon: '⚡',
    type: 'opportunity',
    choices: [
      { text: 'Pegar o Job (+R$ 1.200 / -Happy)', effect: (s) => ({ balance: s.balance + 1200, happiness: s.happiness - 15 }) },
      { text: 'Recusar (Priorizar Saúde)', effect: (s) => ({ happiness: s.happiness + 5 }) }
    ]
  },
  // Mês 5-8: Fase de Crescimento
  {
    id: 'e3',
    title: 'Curso de Especialização',
    description: 'Um workshop prático que pode aumentar seu valor hora no mercado.',
    icon: '🎓',
    type: 'opportunity',
    choices: [
      { text: 'Investir no Curso (-R$ 1.500)', effect: (s) => ({ balance: s.balance - 1500, incomeRate: s.incomeRate + 0.15, happiness: s.happiness + 5 }) },
      { text: 'Aprender sozinho (Grátis)', effect: (s) => ({ incomeRate: s.incomeRate + 0.02 }) }
    ]
  },
  {
    id: 'e4',
    title: 'Computador Pifou',
    description: 'Sua ferramenta de trabalho parou. Você não pode trabalhar sem ela.',
    icon: '💻',
    type: 'setback',
    choices: [
      { text: 'Comprar Novo Top (-R$ 3.000)', effect: (s) => ({ balance: s.balance - 3000, incomeRate: s.incomeRate + 0.05, happiness: s.happiness + 10 }) },
      { text: 'Arrumar o Velho (-R$ 800)', effect: (s) => ({ balance: s.balance - 800, happiness: s.happiness - 5 }) }
    ]
  },
  // Mês 9-12: Alta Pressão
  {
    id: 'e5',
    title: 'Proposta Irrecusável?',
    description: 'Um cliente grande quer exclusividade por 2 meses. Risco alto de burnout.',
    icon: '🔥',
    type: 'opportunity',
    choices: [
      { text: 'Aceitar Desafio (+R$ 8.000 / -30 Happy)', effect: (s) => ({ balance: s.balance + 8000, happiness: s.happiness - 30 }) },
      { text: 'Manter Clientes Atuais', effect: (s) => ({ happiness: s.happiness + 5 }) }
    ]
  },
  {
    id: 'e6',
    title: 'Crise de Ansiedade',
    description: 'O excesso de trabalho cobrou o preço. Você precisa parar.',
    icon: '🧠',
    type: 'setback',
    choices: [
      { text: 'Terapia e Pausa (-R$ 1.000)', effect: (s) => ({ balance: s.balance - 1000, happiness: s.happiness + 20 }) },
      { text: 'Continuar Trabalhando (-Happy)', effect: (s) => ({ happiness: s.happiness - 25, incomeRate: s.incomeRate * 0.9 }) }
    ]
  },
  {
    id: 'e7',
    title: 'Restituição do IR',
    description: 'O leão te devolveu uma parte do imposto pago.',
    icon: '🦁',
    type: 'neutral',
    choices: [
      { text: 'Receber (+R$ 1.500)', effect: (s) => ({ balance: s.balance + 1500, happiness: s.happiness + 5 }) }
    ]
  }
];

const MiniGame: React.FC<MiniGameProps> = ({ isPrivacyMode = false, navigateToHome }) => {
  const [game, setGame] = useState<GameState>({
    month: 1,
    balance: 3000, // Reserva inicial
    investments: 0,
    happiness: 80,
    incomeRate: 1.0,
    logs: [],
    gameOver: false,
    victory: false,
    score: 0,
    badges: []
  });

  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [game.logs]);

  const startGame = () => {
    setShowIntro(false);
    addLog(1, "Sua jornada começou! Você tem R$ 3.000 de reserva inicial. Boa sorte, Alex!", 'info');
  };

  const addLog = (month: number, message: string, type: GameLog['type']) => {
    setGame(prev => ({ ...prev, logs: [...prev.logs, { month, message, type }] }));
  };

  const processTurn = (action: 'invest' | 'save' | 'spend') => {
    if (game.gameOver || activeEvent) return;

    let newState = { ...game };
    let turnLogs: GameLog[] = [];

    // 1. Renda Variável (Base + Performance)
    // Se a felicidade estiver baixa, produz menos. Se alta, produz mais.
    const happinessFactor = newState.happiness / 100;
    const baseIncome = 4000 * newState.incomeRate;
    const fluctuation = (Math.random() * 1000) - 500; // +/- R$ 500
    const actualIncome = (baseIncome * (0.8 + (happinessFactor * 0.4))) + fluctuation;
    
    newState.balance += actualIncome;
    
    // 2. Ação do Jogador
    const fixedExpenses = 2500; // Custo de vida fixo
    
    if (action === 'invest') {
      const investAmount = 1500;
      if (newState.balance >= investAmount + fixedExpenses) {
        newState.balance -= investAmount;
        newState.investments += investAmount;
        turnLogs.push({ month: newState.month, message: `Investiu ${formatCurrency(investAmount)}. Foco no futuro!`, type: 'success' });
        newState.happiness -= 2; // Sacrifício leve
      } else {
        turnLogs.push({ month: newState.month, message: `Não sobrou dinheiro para investir R$ 1.500.`, type: 'warning' });
      }
    } else if (action === 'spend') {
      const leisureCost = 800;
      newState.balance -= leisureCost;
      newState.happiness += 10;
      turnLogs.push({ month: newState.month, message: `Gastou com lazer para recarregar as energias.`, type: 'info' });
    } else {
      // Save (apenas paga contas)
      turnLogs.push({ month: newState.month, message: `Mês contido. Apenas pagou as contas.`, type: 'info' });
      newState.happiness -= 5; // Tédio/Privação
    }

    // 3. Pagar Contas
    newState.balance -= fixedExpenses;

    // 4. Rendimento dos Investimentos (1% a.m.)
    const returns = newState.investments * 0.01;
    newState.investments += returns;

    // 5. Trigger Evento Aleatório (40% de chance ou meses específicos)
    const roll = Math.random();
    let eventTriggered = false;
    
    // Lógica de progressão de eventos
    const availableEvents = EVENTS.filter(e => {
       if (newState.month <= 4) return ['e1', 'e2'].includes(e.id);
       if (newState.month <= 8) return ['e3', 'e4', 'e7'].includes(e.id);
       return ['e5', 'e6'].includes(e.id);
    });

    if (roll > 0.6 && availableEvents.length > 0) {
      const evt = availableEvents[Math.floor(Math.random() * availableEvents.length)];
      setActiveEvent(evt);
      eventTriggered = true;
    }

    // Atualizar Estado Intermediário
    newState.month += 1;
    newState.happiness = Math.min(100, Math.max(0, newState.happiness));
    
    // Verificar Game Over (Falência ou Burnout)
    if (newState.balance < -2000) { // Permite cheque especial até 2k
      endGame(newState, false, "Sua dívida virou uma bola de neve impagável.");
      return;
    }
    if (newState.happiness <= 0) {
      endGame(newState, false, "BURNOUT! Você não consegue mais trabalhar.");
      return;
    }

    // Verificar Vitória
    if (newState.month > 12) {
      endGame(newState, true, "Ano concluído com sucesso!");
      return;
    }

    // Se não houve game over e nem evento que bloqueia, atualiza
    if (!eventTriggered) {
      setGame({ ...newState, logs: [...newState.logs, ...turnLogs] });
    } else {
      // Se houve evento, salva o estado PRE-evento (mas com mês atualizado) e mostra modal
      // O modal aplicará o efeito do evento
      setGame({ ...newState, logs: [...newState.logs, ...turnLogs] });
    }
  };

  const handleEventChoice = (effect: (state: GameState) => Partial<GameState>, choiceText: string) => {
    const changes = effect(game);
    const updatedGame = { ...game, ...changes };
    
    // Re-check limits after event
    updatedGame.happiness = Math.min(100, Math.max(0, updatedGame.happiness));
    
    setGame({
      ...updatedGame,
      logs: [...updatedGame.logs, { month: game.month - 1, message: `Evento: ${activeEvent?.title} -> ${choiceText}`, type: 'warning' }]
    });
    setActiveEvent(null);
  };

  const endGame = (finalState: GameState, victory: boolean, reason: string) => {
    const badges = [];
    let score = 0;

    if (victory) {
      score += 50; // Base completion score
      if (finalState.balance > 5000) { badges.push('🛡️ Muralha de Ferro'); score += 10; }
      if (finalState.investments > 30000) { badges.push('🚀 Foguete Não Tem Ré'); score += 20; }
      else if (finalState.investments > 15000) { badges.push('💰 Investidor Júnior'); score += 10; }
      
      if (finalState.happiness > 90) { badges.push('🧘 Mestre Zen'); score += 20; }
      else if (finalState.happiness > 50) { badges.push('😊 Equilibrado'); score += 10; }
      
      if (finalState.balance < 1000 && finalState.balance > 0) badges.push('🎢 Sobrevivente do Caos');
    }

    setGame({
      ...finalState,
      gameOver: true,
      victory,
      score: Math.min(100, score),
      badges,
      logs: [...finalState.logs, { month: finalState.month - 1, message: `FIM DE JOGO: ${reason}`, type: victory ? 'success' : 'danger' }]
    });
  };

  const resetGame = () => {
    setGame({
      month: 1,
      balance: 3000,
      investments: 0,
      happiness: 80,
      incomeRate: 1.0,
      logs: [],
      gameOver: false,
      victory: false,
      score: 0,
      badges: []
    });
    setShowIntro(true);
  };

  return (
    <div className="space-y-6">
      {navigateToHome && <Breadcrumb items={[{ label: 'Home', action: navigateToHome }, { label: 'Simulador Financeiro' }]} />}

      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 relative min-h-[600px]">
        
        {/* Intro Overlay */}
        {showIntro && (
          <div className="absolute inset-0 z-50 bg-slate-900/95 flex items-center justify-center p-4 rounded-3xl backdrop-blur-sm">
            <div className="max-w-lg text-center space-y-6 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto shadow-2xl shadow-emerald-900/50">
                💼
              </div>
              <div>
                <h2 className="text-3xl font-black text-white mb-2">O Sobrevivente</h2>
                <p className="text-slate-400">Cenário: <strong>Desafio do Freelancer</strong>. Você é Alex, um designer autônomo. Sua renda varia todo mês e depende da sua produtividade.</p>
              </div>
              
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-left space-y-2">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-2">Seus Objetivos (12 Meses):</h4>
                <p className="flex items-center gap-2 text-sm text-slate-300">💰 Acumular <strong>R$ 20.000</strong> investidos.</p>
                <p className="flex items-center gap-2 text-sm text-slate-300">🧠 Manter Saúde Mental acima de <strong>50%</strong>.</p>
                <p className="flex items-center gap-2 text-sm text-slate-300">🚫 Não entrar no cheque especial.</p>
              </div>

              <button 
                onClick={startGame}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-lg py-4 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                Começar Desafio
              </button>
            </div>
          </div>
        )}

        {/* Event Modal */}
        {activeEvent && (
          <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center p-4 rounded-3xl backdrop-blur-sm">
            <div className="bg-slate-800 border-2 border-slate-600 p-8 rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
              <div className="text-center mb-6">
                <span className="text-5xl mb-4 block">{activeEvent.icon}</span>
                <h3 className="text-2xl font-bold text-white mb-2">{activeEvent.title}</h3>
                <p className="text-slate-300">{activeEvent.description}</p>
              </div>
              <div className="space-y-3">
                {activeEvent.choices?.map((choice, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleEventChoice(choice.effect, choice.text)}
                    className="w-full p-4 bg-slate-700 hover:bg-slate-600 border border-slate-500 rounded-xl text-left transition-colors font-bold text-white flex justify-between items-center group"
                  >
                    <span>{choice.text}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">➜</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Game Over / Victory Screen */}
        {game.gameOver && (
          <div className="absolute inset-0 z-40 bg-slate-900/95 flex items-center justify-center p-4 rounded-3xl backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-600 p-8 rounded-2xl max-w-lg w-full shadow-2xl text-center animate-in zoom-in duration-300">
              <span className="text-6xl block mb-4">{game.victory ? '🏆' : '💀'}</span>
              <h2 className="text-3xl font-black text-white mb-2">{game.victory ? 'Objetivo Conquistado!' : 'Fim da Linha'}</h2>
              
              {game.victory && (
                  <div className="text-5xl font-black text-emerald-400 my-6 tracking-tighter">
                    {game.score}<span className="text-2xl text-emerald-600">/100</span>
                  </div>
              )}

              <p className="text-slate-400 mb-6 italic">"{game.logs[game.logs.length - 1].message}"</p>

              {game.badges.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Conquistas Desbloqueadas</h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {game.badges.map(b => (
                      <span key={b} className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6 bg-black/20 p-4 rounded-xl">
                  <div>
                    <span className="block text-xs text-slate-500 uppercase font-bold">Patrimônio</span>
                    <span className="block text-xl font-bold text-white">{maskCurrency(game.investments, isPrivacyMode)}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 uppercase font-bold">Saúde Mental</span>
                    <span className="block text-xl font-bold text-white">{game.happiness}%</span>
                  </div>
              </div>

              <div className="space-y-3">
                <button onClick={resetGame} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-transform hover:scale-105">
                  Jogar Novamente
                </button>
                <button className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3 rounded-xl">
                  Compartilhar Resultado
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats HUD */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 text-3xl group-hover:scale-110 transition-transform">📅</div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mês Atual</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">{game.month > 12 ? 12 : game.month}</span>
              <span className="text-xs text-slate-500">/ 12</span>
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 text-3xl group-hover:scale-110 transition-transform">💰</div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Caixa</span>
            <span className={`text-2xl font-black tracking-tight ${game.balance < 0 ? 'text-red-500' : 'text-emerald-400'}`}>
              {maskCurrency(game.balance, isPrivacyMode)}
            </span>
          </div>

          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 text-3xl group-hover:scale-110 transition-transform">📈</div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Investido</span>
            <span className="text-2xl font-black text-indigo-400 tracking-tight">
              {maskCurrency(game.investments, isPrivacyMode)}
            </span>
          </div>

          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 text-3xl group-hover:scale-110 transition-transform">🧠</div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saúde Mental</span>
            <div className="w-full bg-slate-700 h-2 mt-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${game.happiness > 50 ? 'bg-emerald-500' : game.happiness > 20 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                  style={{ width: `${game.happiness}%` }}
                ></div>
            </div>
            <span className="text-xs font-bold text-slate-300 mt-1 block">{game.happiness}%</span>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
          
          {/* Log Area */}
          <div className="lg:col-span-2 bg-slate-800 rounded-3xl border border-slate-700 shadow-xl overflow-hidden flex flex-col">
            <div className="bg-slate-900/80 backdrop-blur p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Diário do Freelancer
              </h3>
            </div>
            
            <div className="flex-grow p-6 overflow-y-auto custom-scrollbar space-y-3 bg-[#020617]/50">
              {game.logs.length === 0 && <p className="text-slate-500 text-center text-sm mt-10">Aguardando início do jogo...</p>}
              {game.logs.map((log, i) => (
                <div key={i} className={`p-4 rounded-xl border text-sm animate-in slide-in-from-left-2 duration-300 flex gap-3 items-start ${
                  log.type === 'success' ? 'bg-emerald-900/10 border-emerald-500/20 text-emerald-300' :
                  log.type === 'danger' ? 'bg-red-900/10 border-red-500/20 text-red-300' :
                  log.type === 'warning' ? 'bg-amber-900/10 border-amber-500/20 text-amber-300' :
                  'bg-slate-800 border-slate-700 text-slate-300'
                }`}>
                  <span className="text-[10px] font-bold opacity-60 bg-black/20 px-2 py-0.5 rounded uppercase tracking-wider shrink-0 mt-0.5">Mês {log.month}</span>
                  <span className="leading-relaxed">{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-700">
              <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => processTurn('invest')} 
                    disabled={game.gameOver}
                    className="group relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 p-3 rounded-xl text-left transition-all hover:scale-[1.02] shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:grayscale"
                  >
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">🚀</span>
                      <span className="font-bold text-white text-xs uppercase tracking-wide">Investir</span>
                      <span className="text-[10px] text-indigo-200 mt-1 opacity-80">-R$ 1.500</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => processTurn('save')} 
                    disabled={game.gameOver}
                    className="group relative overflow-hidden bg-slate-700 hover:bg-slate-600 p-3 rounded-xl text-left transition-all hover:scale-[1.02] border border-slate-600 disabled:opacity-50 disabled:grayscale"
                  >
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">🛡️</span>
                      <span className="font-bold text-white text-xs uppercase tracking-wide">Manter</span>
                      <span className="text-[10px] text-slate-300 mt-1 opacity-80">Pagar Contas</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => processTurn('spend')} 
                    disabled={game.gameOver}
                    className="group relative overflow-hidden bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 p-3 rounded-xl text-left transition-all hover:scale-[1.02] shadow-lg shadow-orange-900/20 disabled:opacity-50 disabled:grayscale"
                  >
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">🍹</span>
                      <span className="font-bold text-white text-xs uppercase tracking-wide">Viver</span>
                      <span className="text-[10px] text-orange-200 mt-1 opacity-80">-R$ 800 / +Happy</span>
                    </div>
                  </button>
                </div>
            </div>
          </div>

          {/* Status Panel */}
          <div className="space-y-4">
            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl h-full flex flex-col">
                <h4 className="font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-700 pb-4">
                  <span className="text-xl">📊</span> Status do Freelancer
                </h4>
                
                <div className="space-y-6 flex-grow">
                  <div>
                      <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                        <span>Produtividade (Renda)</span>
                        <span className={game.incomeRate >= 1 ? 'text-emerald-400' : 'text-red-400'}>{(game.incomeRate * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full transition-all" style={{ width: `${Math.min(100, game.incomeRate * 100)}%` }}></div>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Afeta quanto você ganha por mês.</p>
                  </div>

                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-700">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Meta: R$ 20k</span>
                      <div className="flex items-end justify-between">
                        <span className="text-emerald-400 font-bold text-lg">{((game.investments / 20000) * 100).toFixed(0)}%</span>
                        <span className="text-slate-600 text-xs">Concluído</span>
                      </div>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-700 text-center">
                  <p className="text-xs text-slate-500 italic">
                      "O segredo não é quanto você ganha, é quanto você não gasta com bobagem."
                  </p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniGame;
