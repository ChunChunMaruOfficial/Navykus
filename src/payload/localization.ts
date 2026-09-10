import type { Field, Payload } from 'payload';
import { createHash } from 'node:crypto';

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n/languages';
import { translateStructuredContent } from '../../server/ai-translator';

export const TRANSLATION_STATUSES = ['pending', 'in_progress', 'ready', 'failed'] as const;
export type TranslationStatus = (typeof TRANSLATION_STATUSES)[number];

export const SUPPORTED_CONTENT_COLLECTIONS = [
  'team-members',
  'activities',
  'events',
  'experts',
  'faqs',
  'opportunities',
  'tournaments',
  'page-texts',
] as const;

export type SupportedContentCollection = (typeof SUPPORTED_CONTENT_COLLECTIONS)[number];
export type ProcessContentLocalizationOptions = {
  batchSize?: number;
  maxAttempts?: number;
  staleInProgressMs?: number;
};

type LocalizationConfig = {
  collection: SupportedContentCollection;
  sourceLanguageField?: string;
  onlyWhen?: (doc: Record<string, unknown>) => boolean;
  fields: readonly string[];
};

const textList = (items: unknown) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'value' in item) return String((item as Record<string, unknown>).value || '');
      return '';
    })
    .filter((item) => item !== undefined && item !== null)
    .map((item) => item.trim());
};

export const originalLanguageField: Field = {
  name: 'originalLanguage',
  label: 'Исходный язык',
  type: 'select',
  required: true,
  defaultValue: DEFAULT_LANGUAGE,
  options: SUPPORTED_LANGUAGES as unknown as string[],
  index: true,
  admin: {
    position: 'sidebar',
    description: 'Язык, используемый как источник для AI-перевода.',
  },
};

const LOCALIZATION_CONFIGS: Record<SupportedContentCollection, LocalizationConfig> = {
  'team-members': {
    collection: 'team-members',
    sourceLanguageField: 'originalLanguage',
    fields: ['country', 'city', 'shortBio', 'interests', 'skills', 'targetProject', 'whyLooking'],
  },
  activities: {
    collection: 'activities',
    sourceLanguageField: 'originalLanguage',
    fields: ['title', 'shortDescription', 'fullDescription', 'format', 'date', 'who', 'benefits', 'prerequisites', 'ctaText', 'seoTitle', 'seoDescription'],
  },
  events: {
    collection: 'events',
    sourceLanguageField: 'originalLanguage',
    // Codes (slug, eventType, format, languages) are never translated — the site maps them itself.
    fields: ['title', 'shortDescription', 'fullDescription', 'displayDate', 'country', 'venue', 'speaker', 'materials', 'audience', 'outcomesText', 'prerequisites'],
  },
  experts: {
    collection: 'experts',
    sourceLanguageField: 'originalLanguage',
    fields: ['name', 'role', 'expertise', 'description', 'seoTitle', 'seoDescription'],
  },
  faqs: {
    collection: 'faqs',
    sourceLanguageField: 'originalLanguage',
    fields: ['question', 'answer', 'seoTitle', 'seoDescription'],
  },
  opportunities: {
    collection: 'opportunities',
    sourceLanguageField: 'originalLanguage',
    // Codes (slug, category, cost, languages, …) are never translated — the site maps them itself.
    fields: ['title', 'organization', 'shortDescription', 'fullDescription', 'country', 'city', 'skills', 'requirements', 'benefits', 'documents'],
  },
  tournaments: {
    collection: 'tournaments',
    sourceLanguageField: 'originalLanguage',
    fields: ['title', 'type', 'description', 'pitch', 'aboutHeading', 'date', 'registrationDeadline', 'skills', 'suitableFor', 'format', 'ageLimit', 'teamsAllowed', 'language', 'expectedResult', 'themesText', 'evaluationCriteriaText', 'seoTitle', 'seoDescription'],
  },
  'page-texts': {
    collection: 'page-texts',
    fields: ['value'],
  },
};

const asSupportedLanguage = (value: unknown): SupportedLanguage => {
  if (typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)) {
    return value as SupportedLanguage;
  }
  return DEFAULT_LANGUAGE;
};

const payloadId = (value: string | number) => (typeof value === 'number' ? value : /^\d+$/.test(value) ? Number(value) : value);

const fieldValue = (doc: Record<string, unknown>, field: string) => {
  const value = doc[field];
  if (Array.isArray(value)) return textList(value);
  if (typeof value === 'string') return value.trim();
  return value;
};

