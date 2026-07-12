import type { CollectionConfig } from 'payload';

import { anyone, authenticated } from '../access';
import { legacyIdField, publishedField, sortOrderField } from '../fields';

export const Stats: CollectionConfig = {
  slug: 'stats',
  admin: {
    useAsTitle: 'label',
    group: 'Content',
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    legacyIdField,
    sortOrderField,
    publishedField,
    { name: 'value', type: 'text', required: true },
    { name: 'label', type: 'text', required: true },
  ],
};

