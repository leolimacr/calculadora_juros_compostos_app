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
    <section id="secao-cursos" className="px-4 lg:px-12 py-16 max-w-[1600px] mx-auto w-full">
      <div className="mb-12 text-center md:text-left">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest mb-4 ${heroPersona === 'dividas' ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-indigo-100 border-indigo-200 text-indigo-700'}`}>
          <span className={`w-2 h-2 rounded-full animate-pulse ${heroPersona === 'dividas' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>Aprenda no seu ritmo
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          {heroPersona === 'dividas' ? <>'Primeiro organize a base. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-sky-600">Depois aprofunde.</span></> : <>'Primeiro organize a base. <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-700">Depois refine decisões.</span></>}
        </h2>
        <p className="text-slate-600 max-w-2xl text-sm md:text-base mx-auto md:mx-0 mb-4">{heroPersona === 'dividas' ? 'Os cursos entram para aprofundar entendimento, organização e disciplina depois que sua base inicial já começou a ser construída.' : 'Os cursos complementam o ecossistema com conteúdo direto para amadurecer decisões depois que sua base patrimonial e sua rotina financeira já começaram a ganhar contexto.'}</p>
        <button onClick={() => setHeroPersona(heroPersona === 'dividas' ? 'patrimonio' : 'dividas')} className="text-xs font-bold underline decoration-slate-300 underline-offset-4 text-slate-500 hover:text-slate-900 transition-colors">{heroPersona === 'dividas' ? 'Já organizou a base e quer evoluir para investimentos? Veja a outra jornada.' : 'Precisa organizar dívidas antes de pensar em investir melhor? Veja a outra jornada.'}</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const isDebtCourse = course.id === 'dividas' || course.slug === 'dividas';
          const isFeaturedDebtCourse = heroPersona === 'dividas' && isDebtCourse;
          return (
            <div key={course.id} className={`relative backdrop-blur-md rounded-2xl p-6 transition-all duration-500 cursor-pointer group overflow-hidden shadow-sm ${isFeaturedDebtCourse ? 'md:col-span-2 lg:col-span-2 bg-gradient-to-br from-emerald-50 via-white to-sky-50 border-2 border-emerald-300 hover:border-emerald-400' : 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
              onClick={() => {
                let internalSlug: string | null = null;
                if (course.slug === 'plano-realista-para-sair-das-dividas') internalSlug = 'dividas';
                else if (course.slug === 'investidor-iniciante-seus-primeiros-passos') internalSlug = 'investidor-iniciante';
                if (internalSlug) navigate(`/curso/${internalSlug}`);
                else setSelectedCourse(course);
              }}>
              {isFeaturedDebtCourse && (
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center rounded-full bg-emerald-100 border border-emerald-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">Curso em destaque</span>
                  <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Aprofunde por aqui</span>
                </div>
              )}
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-6 shadow-sm group-hover:scale-110 transition-all duration-300 ${heroPersona === 'dividas' ? 'bg-emerald-50 border border-emerald-200 group-hover:bg-emerald-100' : 'bg-indigo-50 border border-indigo-200 group-hover:bg-indigo-100'}`}>{course.icon}</div>
              <div className="mb-3">
                <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Curso online</span>
                <h4 className={`text-xl font-bold text-slate-900 transition-colors duration-300 ${heroPersona === 'dividas' ? 'group-hover:text-emerald-700' : 'group-hover:text-indigo-700'}`}>{course.title}</h4>
              </div>
              <p className={`text-sm text-slate-600 leading-relaxed ${isFeaturedDebtCourse ? 'mb-4 max-w-2xl' : 'mb-6 line-clamp-2'}`}>{course.excerpt}</p>
              {isFeaturedDebtCourse && (
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-white border border-emerald-200 px-4 py-3"><p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-1">Resultado</p><p className="text-sm font-semibold text-slate-800">Mais clareza para organizar a próxima etapa</p></div>
                  <div className="rounded-xl bg-white border border-slate-200 px-4 py-3"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Formato</p><p className="text-sm font-semibold text-slate-800">Trilha guiada</p></div>
                  <div className="rounded-xl bg-white border border-slate-200 px-4 py-3"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Ideal para</p><p className="text-sm font-semibold text-slate-800">Quem quer sair do vermelho</p></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};