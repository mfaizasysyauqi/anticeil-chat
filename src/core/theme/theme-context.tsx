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
    return 'dark'; // Default to Dark Mode (AMOLED Pure Black)
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'midnight' : theme === 'midnight' ? 'light' : 'dark');
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-midnight', 'theme-dark', 'theme-light', 'dark', 'light');

    if (theme === 'light') {
      root.classList.add('light', 'theme-light');
      root.style.setProperty('--background', '#ffffff');
      root.style.setProperty('--foreground', '#18181b');
      root.style.setProperty('--card', '#ffffff');
      root.style.setProperty('--card-foreground', '#18181b');
      root.style.setProperty('--popover', '#ffffff');
      root.style.setProperty('--popover-foreground', '#18181b');
      root.style.setProperty('--sidebar-background', '#ffffff');
      root.style.setProperty('--sidebar-foreground', '#18181b');
      root.style.setProperty('--sidebar-border', '#cbd5e1');
      root.style.setProperty('--sidebar-accent', '#f4f4f5');
      root.style.setProperty('--border', '#cbd5e1');
      root.style.setProperty('--muted', '#f4f4f5');
      root.style.setProperty('--muted-foreground', '#475569');
      root.style.setProperty('--accent', '#f4f4f5');
      root.style.setProperty('--accent-foreground', '#18181b');
      root.style.setProperty('--input', '#f4f4f5');
      // Anticeil Secondary: Subtle Neutral Slate
      root.style.setProperty('--secondary', '#f1f5f9');
      root.style.setProperty('--secondary-foreground', '#0f172a');
      // Anticeil Primary: Electric Azure Blue (#026fe4) from Anticeil Gradient Logo
      root.style.setProperty('--primary', '211 98% 45%');
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--sidebar-primary', '211 98% 45%');
      root.style.setProperty('--sidebar-primary-foreground', '0 0% 100%');
      root.style.setProperty('--primary-100', '211 98% 92%');
      root.style.setProperty('--primary-300', '211 98% 60%');
      root.style.setProperty('--ring', 'rgba(2, 111, 228, 0.4)');
    } else if (theme === 'midnight') {
      // Midnight: Classic Discord Grey (#313338 / #2b2d31)
      root.classList.add('dark', 'theme-midnight');
      root.style.setProperty('--background', '#313338');
      root.style.setProperty('--foreground', '#dbdee1');
      root.style.setProperty('--card', '#2b2d31');
      root.style.setProperty('--card-foreground', '#f2f3f5');
      // Popover matches background so dialogs/menus blend with the theme
      root.style.setProperty('--popover', '#313338');
      root.style.setProperty('--popover-foreground', '#dbdee1');
      root.style.setProperty('--sidebar-background', '#2b2d31');
      root.style.setProperty('--sidebar-foreground', '#dbdee1');
      root.style.setProperty('--sidebar-border', 'rgba(255, 255, 255, 0.14)');
      root.style.setProperty('--sidebar-accent', '#35373c');
      root.style.setProperty('--border', 'rgba(255, 255, 255, 0.16)');
      root.style.setProperty('--muted', '#383a40');
      root.style.setProperty('--muted-foreground', '#949ba4');
      root.style.setProperty('--accent', '#35373c');
      root.style.setProperty('--accent-foreground', '#ffffff');
      root.style.setProperty('--input', '#383a40');
      // Anticeil Secondary: Midnight Slate
      root.style.setProperty('--secondary', '#2b2d31');
      root.style.setProperty('--secondary-foreground', '#f2f3f5');
      // Anticeil Primary: Electric Azure Blue (#026fe4) from Anticeil Gradient Logo
      root.style.setProperty('--primary', '211 98% 48%');
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--sidebar-primary', '211 98% 48%');
      root.style.setProperty('--sidebar-primary-foreground', '0 0% 100%');
      root.style.setProperty('--primary-100', '211 98% 20%');
      root.style.setProperty('--primary-300', '211 98% 65%');
      root.style.setProperty('--ring', 'rgba(2, 111, 228, 0.45)');
    } else {
      // Dark Mode: Discord AMOLED Pure Black with Anticeil Palette (#000000 / #09090b)
      root.classList.add('dark', 'theme-dark');
      root.style.setProperty('--background', '#000000');
      root.style.setProperty('--foreground', '#f4f4f5');
      root.style.setProperty('--card', '#09090b');
      root.style.setProperty('--card-foreground', '#f4f4f5');
      // Popover matches background so dialogs/menus blend with the theme
      root.style.setProperty('--popover', '#000000');
      root.style.setProperty('--popover-foreground', '#f4f4f5');
      root.style.setProperty('--sidebar-background', '#000000');
      root.style.setProperty('--sidebar-foreground', '#f4f4f5');
      root.style.setProperty('--sidebar-border', 'rgba(255, 255, 255, 0.15)');
      root.style.setProperty('--sidebar-accent', '#121215');
      root.style.setProperty('--border', 'rgba(255, 255, 255, 0.18)');
      root.style.setProperty('--muted', '#121215');
      root.style.setProperty('--muted-foreground', '#a1a1aa');
      root.style.setProperty('--accent', '#18181b');
      root.style.setProperty('--accent-foreground', '#ffffff');
      root.style.setProperty('--input', '#121215');
      // Anticeil Secondary: Dark Surface Neutral
      root.style.setProperty('--secondary', '#18181b');
      root.style.setProperty('--secondary-foreground', '#f4f4f5');
      // Anticeil Primary: Electric Azure Blue (#026fe4) from Anticeil Gradient Logo
      root.style.setProperty('--primary', '211 98% 48%');
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--sidebar-primary', '211 98% 48%');
      root.style.setProperty('--sidebar-primary-foreground', '0 0% 100%');
      root.style.setProperty('--primary-100', '211 98% 20%');
      root.style.setProperty('--primary-300', '211 98% 65%');
      root.style.setProperty('--ring', 'rgba(2, 111, 228, 0.45)');
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
