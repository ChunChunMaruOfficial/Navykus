import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { legacyIdField, publicContentVersions, publishedField, sortOrderField, syncPublishedDraftBeforeChange, textListField } from '../fields';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { localizedAfterChange, localizedAfterDelete, originalLanguageField } from '../localization';
import { publicPreview } from '../preview';
import { slugBeforeValidate } from '../slug';

export const Opportunities: CollectionConfig = {
  slug: 'opportunities',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'External & internal opportunities for students (grants, internships, olympiads, etc.)',
    defaultColumns: ['title', 'organization', 'opportunityType', 'deadline', 'format', 'isPublished'],
    preview: publicPreview('opportunities'),
  },
  versions: publicContentVersions,
  access: {
    read: anyone,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  hooks: {
    beforeValidate: [slugBeforeValidate('opportunities')],
    beforeChange: [syncPublishedDraftBeforeChange],
    afterChange: [localizedAfterChange('opportunities'), auditAfterChange('opportunities')],
    afterDelete: [localizedAfterDelete('opportunities'), auditAfterDelete('opportunities')],
  },
  fields: [
    legacyIdField,
    sortOrderField,
    publishedField,
    originalLanguageField,
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'slug', type: 'text', unique: true, index: true, admin: { description: 'Auto-generated from title when empty.' } },
            { name: 'organization', type: 'text', required: true, index: true },
            { name: 'opportunityType', type: 'text', required: true, index: true, admin: { description: 'e.g. championship, olympiad, internship, grant' } },
            { name: 'source', type: 'select', options: ['navykus', 'verified', 'partner'], defaultValue: 'verified' },
            { name: 'category', type: 'text', admin: { description: 'Frontend category id, e.g. championships, olympiads, internships, projects' } },
            { name: 'direction', type: 'select', options: ['business', 'science', 'tech', 'social', 'creative', 'leadership'], defaultValue: 'social' },
            { name: 'participation', type: 'select', options: ['individual', 'team', 'both'], defaultValue: 'both' },
            { name: 'shortDescription', type: 'textarea', required: true },
            { name: 'fullDescription', type: 'textarea', admin: { description: 'Detailed description (optional)' } },
            { name: 'logoUrl', type: 'text' },
            { name: 'imageUrl', type: 'text', admin: { description: 'Public card/detail image URL. Falls back to logo URL.' } },
          ],
        },
        {
          label: 'Eligibility & Details',
          fields: [
            { name: 'country', type: 'text', index: true },
            { name: 'city', type: 'text' },
            { name: 'format', type: 'select', options: ['online', 'offline', 'hybrid'], index: true },
            { name: 'ageMin', type: 'number' },
            { name: 'ageMax', type: 'number' },
            { name: 'cost', type: 'text', admin: { description: 'Cost description (e.g. "Free", "$50")' } },
            { name: 'funding', type: 'checkbox', defaultValue: false, index: true },
            { name: 'deadline', type: 'date', index: true },
            { name: 'startDate', type: 'date' },
            { name: 'finalDeadline', type: 'checkbox', defaultValue: false },
            { name: 'registrationOpen', type: 'checkbox', defaultValue: true },
            { name: 'seats', type: 'number', defaultValue: 0 },
            { name: 'savedCount', type: 'number', defaultValue: 0 },
            { name: 'editorPick', type: 'checkbox', defaultValue: false },
            { name: 'recommended', type: 'checkbox', defaultValue: false },
            { name: 'portfolioValue', type: 'number', defaultValue: 0 },
            { name: 'publishedAt', type: 'date' },
            textListField('languages', 'Languages'),
            textListField('skills', 'Skills'),
            textListField('keywords', 'Keywords'),
            textListField('grades', 'Grades'),
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
