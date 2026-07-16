import type { CollectionConfig } from 'payload';

import { adminOrModerator, ownerOrStaff } from '../access';

export const ApplicationStatusHistory: CollectionConfig = {
  slug: 'application-status-history',
  admin: {
    useAsTitle: 'status',
    group: 'Submissions',
    defaultColumns: ['application', 'previousStatus', 'status', 'createdAt'],
  },
  access: {
    read: ownerOrStaff('user'),
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  fields: [
    { name: 'application', type: 'relationship', relationTo: 'applications', required: true },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true },
    { name: 'actor', type: 'relationship', relationTo: 'users' },
    { name: 'previousStatus', type: 'text' },
    { name: 'status', type: 'text', required: true },
    { name: 'comment', type: 'textarea' },
  ],
};
