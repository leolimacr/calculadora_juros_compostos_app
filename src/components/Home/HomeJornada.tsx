import React from 'react';

interface Props {
  heroPersona: 'dividas' | 'patrimonio';
}

export const HomeJornada: React.FC<Props> = ({ heroPersona }) => (
  <section id="como-funciona" className="px-4 lg:px-12 pb-10 max-w-[1600px] mx-auto w-full">
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="mb-8 text-center md:text-left">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-widest mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>Como o ecossistema funciona
        </span>
        <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-3">
          {heroPersona === 'dividas' ? 'Comece organizando suas dívidas e evolua para um acompanhamento financeiro mais contínuo.' : 'Cadastre sua base patrimonial e transforme dados em contexto para acompanhar e decidir melhor.'}
        </h3>
        <p className="text-slate-600 text-sm md:text-base max-w-3xl">
          {heroPersona === 'dividas' ? 'A entrada pode ser simples, mas o valor cresce quando o ecossistema passa a acompanhar sua rotina, perceber mudanças e ajudar você a revisar a rota com bom senso.' : 'O objetivo não é só mostrar números, mas dar ao Nexus uma visão melhor da sua realidade para acompanhar mudanças, apoiar revisões e manter decisões importantes no radar.'}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { n: 1, iconBg: 'bg-emerald-100', iconText: 'text-emerald-700', title: heroPersona === 'dividas' ? 'Cadastre sua realidade' : 'Cadastre sua base patrimonial', body: heroPersona === 'dividas' ? 'Comece pelas dívidas e, sempre que possível, inclua também gastos e patrimônio para o Nexus entender melhor sua situação.' : 'Consolide ativos, passivos e investimentos para construir uma visão mais fiel da sua vida financeira atual.' },
          { n: 2, iconBg: 'bg-sky-100', iconText: 'text-sky-700', title: heroPersona === 'dividas' ? 'Mantenha o contexto vivo' : 'Acompanhe sua posição com mais clareza', body: heroPersona === 'dividas' ? 'À medida que você organiza dívidas, gastos e outras frentes da vida financeira, o ecossistema ganha contexto para acompanhar o que mudou e o que merece atenção.' : 'Conecte patrimônio, metas e rotina financeira para enxergar melhor onde você está, o que mudou e o que precisa ser revisado.' },
          { n: 3, iconBg: 'bg-indigo-100', iconText: 'text-indigo-700', title: heroPersona === 'dividas' ? 'Receba sinais e revisões mais úteis' : 'Revise com apoio contínuo do Nexus', body: heroPersona === 'dividas' ? 'Com mais contexto organizado, o Nexus pode sinalizar prioridades, revisões e próximos passos de forma mais útil, discreta e conectada à sua realidade.' : 'Quanto mais completo estiver seu contexto, mais útil tende a ser o apoio do Nexus para sinalizar revisões, prioridades e decisões ao longo do tempo.' },
        ].map(({ n, iconBg, iconText, title, body }) => (
          <div key={n} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className={`w-10 h-10 rounded-xl ${iconBg} ${iconText} flex items-center justify-center font-black text-sm mb-4`}>{n}</div>
            <h4 className="text-slate-900 font-black text-lg mb-2">{title}</h4>
            <p className="text-slate-600 text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);