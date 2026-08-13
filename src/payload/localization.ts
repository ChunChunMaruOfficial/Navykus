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
  'pillars',
  'scenarios',
  'stats',
  'trust-points',
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
    .filter(Boolean);
};

export const originalLanguageField: Field = {
  name: 'originalLanguage',
  type: 'select',
  required: true,
  defaultValue: DEFAULT_LANGUAGE,
  options: SUPPORTED_LANGUAGES as unknown as string[],
  index: true,
  admin: {
    position: 'sidebar',
    description: 'Language used as the source for AI localizations.',
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
    fields: ['title', 'shortDescription', 'fullDescription', 'format', 'date', 'category', 'status', 'who', 'benefits', 'prerequisites', 'ctaText', 'seoTitle', 'seoDescription'],
  },
  events: {
    collection: 'events',
    sourceLanguageField: 'originalLanguage',
    fields: ['title', 'slug', 'shortDescription', 'fullDescription', 'eventType', 'country', 'venue', 'speaker', 'languages', 'materials', 'seoTitle', 'seoDescription'],
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
    fields: ['title', 'slug', 'opportunityType', 'shortDescription', 'fullDescription', 'country', 'cost', 'languages', 'requirements', 'benefits', 'documents', 'seoTitle', 'seoDescription'],
  },
  pillars: {
    collection: 'pillars',
    sourceLanguageField: 'originalLanguage',
    fields: ['label', 'title', 'description', 'seoTitle', 'seoDescription'],
  },
  scenarios: {
    collection: 'scenarios',
    sourceLanguageField: 'originalLanguage',
    fields: ['title', 'who', 'why', 'ctaText', 'actionType', 'seoTitle', 'seoDescription'],
  },
  stats: {
    collection: 'stats',
    sourceLanguageField: 'originalLanguage',
    fields: ['value', 'label', 'seoTitle', 'seoDescription'],
  },
  'trust-points': {
    collection: 'trust-points',
    sourceLanguageField: 'originalLanguage',
    fields: ['title', 'description', 'seoTitle', 'seoDescription'],
  },
  tournaments: {
    collection: 'tournaments',
    sourceLanguageField: 'originalLanguage',
    fields: ['title', 'slug', 'type', 'description', 'pitch', 'date', 'registrationDeadline', 'skills', 'suitableFor', 'format', 'targetAudience', 'ageLimit', 'teamsAllowed', 'language', 'expectedResult', 'themesText', 'evaluationCriteriaText', 'seoTitle', 'seoDescription'],
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

const extractContent = (config: LocalizationConfig, doc: Record<string, unknown>) => {
  const content: Record<string, unknown> = {};
  for (const field of config.fields) {
    const value = fieldValue(doc, field);
    if (Array.isArray(value) ? value.length > 0 : typeof value === 'string' ? value.length > 0 : value !== undefined && value !== null) {
      content[field] = value;
    }
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
      context: `${collection}:${sourceId}`,
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
      data: { translationStatus: 'failed', errorMessage: 'Source document is not eligible for localization' },
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
      data: { translationStatus: 'failed', errorMessage: 'Source document has no localizable content' },
      overrideAccess: true,
    });
    return;
  }

  const hash = contentHash(content, sourceLanguage);
  if (record.contentHash !== hash) {
    await payload.update({
      collection: 'content-localizations' as any,
      id: payloadId(record.id as string | number),
      data: { contentHash: hash, localizedData: {}, translationStatus: 'pending', errorMessage: '' },
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
  const batchSize = Math.max(1, Math.min(10, options.batchSize || Number(process.env.TRANSLATION_WORKER_BATCH_SIZE || 3)));
  const maxAttempts = Math.max(1, options.maxAttempts || Number(process.env.TRANSLATION_WORKER_MAX_ATTEMPTS || 5));
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
            { translationStatus: { equals: 'failed' } },
          ],
        },
        { attempts: { less_than: maxAttempts } },
      ],
    },
    limit: batchSize,
    sort: 'updatedAt',
    overrideAccess: true,
  });

  let processed = 0;
  for (const record of result.docs as Array<Record<string, unknown>>) {
    try {
      await processContentLocalizationRecord(payload, record);
    } catch (error) {
      await payload.update({
        collection: 'content-localizations' as any,
        id: payloadId(record.id as string | number),
        data: {
          translationStatus: 'failed',
          errorMessage: (error as Error).message?.slice(0, 500) || 'Translation failed',
        },
        overrideAccess: true,
      }).catch(() => undefined);
    }
    processed += 1;
  }

  return { processed, remaining: Math.max(0, result.totalDocs - processed) };
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
  if (Object.keys(content).length === 0) return;

  const hash = contentHash(content, sourceLanguage);
  const targets = (SUPPORTED_LANGUAGES as readonly SupportedLanguage[]).filter((language) => language !== sourceLanguage);
  for (const language of targets) {
    await upsertLocalizationRecord(payload, collection, doc.id as string | number, language, hash);
  }
};

export const localizedAfterChange = (collection: SupportedContentCollection) => async ({ doc, req }: { doc: Record<string, unknown>; req: { payload: Payload } }) => {
  await enqueueContentLocalizations(req.payload, collection, doc).catch((error) => {
    console.error(`[content-localization] ${collection}:${String(doc?.id || '')} enqueue failed:`, error);
  });
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
