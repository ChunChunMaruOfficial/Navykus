import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import ar from './locales/ar/translation.json';
import de from './locales/de/translation.json';
import en from './locales/en/translation.json';
import es from './locales/es/translation.json';
import kk from './locales/kk/translation.json';
import ru from './locales/ru/translation.json';
import tr from './locales/tr/translation.json';
import uz from './locales/uz/translation.json';
import {
  DEFAULT_LANGUAGE,
  getDirection,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
} from './languages';

const resources = {
  ru: { translation: ru },
  en: { translation: en },
  kk: { translation: kk },
  uz: { translation: uz },
  ar: { translation: ar },
  de: { translation: de },
  es: { translation: es },
  tr: { translation: tr },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
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
