export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  mobile: boolean;
  desktop: boolean;
  icon?: string;
  badge?: string | number;
  disabled?: boolean;
}

export const navigationItems: NavigationItem[] = [
  {
    id: 'central',
    label: 'Central',
    path: '/app/central',
    mobile: true,
    desktop: true,
  },
  {
    id: 'controla',
    label: 'Controla',
    path: '/app/controla',
    mobile: true,
    desktop: true,
  },
  {
    id: 'agenda',
    label: 'Agenda',
    path: '/app/agenda',
    mobile: true,
    desktop: true,
  },
  {
    id: 'explorar',
    label: 'Explorar',
    path: '/app/explorar',
    mobile: true,
    desktop: true,
  },
  {
    id: 'mais',
    label: 'Mais',
    path: '/app/mais',
    mobile: true,
    desktop: true,
  },
];
