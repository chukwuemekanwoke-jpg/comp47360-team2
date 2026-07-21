import { vars } from "nativewind";
import type { ThemeName } from "@shared/settingsSlice";

// Runtime palette for the session theme toggle. Values are space-separated
// RGB triplets consumed by tailwind.config.js as
// `rgb(var(--table-*) / <alpha-value>)`. Dark mirrors the web palette.
export const themeVars: Record<ThemeName, ReturnType<typeof vars>> = {
  dark: vars({
    "--table-canvas": "0 0 0",
    "--table-surface": "9 9 11",
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
    canvas: "#000000",
    surface: "#09090b",
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