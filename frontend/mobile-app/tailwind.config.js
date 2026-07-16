/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Resolved from CSS variables so the session theme toggle
        // (light/dark, see src/theme.ts) can swap the palette at runtime.
        // The dark values mirror the web tailwind.config.js exactly.
        table: {
          canvas:      'rgb(var(--table-canvas) / <alpha-value>)',      // page background
          surface:     'rgb(var(--table-surface) / <alpha-value>)',     // card background
          border:      'rgb(var(--table-border) / <alpha-value>)',
          interactive: 'rgb(var(--table-interactive) / <alpha-value>)', // hover / pressed
          cream:       'rgb(var(--table-cream) / <alpha-value>)',       // primary text
          gold:        'rgb(var(--table-gold) / <alpha-value>)',        // secondary text
          live:        'rgb(var(--table-live) / <alpha-value>)',        // availability / positive
          offer:       'rgb(var(--table-offer) / <alpha-value>)',       // flash deals
          teal:        'rgb(var(--table-teal) / <alpha-value>)',        // brand accent
        },
      },
    },
  },
  plugins: [],
};
