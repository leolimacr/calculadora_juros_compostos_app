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
      <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] gap-10 xl:gap-12 items-center">

        {/* Coluna Esquerda */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 text-slate-600 text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-1000 text-center leading-relaxed max-w-xs sm:max-w-sm lg:max-w-md whitespace-normal">
            {heroPersona === 'dividas'
              ? 'Você não precisa mais decidir sozinho o que fazer com suas dívidas'
              : 'Você não precisa mais adivinhar o que fazer com seu patrimônio'}
          </div>

          <div className="flex bg-slate-200/50 p-1.5 rounded-2xl mb-8 w-fit mx-auto lg:mx-0 border border-slate-200/60 shadow-inner animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
            <button onClick={() => setHeroPersona('dividas')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${heroPersona === 'dividas' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}>
              Quero sair das dívidas
            </button>
            <button onClick={() => setHeroPersona('patrimonio')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${heroPersona === 'patrimonio' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}>
              Quero organizar meu patrimônio
            </button>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-[5.2rem] font-black text-slate-950 leading-[0.98] tracking-[-0.04em] mb-5 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
            {heroPersona === 'dividas' ? (
              <>Saia das dívidas com<br />um plano claro e <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-emerald-500 to-sky-600">realista.</span></>
            ) : (
              <>Seu dinheiro organizado,<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-400 to-sky-500">seu futuro mais claro.</span></>
            )}
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-lg mb-8 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            {heroPersona === 'dividas'
              ? 'O Finanças Pro Invest organiza suas contas, mostra o que priorizar e te guia até a liberdade financeira — mesmo que você não entenda de matemática.'
              : 'Acompanhe tudo o que você tem, veja seu patrimônio crescer e tome decisões com confiança — sem complicação.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <button onClick={() => onNavigate(heroPersona === 'dividas' ? 'minhas-dividas' : 'investimentos')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-[0_16px_35px_-18px_rgba(16,185,129,0.65)] flex items-center justify-center gap-2 w-full sm:w-auto">
              <span>{heroPersona === 'dividas' ? 'Quero organizar meu dinheiro' : 'Quero ver meu futuro financeiro'}</span>
              <ArrowRight size={20} />
            </button>
            <button onClick={() => { const el = document.getElementById('como-funciona'); if (el) { const y = el.getBoundingClientRect().top + window.scrollY - 90; window.scrollTo({ top: y, behavior: 'smooth' }); } }} className="bg-white hover:bg-slate-100 text-slate-900 font-black px-8 py-4 rounded-2xl transition-all border border-slate-300 shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto">
              <span>Como funciona</span>
              <ArrowRight size={20} />
            </button>
          </div>

          {heroPersona === 'dividas' && (
            <div className="mt-4 text-sm text-slate-500 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
              Com suas dívidas cadastradas,{' '}
              <button onClick={() => onNavigate('chat')} className="font-bold text-emerald-700 hover:text-emerald-800 transition-colors">o Nexus já consegue orientar seus próximos passos</button>
            </div>
          )}

          <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-6 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            {heroPersona === 'dividas' ? (
              <>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600">✓ Avisa antes do vencimento</span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600">✓ Calcula seu fôlego real</span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600">✓ Mostra qual dívida atacar primeiro</span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600">✓ Acompanha seu progresso ao longo do tempo</span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600">✓ Consolida ativos e passivos</span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600">✓ Avisa quando algo precisa de revisão</span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600">✓ Acompanha metas e aportes</span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600">✓ Nexus apoia decisões com contexto real</span>
              </>
            )}
          </div>
        </div>

        {/* Coluna Direita */}
        <div className="hidden lg:block relative max-w-[620px] w-full ml-auto animate-in fade-in slide-in-from-right-8 duration-1000 delay-300 group/card cursor-default">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/15 to-sky-500/15 blur-3xl rounded-[3rem] opacity-30 transition-opacity duration-700 group-hover/card:opacity-60" />
          <div className="relative bg-white/95 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-5 xl:p-6 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.22)] overflow-hidden transition-all duration-700 group-hover/card:-translate-y-1 group-hover/card:shadow-[0_28px_65px_-28px_rgba(15,23,42,0.24)] group-hover/card:border-slate-300">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Visão geral</span>
                <span className="h-4 w-16 bg-slate-200 rounded-full" />
              </div>
            </div>
            <div className="grid gap-4 mb-4">
              <div onClick={() => heroPersona === 'dividas' ? onNavigate('minhas-dividas') : isAuthenticated ? onNavigate('investimentos') : onStartNow()} className="bg-gradient-to-br from-emerald-50 via-white to-slate-50 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-emerald-200 relative overflow-hidden cursor-pointer">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-300/20 rounded-full blur-3xl" />
                <div className="flex items-center gap-2 mb-3 relative z-10">
                  <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
                  <p className="text-[10px] md:text-xs text-emerald-800 font-black uppercase tracking-widest">{heroPersona === 'dividas' ? 'Seu ponto de partida' : 'Base patrimonial consolidada'}</p>
                </div>
                {heroPersona === 'dividas' ? (
                  <div className="relative z-10 space-y-3">
                    <div className="flex flex-col gap-2">
                      {[{ step: '1', label: 'Cadastre suas dívidas', done: true }, { step: '2', label: 'O sistema calcula seu fôlego e as prioridades', done: true }, { step: '3', label: 'O Nexus acompanha e avisa quando algo muda', done: false }].map(({ step, label, done }) => (
                        <div key={step} className={`flex items-center gap-3 p-2.5 rounded-xl border ${done ? 'bg-white border-emerald-200' : 'bg-slate-50 border-slate-200 border-dashed'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{done ? '✓' : step}</div>
                          <p className={`text-xs font-semibold ${done ? 'text-slate-700' : 'text-slate-400'}`}>{label}</p>
                        </div>
                      ))}
                    </div>
                    <span className="inline-block bg-white/80 border border-emerald-200 text-emerald-700 text-[9px] font-bold px-2 py-1 rounded">100% Confidencial · Gratuito</span>
                  </div>
                ) : isAuthenticated && patrimonioAtivo != null ? (
                  <>
                    <p className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight my-2 relative z-10">{formatValue(patrimonioAtivo)}</p>
                    <p className="text-xs md:text-sm text-emerald-800 font-medium relative z-10">Sua base patrimonial organizada para decisões melhores.</p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight my-2 relative z-10">R$ 142.500,00</p>
                    <p className="text-xs md:text-sm text-emerald-800 font-medium relative z-10">Exemplo visual de patrimônio consolidado.</p>
                  </>
                )}
              </div>

              <div className={`grid gap-4 ${heroPersona === 'dividas' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div onClick={() => heroPersona === 'dividas' ? onNavigate('minhas-dividas') : isAuthenticated ? onNavigate('metas') : onStartNow()} className="h-full bg-gradient-to-b from-blue-50 to-white backdrop-blur-md rounded-xl p-4 md:p-5 border border-blue-200 shadow-sm flex flex-col justify-center cursor-pointer transition-all duration-300 hover:shadow-md hover:border-blue-300">
                  <p className="text-[10px] md:text-xs text-blue-800 font-bold uppercase mb-2 tracking-wider">{heroPersona === 'dividas' ? 'Próximo passo no ecossistema' : 'Próxima revisão'}</p>
                  <p className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 truncate mb-1">{heroPersona === 'dividas' ? 'Qual dívida quitar primeiro?' : userMeta ? formatValue(valorProximoAporte) : 'R$ 1.200,00'}</p>
                  <div className="mt-auto pt-3">
                    {heroPersona === 'dividas' ? (
                      <span className="inline-block bg-blue-100 border border-blue-300 text-blue-800 text-[10px] font-bold px-2 py-1 rounded-md">O Nexus responde com base no seu contexto real</span>
                    ) : userMeta ? (
                      metasAtivas.length === 0 ? <span className="inline-block bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-md">Definir meta</span> : (
                        <span className={`inline-block border text-[10px] font-bold px-2 py-1 rounded-md ${diasRestantes !== null && diasRestantes <= 0 ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : diasRestantes !== null && diasRestantes <= 5 ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-blue-100 border-blue-300 text-blue-800'}`}>
                          {diasRestantes !== null ? diasRestantes <= 0 ? 'Hoje é o dia!' : `Faltam ${diasRestantes} dias` : 'Em breve'}
                        </span>
                      )
                    ) : <span className="inline-block bg-blue-100 border border-blue-300 text-blue-800 text-[10px] font-bold px-2 py-1 rounded-md">Faça login para definir metas</span>}
                  </div>
                </div>

                {heroPersona === 'patrimonio' && (
                  <div className="flex flex-col gap-3">
                    <div onClick={() => isAuthenticated ? onNavigate('passivos') : onStartNow()} className="flex-1 bg-white backdrop-blur-md rounded-xl p-3 md:p-4 border border-slate-200 transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 cursor-pointer flex flex-col justify-center shadow-sm">
                      <p className="text-[10px] text-slate-700 font-bold uppercase mb-1 tracking-wider">Patrimônio Passivo</p>
                      <p className="text-base md:text-lg font-bold text-slate-500 truncate">{isAuthenticated && patrimonioPassivo != null ? formatValue(patrimonioPassivo) : 'R$ 350.000,00'}</p>
                    </div>
                    <div className="flex-1 bg-slate-50 backdrop-blur-md rounded-xl p-3 md:p-4 border border-slate-300 border-dashed transition-all duration-300 flex flex-col justify-center">
                      <p className="text-[9px] md:text-[10px] text-slate-600 font-bold uppercase mb-1 tracking-wider">Patrimônio Total</p>
                      <p className="text-sm md:text-base font-bold text-slate-700 truncate">{isAuthenticated && patrimonioAtivo != null && patrimonioPassivo != null ? formatValue(patrimonioTotal) : 'R$ 492.500,00'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {heroPersona === 'patrimonio' && (
              <div className="bg-white backdrop-blur-md rounded-xl p-4 border border-slate-200 mt-4 group shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Evolução Patrimonial</p>
                  <div className="flex gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span></div>
                </div>
                <div className="flex items-end justify-between h-24 gap-2">
                  {[40, 55, 45, 70, 60, 85, 100].map((height, index) => (
                    <div key={index} className="w-full bg-slate-200 rounded-t-sm transition-all duration-300 group-hover:bg-slate-300 hover:!bg-emerald-500/60" style={{ height: `${height}%` }}></div>
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