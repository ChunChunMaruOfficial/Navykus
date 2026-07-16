export const SUPPORTED_LANGUAGES = ['ru', 'en', 'kk', 'uz', 'ar', 'de', 'es', 'tr'] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'ru';

export const LANGUAGE_STORAGE_KEY = 'navykus.language';

const LANGUAGE_SOURCE_STORAGE_KEY = 'navykus.language.source';

const MANUAL_LANGUAGE_SOURCE = 'manual';
const LEGACY_LANGUAGE_SOURCE_STORAGE_KEY = 'navykus.languageSource';

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

const REGION_LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  RU: 'ru',
  BY: 'ru',
  KZ: 'kk',
  UZ: 'uz',
  SA: 'ar',
  AE: 'ar',
  QA: 'ar',
  KW: 'ar',
  BH: 'ar',
  OM: 'ar',
  YE: 'ar',
  IQ: 'ar',
  JO: 'ar',
  LB: 'ar',
  SY: 'ar',
  PS: 'ar',
  EG: 'ar',
  MA: 'ar',
  DZ: 'ar',
  TN: 'ar',
  LY: 'ar',
  SD: 'ar',
  SO: 'ar',
  MR: 'ar',
  DE: 'de',
  AT: 'de',
  CH: 'de',
  LI: 'de',
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CO: 'es',
  PE: 'es',
  CL: 'es',
  VE: 'es',
  EC: 'es',
  BO: 'es',
  PY: 'es',
  UY: 'es',
  CR: 'es',
  PA: 'es',
  DO: 'es',
  GT: 'es',
  HN: 'es',
  SV: 'es',
  NI: 'es',
  TR: 'tr',
  US: 'en',
  GB: 'en',
  IE: 'en',
  CA: 'en',
  AU: 'en',
  NZ: 'en',
  SG: 'en',
  IN: 'en',
  ZA: 'en',
};

const TIME_ZONE_LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  'Europe/Moscow': 'ru',
  'Europe/Kaliningrad': 'ru',
  'Europe/Samara': 'ru',
  'Asia/Yekaterinburg': 'ru',
  'Asia/Omsk': 'ru',
  'Asia/Novosibirsk': 'ru',
  'Asia/Krasnoyarsk': 'ru',
  'Asia/Irkutsk': 'ru',
  'Asia/Yakutsk': 'ru',
  'Asia/Vladivostok': 'ru',
  'Asia/Kamchatka': 'ru',
  'Asia/Almaty': 'kk',
  'Asia/Aqtau': 'kk',
  'Asia/Aqtobe': 'kk',
  'Asia/Atyrau': 'kk',
  'Asia/Oral': 'kk',
  'Asia/Qostanay': 'kk',
  'Asia/Qyzylorda': 'kk',
  'Asia/Tashkent': 'uz',
  'Asia/Samarkand': 'uz',
  'Europe/Berlin': 'de',
  'Europe/Vienna': 'de',
  'Europe/Zurich': 'de',
  'Europe/Madrid': 'es',
  'Atlantic/Canary': 'es',
  'Africa/Ceuta': 'es',
  'Europe/Istanbul': 'tr',
  'Asia/Istanbul': 'tr',
  'Asia/Riyadh': 'ar',
  'Asia/Dubai': 'ar',
  'Asia/Qatar': 'ar',
  'Asia/Kuwait': 'ar',
  'Asia/Bahrain': 'ar',
  'Asia/Muscat': 'ar',
  'Asia/Aden': 'ar',
  'Asia/Baghdad': 'ar',
  'Asia/Amman': 'ar',
  'Asia/Beirut': 'ar',
  'Asia/Damascus': 'ar',
  'Asia/Gaza': 'ar',
  'Asia/Hebron': 'ar',
  'Africa/Cairo': 'ar',
  'Africa/Casablanca': 'ar',
  'Africa/Algiers': 'ar',
  'Africa/Tunis': 'ar',
};

