import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

const STORAGE_KEY = 'table_theme';

// Applied synchronously (not in a useEffect) so the very first paint already
// has the right theme — a useEffect only runs after mount/commit, which is
// too late and produces a dark->light flash on every load for light-mode
// users. Same class of first-paint timing issue AuthContext's dummy-session
// seeding comment describes; same fix (do it before React ever paints).
function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  const theme = localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  return theme;
}

// Wraps the whole app (not just the merchant dashboard) so the toggle in
// Settings affects every screen, including login/register, consistent with
// index.css's [data-theme='light'] token overrides.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- context + hook pair, same shape as AuthContext
export const useTheme = () => useContext(ThemeContext);
