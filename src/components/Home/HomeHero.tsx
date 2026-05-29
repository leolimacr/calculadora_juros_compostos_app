import React from 'react';
import { ArrowRight } from 'lucide-react';
import { calcularProximoAporte, diasAteProximoAporte } from '../../utils/dateHelpers';

interface HomeHeroProps {
  heroPersona: 'dividas' | 'patrimonio';
  setHeroPersona: (p: 'dividas' | 'patrimonio') => void;
  isAuthenticated: boolean;
  onNavigate: (route: string) => void;
  onStartNow: () => void;
  isPrivacyMode: boolean;
  userMeta: any;
  patrimonioAtivo: number;
  patrimonioPassivo: number;
  patrimonioTotal: number;
  metas: any[];
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  heroPersona, setHeroPersona, isAuthenticated, onNavigate, onStartNow,
  isPrivacyMode, userMeta, patrimonioAtivo, patrimonioPassivo, patrimonioTotal, metas,
}) => {
  const formatValue = (value: number) => {
    if (isPrivacyMode) return 'R$ •••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const metasAtivas = metas.filter(m => m.ativa);
  const proximaMeta = metasAtivas.length > 0 ? metasAtivas[0] : null;
  let diasRestantes: number | null = null;
  let valorProximoAporte: number = 1200;

  if (userMeta && proximaMeta) {
    const proximoAporteData = calcularProximoAporte({
      dataInicio: proximaMeta.dataInicio,
      frequencia: proximaMeta.frequencia,
      diasPersonalizado: proximaMeta.diasPersonalizado,
    });
    diasRestantes = diasAteProximoAporte(proximoAporteData);
    valorProximoAporte = proximaMeta.valor;
  }

  return (
    <section className="relative px-6 pt-20 pb-12 lg:pt-28 lg:pb-20 max-w-[1600px] mx-auto w-full z-10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[420px] bg-emerald-100/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] gap-10 xl:gap-12 items-start">

        {/* Coluna Esquerda */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 text-slate-600 text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-1000 text-center leading-relaxed max-w-xs sm:max-w-sm lg:max-w-md whitespace-normal">
            {heroPersona === 'dividas'
              ? 'Você não precisa mais enfrentar suas dívidas sozinho.'
              : 'Você não precisa mais adivinhar o caminho do seu patrimônio.'}
          </div>

          <div className="flex bg-transparent p-1 rounded-2xl mb-8 w-fit mx-auto lg:mx-0 border border-slate-200 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
            <button onClick={() => setHeroPersona('dividas')} className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${heroPersona === 'dividas' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
              Dívidas
            </button>
            <button onClick={() => setHeroPersona('patrimonio')} className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${heroPersona === 'patrimonio' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
              Patrimônio
            </button>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-[5.2rem] font-black text-slate-950 leading-[0.98] tracking-[-0.04em] mb-5 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
            {heroPersona === 'dividas' ? (
              <>Dívidas não definem você.<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-emerald-500 to-sky-600 text-4xl md:text-5xl lg:text-6xl block mt-4">Com clareza e um plano realista, o Finanças Pro Invest ajuda você a sair delas.</span></>
            ) : (
              <>Seu dinheiro trabalhando por você.<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-400 to-sky-500">Organize seus ativos e veja seu patrimônio crescer com clareza.</span></>
            )}
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-lg mb-8 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            {heroPersona === 'dividas'
              ? 'Um plano realista e humano para você recuperar o controle e sua tranquilidade financeira.'
              : 'Tome decisões baseadas em dados e acompanhe sua evolução em um só lugar.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <button onClick={() => onNavigate(heroPersona === 'dividas' ? 'minhas-dividas' : 'investimentos')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-[0_16px_35px_-18px_rgba(16,185,129,0.65)] flex items-center justify-center gap-2 w-full sm:w-auto">
              <span>{heroPersona === 'dividas' ? 'Começar meu plano gratuito' : 'Organizar meu patrimônio'}</span>
              <ArrowRight size={20} />
            </button>
            <button onClick={() => { const el = document.getElementById('como-funciona'); if (el) { const y = el.getBoundingClientRect().top + window.scrollY - 90; window.scrollTo({ top: y, behavior: 'smooth' }); } }} className="text-slate-600 hover:text-slate-900 font-bold text-sm transition-all flex items-center gap-2 py-2">
              <span>Como funciona</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {heroPersona === 'dividas' && (
            <div className="mt-4 text-sm text-slate-500 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
              Com suas dívidas cadastradas,{' '}
              <button onClick={() => onNavigate('chat')} className="font-bold text-emerald-700 hover:text-emerald-800 transition-colors">o Nexus já consegue orientar seus próximos passos</button>
            </div>
          )}

          <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-8 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            {heroPersona === 'dividas' ? (
              <>
                <span className="inline-flex items-center rounded-full border border-slate-100 bg-white px-3 py-1 text-[10px] font-bold text-slate-500">✓ Avisa antes do vencimento</span>
                <span className="inline-flex items-center rounded-full border border-slate-100 bg-white px-3 py-1 text-[10px] font-bold text-slate-500">✓ Calcula seu fôlego real</span>
                <span className="inline-flex items-center rounded-full border border-slate-100 bg-white px-3 py-1 text-[10px] font-bold text-slate-500">✓ Mostra qual dívida atacar primeiro</span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center rounded-full border border-slate-100 bg-white px-3 py-1 text-[10px] font-bold text-slate-500">✓ Consolida ativos e passivos</span>
                <span className="inline-flex items-center rounded-full border border-slate-100 bg-white px-3 py-1 text-[10px] font-bold text-slate-500">✓ Avisa quando algo precisa de revisão</span>
                <span className="inline-flex items-center rounded-full border border-slate-100 bg-white px-3 py-1 text-[10px] font-bold text-slate-500">✓ Acompanha metas e aportes</span>
              </>
            )}
          </div>
        </div>

        {/* Coluna Direita */}
        <div className="hidden lg:block relative max-w-[620px] w-full ml-auto animate-in fade-in slide-in-from-right-8 duration-1000 delay-300 lg:mt-32">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-sky-500/10 blur-3xl rounded-[3rem] opacity-30" />
          <div className="relative bg-white/95 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-5 xl:p-6 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.15)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Visualização do App</span>
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 bg-slate-200 rounded-full" />
                  <span className="h-2 w-2 bg-slate-200 rounded-full" />
                  <span className="h-2 w-2 bg-slate-200 rounded-full" />
                </div>
              </div>
            </div>
            <div className="grid gap-4 mb-4">
              <div className="bg-gradient-to-br from-emerald-50 via-white to-slate-50 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-emerald-100 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-300/10 rounded-full blur-3xl" />
                <div className="flex items-center gap-2 mb-3 relative z-10">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                  <p className="text-[10px] text-emerald-800 font-black uppercase tracking-widest">{heroPersona === 'dividas' ? 'Status do Plano' : 'Base patrimonial'}</p>
                </div>
                {heroPersona === 'dividas' ? (
                  <div className="relative z-10 space-y-3">
                    <div className="flex flex-col gap-2">
                      {[{ step: '1', label: 'Dívidas cadastradas', done: true }, { step: '2', label: 'Prioridades calculadas', done: true }, { step: '3', label: 'Monitoramento Nexus', done: false }].map(({ step, label, done }) => (
                        <div key={step} className={`flex items-center gap-3 p-2 rounded-xl border ${done ? 'bg-white border-emerald-100' : 'bg-slate-50/50 border-slate-100 border-dashed'}`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 ${done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>{done ? '✓' : step}</div>
                          <p className={`text-[11px] font-semibold ${done ? 'text-slate-700' : 'text-slate-400'}`}>{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight my-2 relative z-10">R$ 142.500,00</p>
                    <p className="text-xs text-emerald-800 font-medium relative z-10">Patrimônio consolidado e organizado.</p>
                  </>
                )}
              </div>

              <div className={`grid gap-4 ${heroPersona === 'dividas' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div className="h-full bg-white backdrop-blur-md rounded-xl p-4 md:p-5 border border-slate-100 shadow-sm flex flex-col justify-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 tracking-wider">{heroPersona === 'dividas' ? 'Próxima ação' : 'Revisão de Metas'}</p>
                  <p className="text-xl md:text-2xl font-black text-slate-800 truncate mb-1">{heroPersona === 'dividas' ? 'Atacar dívida com maior juros' : 'R$ 1.200,00'}</p>
                  <div className="mt-auto pt-2">
                    <span className="inline-block bg-slate-50 border border-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded">
                      {heroPersona === 'dividas' ? 'Orientado pelo Nexus' : 'Faltam 5 dias'}
                    </span>
                  </div>
                </div>

                {heroPersona === 'patrimonio' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex-1 bg-white backdrop-blur-md rounded-xl p-3 md:p-4 border border-slate-100 flex flex-col justify-center shadow-sm">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-wider">Passivo</p>
                      <p className="text-base md:text-lg font-bold text-slate-500 truncate">R$ 350.000,00</p>
                    </div>
                    <div className="flex-1 bg-slate-50/50 backdrop-blur-md rounded-xl p-3 md:p-4 border border-slate-200 border-dashed flex flex-col justify-center">
                      <p className="text-[9px] text-slate-500 font-bold uppercase mb-1 tracking-wider">Total</p>
                      <p className="text-sm font-bold text-slate-600 truncate">R$ 492.500,00</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {heroPersona === 'patrimonio' && (
              <div className="bg-white rounded-xl p-4 border border-slate-100 mt-4 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Evolução</p>
                </div>
                <div className="flex items-end justify-between h-16 gap-1.5">
                  {[40, 55, 45, 70, 60, 85, 100].map((height, index) => (
                    <div key={index} className="w-full bg-slate-100 rounded-t-sm" style={{ height: `${height}%` }}></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};