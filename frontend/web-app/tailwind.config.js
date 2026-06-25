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
          canvas: 'var(--table-canvas, #0F172A)',
          surface: 'var(--table-surface, #111827)',
          surfaceElevated: 'var(--table-surface-elevated, #172033)',
          border: 'var(--table-border, #243044)',
          interactive: 'var(--table-interactive, #1E293B)',
          text: 'var(--table-text, #F8FAFC)',
          textMuted: 'var(--table-text-muted, #A8B3C7)',
          textSubtle: 'var(--table-text-subtle, #64748B)',
          primary: 'var(--table-primary, #31D5D5)',
          primaryHover: 'var(--table-primary-hover, #67E8F9)',
          offer: 'var(--table-offer, #F59E0B)',
          success: 'var(--table-success, #10B981)',
          warning: 'var(--table-warning, #F59E0B)',
          danger: 'var(--table-danger, #EF4444)',

          // Backwards-compatible aliases for existing components.
          // New code should prefer table-text and table-primary.
          cream: 'var(--table-text, #F8FAFC)',
          gold: 'var(--table-primary, #31D5D5)',
          live: 'var(--table-success, #10B981)',

          light: {
            canvas: '#F8FAFC',
            surface: '#FFFFFF',
            surfaceElevated: '#F1F5F9',
            border: '#CBD5E1',
            interactive: '#E2E8F0',
            text: '#0F172A',
            textMuted: '#475569',
            textSubtle: '#64748B',
            primary: '#0891B2',
            primaryHover: '#0E7490',
            offer: '#D97706',
            success: '#059669',
            warning: '#D97706',
            danger: '#DC2626',
          },
        }
      },
      fontFamily: {
        display: ['Inter', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        serif: ['Inter', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
