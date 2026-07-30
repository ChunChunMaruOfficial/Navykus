import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { legacyIdField, publicContentVersions, publishedField, seoFields, sortOrderField, syncPublishedDraftBeforeChange } from '../fields';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { localizedAfterChange, localizedAfterDelete, originalLanguageField } from '../localization';
import { publicPreview } from '../preview';

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  admin: {
    useAsTitle: 'question',
    group: 'Content',
    defaultColumns: ['question', 'page', 'isPublished', 'sortOrder'],
    preview: publicPreview('faqs'),
  },
  versions: publicContentVersions,
  access: {
    read: anyone,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  hooks: {
    beforeChange: [syncPublishedDraftBeforeChange],
    afterChange: [localizedAfterChange('faqs'), auditAfterChange('faqs')],
    afterDelete: [localizedAfterDelete('faqs'), auditAfterDelete('faqs')],
  },
  fields: [
    legacyIdField,
    sortOrderField,
    publishedField,
    originalLanguageField,
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
    ...seoFields,
  ],
};
