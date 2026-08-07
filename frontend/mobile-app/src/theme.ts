import { vars } from "nativewind";
import type { ThemeName } from "@shared/settingsSlice";

// Runtime palette for the session theme toggle. Values are space-separated
// RGB triplets consumed by tailwind.config.js as
// `rgb(var(--table-*) / <alpha-value>)`.
//
// This palette is mobile's own and is NOT shared with the web dashboard: that
// one is slate-based (canvas `15 23 42`) and carries tokens this one has no
// equivalent for, notably `surfaceElevated`. Changing a colour here has no
// effect there, and vice versa — frontend/web-app/tailwind.config.js reads its
// triplets from `--table-*-rgb` variables defined in the web app's index.css.
export const themeVars: Record<ThemeName, ReturnType<typeof vars>> = {
  dark: vars({
    // Elevation ramp, zinc 950 → 900 → 800. Canvas and surface used to be
    // #000000 and #09090b: a ~3% luminance step that left cards reading as
    // transparent against the page, with only the 1px border to separate them.
    // Canvas is also what global.css paints on <body>, which is why that file
    // hardcodes #09090b.
    "--table-canvas": "9 9 11",
    "--table-surface": "24 24 27",
    "--table-border": "39 39 42",
    "--table-interactive": "63 63 70",
    "--table-cream": "251 247 242",
    "--table-gold": "235 216 195",
    "--table-live": "16 185 129",
    "--table-offer": "245 158 11",
    "--table-teal": "0 242 254",
  }),
  light: vars({
    "--table-canvas": "246 243 238",
    "--table-surface": "255 255 255",
    "--table-border": "228 224 216",
    "--table-interactive": "214 209 198",
    "--table-cream": "28 25 23",
    "--table-gold": "138 115 87",
    "--table-live": "5 150 105",
    "--table-offer": "217 119 6",
    "--table-teal": "8 145 178",
  }),
};

// Hex equivalents for places styled outside tailwind — navigation headers,
// tab bars, ActivityIndicators and other `style={{}}` colors.
export const navColors: Record<
  ThemeName,
  {
    canvas: string;
    surface: string;
    border: string;
    interactive: string;
    cream: string;
    gold: string;
    teal: string;
    offer: string;
    live: string;
  }
> = {
  dark: {
    // Keep in step with themeVars.dark above.
    canvas: "#09090b",
    surface: "#18181b",
    border: "#27272a",
    interactive: "#3f3f46",
    cream: "#fbf7f2",
    gold: "#a1a1aa",
    teal: "#00f2fe",
    offer: "#f59e0b",
    live: "#10b981",
  },
  light: {
    canvas: "#f6f3ee",
    surface: "#ffffff",
    border: "#e4e0d8",
    interactive: "#d6d1c6",
    cream: "#1c1917",
    gold: "#8a7357",
    teal: "#0891b2",
    offer: "#d97706",
    live: "#059669",
  },
};