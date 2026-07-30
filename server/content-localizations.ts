import type { Request } from 'express';
import type { Payload } from 'payload';

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../src/i18n/languages';
import type { SupportedContentCollection } from '../src/payload/localization';

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

const mergeLocalizedData = (doc: Record<string, unknown>, localizedData: Record<string, unknown>) => {
  for (const [key, value] of Object.entries(localizedData)) {
    if (Array.isArray(value)) {
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

export const applyLocalizations = async <T extends Record<string, unknown>>(
  payload: Payload,
  collection: SupportedContentCollection,
  docs: T[],
  language: SupportedLanguage,
) => {
  if (!docs.length || language === DEFAULT_LANGUAGE) return docs;

  const ids = docs.map((doc) => String(doc.id || '')).filter(Boolean);
  if (!ids.length) return docs;

  const result = await payload.find({
    collection: 'content-localizations' as any,
    where: {
      and: [
        { sourceCollection: { equals: collection } },
        { sourceId: { in: ids } },
        { language: { equals: language } },
        { translationStatus: { equals: 'ready' } },
      ],
    },
    limit: ids.length,
    overrideAccess: true,
  });

  const localizedBySource = new Map(
    (result.docs as Array<Record<string, unknown>>).map((doc) => [
      String(doc.sourceId || relationId(doc.sourceId)),
      parseLocalizedData(doc.localizedData),
    ]),
  );

  for (const doc of docs) {
    const localizedData = localizedBySource.get(String(doc.id || ''));
    if (localizedData) {
      mergeLocalizedData(doc, localizedData);
    } else {
      (doc as Record<string, unknown>).translationPending = true;
    }
  }

  return docs;
};

export const localizationSummaries = async (
  payload: Payload,
  collection: SupportedContentCollection,
  ids: Array<string | number>,
) => {
  if (!ids.length) return new Map<string, Array<{ language: string; translationStatus: string }>>();
  const result = await payload.find({
    collection: 'content-localizations' as any,
    where: {
      and: [
        { sourceCollection: { equals: collection } },
        { sourceId: { in: ids.map(String) } },
      ],
    },
    limit: ids.length * SUPPORTED_LANGUAGES.length,
    overrideAccess: true,
  });
  const map = new Map<string, Array<{ language: string; translationStatus: string }>>();
  for (const doc of result.docs as Array<Record<string, unknown>>) {
    const sourceId = String(doc.sourceId || '');
    const rows = map.get(sourceId) || [];
    rows.push({
      language: String(doc.language || ''),
      translationStatus: String(doc.translationStatus || ''),
    });
    map.set(sourceId, rows);
  }
  return map;
};

export const toPayloadId = payloadId;
