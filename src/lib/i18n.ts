import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import en from '../../public/locales/en/common.json';
import fr from '../../public/locales/fr/common.json';
import sw from '../../public/locales/sw/common.json';
import ha from '../../public/locales/ha/common.json';

const resources = {
  en: {
    common: en,
  },
  fr: {
    common: fr,
  },
  sw: {
    common: sw,
  },
  ha: {
    common: ha,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;