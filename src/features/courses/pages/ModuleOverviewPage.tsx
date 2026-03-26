// src/features/courses/pages/ModuleOverviewPage.tsx
import { coursesRegistry, type CourseSlug } from '../registry';
import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, PlayCircle, Lock, Clock } from 'lucide-react';

import { useCourseProgress } from '../hooks/useCourseProgress';
// IMPORTANTE: Ajuste este import para pegar a sua registry real!
// import { courseRegistry } from '../debt-rescue/registry';
// ==========================================

export const ModuleOverviewPage: React.FC = () => {
  const { courseSlug, moduleSlug } = useParams<{ courseSlug: string; moduleSlug: string }>();
  const navigate = useNavigate();
  const { progress, isLoading } = useCourseProgress(courseSlug || 'dividas');
  // Descobre a posição (1, 2, 3...) do módulo dentro do curso
  const moduleIndex = useMemo(() => {
    if (!courseSlug || !moduleSlug) return null;
    const course = coursesRegistry[courseSlug as CourseSlug];
    if (!course) return null;
    const idx = course.modules.findIndex((m) => m.slug === moduleSlug);
    return idx >= 0 ? idx + 1 : null; // +1 para ficar 1-based
  }, [courseSlug, moduleSlug]);
  // Encontra os dados do módulo atual na Registry
  const moduleData = useMemo(() => {
    if (!courseSlug) return null;

    const course = coursesRegistry[courseSlug as CourseSlug];
    if (!course) return null;

    return course.modules.find((m) => m.slug === moduleSlug) ?? null;
  }, [courseSlug, moduleSlug]);

  // Processa o estado de cada aula dentro deste módulo
  const { lessonsState, nextLessonSlug, completedCount } = useMemo(() => {
    if (!progress || !moduleData) {
      return { lessonsState: [], nextLessonSlug: null, completedCount: 0 };
    }

    let foundCurrent = false;
    let nextSlug: string | null = null;
    let completed = 0;
    const states = moduleData.lessons.map((lesson) => {
      const isCompleted = progress.completedLessons.includes(lesson.slug);

      if (isCompleted) {
        completed++;
      }

      // novo tipo inclui 'locked'
      let status: 'completed' | 'current' | 'unlocked' | 'locked' = 'locked';

      if (isCompleted) {
        status = 'completed';
      } else if (!foundCurrent) {
        // primeira não-concluída vira aula atual
        status = 'current';
        foundCurrent = true;
        nextSlug = lesson.slug;
      } else {
        // aulas depois da atual ficam travadas
        status = 'locked';
      }

      return { ...lesson, status };
    });
    return {
      lessonsState: states,
      nextLessonSlug: nextSlug,
      completedCount: completed,
    };
  }, [progress, moduleData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Módulo não encontrado</h2>
        <p className="text-gray-600 mb-6">Parece que esse conteúdo não está disponível.</p>
        <button onClick={() => navigate(`/curso/${courseSlug}`)} className="text-blue-600 font-semibold">
          Voltar para a Trilha
        </button>
      </div>
    );
  }

  const isModuleFinished = completedCount === moduleData.lessons.length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* HEADER: Navegação e Título */}
      <header className="bg-white px-4 pt-6 pb-6 shadow-sm">
        <button 
          onClick={() => navigate(`/curso/${courseSlug}`)}
          className="flex items-center text-gray-500 mb-6 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">Voltar para a trilha</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
          {moduleIndex && (
            <span className="text-xs font-black uppercase tracking-[0.18em] text-gray-400 block mb-1">
              Módulo {moduleIndex}
            </span>
          )}
          {moduleData.title}
        </h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          {moduleData.objective}
        </p>
      </header>

      {/* LISTA DE AULAS */}
      <main className="px-4 mt-8 max-w-lg mx-auto">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
          {/* Nome do módulo + progresso */}
          <span className="text-[11px] text-gray-500 font-semibold normal-case">
            {moduleData.title}
          </span>
          <span className="mx-2 text-gray-300">·</span>
          <span>
            {completedCount}/{moduleData.lessons.length} aulas concluídas
          </span>
        </h2>
        <div className="flex flex-col gap-3">
          {lessonsState.map((lesson, index) => {
            // isLocked aqui se refere a se o módulo está bloqueado, não a aula individualmente
            // A aula só é "bloqueada" se o módulo pai estiver bloqueado (tratado na CourseTrackPage)
            // ou se for uma aula futura em um módulo que exige sequência estrita.
            // Para este caso, vamos considerar que todas as aulas de um módulo acessível são clicáveis.
            const isLocked = lesson.status === 'locked';

            const isCompleted = lesson.status === 'completed';
            const isCurrent = lesson.status === 'current';
            return (
              <Link
                key={lesson.slug}
                to={isLocked ? '#' : `/curso/${courseSlug}/modulo/${moduleSlug}/aula/${lesson.slug}`}
                onClick={(e) => {
                  if (isLocked) e.preventDefault();
                }}
                className={`flex items-center p-4 rounded-2xl border transition-all ${
                  isLocked
                    ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                    : isCompleted
                      ? 'bg-white border-emerald-200 shadow-sm'
                      : isCurrent
                        ? 'bg-white border-blue-300 shadow-md ring-2 ring-blue-50'
                        : 'bg-white border-slate-200 shadow-sm hover:bg-slate-50'
                }`}
              >
                {/* ÍCONE DE STATUS */}
                <div className="mr-4">
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : ( // Se não está completa, é a atual ou desbloqueada
                    <PlayCircle className="w-6 h-6 text-blue-600" />
                  )}
                </div>

                {/* TEXTOS */}
                <div className="flex-1">
                  <p className={`text-xs font-bold mb-1 ${
                     isCompleted ? 'text-emerald-600' : 'text-blue-600'
                  }`}>
                    AULA {index + 1}
                  </p>
                  <h3 className={`text-sm font-semibold leading-snug text-gray-900`}>
                    {lesson.title}
                  </h3>
                  
                  {/* DURAÇÃO */}
                  {lesson.durationMinutes && (
                    <div className="flex items-center mt-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {lesson.durationMinutes} min
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* FOOTER FIXO: Call to Action Principal */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-lg mx-auto">
          {!isModuleFinished && nextLessonSlug ? (
            <button 
              onClick={() => navigate(`/curso/${courseSlug}/modulo/${moduleSlug}/aula/${nextLessonSlug}`)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <PlayCircle className="w-5 h-5" />
              {completedCount === 0 ? 'Começar Módulo' : 'Continuar Módulo'}
            </button>
          ) : (
            <button 
              onClick={() => navigate(`/curso/${courseSlug}`)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              Módulo Concluído - Voltar à Trilha
            </button>
          )}
        </div>
      </div>
    </div>
  );
};