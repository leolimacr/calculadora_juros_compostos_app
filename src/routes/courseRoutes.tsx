import React from 'react';
import { Route } from 'react-router-dom';
import { CourseTrackPage } from '../features/courses/pages/CourseTrackPage';
import { ModuleOverviewPage } from '../features/courses/pages/ModuleOverviewPage';
import { LessonPage } from '../features/courses/pages/LessonPage';

export const courseRoutes = (
  <>
    <Route path="/curso/:courseSlug" element={<CourseTrackPage />} />
    <Route path="/curso/:courseSlug/modulo/:moduleSlug" element={<ModuleOverviewPage />} />
    <Route path="/curso/:courseSlug/modulo/:moduleSlug/aula/:lessonSlug" element={<LessonPage />} />
    <Route path="*" element={<CourseTrackPage />} />
  </>
);

export const CourseRoutesShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="pt-16 pb-24 min-h-screen h-full bg-slate-50 w-full relative z-0 overflow-y-auto">
    {children}
  </div>
);
