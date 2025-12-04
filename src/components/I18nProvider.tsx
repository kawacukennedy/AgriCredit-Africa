'use client';

import { useEffect } from 'react';
import i18n from '../lib/i18n';
import { initReactI18next } from 'react-i18next';

export function I18nProvider() {
  useEffect(() => {
    // Initialize React integration on client side
    if (!i18n.isInitialized) {
      i18n.use(initReactI18next).init();
    }
  }, []);

  return null;
}