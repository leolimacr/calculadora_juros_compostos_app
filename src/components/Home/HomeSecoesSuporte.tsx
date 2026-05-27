import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  heroPersona: 'dividas' | 'patrimonio';
  onNavigate: (route: string) => void;
  onStartNow: () => void;
  isAuthenticated: boolean;
}

export const HomeSecoesSuporte: React.FC<Props> = ({ heroPersona, onNavigate, onStartNow, isAuthenticated }) => (
  <>
    {/* PONTE DE AÇÃO */}
    {heroPersona === 'dividas' && (
      <section className="px-4 lg:px-12 pb-10 max-w-[1600px] mx-auto w-full">
        <div className="bg-gradient-to-br from-emerald-50 via-white to-sky-50 border border-emerald-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-widest mb-4"><span className="w-2 h-2 rounded-full bg-emerald-500" />Próxima etapa recomendada</span>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-3">Comece cadastrando suas dívidas e evolua o contexto depois.</h3>
            <p className="text-slate-600 text-sm md:text-base max-w-2xl mb-6 leading-relaxed">Entre em Minhas Dívidas, registre o que já souber e construa a base que o Nexus vai usar junto com os demais dados do ecossistema para gerar uma análise mais completa.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => onNavigate('minhas-dividas')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-[0_16px_35px_-18px_rgba(16,185,129,0.65)] inline-flex items-center justify-center gap-2 w-full sm:w-auto"><span>Ir para Minhas Dívidas</span><ArrowRight size={20} /></button>
              <button onClick={() => onNavigate('chat')} className="bg-white hover:bg-slate-100 text-slate-900 font-black px-8 py-4 rounded-2xl transition-all border border-slate-300 shadow-sm inline-flex items-center justify-center gap-2 w-full sm:w-auto"><span>Entender como o Nexus acompanha sua jornada</span><Sparkles size={18} /></button>
            </div>
            <p className="text-xs text-slate-500 mt-4">Você pode começar com informações parciais e melhorar o cadastro depois.</p>
          </div>
        </div>
      </section>
    )}

    {/* POR QUE FAZ SENTIDO */}
    <section className="px-4 lg:px-12 pb-10 max-w-[1600px] mx-auto w-full">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="mb-8 text-center md:text-left">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest mb-4">{heroPersona === 'dividas' ? 'Por que continuar no ecossistema' : 'Por que contexto importa'}</span>
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-3">{heroPersona === 'dividas' ? 'O valor real aparece quando o diagnóstico vira presença útil no dia a dia.' : 'Patrimônio bem cadastrado vale mais quando o sistema continua útil entre uma decisão e outra.'}</h3>
          <p className="text-slate-600 text-sm md:text-base max-w-3xl">{heroPersona === 'dividas' ? 'A proposta não é só orientar uma decisão pontual, mas acompanhar mudanças da sua realidade e ajudar você a revisar a rota com inteligência, discrição e bom senso.' : 'O Finanças Pro Invest fica mais útil quando patrimônio, metas e rotina financeira passam a conversar dentro do mesmo ecossistema, mantendo revisões importantes no radar sem gerar ruído.'}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: heroPersona === 'dividas' ? 'Contexto que continua vivo' : 'Leitura mais fiel da rotina', body: heroPersona === 'dividas' ? 'Dívidas, gastos e patrimônio no mesmo lugar ajudam a enxergar a situação com menos distorção.' : 'Investimentos, patrimônio e rotina financeira conectados ajudam o Nexus a interpretar melhor sua realidade.' },
            { title: heroPersona === 'dividas' ? 'Prioridades acompanhadas' : 'Decisões acompanhadas', body: heroPersona === 'dividas' ? 'Com apoio do Nexus, fica mais fácil perceber o que mudou, revisar prioridades e receber alertas mais úteis sem sensação de invasão.' : 'Com mais contexto, o Nexus ajuda a revisar prioridades e manter pontos importantes no radar sem depender só de memória ou impressão momentânea.' },
            { title: heroPersona === 'dividas' ? 'Presença útil no mesmo lugar' : 'Acompanhamento útil no mesmo lugar', body: heroPersona === 'dividas' ? 'Você começa pelo básico e pode aprofundar sem trocar de sistema nem perder contexto.' : 'Você cadastra, acompanha e revisa decisões no mesmo ambiente, com menos fricção.' },
          ].map(({ title, body }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h4 className="text-slate-900 font-black text-lg mb-2">{title}</h4>
              <p className="text-slate-600 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* PARA QUEM É */}
    <section className="px-4 lg:px-12 pb-10 max-w-[1600px] mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: heroPersona === 'dividas' ? 'Para quem quer sair da confusão' : 'Para quem quer parar de improvisar', body: heroPersona === 'dividas' ? 'Se hoje falta clareza sobre juros, prioridades e próximos passos, aqui existe um ponto de partida objetivo.' : 'Se hoje o patrimônio está espalhado ou mal acompanhado, aqui existe uma base mais organizada para começar.' },
          { title: heroPersona === 'dividas' ? 'Para quem quer decidir com mais segurança' : 'Para quem quer decidir com mais contexto', body: heroPersona === 'dividas' ? 'O Nexus ajuda a transformar contexto financeiro em prioridade prática, em vez de agir só por pressão.' : 'O Nexus ajuda a revisar prioridades e decisões com base no que está cadastrado dentro do ecossistema.' },
          { title: heroPersona === 'dividas' ? 'Para quem quer um aliado no dia a dia' : 'Para quem quer um sistema presente ao longo do tempo', body: heroPersona === 'dividas' ? 'Depois do primeiro passo, o sistema continua útil para acompanhar mudanças, lembrar o que importa e ajudar você a não perder contexto.' : 'Quando o mercado ou sua vida mudarem, o sistema continua presente para sinalizar revisões importantes com menos fricção e mais bom senso.' },
        ].map(({ title, body }) => (
          <div key={title} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h4 className="text-slate-900 font-black text-lg mb-2">{title}</h4>
            <p className="text-slate-600 text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </section>

    {/* CREDIBILIDADE */}
    <section className="px-4 lg:px-12 pb-10 max-w-[1600px] mx-auto w-full">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-sm overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.35),_transparent_35%)]" />
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest mb-4">Feito para a realidade brasileira</span>
          <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-3">Inteligência que fala a sua língua — simples, útil e sempre ao seu lado.</h3>
          <p className="text-slate-200 text-sm md:text-base leading-relaxed">{heroPersona === 'dividas' ? 'O Finanças Pro Invest foi desenhado para ajudar você a sair do improviso, construir uma base confiável e continuar recebendo apoio quando sua realidade mudar.' : 'O Finanças Pro Invest combina cadastro patrimonial, rotina financeira e apoio do Nexus para transformar contexto em decisão prática e acompanhamento contínuo.'}</p>
        </div>
      </div>
    </section>

    {/* CTA FINAL */}
    <section className="px-4 lg:px-12 py-16 max-w-[1600px] mx-auto w-full">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 text-center shadow-sm">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-widest mb-4">{heroPersona === 'dividas' ? 'Comece com clareza' : 'Comece com contexto'}</span>
        <h3 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">{heroPersona === 'dividas' ? <>Cadastre sua realidade financeira. <br className="hidden md:block" />Deixe o ecossistema acompanhar seus próximos passos.</> : <>'Cadastre seu patrimônio e seus investimentos. <br className="hidden md:block" />Deixe o ecossistema acompanhar sua evolução.</>}</h3>
        <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto mb-6">{heroPersona === 'dividas' ? 'Você não precisa organizar tudo no primeiro dia. Comece pelas dívidas, evolua seu contexto aos poucos e permita que o sistema continue útil no seu dia a dia.' : 'O valor do ecossistema aumenta quando patrimônio e rotina financeira estão bem cadastrados, porque o sistema passa a acompanhar melhor o que mudou e o que merece revisão.'}</p>
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-600">{heroPersona === 'dividas' ? 'Dívidas + rotina + contexto vivo' : 'Patrimônio + investimentos + contexto vivo'}</span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-600">{heroPersona === 'dividas' ? 'Entrada inicial + acompanhamento contínuo' : 'Acompanhamento + revisão contínua'}</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={() => onNavigate(heroPersona === 'dividas' ? 'minhas-dividas' : 'investimentos')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-[0_16px_35px_-18px_rgba(16,185,129,0.65)] inline-flex items-center justify-center gap-2 w-full sm:w-auto"><span>{heroPersona === 'dividas' ? 'Quero organizar meu dinheiro' : 'Quero ver meu futuro financeiro'}</span><ArrowRight size={20} /></button>
          <button onClick={() => isAuthenticated ? onNavigate('manager') : onStartNow()} className="bg-white hover:bg-slate-100 text-slate-900 font-black px-8 py-4 rounded-2xl transition-all border border-slate-300 shadow-sm inline-flex items-center justify-center gap-2 w-full sm:w-auto"><span>{heroPersona === 'dividas' ? 'Registrar minha rotina no Controla' : 'Organizar minha rotina no Controla'}</span><ArrowRight size={20} /></button>
        </div>
      </div>
    </section>
  </>
);