import { CursoInvestidorIniciante, metadata as metaIniciante } from './CursoInvestidorIniciante';

export const courses = [
  {
    ...metaIniciante,
    component: CursoInvestidorIniciante
  }
];

export const getCourseById = (id: string) => 
  courses.find(course => course.id === id);