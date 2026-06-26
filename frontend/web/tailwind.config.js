/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        table: {
          canvas: '#0F172A',
          surface: '#111827',
          surfaceElevated: '#172033',
          border: '#243044',
          interactive: '#1E293B',
          text: '#F8FAFC',
          textMuted: '#A8B3C7',
          textSubtle: '#64748B',
          primary: '#31D5D5',
          primaryHover: '#67E8F9',
          offer: '#F59E0B',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444'
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    }
  },
  plugins: [],
}