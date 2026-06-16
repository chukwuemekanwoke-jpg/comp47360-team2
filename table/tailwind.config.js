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
          canvas: '#000000',
          surface: '#09090b',
          border: '#141416',
          interactive: '#1f1f23',
          cream: '#fbf7f2',
          gold: '#ebd8c3',
          live: '#10b981',
          offer: '#f59e0b'
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}