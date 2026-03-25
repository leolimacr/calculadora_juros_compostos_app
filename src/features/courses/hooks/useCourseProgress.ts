import { useState, useEffect } from 'react';

export interface CourseProgress {
  courseSlug: string;
  completedLessons: string[];
  unlockedBadges: string[];
  lastAccessedModule?: string;
  lastAccessedLesson?: string;
}

export interface CourseProgressState {
  progress: CourseProgress | null;
  isLoading: boolean;
  markLessonAsCompleted: (lessonSlug: string) => Promise<void>;
  getCourseCompletionPercentage: () => number;
  getModuleCompletionPercentage: (moduleSlug: string) => number;
  isLessonCompleted: (lessonSlug: string) => boolean;
}

// Mock inicial para podermos ver as telas funcionando
const MOCK_PROGRESS: CourseProgress = {
  courseSlug: 'dividas',
  completedLessons:[], // Começa vazio para vermos o progresso do zero
  unlockedBadges:[],
};

export const useCourseProgress = (courseSlug: string): CourseProgressState => {
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const[isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulando o tempo de carregamento do banco de dados (500ms)
    const timer = setTimeout(() => {
      setProgress(MOCK_PROGRESS);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  },[courseSlug]);

  const markLessonAsCompleted = async (lessonSlug: string) => {
    setProgress((prev) => {
      if (!prev) return prev;
      if (prev.completedLessons.includes(lessonSlug)) return prev;
      return {
        ...prev,
        completedLessons:[...prev.completedLessons, lessonSlug],
        lastAccessedLesson: lessonSlug
      };
    });
  };

  const getCourseCompletionPercentage = () => {
    if (!progress) return 0;
    // Mock temporário: supondo que o curso tenha 5 aulas no total
    const totalLessons = 5; 
    return Math.round((progress.completedLessons.length / totalLessons) * 100);
  };

  const getModuleCompletionPercentage = (_moduleSlug: string) => {
    return 0; // Será implementado depois com a registry real
  };

  const isLessonCompleted = (lessonSlug: string) => {
    return progress?.completedLessons.includes(lessonSlug) ?? false;
  };

  return {
    progress,
    isLoading,
    markLessonAsCompleted,
    getCourseCompletionPercentage,
    getModuleCompletionPercentage,
    isLessonCompleted
  };
};