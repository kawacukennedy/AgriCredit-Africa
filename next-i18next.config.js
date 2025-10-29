module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'sw', 'ha'],
    localeDetection: false,
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};