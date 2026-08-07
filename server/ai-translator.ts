import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../src/i18n/languages';

const DEFAULT_LIBRETRANSLATE_URL = 'https://libretranslate.com/translate';
const DEFAULT_MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const DEFAULT_GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';

const LANGUAGE_CODES: Record<SupportedLanguage, string> = {
  ru: 'ru',
  en: 'en',
  kk: 'kk',
  uz: 'uz',
  ar: 'ar',
  de: 'de',
  es: 'es',
  tr: 'tr',
};

type TranslationProvider = 'google' | 'mymemory' | 'libretranslate';

const normalizeLocale = (value: unknown): SupportedLanguage => {
  if (typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)) {
    return value as SupportedLanguage;
  }
  return DEFAULT_LANGUAGE;
};

const normalizeProvider = (value: unknown): TranslationProvider => {
  if (value === 'libretranslate' || value === 'mymemory') return value;
  return 'google';
};

const providerOrder = (): TranslationProvider[] => {
  const primary = normalizeProvider(process.env.TRANSLATION_PROVIDER);
  const fallbacks: TranslationProvider[] = ['google', 'mymemory', 'libretranslate'].filter((provider) => provider !== primary) as TranslationProvider[];
  if (!process.env.LIBRETRANSLATE_API_KEY && !process.env.LIBRETRANSLATE_URL) {
    return [primary, ...fallbacks.filter((provider) => provider !== 'libretranslate')];
  }
  return [primary, ...fallbacks];
};

export const getTranslationProviderName = () => {
  return normalizeProvider(process.env.TRANSLATION_PROVIDER);
};

const parseGoogleTranslateResponse = (data: unknown) => {
  if (!Array.isArray(data) || !Array.isArray(data[0])) return '';
  return data[0]
    .map((segment) => Array.isArray(segment) && typeof segment[0] === 'string' ? segment[0] : '')
    .join('');
};

const translateWithGoogle = async (text: string, from: SupportedLanguage, to: SupportedLanguage) => {
  const endpoint = process.env.GOOGLE_TRANSLATE_URL || DEFAULT_GOOGLE_TRANSLATE_URL;
  const url = new URL(endpoint);
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', LANGUAGE_CODES[from]);
  url.searchParams.set('tl', LANGUAGE_CODES[to]);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);

  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Google Translate failed with ${response.status}: ${body.slice(0, 300)}`);
  }

  const translated = parseGoogleTranslateResponse(JSON.parse(body));
  return translated || text;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
};

const shouldTranslateString = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return false;
  if (/^[\w.-]+@[\w.-]+\.[a-z]{2,}$/i.test(trimmed)) return false;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return false;
  return true;
};

const slugify = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80) || 'content';

const translateWithMyMemory = async (text: string, from: SupportedLanguage, to: SupportedLanguage) => {
  const endpoint = process.env.MYMEMORY_TRANSLATE_URL || DEFAULT_MYMEMORY_URL;
  const url = new URL(endpoint);
  url.searchParams.set('q', text);
  url.searchParams.set('langpair', `${LANGUAGE_CODES[from]}|${LANGUAGE_CODES[to]}`);
  if (process.env.MYMEMORY_EMAIL) url.searchParams.set('de', process.env.MYMEMORY_EMAIL);

  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`MyMemory translation failed with ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = JSON.parse(body) as { responseData?: { translatedText?: string }; responseStatus?: number; responseDetails?: string };
  if (data.responseStatus && data.responseStatus >= 400) {
    throw new Error(`MyMemory translation failed: ${data.responseDetails || data.responseStatus}`);
  }
  return data.responseData?.translatedText || text;
};

const translateWithLibreTranslate = async (text: string, from: SupportedLanguage, to: SupportedLanguage) => {
  const endpoint = process.env.LIBRETRANSLATE_URL || DEFAULT_LIBRETRANSLATE_URL;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const body: Record<string, string> = {
    q: text,
    source: LANGUAGE_CODES[from],
    target: LANGUAGE_CODES[to],
    format: 'text',
  };
  if (process.env.LIBRETRANSLATE_API_KEY) body.api_key = process.env.LIBRETRANSLATE_API_KEY;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const textBody = await response.text();
  if (!response.ok) {
    throw new Error(`LibreTranslate failed with ${response.status}: ${textBody.slice(0, 300)}`);
  }

  const data = JSON.parse(textBody) as { translatedText?: string };
  return data.translatedText || text;
};

const translateWithProvider = async (provider: TranslationProvider, text: string, from: SupportedLanguage, to: SupportedLanguage) => {
  if (provider === 'google') return translateWithGoogle(text, from, to);
  if (provider === 'libretranslate') return translateWithLibreTranslate(text, from, to);
  return translateWithMyMemory(text, from, to);
};

const translateText = async (text: string, from: SupportedLanguage, to: SupportedLanguage) => {
  if (!shouldTranslateString(text) || from === to) return text;
  const errors: string[] = [];
  for (const provider of providerOrder()) {
    try {
      return await translateWithProvider(provider, text, from, to);
    } catch (error) {
      errors.push(`${provider}: ${(error as Error).message}`);
    }
  }
  throw new Error(`Translation failed: ${errors.join('; ')}`);
};

const translateValue = async (value: unknown, from: SupportedLanguage, to: SupportedLanguage, key?: string): Promise<unknown> => {
  if (typeof value === 'string') {
    const translated = await translateText(value, from, to);
    return key === 'slug' ? slugify(translated) : translated;
  }
  if (Array.isArray(value)) {
    const translatedItems = [];
    for (const item of value) translatedItems.push(await translateValue(item, from, to));
    return translatedItems;
  }
  if (isPlainObject(value)) {
    const translatedEntries: Array<[string, unknown]> = [];
    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      translatedEntries.push([nestedKey, await translateValue(nestedValue, from, to, nestedKey)]);
    }
    return Object.fromEntries(translatedEntries);
  }
  return value;
};

export const translateStructuredContent = async ({
  content,
  from,
  to,
}: {
  content: Record<string, unknown>;
  from: SupportedLanguage;
  to: SupportedLanguage;
  context?: string;
}) => {
  const sourceLanguage = normalizeLocale(from);
  const targetLanguage = normalizeLocale(to);
  if (sourceLanguage === targetLanguage) return content;

  const localizedEntries: Array<[string, unknown]> = [];
  for (const [key, value] of Object.entries(content)) {
    localizedEntries.push([key, await translateValue(value, sourceLanguage, targetLanguage, key)]);
  }
  return Object.fromEntries(localizedEntries);
};

export const targetLocales = (source: SupportedLanguage): SupportedLanguage[] =>
  (SUPPORTED_LANGUAGES as readonly SupportedLanguage[]).filter((language) => language !== source);
