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
  children: React.ReactNode;
}

const PageShell: React.FC<PageShellProps> = ({ currentTool, isAuthRoute = false, children }) => (
  <div
    className={`${isAuthRoute ? 'pt-0 pb-0' : 'pt-16 pb-24'} min-h-screen h-full bg-slate-50`}
  >
    {children}
  </div>
);

export default PageShell;
