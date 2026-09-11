import type { Request } from 'express';
import type { Payload } from 'payload';

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../src/i18n/languages';
import {
  localizableContentFields,
  localizationSourceLanguage,
  type SupportedContentCollection,
} from '../src/payload/localization';

const payloadId = (value: string | number) => (typeof value === 'number' ? value : /^\d+$/.test(value) ? Number(value) : value);

export const languageFromRequest = (req: Request): SupportedLanguage => {
  const value = typeof req.query.lang === 'string' ? req.query.lang.split('-')[0] : '';
  if ((SUPPORTED_LANGUAGES as readonly string[]).includes(value)) {
    return value as SupportedLanguage;
  }
  return DEFAULT_LANGUAGE;
};

const relationId = (value: unknown) => {
  if (value && typeof value === 'object' && 'id' in value) return String((value as Record<string, unknown>).id || '');
  return String(value || '');
};

const parseLocalizedData = (value: unknown): Record<string, unknown> => {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
  return typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
};

const mergeLocalizedData = (
  doc: Record<string, unknown>,
  localizedData: Record<string, unknown>,
  allowedFields: ReadonlySet<string>,
) => {
  for (const [key, value] of Object.entries(localizedData)) {
    // Older translations may still carry fields that are no longer translated (slug, codes…).
    if (!allowedFields.has(key)) continue;
    const rows = doc[key];
    if (Array.isArray(value) && Array.isArray(rows) && rows.some((row) => row && typeof row === 'object' && !('value' in row))) {
      // Array of objects (the jury): merge the translated text sub-fields into the rows by position.
      doc[key] = rows.map((row, index) => {
        const translated = value[index];
        return translated && typeof translated === 'object' && !Array.isArray(translated)
          ? { ...(row as Record<string, unknown>), ...(translated as Record<string, unknown>) }
          : row;
      });
    } else if (Array.isArray(value)) {
      doc[key] = value.flatMap((item) => {
        if (Array.isArray(item)) return item;
        if (item && typeof item === 'object' && 'value' in item) return (item as Record<string, unknown>).value;
        return item;
      }).filter((item) => item !== undefined && item !== null && String(item).trim()).map((item) => ({ value: String(item) }));
    } else {
      doc[key] = value;
    }
  }
};


const clearPendingLocalizedFields = (
  doc: Record<string, unknown>,
  collection: SupportedContentCollection,
) => {
  for (const field of localizableContentFields(collection)) {
    if (!Object.prototype.hasOwnProperty.call(doc, field)) continue;
    doc[field] = Array.isArray(doc[field]) ? [] : '';
  }
  doc.translationPending = true;
};

export const applyLocalizations = async <T extends Record<string, unknown>>(
  payload: Payload,
  collection: SupportedContentCollection,
  docs: T[],
  language: SupportedLanguage,
) => {
  if (!docs.length) return docs;

  // Documents written in the requested language are shown as they are (no translation exists
  // for them); every other document needs the translation into `language` — including Russian
  // visitors looking at content that was originally written in another language.
  const translatable = docs.filter((doc) => localizationSourceLanguage(collection, doc) !== language);
  const ids = translatable.map((doc) => String(doc.id || '')).filter(Boolean);
  if (!ids.length) return docs;

  const result = await payload.find({
    collection: 'content-localizations' as any,
    where: {
      and: [
        { sourceCollection: { equals: collection } },
        { sourceId: { in: ids } },
        { language: { equals: language } },
      ],
    },
    limit: ids.length * 2,
    overrideAccess: true,
  });

  const records = new Map(
    (result.docs as Array<Record<string, unknown>>).map((doc) => [String(doc.sourceId || relationId(doc.sourceId)), doc]),
  );
  const allowedFields = new Set(localizableContentFields(collection));

  for (const doc of translatable) {
    const record = records.get(String(doc.id || ''));
    if (record?.translationStatus === 'ready') {
      mergeLocalizedData(doc, parseLocalizedData(record.localizedData), allowedFields);
    } else if (record?.translationStatus === 'failed') {
      // The translator gave up (for now): show the original text rather than an empty card.
      continue;
    } else {
      // Translation is queued / running: hide the untranslated text until it is ready.
      clearPendingLocalizedFields(doc, collection);
    }
  }

  return docs;
};
