import React, { useMemo } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Lock, CheckCircle2, PlayCircle, Trophy, ArrowRight } from 'lucide-react';

import { useCourseProgress } from '../hooks/useCourseProgress';
import { coursesRegistry, type CourseSlug } from '../registry';

export const CourseTrackPage: React.FC = () => {
  const navigate = useNavigate();
  const { courseSlug } = useParams<{ courseSlug: string }>();

  const safeCourseSlug = (courseSlug || 'dividas') as CourseSlug;
  const course = coursesRegistry[safeCourseSlug];

  const { progress, isLoading, getCourseCompletionPercentage } = useCourseProgress(safeCourseSlug);

  const { currentModuleSlug, currentLessonSlug, moduleStates } = useMemo(() => {
    if (!progress || !course) {
      return { currentModuleSlug: '', currentLessonSlug: '', moduleStates: [] };
    }

    let foundCurrent = false;
    let nextMod = '';
    let nextLess = '';

    const states = course.modules.map((mod) => {
      const completedLessonsInMod = mod.lessons.filter((l) =>
        progress.completedLessons.includes(l.slug)
      ).length;

      const isCompleted = completedLessonsInMod === mod.lessons.length;
      const isUnlocked = true; // Para o curso de investidor iniciante, todos os módulos são desbloqueados

      if (isUnlocked && !isCompleted && !foundCurrent) {
        foundCurrent = true;
        nextMod = mod.slug;
        nextLess =
          mod.lessons.find((l) => !progress.completedLessons.includes(l.slug))?.slug || '';
      }

      return {
        ...mod,
        isCompleted,
        isUnlocked,
        completedCount: completedLessonsInMod,
        totalCount: mod.lessons.length,
      };
    });

    return {
      currentModuleSlug: nextMod || course.modules[0]?.slug || '',
      currentLessonSlug: nextLess || course.modules[0]?.lessons[0]?.slug || '',
      moduleStates: states,
    };
  }, [progress, course]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const completionPercent = getCourseCompletionPercentage();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER / ACOLHIMENTO */}
      <header className="bg-white px-4 pt-10 pb-6 shadow-sm rounded-b-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {course?.meta.title ?? 'Curso'}
        </h1>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          {course?.meta.mainGoal ?? ''}
        </p>

        {/* BARRA DE PROGRESSO GLOBAL */}
        <div className="bg-gray-100 rounded-full h-3 w-full overflow-hidden mb-2">
          <div 
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <p className="text-xs font-medium text-gray-500 text-right">
          {completionPercent}% concluído
        </p>
      </header>

      <main className="px-4 mt-6 max-w-lg mx-auto">
        
        {/* BOTÃO CONTINUAR (Fixo ou no topo da trilha) */}
        {completionPercent < 100 && (
          <button 
            onClick={() => navigate(`/curso/${safeCourseSlug}/modulo/${currentModuleSlug}/aula/${currentLessonSlug}`)}
            className="w-full bg-blue-600 text-white font-semibold py-4 rounded-xl shadow-md flex items-center justify-between px-6 mb-8 active:scale-95 transition-transform"
          >
            <span className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5" />
              Continuar jornada
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}

        {/* BADGES (Exibir apenas se o usuário tiver alguma) */}
        {progress?.unlockedBadges && progress.unlockedBadges.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Suas Conquistas</h2>
            <div className="flex gap-3">
              {progress.unlockedBadges.map(badge => (
                <div key={badge} className="bg-orange-100 p-3 rounded-xl border border-orange-200 flex flex-col items-center gap-1">
                  <Trophy className="w-6 h-6 text-orange-500" />
                  {/* Nome da badge mockado, ideal vir de um dicionário */}
                  <span className="text-[10px] font-bold text-orange-700">PRIMEIRO PASSO</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LISTA DE MÓDULOS */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Trilha do Plano</h2>
          
          <div className="flex flex-col gap-4">
            {moduleStates.map((mod, index) => {
              const isLocked = !mod.isUnlocked;

              return (
                <Link 
                  key={mod.slug}
                  to={isLocked ? '#' : `/curso/${safeCourseSlug}/modulo/${mod.slug}`}
                  className={`relative p-5 rounded-2xl border transition-all ${
                    isLocked 
                      ? 'bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed' 
                      : mod.isCompleted 
                        ? 'bg-white border-emerald-200 shadow-sm'
                        : 'bg-white border-blue-200 shadow-md ring-1 ring-blue-100'
                  }`}
                  onClick={(e) => {
                    if (isLocked) e.preventDefault();
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className={`text-xs font-bold mb-1 ${
                        isLocked ? 'text-gray-400' : mod.isCompleted ? 'text-emerald-600' : 'text-blue-600'
                      }`}>
                        MÓDULO {index + 1}
                      </p>
                      <h3 className={`font-semibold text-base mb-2 ${
                        isLocked ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        {mod.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {mod.completedCount} de {mod.totalCount} aulas concluídas
                      </p>
                    </div>

                    <div className="mt-1">
                      {isLocked ? (
                        <Lock className="w-6 h-6 text-gray-300" />
                      ) : mod.isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <PlayCircle className="w-6 h-6 text-blue-500" />
                      )}
                    </div>
                  </div>

                  {/* Barra de progresso do módulo (opcional, mas visualmente agradável) */}
                  {!isLocked && !mod.isCompleted && (
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all"
                        style={{ width: `${(mod.completedCount / mod.totalCount) * 100}%` }}
                      />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
};