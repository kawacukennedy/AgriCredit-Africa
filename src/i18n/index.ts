import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';
import sw from './locales/sw.json';
import ha from './locales/ha.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  sw: { translation: sw },
  ha: { translation: ha },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for SSR
    },
  });

export default i18n;