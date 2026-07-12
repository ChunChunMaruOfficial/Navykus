export const SUPPORTED_LANGUAGES = ['ru', 'en', 'kk', 'uz', 'ar', 'de', 'es', 'tr'] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'ru';

export const LANGUAGE_STORAGE_KEY = 'navykus.language';

export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  ru: '🇷🇺',
  en: '🇬🇧',
  kk: '🇰🇿',
  uz: '🇺🇿',
  ar: '🇸🇦',
  de: '🇩🇪',
  es: '🇪🇸',
  tr: '🇹🇷',
};

export const RTL_LANGUAGES = new Set<SupportedLanguage>(['ar']);

export const isSupportedLanguage = (value: string): value is SupportedLanguage => {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
};

export const getDirection = (language: string) => {
  return isSupportedLanguage(language) && RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr';
};
