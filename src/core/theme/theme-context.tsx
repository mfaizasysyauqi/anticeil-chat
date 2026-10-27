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
      root.style.setProperty('--foreground', '#18181b');
      root.style.setProperty('--card', '#f8f9fa');
      root.style.setProperty('--card-foreground', '#18181b');
      root.style.setProperty('--popover', '#ffffff');
      root.style.setProperty('--popover-foreground', '#18181b');
      root.style.setProperty('--sidebar-background', '#f4f4f5');
      root.style.setProperty('--sidebar-foreground', '#18181b');
      root.style.setProperty('--sidebar-border', 'rgba(0, 0, 0, 0.08)');
      root.style.setProperty('--sidebar-accent', '#e4e4e7');
      root.style.setProperty('--border', 'rgba(0, 0, 0, 0.08)');
      root.style.setProperty('--muted', '#f4f4f5');
      root.style.setProperty('--muted-foreground', '#71717a');
      root.style.setProperty('--accent', '#e4e4e7');
      root.style.setProperty('--accent-foreground', '#18181b');
      root.style.setProperty('--input', '#f4f4f5');
      // Anticeil Secondary: Hijau Emerald / Teal (#0d9488 / #059669)
      root.style.setProperty('--secondary', '#0d9488');
      root.style.setProperty('--secondary-foreground', '#ffffff');
      // Anticeil Primary: Kuning Anticeil (#f59e0b / #d97706)
      root.style.setProperty('--primary', '43 96% 46%');
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--primary-100', '43 96% 90%');
      root.style.setProperty('--primary-300', '43 96% 65%');
      root.style.setProperty('--ring', '#f59e0b');
    } else if (theme === 'dark') {
      root.classList.add('dark', 'theme-dark');
      root.style.setProperty('--background', '#18181b');
      root.style.setProperty('--foreground', '#f4f4f5');
      root.style.setProperty('--card', '#27272a');
      root.style.setProperty('--card-foreground', '#f4f4f5');
      root.style.setProperty('--popover', '#27272a');
      root.style.setProperty('--popover-foreground', '#f4f4f5');
      root.style.setProperty('--sidebar-background', '#121215');
      root.style.setProperty('--sidebar-foreground', '#f4f4f5');
      root.style.setProperty('--sidebar-border', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--sidebar-accent', '#27272a');
      root.style.setProperty('--border', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--muted', '#27272a');
      root.style.setProperty('--muted-foreground', '#a1a1aa');
      root.style.setProperty('--accent', '#3f3f46');
      root.style.setProperty('--accent-foreground', '#ffffff');
      root.style.setProperty('--input', '#27272a');
      // Anticeil Secondary: Hijau Teal (#14b8a6)
      root.style.setProperty('--secondary', '#0f766e');
      root.style.setProperty('--secondary-foreground', '#ffffff');
      // Anticeil Primary: Kuning Anticeil (#f59e0b / #fbbf24)
      root.style.setProperty('--primary', '45 93% 47%');
      root.style.setProperty('--primary-foreground', '0 0% 0%');
      root.style.setProperty('--primary-100', '45 93% 20%');
      root.style.setProperty('--primary-300', '45 93% 70%');
      root.style.setProperty('--ring', '#fbbf24');
    } else {
      // Midnight (Discord AMOLED Pure Black with Anticeil Palette)
      root.classList.add('dark', 'theme-midnight');
      root.style.setProperty('--background', '#000000');
      root.style.setProperty('--foreground', '#f4f4f5');
      root.style.setProperty('--card', '#09090b');
      root.style.setProperty('--card-foreground', '#f4f4f5');
      root.style.setProperty('--popover', '#09090b');
      root.style.setProperty('--popover-foreground', '#f4f4f5');
      root.style.setProperty('--sidebar-background', '#000000');
      root.style.setProperty('--sidebar-foreground', '#f4f4f5');
      root.style.setProperty('--sidebar-border', 'rgba(255, 255, 255, 0.06)');
      root.style.setProperty('--sidebar-accent', '#121215');
      root.style.setProperty('--border', 'rgba(255, 255, 255, 0.06)');
      root.style.setProperty('--muted', '#121215');
      root.style.setProperty('--muted-foreground', '#a1a1aa');
      root.style.setProperty('--accent', '#18181b');
      root.style.setProperty('--accent-foreground', '#ffffff');
      root.style.setProperty('--input', '#121215');
      // Anticeil Secondary: Hijau Emerald / Teal (#0d9488)
      root.style.setProperty('--secondary', '#0d9488');
      root.style.setProperty('--secondary-foreground', '#ffffff');
      // Anticeil Primary: Kuning Anticeil Emas (#f59e0b / #fbbf24)
      root.style.setProperty('--primary', '45 93% 47%');
      root.style.setProperty('--primary-foreground', '0 0% 0%');
      root.style.setProperty('--primary-100', '45 93% 20%');
      root.style.setProperty('--primary-300', '45 93% 70%');
      root.style.setProperty('--ring', '#fbbf24');
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
