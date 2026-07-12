import type { CollectionConfig } from 'payload';

import { anyone, authenticated } from '../access';
import { legacyIdField, publishedField, sortOrderField } from '../fields';

export const TrustPoints: CollectionConfig = {
  slug: 'trust-points',
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
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea', required: true },
  ],
};

