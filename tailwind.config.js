/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    'bg-amber-50',
    'bg-emerald-50',
    'bg-sky-50',
    'bg-purple-50',
    'border-amber-300',
    'border-emerald-300',
    'border-sky-300',
    'border-purple-300',
    'hover:border-amber-400',
    'hover:border-emerald-400',
    'hover:border-sky-400',
    'hover:border-purple-400',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#059669',   // emerald-600
          secondary: '#0284c7', // sky-600
          accent: '#f59e0b',    // amber-500
        },
        status: {
          success: '#10b981',   // emerald-500
          danger: '#e11d48',    // rose-600
          warning: '#f59e0b',   // amber-500
          info: '#0ea5e9',      // sky-500
        },
        surface: {
          primary: '#ffffff',   // white
          secondary: '#f8fafc', // slate-50
          elevated: '#f1f5f9',  // slate-100
          dark: '#0f172a',      // slate-900
          deep: '#020617',      // Blue-Black (App Background)
        },
        text: {
          primary: '#0f172a',   // slate-900
          secondary: '#475569', // slate-600
          muted: '#64748b',     // slate-500
          onBrand: '#ffffff',   // white
        }
      },
      borderRadius: {
        '4xl': '1.75rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'brand-glow': '0 10px 15px -3px rgba(16, 185, 129, 0.2)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      },
      letterSpacing: {
        'ultra-wide': '0.2em',
      },
      fontSize: {
        'xxs': ['0.625rem', { lineHeight: '1rem' }],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(to bottom right, #10b981, #059669)',
        'gradient-dark': 'linear-gradient(to bottom right, #020617, #1e293b)',
        'gradient-info': 'linear-gradient(to bottom right, #38bdf8, #0284c7)',
      }
    },
  },
  plugins: [],
}
