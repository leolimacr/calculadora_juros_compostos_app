import React from 'react';

interface Props {
  heroPersona: 'dividas' | 'patrimonio';
}

const STEPS = {
  dividas: [
    {
      n: 1,
      iconBg: 'bg-rose-100',
      iconText: 'text-rose-700',
      title: '1. Respire e puxe tudo para a mesa',
      body: 'Cartão de crédito, empréstimo pessoal, crediário... Cadastre do seu jeito, sem planilha. A gente organiza.',
    },
    {
      n: 2,
      iconBg: 'bg-sky-100',
      iconText: 'text-sky-700',
      title: '2. Veja o caminho mais curto',
      body: 'O Nexus calcula a ordem certa para quitar. Qual dívida atacar primeiro? Quanto guardar no mês? Você vê no app.',
    },
    {
      n: 3,
      iconBg: 'bg-emerald-100',
      iconText: 'text-emerald-700',
      title: '3. Siga no seu ritmo. A gente te lembra.',
      body: 'Sem pressão. Se imprevistos acontecerem, o plano se ajusta. Você não está mais sozinho nessa.',
    },
  ],
  patrimonio: [
    {
      n: 1,
      iconBg: 'bg-emerald-100',
      iconText: 'text-emerald-700',
      title: '1. Consolide seu império',
      body: 'Ativos, investimentos e metas de aporte reunidos. Você para de adivinhar o tamanho do seu patrimônio e começa a enxergar o número real.',
    },
    {
      n: 2,
      iconBg: 'bg-sky-100',
      iconText: 'text-sky-700',
      title: '2. Acompanhe a evolução real',
      body: 'O sistema registra cada mudança. Quando chegar a hora de revisar alocação ou aumentar aportes, você tem histórico — não memória.',
    },
    {
      n: 3,
      iconBg: 'bg-indigo-100',
      iconText: 'text-indigo-700',
      title: '3. Receba alertas estratégicos',
      body: 'Concentração excessiva num ativo, meta de aporte atrasada, reserva abaixo do ideal — o Nexus sinaliza antes de virar problema.',
    },
  ],
};

export const HomeJornada: React.FC<Props> = ({ heroPersona }) => {
  const steps = STEPS[heroPersona];
  return (
    <section id="como-funciona" className="px-4 lg:px-12 pb-10 max-w-[1600px] mx-auto w-full">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="mb-8 text-center md:text-left">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Como funciona na prática
          </span>
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-3">
            {heroPersona === 'dividas'
              ? 'Três passos para parar de dever no escuro.'
              : 'Três passos para construir patrimônio com clareza.'}
          </h3>
          <p className="text-slate-500 text-sm md:text-base max-w-2xl">
            {heroPersona === 'dividas'
              ? 'Você não precisa resolver tudo de uma vez. Começa organizando — o resto fica mais fácil quando você enxerga o que está enfrentando.'
              : 'Patrimônio não se constrói no improviso. Começa com visibilidade — depois vem consistência.'}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map(({ n, iconBg, iconText, title, body }) => (
            <div key={n} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className={`w-10 h-10 rounded-xl ${iconBg} ${iconText} flex items-center justify-center font-black text-sm mb-4`}>
                {n}
              </div>
              <h4 className="text-slate-900 font-black text-base mb-2">{title}</h4>
              <p className="text-slate-600 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};







