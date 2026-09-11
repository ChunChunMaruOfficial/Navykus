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
    // Google answers rate limiting with a large HTML page — keep the message short and readable.
    const details = body.trimStart().startsWith('<') ? (response.status === 429 ? 'rate limited' : 'HTML error page') : body.slice(0, 200);
    throw new Error(`Google Translate failed with ${response.status}: ${details}`);
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
  // Quota warnings sometimes arrive as a «translation» — never store them as content.
  if (/^MYMEMORY WARNING/i.test(data.responseData?.translatedText || '')) {
    throw new Error('MyMemory translation failed with 429: daily quota exceeded');
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

const callProvider = (provider: TranslationProvider, text: string, from: SupportedLanguage, to: SupportedLanguage) => {
  if (provider === 'google') return translateWithGoogle(text, from, to);
  if (provider === 'libretranslate') return translateWithLibreTranslate(text, from, to);
  return translateWithMyMemory(text, from, to);
};

// The free endpoints rate-limit bursts (HTTP 429). Several documents/languages are translated
// in parallel, so cap the number of simultaneous requests per process and retry throttled
// requests with a growing pause instead of failing the whole translation.
const MAX_CONCURRENT_REQUESTS = Math.max(1, Number(process.env.TRANSLATION_MAX_CONCURRENCY || 3));
const RETRY_DELAYS_MS = [1000, 3000, 7000];
let activeRequests = 0;
const requestQueue: Array<() => void> = [];

const withRequestSlot = async <T>(operation: () => Promise<T>): Promise<T> => {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    await new Promise<void>((resolve) => requestQueue.push(resolve));
  }
  activeRequests += 1;
  try {
    return await operation();
  } finally {
    activeRequests -= 1;
    requestQueue.shift()?.();
  }
};

const isRetryable = (error: unknown) => /\b(429|500|502|503|504)\b|timeout|aborted|fetch failed/i.test(String((error as Error)?.message || ''));

// A provider that keeps answering 429 after the retries is skipped for a while, so a blocked
// endpoint doesn't add long waits to every single string of every document.
const PROVIDER_COOLDOWN_MS = 10 * 60_000;
const providerCooldownUntil = new Map<TranslationProvider, number>();

const translateWithProvider = async (provider: TranslationProvider, text: string, from: SupportedLanguage, to: SupportedLanguage) => {
  const cooldownUntil = providerCooldownUntil.get(provider) || 0;
  if (cooldownUntil > Date.now()) {
    throw new Error(`${provider} is rate limited, retry after ${new Date(cooldownUntil).toISOString()}`);
  }
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await withRequestSlot(() => callProvider(provider, text, from, to));
    } catch (error) {
      const quotaExceeded = /quota/i.test(String((error as Error)?.message || ''));
      if (quotaExceeded || attempt >= RETRY_DELAYS_MS.length || !isRetryable(error)) {
        if (/\b429\b/.test(String((error as Error)?.message || ''))) {
          providerCooldownUntil.set(provider, Date.now() + PROVIDER_COOLDOWN_MS);
        }
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }
};

// The free translation endpoints take the text in the URL: long descriptions are sent
// paragraph by paragraph so a request never exceeds the URL length limits.
const MAX_CHUNK_LENGTH = 1500;

const splitIntoChunks = (text: string) => {
  const parts = text.split(/(\n+)/);
  const chunks: string[] = [];
  let current = '';
  for (const part of parts) {
    if (current && current.length + part.length > MAX_CHUNK_LENGTH) {
      chunks.push(current);
      current = '';
    }
    current += part;
  }
  if (current) chunks.push(current);
  return chunks;
};

const translateText = async (text: string, from: SupportedLanguage, to: SupportedLanguage): Promise<string> => {
  if (!shouldTranslateString(text) || from === to) return text;
  if (text.length > MAX_CHUNK_LENGTH) {
    const translated: string[] = [];
    for (const chunk of splitIntoChunks(text)) {
      translated.push(/^\n+$/.test(chunk) ? chunk : await translateSingleText(chunk, from, to));
    }
    return translated.join('');
  }
  return translateSingleText(text, from, to);
};

const translateSingleText = async (text: string, from: SupportedLanguage, to: SupportedLanguage) => {
  if (!shouldTranslateString(text)) return text;
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

// Batch mode: every string of a document goes to Google in ONE POST request (many `q` params),
// instead of one GET per string. A championship has ~20 strings × 7 languages — sending them
// one by one is what made the free endpoint answer 429 («сервис перевода занят»).
const DEFAULT_GOOGLE_BATCH_URL = 'https://translate.googleapis.com/translate_a/t';
const MAX_BATCH_CHARS = 4500;
const MAX_BATCH_ITEMS = 64;

const translateBatchWithGoogle = async (texts: string[], from: SupportedLanguage, to: SupportedLanguage) => {
  const url = new URL(process.env.GOOGLE_TRANSLATE_BATCH_URL || DEFAULT_GOOGLE_BATCH_URL);
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', LANGUAGE_CODES[from]);
  url.searchParams.set('tl', LANGUAGE_CODES[to]);
  url.searchParams.set('format', 'text');
  const body = new URLSearchParams();
  for (const text of texts) body.append('q', text);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body,
    signal: AbortSignal.timeout(30000),
  });
  const raw = await response.text();
  if (!response.ok) {
    const details = raw.trimStart().startsWith('<') ? (response.status === 429 ? 'rate limited' : 'HTML error page') : raw.slice(0, 200);
    throw new Error(`Google Translate failed with ${response.status}: ${details}`);
  }
  const data = JSON.parse(raw) as unknown;
  const items = Array.isArray(data) ? data : [data];
  // With a known source language each item is a string; with sl=auto it is [text, detectedLang].
  const translated = items.map((item) => (Array.isArray(item) ? item[0] : item));
  if (translated.length !== texts.length || translated.some((item) => typeof item !== 'string')) {
    throw new Error('Google Translate batch returned an unexpected response');
  }
  return translated as string[];
};

