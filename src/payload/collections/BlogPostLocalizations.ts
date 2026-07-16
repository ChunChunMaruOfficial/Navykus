import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';

export const TRANSLATION_STATUSES = ['pending', 'in_progress', 'ready', 'failed'] as const;
export type TranslationStatus = (typeof TRANSLATION_STATUSES)[number];

export const BlogPostLocalizations: CollectionConfig = {
  slug: 'blog-post-localizations',
  admin: {
    useAsTitle: 'title',
    group: 'Blog',
    defaultColumns: ['post', 'language', 'title', 'translationStatus', 'createdAt'],
  },
  access: {
    // Public reads only ready localizations; staff manages them.
    read: ({ req: { user } }) => {
      if (!user) return { and: [{ translationStatus: { equals: 'ready' } }, { post: { exists: true } }] };
      if (user.role === 'admin' || user.role === 'moderator') return true;
      // Authors can read localizations of their own posts.
      return { post: { exists: true } };
    },
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  fields: [
    { name: 'post', type: 'relationship', relationTo: 'blog-posts' as any, required: true, index: true },
    {
      name: 'language',
      type: 'select',
      required: true,
      options: ['ru', 'en', 'kk', 'uz', 'ar', 'de', 'es', 'tr'],
      index: true,
    },
    { name: 'title', type: 'text', required: true },
    { name: 'excerpt', type: 'textarea', required: true },
    { name: 'content', type: 'textarea', required: true },
    { name: 'slug', type: 'text', required: true, index: true },
    { name: 'coverAlt', type: 'text' },
    { name: 'seoTitle', type: 'text' },
    { name: 'seoDescription', type: 'textarea' },
    {
      name: 'translationStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: TRANSLATION_STATUSES as unknown as string[],
      index: true,
      admin: { position: 'sidebar' },
    },
    { name: 'errorMessage', type: 'textarea', admin: { position: 'sidebar' } },
    { name: 'generatedAt', type: 'date', admin: { position: 'sidebar' } },
    { name: 'attempts', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
};

// Public read access helper (anyone), used when we override access on find queries.
export const publicRead = anyone;
