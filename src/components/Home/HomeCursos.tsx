import React from 'react';
import { useNavigate } from 'react-router-dom';
import { courses } from '../Public/Courses';

interface Props {
  heroPersona: 'dividas' | 'patrimonio';
  setHeroPersona: (p: 'dividas' | 'patrimonio') => void;
  setSelectedCourse: (c: any) => void;
}

export const HomeCursos: React.FC<Props> = ({ heroPersona, setHeroPersona, setSelectedCourse }) => {
  const navigate = useNavigate();
  return (
    <section id="secao-cursos" className="px-6 lg:px-16 py-24 w-full bg-[#0B0F17] text-[#E5E7EB] font-sans border-t border-white/[0.04]">
      <div className="max-w-[1200px] mx-auto mb-16 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-950/40 border border-blue-900/50 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Conhecimento Estratégico
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
          {heroPersona === 'dividas' 
            ? <>Primeiro organize a base. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Depois avance.</span></> 
            : <>Primeiro organize a base. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Depois refine decisões.</span></>
          }
        </h2>
        <p className="text-[#A0A4AB] max-w-2xl text-sm md:text-base mb-6 leading-relaxed">
          {heroPersona === 'dividas' 
            ? 'Os cursos de estruturação ajudam a aprofundar seu entendimento, disciplina e organização tática após estabelecer seu Colchão Inicial.' 
            : 'Nossos cursos diretos amadurecem suas tomadas de decisão após registrar sua base patrimonial e sua rotina financeira no painel principal.'}
        </p>
        <button 
          onClick={() => setHeroPersona(heroPersona === 'dividas' ? 'patrimonio' : 'dividas')} 
          className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider"
        >
          {heroPersona === 'dividas' 
            ? 'Já organizou a base e quer evoluir para investimentos? Veja a jornada patrimonial →' 
            : 'Precisa organizar suas pendências antes de investir? Veja a jornada de quitação →'}
        </button>
      </div>

      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course) => {
          const isDebtCourse = course.id === 'dividas' || course.slug === 'dividas';
          const isFeaturedDebtCourse = heroPersona === 'dividas' && isDebtCourse;
          return (
            <div 
              key={course.id} 
              className={`relative rounded-2xl p-6 transition-all duration-300 cursor-pointer border flex flex-col justify-between ${
                isFeaturedDebtCourse 
                  ? 'md:col-span-2 lg:col-span-2 bg-[#111622] border-blue-500/40 shadow-[0_10px_35px_rgba(37,99,235,0.15)]' 
                  : 'bg-[#111622] border-white/[0.06] hover:border-white/[0.12]'
              }`}
              onClick={() => {
                let internalSlug: string | null = null;
                if (course.slug === 'plano-realista-para-sair-das-dividas') internalSlug = 'dividas';
                else if (course.slug === 'investidor-iniciante-seus-primeiros-passos') internalSlug = 'investidor-iniciante';
                if (internalSlug) navigate(`/curso/${internalSlug}`);
                else setSelectedCourse(course);
              }}
            >
              <div>
                {isFeaturedDebtCourse && (
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center rounded-lg bg-blue-950/40 border border-blue-900/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">Destaque de Onboarding</span>
                  </div>
                )}
                
                <div className="w-12 h-12 rounded-xl bg-[#0B0F17] border border-white/[0.08] flex items-center justify-center text-2xl mb-6">
                  {course.icon}
                </div>

                <span className="inline-flex items-center rounded-lg bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#A0A4AB] mb-4">
                  Conteúdo Exclusivo
                </span>
                
                <h4 className="text-xl font-bold text-white mb-3 tracking-tight group-hover:text-blue-400 transition-colors">
                  {course.title}
                </h4>
                
                <p className="text-sm text-[#A0A4AB] leading-relaxed mb-6">
                  {course.excerpt}
                </p>
              </div>

              {isFeaturedDebtCourse && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/[0.04] mt-auto">
                  <div className="rounded-xl bg-[#0B0F17] border border-white/[0.06] px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-wider text-blue-400 mb-1">Resultado</p>
                    <p className="text-xs font-semibold text-white">Comando absoluto de rota</p>
                  </div>
                  <div className="rounded-xl bg-[#0B0F17] border border-white/[0.06] px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-wider text-[#A0A4AB] mb-1">Formato</p>
                    <p className="text-xs font-semibold text-white">Piloto guiado</p>
                  </div>
                  <div className="rounded-xl bg-[#0B0F17] border border-white/[0.06] px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-wider text-[#A0A4AB] mb-1">Alvo</p>
                    <p className="text-xs font-semibold text-white">Sair do vermelho</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};