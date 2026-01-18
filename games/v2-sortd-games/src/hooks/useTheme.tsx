import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return 'dark';
    
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    
    if (savedTheme) {
      return savedTheme;
    }
    
    return 'dark';
  });

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('theme', theme);

    // Update document class for global CSS
    // Since dark is default in CSS, we only need to add 'light' class for light mode
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
}