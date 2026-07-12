import type { CollectionConfig } from 'payload';

import { anyone, authenticated } from '../access';
import { legacyIdField, publishedField, sortOrderField } from '../fields';

export const Pillars: CollectionConfig = {
  slug: 'pillars',
  admin: {
    useAsTitle: 'title',
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
    { name: 'label', type: 'text', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea', required: true },
  ],
};

