/**
 * Design System Tokens - Finanças Pro Invest
 * Fonte de verdade para estilos programáticos (Gráficos, Canvas, Inline Styles)
 */

export const COLORS = {
  brand: {
    primary: '#059669',   // emerald-600
    secondary: '#0284c7', // sky-600
    accent: '#f59e0b',    // amber-500
  },
  status: {
    success: '#10b981',   // emerald-500
    danger: '#e11d48',    // rose-600
    // Compartilha o mesmo hex que brand.accent por decisão semântica
    warning: '#f59e0b',   // amber-500
    info: '#0ea5e9',      // sky-500
  },
  surface: {
    primary: '#ffffff',   // white
    secondary: '#f8fafc', // slate-50
    elevated: '#f1f5f9',  // slate-100
    dark: '#0f172a',      // slate-900
    deep: '#020617',      // Blue-Black
  },
  text: {
    primary: '#0f172a',   // slate-900
    secondary: '#475569', // slate-600
    muted: '#94a3b8',     // slate-400
    onBrand: '#ffffff',   // white
  }
} as const;

export const GRADIENTS = {
  brand: 'linear-gradient(to bottom right, #10b981, #059669)',
  dark: 'linear-gradient(to bottom right, #020617, #1e293b)',
  info: 'linear-gradient(to bottom right, #38bdf8, #0284c7)',
  amber: 'linear-gradient(to bottom right, #fbbf24, #d97706)',
} as const;

export const TYPOGRAPHY = {
  // text-xxs, font-black e tracking-ultra-wide definidos no tailwind.config
  label: 'text-xxs font-black uppercase tracking-ultra-wide',
  title: 'text-3xl font-black tracking-tight',
  subtitle: 'text-xs font-bold uppercase tracking-widest text-slate-400',
} as const;

export const RADIUS = {
  card: 'rounded-4xl',
  container: 'rounded-5xl',
  button: 'rounded-2xl', // Nativo do Tailwind
} as const;

export const SHADOWS = {
  sm: 'shadow-sm',
  card: 'shadow-card',
  brand: 'shadow-brand-glow',
} as const;
