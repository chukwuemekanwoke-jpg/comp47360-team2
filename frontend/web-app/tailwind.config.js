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
          // R-23: these used to be plain `var(--table-primary, #hex)` strings,
          // which Tailwind can't inject an opacity modifier into — every
          // bg-table-x/10, shadow-table-x/30, etc. silently produced fully
          // transparent output. The `rgb(... / <alpha-value>)` form lets
          // Tailwind substitute the modifier (or 1, with none given) into
          // <alpha-value>; the RGB triples themselves live in index.css as
          // --table-x-rgb, alongside (not replacing) the hex vars that
          // direct var(--table-x) references (BrandMark, login glow) use.
          canvas: 'rgb(var(--table-canvas-rgb, 15 23 42) / <alpha-value>)',
          surface: 'rgb(var(--table-surface-rgb, 17 24 39) / <alpha-value>)',
          surfaceElevated: 'rgb(var(--table-surface-elevated-rgb, 23 32 51) / <alpha-value>)',
          border: 'rgb(var(--table-border-rgb, 36 48 68) / <alpha-value>)',
          interactive: 'rgb(var(--table-interactive-rgb, 30 41 59) / <alpha-value>)',
          text: 'rgb(var(--table-text-rgb, 248 250 252) / <alpha-value>)',
          textMuted: 'rgb(var(--table-text-muted-rgb, 168 179 199) / <alpha-value>)',
          textSubtle: 'rgb(var(--table-text-subtle-rgb, 136 150 171) / <alpha-value>)',
          primary: 'rgb(var(--table-primary-rgb, 49 213 213) / <alpha-value>)',
          primaryHover: 'rgb(var(--table-primary-hover-rgb, 103 232 249) / <alpha-value>)',
          offer: 'rgb(var(--table-offer-rgb, 245 158 11) / <alpha-value>)',
          success: 'rgb(var(--table-success-rgb, 16 185 129) / <alpha-value>)',
          warning: 'rgb(var(--table-warning-rgb, 245 158 11) / <alpha-value>)',
          danger: 'rgb(var(--table-danger-rgb, 239 68 68) / <alpha-value>)',

          // Backwards-compatible aliases for existing components.
          // New code should prefer table-text and table-primary.
          cream: 'rgb(var(--table-text-rgb, 248 250 252) / <alpha-value>)',
          gold: 'rgb(var(--table-primary-rgb, 49 213 213) / <alpha-value>)',
          live: 'rgb(var(--table-success-rgb, 16 185 129) / <alpha-value>)',

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
    }
  },
  plugins: [],
}
