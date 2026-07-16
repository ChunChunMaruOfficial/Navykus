import { getPayloadClient } from './payload';
import { targetLocales, translateArticle } from './ai-translator';
import type { SupportedLanguage } from '../src/i18n/languages';

const payloadId = (value: string | number) => (typeof value === 'number' ? value : /^\d+$/.test(value) ? Number(value) : value);

type LocalizationRecord = {
  id: string | number;
  language: SupportedLanguage;
};

const setLocalizationState = async (
  recordId: string | number,
  status: 'pending' | 'in_progress' | 'ready' | 'failed',
  patch: { errorMessage?: string; generatedAt?: string; attempts?: number } = {},
) => {
  const payload = await getPayloadClient();
  await payload.update({
    collection: 'blog-post-localizations' as any,
    id: payloadId(recordId),
    data: { translationStatus: status, ...patch },
    overrideAccess: true,
  });
};

const ensureLocalizationRecord = async (postId: string | number, language: SupportedLanguage): Promise<LocalizationRecord | undefined> => {
  const payload = await getPayloadClient();
  const existing = await payload.find({
    collection: 'blog-post-localizations' as any,
    where: { and: [{ post: { equals: payloadId(postId) } }, { language: { equals: language } }] },
    limit: 1,
    overrideAccess: true,
  });
  if (existing.docs[0]) {
    const doc = existing.docs[0] as any;
    return { id: doc.id, language };
  }
  const created = await payload.create({
    collection: 'blog-post-localizations' as any,
    data: {
      post: payloadId(postId),
      language,
      title: '',
      excerpt: '',
      content: '',
      slug: '',
      translationStatus: 'pending',
    },
    overrideAccess: true,
  });
  return { id: created.id, language };
};

const processLanguage = async (
  postId: string | number,
  post: {
    title: string;
    excerpt: string;
    content: string;
    slug: string;
    originalLanguage: SupportedLanguage;
    seoTitle?: string;
    seoDescription?: string;
    coverAlt?: string;
  },
  targetLang: SupportedLanguage,
): Promise<void> => {
  const record = await ensureLocalizationRecord(postId, targetLang);
  if (!record) return;

  await setLocalizationState(record.id, 'in_progress');
  try {
    const translated = await translateArticle(
      {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        slug: post.slug,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        coverAlt: post.coverAlt,
      },
      post.originalLanguage,
      targetLang,
    );

    const payload = await getPayloadClient();
    await payload.update({
      collection: 'blog-post-localizations' as any,
      id: payloadId(record.id),
      data: {
        title: translated.title,
        excerpt: translated.excerpt,
        content: translated.content,
        slug: translated.slug,
        seoTitle: translated.seoTitle,
        seoDescription: translated.seoDescription,
        coverAlt: translated.coverAlt,
        translationStatus: 'ready',
        generatedAt: new Date().toISOString(),
        attempts: 1,
        errorMessage: '',
      },
      overrideAccess: true,
    });
  } catch (error) {
    await setLocalizationState(record.id, 'failed', {
      errorMessage: (error as Error).message?.slice(0, 500) || 'Translation failed',
      attempts: 1,
    });
  }
};

export const enqueueArticleTranslations = (postId: string | number, post: {
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  originalLanguage: SupportedLanguage;
  seoTitle?: string;
  seoDescription?: string;
  coverAlt?: string;
}) => {
  const targets = targetLocales(post.originalLanguage);
  // Fire-and-forget: each language is independent; errors don't affect siblings.
  for (const target of targets) {
    void processLanguage(postId, post, target).catch((error) => {
      console.error(`[blog-translation] ${post.originalLanguage}->${target} for post ${postId} failed:`, error);
    });
  }
};

export const retrySingleLocalization = async (postId: string | number, language: SupportedLanguage, post: {
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  originalLanguage: SupportedLanguage;
  seoTitle?: string;
  seoDescription?: string;
  coverAlt?: string;
}) => {
  await processLanguage(postId, post, language);
};
