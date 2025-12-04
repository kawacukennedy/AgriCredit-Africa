'use client';

import { ReactNode, useEffect } from 'react';
import { useAccessibility } from '@/hooks/useAccessibility';

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const { getColorBlindStyles, getFontSizeClass, settings } = useAccessibility();

  useEffect(() => {
    // Apply font size class to body
    const fontClassMap = {
      small: 'font-small',
      medium: 'font-medium',
      large: 'font-large'
    };
    const currentFontClass = fontClassMap[settings.fontSize];

    // Remove existing font classes and add new one
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(currentFontClass);

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

    // Apply color blind filter classes
    document.body.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
    if (settings.colorBlindMode !== 'none') {
      document.body.classList.add(settings.colorBlindMode);
    }

  }, [settings]);

  return <>{children}</>;
}