type BrowserLanguageSignals = {
  languages?: readonly string[];
  locale?: string;
  timeZone?: string;
};

export const isSupportedLanguage = (value: string): value is SupportedLanguage => {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
};

export const getDirection = (language: string) => {
  return isSupportedLanguage(language) && RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr';
};

const getNavigatorLanguages = () => {
  if (typeof navigator === 'undefined') return [];

  return [
    ...Array.from(navigator.languages || []),
    navigator.language,
  ].filter((language): language is string => Boolean(language));
};

const getResolvedIntlOptions = (): Partial<Intl.ResolvedDateTimeFormatOptions> => {
  if (typeof Intl === 'undefined') return {};

  try {
    return Intl.DateTimeFormat().resolvedOptions();
  } catch {
    return {};
  }
};

const normalizeLocale = (locale: string) => locale.trim().replace(/_/g, '-');

const getPrimaryLanguage = (locale: string) => {
  return normalizeLocale(locale).split('-')[0]?.toLowerCase();
};

const getLocaleRegion = (locale: string) => {
  const parts = normalizeLocale(locale).split('-');
  const region = parts.find((part) => /^[A-Z]{2}$|^\d{3}$/.test(part));
  return region?.toUpperCase();
};

export const detectSupportedLanguageFromBrowser = (signals: BrowserLanguageSignals = {}): SupportedLanguage => {
  const intlOptions = getResolvedIntlOptions();
  const browserLocaleCandidates = [
    ...(signals.languages || getNavigatorLanguages()),
    signals.locale,
  ].filter((locale): locale is string => Boolean(locale));

  for (const locale of browserLocaleCandidates) {
    const primaryLanguage = getPrimaryLanguage(locale);
    if (primaryLanguage && isSupportedLanguage(primaryLanguage)) {
      return primaryLanguage;
    }
  }

  for (const locale of browserLocaleCandidates) {
    const region = getLocaleRegion(locale);
    const language = region ? REGION_LANGUAGE_MAP[region] : undefined;
    if (language) {
      return language;
    }
  }

  const timeZone = signals.timeZone || intlOptions.timeZone;
  if (timeZone && TIME_ZONE_LANGUAGE_MAP[timeZone]) {
    return TIME_ZONE_LANGUAGE_MAP[timeZone];
  }

  if (intlOptions.locale) {
    const primaryLanguage = getPrimaryLanguage(intlOptions.locale);
    if (primaryLanguage && isSupportedLanguage(primaryLanguage)) {
      return primaryLanguage;
    }

    const region = getLocaleRegion(intlOptions.locale);
    const language = region ? REGION_LANGUAGE_MAP[region] : undefined;
    if (language) {
      return language;
    }
  }

  return DEFAULT_LANGUAGE;
};

export const getSavedPreferredLanguage = (): SupportedLanguage | undefined => {
  if (typeof localStorage === 'undefined') return undefined;

  try {
    const source = localStorage.getItem(LANGUAGE_SOURCE_STORAGE_KEY);
    const language = localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (source === MANUAL_LANGUAGE_SOURCE && language && isSupportedLanguage(language)) {
      return language;
    }
  } catch {
    return undefined;
  }

  return undefined;
};

export const savePreferredLanguage = (language: SupportedLanguage) => {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    localStorage.setItem(LANGUAGE_SOURCE_STORAGE_KEY, MANUAL_LANGUAGE_SOURCE);
    localStorage.setItem(LEGACY_LANGUAGE_SOURCE_STORAGE_KEY, MANUAL_LANGUAGE_SOURCE);
  } catch {
    // localStorage can be disabled by browser privacy settings.
  }
};

export const clearPreferredLanguage = () => {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    localStorage.removeItem(LANGUAGE_SOURCE_STORAGE_KEY);
    localStorage.removeItem(LEGACY_LANGUAGE_SOURCE_STORAGE_KEY);
  } catch {
    // localStorage can be disabled by browser privacy settings.
  }
};
