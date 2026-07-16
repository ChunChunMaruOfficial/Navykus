import type { CollectionConfig } from 'payload';

import { adminOrModerator } from '../access';

export const BlogModerationHistory: CollectionConfig = {
  slug: 'blog-moderation-history',
  admin: {
    useAsTitle: 'status',
    group: 'Blog',
    defaultColumns: ['post', 'previousStatus', 'status', 'actor', 'createdAt'],
  },
  access: {
    // Author sees history of own posts; staff sees all.
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === 'admin' || user.role === 'moderator') return true;
      return { author: { equals: user.id } };
    },
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  fields: [
    { name: 'post', type: 'relationship', relationTo: 'blog-posts' as any, required: true, index: true },
    { name: 'author', type: 'relationship', relationTo: 'users' as any, index: true },
    { name: 'actor', type: 'relationship', relationTo: 'users' as any },
    { name: 'previousStatus', type: 'text' },
    { name: 'status', type: 'text', required: true },
    { name: 'comment', type: 'textarea' },
  ],
};
