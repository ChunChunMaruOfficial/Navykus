import type { CollectionConfig } from 'payload';

import { ownerOrStaff } from '../access';
import { legacyIdField, publicContentVersions, sortOrderField, syncBlogPublicationBeforeChange, textListField } from '../fields';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { localizedAfterChange, localizedAfterDelete } from '../localization';
import { publicPreview } from '../preview';
import { slugBeforeValidate } from '../slug';

export const BLOG_STATUSES = [
  'draft',
  'pending_review',
  'needs_revision',
  'approved',
  'published',
  'rejected',
  'archived',
] as const;

export type BlogStatus = (typeof BLOG_STATUSES)[number];

const BLOG_CATEGORIES = [
  'news',
  'championships',
  'activities',
  'opportunities',
  'stories',
  'interviews',
  'tips',
  'education',
  'projects',
] as const;

export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  admin: {
    useAsTitle: 'title',
    group: 'Blog',
    defaultColumns: ['title', 'author', 'category', 'status', 'originalLanguage', 'createdAt'],
    preview: publicPreview('blog-posts'),
  },
  versions: publicContentVersions,
  access: {
    // Author sees own posts; staff sees all. Public reads only published.
    read: ({ req: { user } }) => {
      if (!user) return { status: { equals: 'published' } };
      if (user.role === 'admin' || user.role === 'moderator') return true;
      return { or: [{ status: { equals: 'published' } }, { author: { equals: user.id } }] };
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ownerOrStaff('author'),
    delete: ownerOrStaff('author'),
  },
  hooks: {
    beforeValidate: [slugBeforeValidate('blog-posts')],
    beforeChange: [syncBlogPublicationBeforeChange],
    afterChange: [localizedAfterChange('blog-posts'), auditAfterChange('blog-posts')],
    afterDelete: [localizedAfterDelete('blog-posts'), auditAfterDelete('blog-posts')],
  },
  fields: [
    legacyIdField,
    sortOrderField,
    { name: 'title', type: 'text', required: true, admin: { description: 'Original title' } },
    { name: 'excerpt', type: 'textarea', required: true },
    { name: 'content', type: 'textarea', required: true, admin: { description: 'Markdown or plain text.' } },
    { name: 'cover', type: 'relationship', relationTo: 'media' as any },
    { name: 'coverAlt', type: 'text' },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: BLOG_CATEGORIES as unknown as string[],
      index: true,
    },
    textListField('tags', 'Tags'),
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      options: BLOG_STATUSES as unknown as string[],
      access: {
        // Only staff may move to approved/published/rejected/archived; author controls draft/pending_review/needs_revision.
        update: ({ req: { user }, data }) => {
          if (!user) return false;
          if (user.role === 'admin' || user.role === 'moderator') return true;
          const next = data?.status as string | undefined;
          return !['approved', 'published', 'rejected', 'archived'].includes(next || '');
        },
      },
    },
    { name: 'author', type: 'relationship', relationTo: 'users' as any, required: true, index: true },
    { name: 'originalLanguage', type: 'select', required: true, defaultValue: 'ru', options: ['ru', 'en', 'kk', 'uz', 'ar', 'de', 'es', 'tr'], index: true },
    { name: 'slug', type: 'text', index: true, unique: true, admin: { description: 'Auto-generated URL slug when empty.' } },
    { name: 'seoTitle', type: 'text' },
    { name: 'seoDescription', type: 'textarea' },
    { name: 'readingTime', type: 'number', admin: { description: 'In minutes. Auto-calculated if not set.' } },
    { name: 'views', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    { name: 'likes', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    { name: 'publishedAt', type: 'date' },
    { name: 'moderationComment', type: 'textarea', admin: { description: 'Last comment from moderator to author' } },
    { name: 'isApproved', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'isPublished', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
  ],
};
