import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useCallback } from 'react';
import { RootState } from '@/store';
import { setTheme } from '@/store/slices/uiSlice';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.ui.theme);

  const setThemeValue = useCallback((newTheme: Theme) => {
    localStorage.setItem('theme', newTheme);
    dispatch(setTheme(newTheme));
  }, [dispatch]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeValue(newTheme);
  }, [theme, setThemeValue]);

  // Get the actual theme to use (resolves 'system' to 'light' or 'dark')
  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  useEffect(() => {
    const root = document.documentElement;

    // Remove previous theme classes
    root.classList.remove('light', 'dark');

    // Add current theme class
    root.classList.add(resolvedTheme);

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        resolvedTheme === 'dark' ? '#1f2937' : '#ffffff'
      );
    }
  }, [resolvedTheme]);

  // Listen for system theme changes when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = document.documentElement;
      const newResolvedTheme = mediaQuery.matches ? 'dark' : 'light';

      root.classList.remove('light', 'dark');
      root.classList.add(newResolvedTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return {
    theme,
    resolvedTheme,
    setTheme: setThemeValue,
    toggleTheme,
  };
}