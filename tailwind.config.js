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
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: '#10b981',   // emerald-500
          secondary: '#0ea5e9', // sky-500
          accent: '#f59e0b',    // amber-500
          technical: '#6366f1', // indigo-500
        },
        status: {
          success: '#10b981',
          danger: '#ef4444',
          warning: '#f59e0b',
          info: '#3b82f6',
        },
        surface: {
          primary: '#ffffff',
          secondary: '#f2f2f7', // Cinza Pérola (Apple Background)
          elevated: '#e5e5ea',
          dark: '#0f172a',
          deep: '#020617',
          glass: 'rgba(255, 255, 255, 0.8)',
        },
        text: {
          primary: '#0f172a',
          secondary: '#3a3a3c',
          muted: '#8e8e93',
          onBrand: '#ffffff',
          technical: '#64748b',
        }
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.03)',
        'floating': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03)',
        'card': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        'brand-glow': '0 10px 15px -3px rgba(16, 185, 129, 0.1)',
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
