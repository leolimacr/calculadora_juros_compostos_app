import React from 'react';

const LIGHT_BG_TOOLS = new Set([
  'home',
  'manager',
  'settings',
  'pricing',
  'chat',
  'central',
  'minhas-dividas',
  'passivos',
  'investimentos',
  'metas',
]);

export function usesLightBackground(currentTool: string): boolean {
  return LIGHT_BG_TOOLS.has(currentTool) || currentTool.startsWith('tool-');
}

interface PageShellProps {
  currentTool: string;
  isAuthRoute?: boolean;
  withMobileNav?: boolean;
  children: React.ReactNode;
}

// Fase 1.5 — canvas com hierarquia de superfícies apenas nas telas
// Central, Controla e Explorar. Demais telas (incluindo Agenda)
// mantêm o fundo anterior.
const CANVAS_TOOLS = new Set(['central', 'home', 'manager', 'explorar']);

const PageShell: React.FC<PageShellProps> = ({
  currentTool,
  isAuthRoute = false,
  withMobileNav = false,
  children,
}) => (
  <div
    className={`${
      isAuthRoute
        ? 'pt-0 pb-0'
        : withMobileNav
          ? 'pb-28'
          : 'pb-24'
    } min-h-full ${CANVAS_TOOLS.has(currentTool) ? 'bg-surface-canvas' : 'bg-slate-50'}`}
  >
    {children}
  </div>
);

export default PageShell;
