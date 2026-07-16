import type { CollectionConfig } from 'payload';

import { ownerOrStaff } from '../access';

export const Favorites: CollectionConfig = {
  slug: 'favorites',
  admin: {
    useAsTitle: 'itemTitle',
    group: 'Community',
    defaultColumns: ['user', 'itemType', 'itemTitle', 'createdAt'],
  },
  access: {
    read: ownerOrStaff('user'),
    create: ({ req: { user } }) => Boolean(user),
    update: ownerOrStaff('user'),
    delete: ownerOrStaff('user'),
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true },
    {
      name: 'itemType',
      type: 'select',
      required: true,
      index: true,
      options: ['championship', 'event', 'opportunity', 'participant', 'team-post'],
    },
    { name: 'itemId', type: 'text', required: true, index: true },
    { name: 'itemTitle', type: 'text', required: true },
    { name: 'href', type: 'text', required: true },
  ],
};
