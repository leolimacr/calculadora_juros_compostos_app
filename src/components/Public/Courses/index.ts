import { CursoInvestidorIniciante } from './CursoInvestidorIniciante';
import { allCourses } from '../../../features/courses/registry';

export const courses = allCourses.map(course => ({
  id: course.meta.id,
  slug: course.meta.slug,
  title: course.meta.title,
  excerpt: course.meta.shortDescription,
  icon: course.meta.id === 'plano-realista-para-sair-das-dividas' ? '💳' : '📈',
  modules: course.meta.modulesCount,
  duration: course.meta.estimatedDuration,
  component: CursoInvestidorIniciante
}));

export const getCourseById = (id: string) =>
  courses.find(course => course.id === id);
