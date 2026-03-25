// src/features/courses/pages/LessonPage.tsx

import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ChevronRight, Loader2 } from 'lucide-react';

import { useCourseProgress } from '../hooks/useCourseProgress';
import { coursesRegistry, type CourseSlug } from '../registry';
import BlockRenderer from '../components/BlockRenderer';

export const LessonPage: React.FC = () => {
  const params = useParams<{ courseSlug: string; moduleSlug: string; lessonSlug?: string; lessonId?: string }>();
  const navigate = useNavigate();

  const safeCourseSlug = (params.courseSlug || 'dividas') as CourseSlug;
  const moduleSlug = params.moduleSlug;
  // Pega o slug da aula independente de como foi nomeado no App.tsx
  const activeLessonSlug = params.lessonSlug || params.lessonId;

  const course = coursesRegistry[safeCourseSlug];

  const { progress, isLoading, markLessonAsCompleted, isLessonCompleted } = useCourseProgress(safeCourseSlug);
  const [isCompleting, setIsCompleting] = useState(false);

  // Busca os dados do módulo e da aula atual
  const { moduleData, lessonData, lessonIndex, nextLesson } = useMemo(() => {
    const mod = course?.modules.find(m => m.slug === moduleSlug);
    const idx = mod?.lessons.findIndex(l => l.slug === activeLessonSlug) ?? -1;
    const currentLesson = idx !== -1 ? mod?.lessons[idx] : null;
    const nextLess = mod && idx !== -1 && idx + 1 < mod.lessons.length ? mod.lessons[idx + 1] : null;

    return {
      moduleData: mod,
      lessonData: currentLesson,
      lessonIndex: idx,
      nextLesson: nextLess,
    };
  }, [course, moduleSlug, activeLessonSlug]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
      </div>
    );
  }

  if (!course || !moduleData || !lessonData) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <p className="text-gray-600 mb-4">Aula não encontrada.</p>
        <button onClick={() => navigate(`/curso/${safeCourseSlug}`)} className="text-blue-600 font-semibold">
          Voltar para a trilha
        </button>
      </div>
    );
  }

  // Verifica se o usuário já havia concluído esta aula antes
  const alreadyCompleted = isLessonCompleted(lessonData.slug);

  // Lógica do Botão de Conclusão
  const handleCompleteLesson = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    
    // Marca como concluído no estado/backend
    await markLessonAsCompleted(lessonData.slug);
    
    // Navega para o próximo passo
    if (nextLesson) {
      // Vai para a próxima aula
      navigate(`/curso/${safeCourseSlug}/modulo/${moduleSlug}/aula/${nextLesson.slug}`);
    } else {
      // Se não tem próxima aula neste módulo, volta para o overview do módulo
      navigate(`/curso/${safeCourseSlug}/modulo/${moduleSlug}`);
    }
    
    setIsCompleting(false);
  };

  // Cálculo para a barra de progresso do topo
  const totalLessons = moduleData.lessons.length;
  const currentStep = lessonIndex + 1;
  const progressPercentage = (currentStep / totalLessons) * 100;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* NAVEGAÇÃO SUPERIOR (Fixa) */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-gray-100 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between mb-3">
          <button 
            onClick={() => navigate(`/curso/${safeCourseSlug}/modulo/${moduleSlug}`)}
            className="p-2 -ml-2 text-gray-500 active:bg-gray-100 rounded-full transition-colors"
            aria-label="Voltar para o módulo"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            AULA {currentStep} DE {totalLessons}
          </span>
          {/* Espaço vazio para centralizar o texto (truque de flexbox) */}
          <div className="w-9"></div> 
        </div>

        {/* Barra de progresso linear fina no topo */}
        <div className="max-w-xl mx-auto w-full bg-gray-100 rounded-full h-1">
          <div 
            className="bg-blue-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 px-5 pt-8 pb-32 max-w-xl mx-auto w-full">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-8 leading-tight">
          {lessonData.title}
        </h1>

        {/* ITERAÇÃO SOBRE OS BLOCOS */}
        <div className="flex flex-col gap-6">
          {lessonData.blocks?.map((block: any, index: number) => (
            // O BlockRenderer é o responsável por saber se é TextBlock, ToolCTA, ActionBlock, etc.
            <BlockRenderer key={index} block={block} />
          ))}
        </div>
      </main>

      {/* FOOTER DE AÇÃO (Fixo na base) */}
      <footer className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 pb-8 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="max-w-xl mx-auto">
          <button
            onClick={handleCompleteLesson}
            disabled={isCompleting}
            className={`w-full py-4 rounded-xl shadow-md flex items-center justify-center gap-2 font-semibold transition-all active:scale-95 ${
              alreadyCompleted
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isCompleting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : alreadyCompleted ? (
              <>
                Ir para o próximo passo
                <ChevronRight className="w-5 h-5" />
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                {nextLesson ? 'Concluir e ir para a próxima' : 'Concluir Módulo'}
              </>
            )}
          </button>
        </div>
      </footer>

    </div>
  );
};