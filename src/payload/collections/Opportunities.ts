import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { legacyIdField, publishedField, sortOrderField, textListField } from '../fields';

export const Opportunities: CollectionConfig = {
  slug: 'opportunities',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'External & internal opportunities for students (grants, internships, olympiads, etc.)',
    defaultColumns: ['title', 'organization', 'opportunityType', 'deadline', 'format', 'isPublished'],
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
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'slug', type: 'text', required: true, unique: true, index: true },
            { name: 'organization', type: 'text', required: true, index: true },
            { name: 'opportunityType', type: 'text', required: true, index: true, admin: { description: 'e.g. championship, olympiad, internship, grant' } },
            { name: 'shortDescription', type: 'textarea', required: true },
            { name: 'fullDescription', type: 'textarea', admin: { description: 'Detailed description (optional)' } },
            { name: 'logoUrl', type: 'text' },
          ],
        },
        {
          label: 'Eligibility & Details',
          fields: [
            { name: 'country', type: 'text', index: true },
            { name: 'format', type: 'select', options: ['online', 'offline', 'hybrid'], index: true },
            { name: 'ageMin', type: 'number' },
            { name: 'ageMax', type: 'number' },
            { name: 'cost', type: 'text', admin: { description: 'Cost description (e.g. "Free", "$50")' } },
            { name: 'funding', type: 'checkbox', defaultValue: false, index: true },
            { name: 'deadline', type: 'date', index: true },
            textListField('languages', 'Languages'),
            textListField('requirements', 'Requirements'),
            textListField('benefits', 'Benefits'),
            textListField('documents', 'Documents'),
          ],
        },
        {
          label: 'Links & SEO',
          fields: [
            { name: 'officialUrl', type: 'text', admin: { description: 'External application link' } },
            { name: 'internalApplicationsEnabled', type: 'checkbox', defaultValue: false },
            { name: 'seoTitle', type: 'text' },
            { name: 'seoDescription', type: 'textarea' },
          ],
        },
      ],
    },
  ],
};
