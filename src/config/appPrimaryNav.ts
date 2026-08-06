import type { LucideIcon } from 'lucide-react';
import { House, LayoutDashboard, Compass, CalendarDays } from 'lucide-react';
import { TOOL_ROUTES } from '../hooks/useNavigation';

export interface PrimaryNavItem {
  /** Chave em TOOL_ROUTES (ex.: manager → /app/controla) */
  toolId: string;
  label: string;
  description: string;
  icon: LucideIcon;
  iconSrc?: string;
}

export const PRIMARY_NAV_ITEMS: PrimaryNavItem[] = [
  {
    toolId: 'central',
    label: 'Central',
    description: 'Painel central e estratégia',
    icon: House,
  },
  {
    toolId: 'manager',
    label: 'Controla',
    description: 'Lançamentos e fluxo',
    icon: LayoutDashboard,
    iconSrc: '/assets/images/brand/icone_controla210726.png',
  },
  {
    toolId: 'explorar',
    label: 'Explorar',
    description: 'Ferramentas e conteúdo',
    icon: Compass,
  },
  {
    toolId: 'agenda',
    label: 'Agenda',
    description: 'Compromissos e alarmes',
    icon: CalendarDays,
  },
];

const PRIMARY_TOOL_IDS = new Set(PRIMARY_NAV_ITEMS.map((item) => item.toolId));

export function isPrimaryNavTool(toolId: string): boolean {
  return PRIMARY_TOOL_IDS.has(toolId);
}

export function getPrimaryNavRoute(toolId: string): string | undefined {
  return TOOL_ROUTES[toolId];
}
