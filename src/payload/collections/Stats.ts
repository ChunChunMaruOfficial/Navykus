import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { legacyIdField, publishedField, sortOrderField } from '../fields';

export const Stats: CollectionConfig = {
  slug: 'stats',
  admin: {
    useAsTitle: 'label',
    group: 'Content',
    defaultColumns: ['label', 'value', 'sortOrder'],
  },
  access: {
    read: anyone,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  fields: [
    legacyIdField,
    sortOrderField,
    publishedField,
    { name: 'value', type: 'text', required: true, admin: { description: 'e.g. "15+", "1000+"' } },
    { name: 'label', type: 'text', required: true, admin: { description: 'e.g. "стран", "участников"' } },
  ],
};