const isEmptyContentValue = (value: unknown) => {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return !value.trim();
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

const extractContent = (config: LocalizationConfig, doc: Record<string, unknown>) => {
  const content: Record<string, unknown> = {};
  for (const field of config.fields) {
    if (!Object.prototype.hasOwnProperty.call(doc, field)) continue;
    const value = fieldValue(doc, field);
    if (isEmptyContentValue(value)) continue;
    content[field] = value;
  }
  return content;
};

const contentHash = (content: Record<string, unknown>, sourceLanguage: SupportedLanguage) =>
  createHash('sha256').update(JSON.stringify({ sourceLanguage, content })).digest('hex');

const isSqliteBusy = (error: unknown) => {
  const current = error as { cause?: unknown; code?: unknown; message?: unknown };
  const cause = current?.cause as { code?: unknown; message?: unknown } | undefined;
  return current?.code === 'SQLITE_BUSY'
    || cause?.code === 'SQLITE_BUSY'
    || String(current?.message || '').includes('SQLITE_BUSY')
    || String(cause?.message || '').includes('SQLITE_BUSY');
};

const isPayloadNotFound = (error: unknown) => {
  const current = error as { status?: unknown; message?: unknown };
  return current?.status === 404 || String(current?.message || '').toLowerCase() === 'not found';
};

// Marks a record that can never succeed so the worker stops retrying it.
const PERMANENT_FAILURE_ATTEMPTS = 999;
const FAILED_RETRY_DELAY_MS = 2 * 60_000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withSqliteBusyRetry = async <T>(operation: () => Promise<T>) => {
  const delays = [250, 750, 1500, 3000];
  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isSqliteBusy(error) || attempt === delays.length) throw error;
      await wait(delays[attempt]);
    }
  }
  return operation();
};

