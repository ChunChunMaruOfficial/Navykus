import type { CollectionConfig } from 'payload';

import { anyone, authenticated } from '../access';
import { legacyIdField, publishedField, sortOrderField } from '../fields';

export const Experts: CollectionConfig = {
  slug: 'experts',
  admin: {
    useAsTitle: 'name',
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
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'text', required: true },
    { name: 'expertise', type: 'textarea', required: true },
    { name: 'description', type: 'textarea', required: true },
  ],
};

