import type { CollectionConfig } from 'payload';

import { anyone, authenticated } from '../access';
import { legacyIdField, publishedField, sortOrderField } from '../fields';

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  admin: {
    useAsTitle: 'question',
    group: 'Content',
    defaultColumns: ['question', 'page', 'isPublished', 'sortOrder'],
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
    {
      name: 'page',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Home', value: 'home' },
        { label: 'About', value: 'about' },
        { label: 'Championship', value: 'championship' },
        { label: 'Activities', value: 'activities' },
        { label: 'Find team', value: 'find-team' },
        { label: 'Opportunities', value: 'opportunities' },
      ],
    },
    { name: 'question', type: 'text', required: true },
    { name: 'answer', type: 'textarea', required: true },
  ],
};
