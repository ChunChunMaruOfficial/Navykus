import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { legacyIdField, publishedField, sortOrderField, textListField } from '../fields';

export const Opportunities: CollectionConfig = {
  slug: 'opportunities',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'organization', 'opportunityType', 'deadline', 'isPublished'],
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
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'organization', type: 'text', required: true, index: true },
    { name: 'opportunityType', type: 'text', required: true, index: true },
    { name: 'shortDescription', type: 'textarea', required: true },
    { name: 'fullDescription', type: 'textarea' },
    { name: 'logoUrl', type: 'text' },
    { name: 'country', type: 'text', index: true },
    { name: 'format', type: 'select', options: ['online', 'offline', 'hybrid'], index: true },
    { name: 'ageMin', type: 'number' },
    { name: 'ageMax', type: 'number' },
    { name: 'deadline', type: 'date', index: true },
    { name: 'cost', type: 'text' },
    { name: 'funding', type: 'checkbox', defaultValue: false, index: true },
    { name: 'officialUrl', type: 'text' },
    { name: 'internalApplicationsEnabled', type: 'checkbox', defaultValue: false },
    textListField('languages', 'Languages'),
    textListField('requirements', 'Requirements'),
    textListField('benefits', 'Benefits'),
    textListField('documents', 'Documents'),
    { name: 'seoTitle', type: 'text' },
    { name: 'seoDescription', type: 'textarea' },
  ],
};