const findLocalization = async (
  payload: Payload,
  collection: SupportedContentCollection,
  sourceId: string | number,
  language: SupportedLanguage,
) => {
  const existing = await withSqliteBusyRetry(() => payload.find({
    collection: 'content-localizations' as any,
    where: {
      and: [
        { sourceCollection: { equals: collection } },
        { sourceId: { equals: String(sourceId) } },
        { language: { equals: language } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  }));
  return existing.docs[0] as Record<string, unknown> | undefined;
};

const upsertLocalizationRecord = async (
  payload: Payload,
  collection: SupportedContentCollection,
  sourceId: string | number,
  language: SupportedLanguage,
  hash: string,
) => {
  const existing = await findLocalization(payload, collection, sourceId, language);
  if (existing && existing.contentHash === hash && ['pending', 'in_progress', 'ready'].includes(String(existing.translationStatus))) {
    return undefined;
  }
  if (existing) {
    try {
      return await withSqliteBusyRetry(() => payload.update({
        collection: 'content-localizations' as any,
        id: payloadId(existing.id as string | number),
        data: {
          localizedData: {},
          translationStatus: 'pending',
          contentHash: hash,
          errorMessage: '',
          attempts: 0,
          generatedAt: null,
        },
        overrideAccess: true,
      }) as Promise<Record<string, unknown>>);
    } catch (error) {
      if (isPayloadNotFound(error)) return undefined;
      throw error;
    }
  }
  return withSqliteBusyRetry(() => payload.create({
    collection: 'content-localizations' as any,
    data: {
      sourceCollection: collection,
      sourceId: String(sourceId),
      language,
      localizedData: {},
      translationStatus: 'pending',
      contentHash: hash,
      attempts: 0,
    },
    overrideAccess: true,
  }) as Promise<Record<string, unknown>>);
};

const processLocalization = async (
  payload: Payload,
  recordId: string | number,
  collection: SupportedContentCollection,
  sourceId: string | number,
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage,
  content: Record<string, unknown>,
  nextAttempts = 1,
) => {
  try {
    await withSqliteBusyRetry(() => payload.update({
      collection: 'content-localizations' as any,
      id: payloadId(recordId),
      data: { translationStatus: 'in_progress', attempts: nextAttempts, errorMessage: '' },
      overrideAccess: true,
    }));
  } catch (error) {
    if (isPayloadNotFound(error)) return;
    throw error;
  }

  try {
    const localizedData = await translateStructuredContent({
      content,
      from: sourceLanguage,
      to: targetLanguage,
    });
    try {
      await withSqliteBusyRetry(() => payload.update({
        collection: 'content-localizations' as any,
        id: payloadId(recordId),
        data: {
          localizedData,
          translationStatus: 'ready',
          generatedAt: new Date().toISOString(),
          errorMessage: '',
        },
        overrideAccess: true,
      }));
    } catch (error) {
      if (isPayloadNotFound(error)) return;
      throw error;
    }
  } catch (error) {
    if (isPayloadNotFound(error)) return;
    try {
      await withSqliteBusyRetry(() => payload.update({
        collection: 'content-localizations' as any,
        id: payloadId(recordId),
        data: {
          translationStatus: 'failed',
          errorMessage: (error as Error).message?.slice(0, 500) || 'Translation failed',
        },
        overrideAccess: true,
      }));
    } catch (updateError) {
      if (isPayloadNotFound(updateError)) return;
      throw updateError;
    }
  }
};

export const processContentLocalizationRecord = async (
  payload: Payload,
  record: Record<string, unknown>,
) => {
  const collection = record.sourceCollection as SupportedContentCollection;
  if (!(SUPPORTED_CONTENT_COLLECTIONS as readonly string[]).includes(collection)) {
    throw new Error('Unsupported localization source collection');
  }

  const targetLanguage = asSupportedLanguage(record.language);
  let source: Record<string, unknown>;
  try {
    source = await payload.findByID({
      collection: collection as any,
      id: payloadId(String(record.sourceId || '')),
      depth: 0,
      overrideAccess: true,
    }) as Record<string, unknown>;
  } catch (error) {
    if (!isPayloadNotFound(error)) throw error;
    await payload.delete({
      collection: 'content-localizations' as any,
      id: payloadId(record.id as string | number),
      overrideAccess: true,
    }).catch(() => undefined);
    return;
  }

  const config = LOCALIZATION_CONFIGS[collection];
  if (config.onlyWhen?.(source) === false) {
    await payload.update({
      collection: 'content-localizations' as any,
      id: payloadId(record.id as string | number),
      data: { translationStatus: 'failed', attempts: PERMANENT_FAILURE_ATTEMPTS, errorMessage: 'Source document is not eligible for localization' },
      overrideAccess: true,
    });
    return;
  }

  const sourceLanguage = asSupportedLanguage(config.sourceLanguageField ? source[config.sourceLanguageField] : undefined);
  if (sourceLanguage === targetLanguage) {
    await payload.delete({
      collection: 'content-localizations' as any,
      id: payloadId(record.id as string | number),
      overrideAccess: true,
    });
    return;
  }

  const content = extractContent(config, source);
  if (Object.keys(content).length === 0) {
    await payload.update({
      collection: 'content-localizations' as any,
      id: payloadId(record.id as string | number),
      data: { translationStatus: 'failed', attempts: PERMANENT_FAILURE_ATTEMPTS, errorMessage: 'Source document has no localizable content' },
      overrideAccess: true,
    });
    return;
  }

  const hash = contentHash(content, sourceLanguage);
  if (record.contentHash !== hash) {
    await payload.update({
      collection: 'content-localizations' as any,
      id: payloadId(record.id as string | number),
      data: { contentHash: hash, localizedData: {}, translationStatus: 'pending', errorMessage: '', attempts: 0, generatedAt: null },
      overrideAccess: true,
    });
  }

  await processLocalization(
    payload,
    record.id as string | number,
    collection,
    String(record.sourceId || ''),
    sourceLanguage,
    targetLanguage,
    content,
    Number(record.attempts || 0) + 1,
  );
};

export const processPendingContentLocalizations = async (
  payload: Payload,
  options: ProcessContentLocalizationOptions = {},
) => {
  const batchSize = Math.max(1, Math.min(10, options.batchSize || Number(process.env.TRANSLATION_WORKER_BATCH_SIZE || SUPPORTED_LANGUAGES.length - 1)));
  const maxAttempts = Math.max(1, options.maxAttempts || Number(process.env.TRANSLATION_WORKER_MAX_ATTEMPTS || 8));
  const staleInProgressMs = Math.max(60_000, options.staleInProgressMs || Number(process.env.TRANSLATION_WORKER_STALE_MS || 15 * 60_000));
  const staleDate = new Date(Date.now() - staleInProgressMs).toISOString();

  await payload.update({
    collection: 'content-localizations' as any,
    where: {
      and: [
        { translationStatus: { equals: 'in_progress' } },
        { updatedAt: { less_than: staleDate } },
      ],
    },
    data: { translationStatus: 'pending', errorMessage: 'Reset stale in_progress translation' },
    overrideAccess: true,
  }).catch(() => undefined);

  const result = await payload.find({
    collection: 'content-localizations' as any,
    where: {
      and: [
        {
          or: [
            { translationStatus: { equals: 'pending' } },
            {
              and: [
                { translationStatus: { equals: 'failed' } },
                { updatedAt: { less_than: new Date(Date.now() - FAILED_RETRY_DELAY_MS).toISOString() } },
              ],
            },
          ],
        },
        { attempts: { less_than: maxAttempts } },
      ],
    },
    limit: batchSize * 5,
    sort: 'updatedAt',
    overrideAccess: true,
  });

  // Failed records back off exponentially (2, 4, 8 … min, max 2 h): the free translators
  // rate-limit bursts, and a few quiet minutes are usually enough to recover.
  const now = Date.now();
  const isDue = (record: Record<string, unknown>) => {
    if (record.translationStatus !== 'failed') return true;
    const attempts = Math.max(1, Number(record.attempts || 1));
    const delay = Math.min(FAILED_RETRY_DELAY_MS * 2 ** (attempts - 1), 2 * 60 * 60_000);
    return new Date(String(record.updatedAt || 0)).getTime() + delay <= now;
  };
  // Records of one batch are independent (different documents/languages): translate them in parallel.
  const docs = (result.docs as Array<Record<string, unknown>>).filter(isDue).slice(0, batchSize);
  await Promise.all(docs.map(async (record) => {
    try {
      await processContentLocalizationRecord(payload, record);
    } catch (error) {
      await payload.update({
        collection: 'content-localizations' as any,
        id: payloadId(record.id as string | number),
        data: {
          translationStatus: 'failed',
          // Count the attempt, otherwise a record that always throws is retried forever.
          attempts: Number(record.attempts || 0) + 1,
          errorMessage: (error as Error).message?.slice(0, 500) || 'Translation failed',
        },
        overrideAccess: true,
      }).catch(() => undefined);
    }
  }));

  return { processed: docs.length, remaining: Math.max(0, result.totalDocs - docs.length) };
};

export const enqueueContentLocalizations = async (
  payload: Payload,
  collection: SupportedContentCollection,
  doc: Record<string, unknown>,
) => {
  const config = LOCALIZATION_CONFIGS[collection];
  if (!doc?.id || config.onlyWhen?.(doc) === false) return;

  const sourceLanguage = asSupportedLanguage(config.sourceLanguageField ? doc[config.sourceLanguageField] : undefined);
  const content = extractContent(config, doc);
  const sourceId = doc.id as string | number;

  if (Object.keys(content).length === 0) {
    await withSqliteBusyRetry(() => payload.delete({
      collection: 'content-localizations' as any,
      where: {
        and: [
          { sourceCollection: { equals: collection } },
          { sourceId: { equals: String(sourceId) } },
        ],
      },
      overrideAccess: true,
    })).catch((error) => {
      console.error(`[content-localization] ${collection}:${String(sourceId)} cleanup on empty source failed:`, error);
    });
    return;
  }

  const hash = contentHash(content, sourceLanguage);
  const targets = (SUPPORTED_LANGUAGES as readonly SupportedLanguage[]).filter((language) => language !== sourceLanguage);
  for (const language of targets) {
    await upsertLocalizationRecord(payload, collection, sourceId, language, hash);
  }
};

const payloadIdValue = (value: unknown) => payloadId(String(value ?? ''));

/**
 * Translates every queued language of one document right away (languages in parallel)
 * instead of waiting for the background worker. With `force`, finished and failed
 * translations are redone too. Safe to call without awaiting.
 */
export const translateSourceNow = async (
  payload: Payload,
  collection: SupportedContentCollection,
  sourceId: string | number,
  { force = false }: { force?: boolean } = {},
) => {
  if (force) {
    const source = await payload.findByID({
      collection: collection as any,
      id: payloadIdValue(sourceId),
      depth: 0,
      overrideAccess: true,
    }).catch(() => undefined) as Record<string, unknown> | undefined;
    if (!source) return;
    await enqueueContentLocalizations(payload, collection, source);
    await withSqliteBusyRetry(() => payload.update({
      collection: 'content-localizations' as any,
      where: {
        and: [
          { sourceCollection: { equals: collection } },
          { sourceId: { equals: String(sourceId) } },
        ],
      },
      data: { translationStatus: 'pending', attempts: 0, errorMessage: '' },
      overrideAccess: true,
    }));
  }

  const queued = await withSqliteBusyRetry(() => payload.find({
    collection: 'content-localizations' as any,
    where: {
      and: [
        { sourceCollection: { equals: collection } },
        { sourceId: { equals: String(sourceId) } },
        { translationStatus: { in: ['pending', 'failed'] } },
      ],
    },
    limit: SUPPORTED_LANGUAGES.length,
    overrideAccess: true,
  }));

  await Promise.all((queued.docs as Array<Record<string, unknown>>).map((record) =>
    processContentLocalizationRecord(payload, record).catch((error) => {
      console.error(`[content-localization] ${collection}:${String(sourceId)} ${String(record.language)} failed:`, error);
    }),
  ));
};

export const localizedAfterChange = (collection: SupportedContentCollection) => async ({ doc, req, context }: {
  doc: Record<string, unknown>;
  req: { payload: Payload };
  context?: Record<string, unknown>;
}) => {
  await enqueueContentLocalizations(req.payload, collection, doc).catch((error) => {
    console.error(`[content-localization] ${collection}:${String(doc?.id || '')} enqueue failed:`, error);
  });
  // Start translating right away in the background; the periodic worker is only a safety net.
  // The short delay lets the save transaction commit first, so the translator reads the new text.
  if (doc?.id != null && !context?.skipImmediateTranslation) {
    void wait(1500).then(() => translateSourceNow(req.payload, collection, doc.id as string | number)).catch((error) => {
      console.error(`[content-localization] ${collection}:${String(doc.id)} immediate translation failed:`, error);
    });
  }
};

/** Language the document was written in (the source for the automatic translations). */
export const localizationSourceLanguage = (collection: SupportedContentCollection, doc: Record<string, unknown>) => {
  const config = LOCALIZATION_CONFIGS[collection];
  return asSupportedLanguage(config.sourceLanguageField ? doc[config.sourceLanguageField] : undefined);
};

export const localizedAfterDelete = (collection: SupportedContentCollection) => async ({ doc, req }: { doc: Record<string, unknown>; req: { payload: Payload } }) => {
  const sourceId = String(doc?.id || '');
  if (!sourceId) return;

  await withSqliteBusyRetry(() => req.payload.delete({
    collection: 'content-localizations' as any,
    where: {
      and: [
        { sourceCollection: { equals: collection } },
        { sourceId: { equals: sourceId } },
      ],
    },
    overrideAccess: true,
  })).catch((error) => {
    console.error(`[content-localization] ${collection}:${sourceId} cleanup failed:`, error);
  });
};

export const localizableContentFields = (collection: SupportedContentCollection) => LOCALIZATION_CONFIGS[collection].fields;

export const retryContentLocalization = async (
  payload: Payload,
  localizationId: string | number,
) => {
  const record = await payload.findByID({
    collection: 'content-localizations' as any,
    id: payloadId(localizationId),
    overrideAccess: true,
  }) as Record<string, unknown>;

  const collection = record.sourceCollection as SupportedContentCollection;
  if (!(SUPPORTED_CONTENT_COLLECTIONS as readonly string[]).includes(collection)) {
    throw new Error('Unsupported localization source collection');
  }

  const targetLanguage = asSupportedLanguage(record.language);
  const source = await payload.findByID({
    collection: collection as any,
    id: payloadId(String(record.sourceId || '')),
    depth: 0,
    overrideAccess: true,
  }) as Record<string, unknown>;
  const config = LOCALIZATION_CONFIGS[collection];
  if (config.onlyWhen?.(source) === false) {
    throw new Error('Source document is not eligible for localization');
  }

  const sourceLanguage = asSupportedLanguage(config.sourceLanguageField ? source[config.sourceLanguageField] : undefined);
  if (sourceLanguage === targetLanguage) {
    throw new Error('Target language matches source language');
  }

  const content = extractContent(config, source);
  if (Object.keys(content).length === 0) {
    throw new Error('Source document has no localizable content');
  }

  const hash = contentHash(content, sourceLanguage);
  await payload.update({
    collection: 'content-localizations' as any,
    id: payloadId(localizationId),
    data: {
      localizedData: {},
      contentHash: hash,
      errorMessage: '',
      attempts: 0,
      generatedAt: null,
    },
    overrideAccess: true,
  });

  await processLocalization(
    payload,
    localizationId,
    collection,
    String(record.sourceId || ''),
    sourceLanguage,
    targetLanguage,
    content,
    Number(record.attempts || 0) + 1,
  );

  return payload.findByID({
    collection: 'content-localizations' as any,
    id: payloadId(localizationId),
    overrideAccess: true,
  });
};
