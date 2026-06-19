/**
 * Design System Tokens - Finanças Pro Invest
 * Fonte de verdade para estilos programáticos (Gráficos, Canvas, Inline Styles)
 */

export const COLORS = {
  brand: {
    primary: '#10b981',   // emerald-500
    secondary: '#0ea5e9', // sky-500
    accent: '#f59e0b',    // amber-500
    technical: '#6366f1', // Indigo
  },
  status: {
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#0ea5e9',
  },
  surface: {
    primary: '#ffffff',
    secondary: '#f8f9fb', // Cinza Técnico Ultra-leve
    elevated: '#f2f2f7',
    dark: '#0f172a',
    deep: '#020617',
    glass: 'rgba(255, 255, 255, 0.7)',
    metallic: 'linear-gradient(135deg, #f8f9fb 0%, #e2e8f0 100%)',
  },
  text: {
    primary: '#1c1c1e',   // Quase preto, mas com profundidade
    secondary: '#48484a',
    muted: '#8e8e93',
    onBrand: '#ffffff',
    metallic: 'linear-gradient(to bottom right, #0f172a 30%, #475569 100%)', // Texto Metálico
    silver: 'linear-gradient(to bottom right, #94a3b8 0%, #cbd5e1 100%)',
  }
} as const;

export const SHADOWS = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  card: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
  floating: '0 30px 60px -12px rgba(0, 0, 0, 0.12), 0 18px 36px -18px rgba(0, 0, 0, 0.15)',
  glow: '0 0 20px rgba(16, 185, 129, 0.15)', // Brilho de Marca
  technical: '0 20px 25px -5px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.5)',
} as const;

export const GRADIENTS = {
  brand: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  metallic: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
  silver: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
  glass: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)',
} as const;


export const TYPOGRAPHY = {
  label: 'text-xxs font-black uppercase tracking-[0.2em]',
  title: 'text-4xl font-black tracking-[-0.03em] leading-tight',
  subtitle: 'text-sm font-medium text-gray-500 leading-relaxed',
} as const;

export const RADIUS = {
  card: 'rounded-[2rem]',
  container: 'rounded-[2.5rem]',
  button: 'rounded-2xl',
} as const;

