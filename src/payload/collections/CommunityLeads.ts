import type { CollectionConfig } from 'payload';

import { authenticated } from '../access';

export const CommunityLeads: CollectionConfig = {
  slug: 'community-leads',
  admin: {
    useAsTitle: 'name',
    group: 'Submissions',
  },
  access: {
    read: authenticated,
    create: () => true,
    update: authenticated,
    delete: authenticated,
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

