import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

import {
  DEFAULT_LANGUAGE,
  detectSupportedLanguageFromBrowser,
  getDirection,
  getSavedPreferredLanguage,
  SUPPORTED_LANGUAGES,
} from './languages';

const languageDetector = new LanguageDetector();

languageDetector.addDetector({
  name: 'manualPreference',
  lookup: getSavedPreferredLanguage,
});

languageDetector.addDetector({
  name: 'browserRegion',
  lookup: () => detectSupportedLanguageFromBrowser(),
});

i18n
  .use(languageDetector)
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['manualPreference', 'browserRegion'],
      caches: [],
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    react: {
      useSuspense: false,
    },
  });

const updateDocumentLanguage = (language: string) => {
  document.documentElement.lang = language;
  document.documentElement.dir = getDirection(language);
};

if (typeof document !== 'undefined') {
  updateDocumentLanguage(i18n.resolvedLanguage || i18n.language || DEFAULT_LANGUAGE);
  i18n.on('languageChanged', updateDocumentLanguage);
}

export default i18n;
