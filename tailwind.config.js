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
    extend: {},
  },
  plugins: [],
}