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

const PENDING_CLEAR_FIELDS: Record<SupportedContentCollection, readonly string[]> = {
  'team-members': ['country', 'city', 'shortBio', 'interests', 'skills', 'targetProject', 'whyLooking'],
  activities: ['title', 'shortDescription', 'fullDescription', 'format', 'date', 'category', 'status', 'who', 'benefits', 'prerequisites', 'ctaText', 'seoTitle', 'seoDescription'],
  events: ['title', 'shortDescription', 'fullDescription', 'eventType', 'displayDate', 'country', 'venue', 'speaker', 'languages', 'materials', 'audience', 'outcomesText', 'prerequisites', 'seoTitle', 'seoDescription'],
  experts: ['name', 'role', 'expertise', 'description', 'seoTitle', 'seoDescription'],
  faqs: ['question', 'answer', 'seoTitle', 'seoDescription'],
  opportunities: ['title', 'opportunityType', 'shortDescription', 'fullDescription', 'country', 'cost', 'languages', 'requirements', 'benefits', 'documents', 'seoTitle', 'seoDescription'],
  pillars: ['label', 'title', 'description', 'seoTitle', 'seoDescription'],
  scenarios: ['title', 'who', 'why', 'ctaText', 'actionType', 'seoTitle', 'seoDescription'],
  stats: ['value', 'label', 'seoTitle', 'seoDescription'],
  'trust-points': ['title', 'description', 'seoTitle', 'seoDescription'],
  tournaments: ['title', 'type', 'description', 'pitch', 'date', 'registrationDeadline', 'skills', 'mentors', 'suitableFor', 'format', 'targetAudience', 'ageLimit', 'teamsAllowed', 'language', 'expectedResult', 'themesText', 'evaluationCriteriaText', 'seoTitle', 'seoDescription'],
  'page-texts': ['value'],
};

const clearPendingLocalizedFields = (
  doc: Record<string, unknown>,
  collection: SupportedContentCollection,
) => {
  for (const field of PENDING_CLEAR_FIELDS[collection]) {
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
      clearPendingLocalizedFields(doc, collection);
    }
  }

  return docs;
};
