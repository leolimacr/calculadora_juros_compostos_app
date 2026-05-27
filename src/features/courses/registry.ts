import { debtRescueCourse } from './debt-rescue';
import { beginnerInvestorCourse } from './beginner-investor';
import type { Course } from '~types';

// Define a lista canônica de todos os cursos
export const allCourses: Course[] = [debtRescueCourse, beginnerInvestorCourse];

// Cria um registro para fácil acesso por slug ou ID
export const coursesRegistry = allCourses.reduce((acc, course) => {
  acc[course.meta.slug] = course;
  // Adiciona IDs legados ou alternativos para compatibilidade
  if (course.meta.id === 'plano-realista-para-sair-das-dividas') {
    acc['dividas'] = course;
  }
  if (course.meta.id === 'investidor-iniciante') {
    acc['investidor-iniciante'] = course;
  }
  return acc;
}, {} as Record<string, Course>);

export type CourseSlug = keyof typeof coursesRegistry;
