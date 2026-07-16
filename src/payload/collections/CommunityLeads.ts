import type { CollectionConfig } from 'payload';

import { adminOrModerator } from '../access';

export const CommunityLeads: CollectionConfig = {
  slug: 'community-leads',
  admin: {
    useAsTitle: 'name',
    group: 'Submissions',
  },
  access: {
    read: adminOrModerator,
    create: () => true,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'age', type: 'text', required: true },
    { name: 'location', type: 'text', required: true },
    { name: 'contact', type: 'text', required: true },
    { name: 'interest', type: 'text' },
    { name: 'source', type: 'text', defaultValue: 'home-inline' },
  ],
};
