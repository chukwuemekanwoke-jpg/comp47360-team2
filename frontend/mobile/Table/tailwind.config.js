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
        // Mirrors the web tailwind.config.js exactly
        table: {
          canvas:      '#000000',  // page background
          surface:     '#09090b',  // card background (zinc-950)
          border:      '#27272a',  // zinc-800
          interactive: '#3f3f46',  // zinc-700 - hover / pressed
          cream:       '#fbf7f2',  // warm text on dark
          gold:        '#ebd8c3',  // secondary warm text
          live:        '#10b981',  // emerald-500 - availability / positive
          offer:       '#f59e0b',  // amber-500  - flash deals
          teal:        '#00f2fe',  // brand accent (from web)
        },
      },
    },
  },
  plugins: [],
};
