// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// optional backend + detector
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

console.log("i18n initialized");

i18n
  .use(HttpBackend) // loads translations from /locales/{lang}/{ns}.json
  .use(LanguageDetector) // detects user language
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en','my'],
    ns: ['translation'],
    defaultNS: 'translation',
    debug: false, // set true only during development
    interpolation: {
      escapeValue: false // react already escapes
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json' // if using public/locales
    },
    detection: {
      // order and options for language detection
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
