'use client';

import { ReactNode, useEffect } from 'react';
import { useAccessibility } from '@/hooks/useAccessibility';

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const { getColorBlindStyles, getFontSizeClass, settings } = useAccessibility();

  useEffect(() => {
    // Apply accessibility styles to the document body
    const styles = getColorBlindStyles();
    const fontClass = getFontSizeClass();

    // Apply filter styles
    document.body.style.filter = styles.filter || 'none';

    // Apply font size class to body
    document.body.className = document.body.className.replace(/text-(sm|base|lg)/g, '') + ' ' + fontClass;

    // Apply high contrast if enabled
    if (settings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Apply reduced motion if needed
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('reduce-motion');
    }

  }, [getColorBlindStyles, getFontSizeClass, settings]);

  return <>{children}</>;
}