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

    {/* POR QUE FAZ SENTIDO / BENEFÍCIOS */}
    <section className="px-4 lg:px-12 pb-10 max-w-[1600px] mx-auto w-full">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="mb-8 text-center md:text-left">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest mb-4">
            {heroPersona === 'dividas' ? 'Benefícios de começar hoje' : 'Por que contexto importa'}
          </span>
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-3">
            {heroPersona === 'dividas' 
              ? 'Tudo o que você precisa para recuperar sua tranquilidade.' 
              : 'Patrimônio bem cadastrado vale mais quando o sistema continua útil entre uma decisão e outra.'}
          </h3>
          <p className="text-slate-600 text-sm md:text-base max-w-3xl">
            {heroPersona === 'dividas' 
              ? 'A gente não quer apenas que você pague boletos. Queremos que você recupere o controle da sua vida financeira com inteligência e apoio.' 
              : 'O Finanças Pro Invest fica mais útil quando patrimônio, metas e rotina financeira passam a conversar dentro do mesmo ecossistema.'}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {heroPersona === 'dividas' ? (
            <>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h4 className="text-slate-900 font-black text-lg mb-2">Clareza para dormir à noite</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Suas dívidas no papel, um plano visual. Chega de acordar de madrugada fazendo conta de cabeça.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h4 className="text-slate-900 font-black text-lg mb-2">Um plano que cabe no seu bolso</h4>
                <p className="text-slate-600 text-sm leading-relaxed">A gente prioriza o essencial. Você define quanto consegue pagar por mês. O app monta a estratégia.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h4 className="text-slate-900 font-black text-lg mb-2">Um parceiro que lembra, mas não persegue</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Notificações no ponto certo. Check-ins semanais sutis. Celebrar cada pequena vitória.</p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h4 className="text-slate-900 font-black text-lg mb-2">Visão 360° do seu patrimônio</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Imóveis, veículos, investimentos. Tudo em um só lugar, atualizado.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h4 className="text-slate-900 font-black text-lg mb-2">Rentabilidade real, sem maquiagem</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Compare seus ganhos com a inflação e veja se seu dinheiro está realmente crescendo.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h4 className="text-slate-900 font-black text-lg mb-2">Decisões baseadas em dados, não em achismo</h4>
                <p className="text-slate-600 text-sm leading-relaxed">O Nexus cruza seu momento de vida com o mercado para te avisar a hora certa de revisar sua carteira.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>

    {/* PARA QUEM É (Simplified for 'dividas') */}
    {heroPersona !== 'dividas' && (
      <section className="px-4 lg:px-12 pb-10 max-w-[1600px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Para quem quer parar de improvisar', body: 'Se hoje o patrimônio está espalhado ou mal acompanhado, aqui existe uma base mais organizada para começar.' },
            { title: 'Para quem quer decidir com mais contexto', body: 'O Nexus ajuda a revisar prioridades e decisões com base no que está cadastrado dentro do ecossistema.' },
            { title: 'Para quem quer um sistema presente ao longo do tempo', body: 'Quando o mercado ou sua vida mudarem, o sistema continua presente para sinalizar revisões importantes.' },
          ].map(({ title, body }) => (
            <div key={title} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h4 className="text-slate-900 font-black text-lg mb-2">{title}</h4>
              <p className="text-slate-600 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>
    )}

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
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-widest mb-4">{heroPersona === 'dividas' ? 'Comece agora. Leva 2 minutos.' : 'Comece com contexto'}</span>
        <h3 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">{heroPersona === 'dividas' ? <>Dívidas não definem você.<br className="hidden md:block" />Vamos resolver isso juntos.</> : <>Cadastre seu patrimônio e seus investimentos. <br className="hidden md:block" />Deixe o ecossistema acompanhar sua evolução.</>}</h3>
        <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto mb-6">{heroPersona === 'dividas' ? 'Cadastre sua primeira dívida e veja na hora o impacto no seu futuro.' : 'O valor do ecossistema aumenta quando patrimônio e rotina financeira estão bem cadastrados, porque o sistema passa a acompanhar melhor o que mudou e o que merece revisão.'}</p>
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-600">{heroPersona === 'dividas' ? 'Plano realista + clareza + apoio' : 'Patrimônio + investimentos + contexto vivo'}</span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-600">{heroPersona === 'dividas' ? 'Entrada rápida + acompanhamento sutil' : 'Acompanhamento + revisão contínua'}</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={() => onNavigate(heroPersona === 'dividas' ? 'minhas-dividas' : 'investimentos')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-[0_16px_35px_-18px_rgba(16,185,129,0.65)] inline-flex items-center justify-center gap-2 w-full sm:w-auto"><span>{heroPersona === 'dividas' ? 'Quero meu plano grátis' : 'Quero ver meu futuro financeiro'}</span><ArrowRight size={20} /></button>
          <button onClick={() => isAuthenticated ? onNavigate('manager') : onStartNow()} className="bg-white hover:bg-slate-100 text-slate-900 font-black px-8 py-4 rounded-2xl transition-all border border-slate-300 shadow-sm inline-flex items-center justify-center gap-2 w-full sm:w-auto"><span>{heroPersona === 'dividas' ? 'Explorar ferramentas primeiro' : 'Organizar minha rotina no Controla'}</span><ArrowRight size={20} /></button>
        </div>
      </div>
    </section>
  </>
);
