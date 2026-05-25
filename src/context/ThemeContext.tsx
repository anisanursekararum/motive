"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // Apply the resolved theme to the document
  const applyTheme = useCallback((mode: ThemeMode) => {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved: ResolvedTheme = mode === 'system'
      ? (systemPrefersDark ? 'dark' : 'light')
      : mode;

    document.documentElement.setAttribute('data-theme', resolved);
    setResolvedTheme(resolved);
  }, []);

  // On mount, read from localStorage
  useEffect(() => {
    const stored = (localStorage.getItem('motive_theme') as ThemeMode) || 'system';
    setThemeState(stored);
    applyTheme(stored);

    // Listen for system preference changes when in 'system' mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if ((localStorage.getItem('motive_theme') as ThemeMode) === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [applyTheme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    localStorage.setItem('motive_theme', mode);
    setThemeState(mode);
    applyTheme(mode);
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
