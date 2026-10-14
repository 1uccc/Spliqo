import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('spliqo_theme_v2');
      if (saved === 'dark' || saved === 'light') return saved;
      // Default theme is strictly light mode
      return 'light';
    } catch (e) {
      console.warn('Error reading theme from localStorage:', e);
      return 'light';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('spliqo_theme_v2', 'dark');
      localStorage.setItem('splitmate_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('spliqo_theme_v2', 'light');
      localStorage.setItem('splitmate_theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setDarkMode = (isDark) => {
    setTheme(isDark ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