const translateBatchWithProvider = async (texts: string[], from: SupportedLanguage, to: SupportedLanguage) => {
  const cooldownUntil = providerCooldownUntil.get('google') || 0;
  if (cooldownUntil > Date.now()) throw new Error(`google is rate limited, retry after ${new Date(cooldownUntil).toISOString()}`);
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await withRequestSlot(() => translateBatchWithGoogle(texts, from, to));
    } catch (error) {
      if (attempt >= RETRY_DELAYS_MS.length || !isRetryable(error)) {
        if (/\b429\b/.test(String((error as Error)?.message || ''))) {
          providerCooldownUntil.set('google', Date.now() + PROVIDER_COOLDOWN_MS);
        }
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }
};

const collectStrings = (value: unknown, into: Set<string>) => {
  if (typeof value === 'string') {
    if (shouldTranslateString(value)) {
      if (value.length > MAX_CHUNK_LENGTH) splitIntoChunks(value).forEach((chunk) => { if (shouldTranslateString(chunk)) into.add(chunk); });
      else into.add(value);
    }
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, into));
  } else if (isPlainObject(value)) {
    Object.values(value).forEach((item) => collectStrings(item, into));
  }
};

/** Pre-translates every string of the content with as few requests as possible. */
const translateAllStrings = async (content: Record<string, unknown>, from: SupportedLanguage, to: SupportedLanguage) => {
  const unique = new Set<string>();
  collectStrings(content, unique);
  const texts = [...unique];
  const dictionary = new Map<string, string>();
  if (!texts.length || normalizeProvider(process.env.TRANSLATION_PROVIDER) !== 'google') return dictionary;

  const batches: string[][] = [];
  let current: string[] = [];
  let currentChars = 0;
  for (const text of texts) {
    if (current.length && (currentChars + text.length > MAX_BATCH_CHARS || current.length >= MAX_BATCH_ITEMS)) {
      batches.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(text);
    currentChars += text.length;
  }
  if (current.length) batches.push(current);

  for (const batch of batches) {
    try {
      const translated = await translateBatchWithProvider(batch, from, to);
      batch.forEach((text, index) => dictionary.set(text, translated[index] || text));
    } catch (error) {
      // Leave the rest to the per-string path (which also falls back to other providers).
      console.warn(`[translator] batch ${from}->${to} failed, falling back to single requests:`, (error as Error).message);
      break;
    }
  }
  return dictionary;
};

const translateValue = async (value: unknown, from: SupportedLanguage, to: SupportedLanguage, key: string | undefined, dictionary: Map<string, string>): Promise<unknown> => {
  if (typeof value === 'string') {
    const translated = await translateTextCached(value, from, to, dictionary);
    return key === 'slug' ? slugify(translated) : translated;
  }
  if (Array.isArray(value)) {
    const translatedItems = [];
    for (const item of value) translatedItems.push(await translateValue(item, from, to, undefined, dictionary));
    return translatedItems;
  }
  if (isPlainObject(value)) {
    const translatedEntries: Array<[string, unknown]> = [];
    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      translatedEntries.push([nestedKey, await translateValue(nestedValue, from, to, nestedKey, dictionary)]);
    }
    return Object.fromEntries(translatedEntries);
  }
  return value;
};

const translateTextCached = async (text: string, from: SupportedLanguage, to: SupportedLanguage, dictionary: Map<string, string>): Promise<string> => {
  if (!shouldTranslateString(text) || from === to) return text;
  const hit = dictionary.get(text);
  if (hit !== undefined) return hit;
  if (text.length > MAX_CHUNK_LENGTH) {
    const translated: string[] = [];
    for (const chunk of splitIntoChunks(text)) {
      if (/^\n+$/.test(chunk) || !shouldTranslateString(chunk)) translated.push(chunk);
      else translated.push(dictionary.get(chunk) ?? await translateSingleText(chunk, from, to));
    }
    return translated.join('');
  }
  return translateText(text, from, to);
};

export const translateStructuredContent = async ({
  content,
  from,
  to,
}: {
  content: Record<string, unknown>;
  from: SupportedLanguage;
  to: SupportedLanguage;
}) => {
  const sourceLanguage = normalizeLocale(from);
  const targetLanguage = normalizeLocale(to);
  if (sourceLanguage === targetLanguage) return content;

  const dictionary = await translateAllStrings(content, sourceLanguage, targetLanguage);
  const localizedEntries: Array<[string, unknown]> = [];
  for (const [key, value] of Object.entries(content)) {
    localizedEntries.push([key, await translateValue(value, sourceLanguage, targetLanguage, key, dictionary)]);
  }
  return Object.fromEntries(localizedEntries);
};
