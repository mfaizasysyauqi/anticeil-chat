import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export type ThemeMode = 'midnight' | 'dark' | 'light';

export interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'anticeil_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
      if (saved === 'midnight' || saved === 'dark' || saved === 'light') {
        return saved;
      }
    } catch {}
    return 'midnight'; // Default to Discord Midnight AMOLED
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    setTheme(theme === 'midnight' ? 'dark' : theme === 'dark' ? 'light' : 'midnight');
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-midnight', 'theme-dark', 'theme-light', 'dark', 'light');

    if (theme === 'light') {
      root.classList.add('light', 'theme-light');
      root.style.setProperty('--background', '#ffffff');
      root.style.setProperty('--foreground', '#2e3338');
      root.style.setProperty('--sidebar-background', '#f2f3f5');
      root.style.setProperty('--sidebar-border', 'rgba(0, 0, 0, 0.08)');
      root.style.setProperty('--border', 'rgba(0, 0, 0, 0.08)');
    } else if (theme === 'dark') {
      root.classList.add('dark', 'theme-dark');
      root.style.setProperty('--background', '#313338');
      root.style.setProperty('--foreground', '#dbdee1');
      root.style.setProperty('--sidebar-background', '#1e1f22');
      root.style.setProperty('--sidebar-border', 'rgba(255, 255, 255, 0.06)');
      root.style.setProperty('--border', 'rgba(255, 255, 255, 0.06)');
    } else {
      // Midnight (Discord AMOLED)
      root.classList.add('dark', 'theme-midnight');
      root.style.setProperty('--background', '#000000');
      root.style.setProperty('--foreground', '#dbdee1');
      root.style.setProperty('--sidebar-background', '#000000');
      root.style.setProperty('--sidebar-border', 'rgba(255, 255, 255, 0.04)');
      root.style.setProperty('--border', 'rgba(255, 255, 255, 0.04)');
    }
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
