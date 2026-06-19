import type { LucideIcon } from 'lucide-react';
import { House, LayoutDashboard, Sparkles, Compass } from 'lucide-react';
import { TOOL_ROUTES } from '../hooks/useNavigation';

export interface PrimaryNavItem {
  /** Chave em TOOL_ROUTES (ex.: manager → /app/controla) */
  toolId: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV_ITEMS: PrimaryNavItem[] = [
  {
    toolId: 'home',
    label: 'Home',
    description: 'Visão geral do mês',
    icon: House,
  },
  {
    toolId: 'manager',
    label: 'Controla',
    description: 'Lançamentos e fluxo',
    icon: LayoutDashboard,
  },
  {
    toolId: 'central',
    label: 'Central',
    description: 'Evolução e estratégia',
    icon: Sparkles,
  },
  {
    toolId: 'explorar',
    label: 'Explorar',
    description: 'Ferramentas e conteúdo',
    icon: Compass,
  },
];

const PRIMARY_TOOL_IDS = new Set(PRIMARY_NAV_ITEMS.map((item) => item.toolId));

export function isPrimaryNavTool(toolId: string): boolean {
  return PRIMARY_TOOL_IDS.has(toolId);
}

export function getPrimaryNavRoute(toolId: string): string | undefined {
  return TOOL_ROUTES[toolId];
}
