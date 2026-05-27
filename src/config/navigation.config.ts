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
    id: 'home',
    label: 'Home',
    path: '/home',
    mobile: true,
    desktop: true,
  },
  {
    id: 'controla',
    label: 'Controla',
    path: '/controla',
    mobile: true,
    desktop: true,
  },
  {
    id: 'evolui',
    label: 'Evolui',
    path: '/evolui',
    mobile: true,
    desktop: true,
  },
  {
    id: 'explora',
    label: 'Explora',
    path: '/explora',
    mobile: true,
    desktop: true,
  },
  {
    id: 'mais',
    label: 'Mais',
    path: '/mais',
    mobile: true,
    desktop: true,
  },
];
