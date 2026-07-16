import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { legacyIdField, publishedField, sortOrderField, textListField } from '../fields';

export const Activities: CollectionConfig = {
  slug: 'activities',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
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
    { name: 'title', type: 'text', required: true },
    { name: 'shortDescription', type: 'textarea', required: true },
    { name: 'fullDescription', type: 'textarea', required: true },
    { name: 'format', type: 'text', required: true },
    { name: 'date', type: 'text', required: true },
    { name: 'imageUrl', type: 'text', required: true },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: ['educational', 'project', 'social', 'online-meeting', 'workshop', 'team'],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: ['coming', 'ongoing', 'completed'],
    },
    { name: 'who', type: 'textarea', required: true },
    textListField('benefits', 'Benefits'),
    { name: 'prerequisites', type: 'textarea', required: true },
    { name: 'ctaText', type: 'text', required: true },
    { name: 'ctaLink', type: 'text' },
  ],
};
