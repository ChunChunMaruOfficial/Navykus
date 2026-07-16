import { GoogleGenAI } from '@google/genai';

import { SUPPORTED_LANGUAGES } from '../src/i18n/languages';
import type { SupportedLanguage } from '../src/i18n/languages';

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  ru: 'Russian',
  en: 'English',
  kk: 'Kazakh',
  uz: 'Uzbek',
  ar: 'Arabic',
  de: 'German',
  es: 'Spanish',
  tr: 'Turkish',
};

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
  return new GoogleGenAI({ apiKey });
};

type LocalizableFields = {
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  seoTitle?: string;
  seoDescription?: string;
  coverAlt?: string;
};

type TranslatedFields = LocalizableFields & { language: SupportedLanguage };

const buildPrompt = (source: LocalizableFields, from: SupportedLanguage, to: SupportedLanguage) => {
  const fromName = LANGUAGE_NAMES[from];
  const toName = LANGUAGE_NAMES[to];
  return `You are a professional translator for a youth educational platform "Navykus".
Translate the following blog article from ${fromName} to ${toName}.
Keep the original tone, markdown formatting and structure.
Return STRICT JSON with exactly these keys: "title", "excerpt", "content", "slug", "seoTitle", "seoDescription", "coverAlt".
- "slug": transliterate to ASCII latin characters, use kebab-case, keep it url-safe, max 80 chars.
- "seoTitle": translate title for SEO (max 70 chars).
- "seoDescription": translate excerpt for SEO (max 170 chars).
- "coverAlt": translate alt-text (concise descriptive alt).
Do NOT include any text outside the JSON object.

SOURCE:
${JSON.stringify(source, null, 2)}`;
};

const parseStrict = (text: string): LocalizableFields => {
  // Strip code fences if present.
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('AI response is not JSON');
  const json = cleaned.slice(start, end + 1);
  return JSON.parse(json) as LocalizableFields;
};

export const translateArticle = async (
  source: LocalizableFields,
  from: SupportedLanguage,
  to: SupportedLanguage,
): Promise<TranslatedFields> => {
  const ai = getClient();
  const prompt = buildPrompt(source, from, to);

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    contents: prompt,
  });

  const text = response.text ?? '';
  const parsed = parseStrict(text);
  return { ...parsed, language: to };
};

export const targetLocales = (source: SupportedLanguage): SupportedLanguage[] =>
  (SUPPORTED_LANGUAGES as readonly SupportedLanguage[]).filter((l) => l !== source);
