import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { legacyIdField, publicContentVersions, publishedField, sortOrderField, syncPublishedDraftBeforeChange, textListField } from '../fields';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { localizedAfterChange, localizedAfterDelete, originalLanguageField } from '../localization';
import { publicPreview } from '../preview';
import { slugBeforeValidate } from '../slug';

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'Online & offline events (workshops, lectures, meetups)',
    defaultColumns: ['title', 'eventType', 'eventDate', 'format', 'country', 'isPublished'],
    preview: publicPreview('events'),
  },
  versions: publicContentVersions,
  access: {
    read: anyone,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  hooks: {
    beforeValidate: [slugBeforeValidate('events')],
    beforeChange: [syncPublishedDraftBeforeChange],
    afterChange: [localizedAfterChange('events'), auditAfterChange('events')],
    afterDelete: [localizedAfterDelete('events'), auditAfterDelete('events')],
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
            { name: 'shortDescription', type: 'textarea', required: true },
            { name: 'fullDescription', type: 'textarea', admin: { description: 'Detailed description (optional)' } },
            { name: 'imageUrl', type: 'text' },
          ],
        },
        {
          label: 'Schedule & Venue',
          fields: [
            { name: 'eventType', type: 'text', required: true, index: true, admin: { description: 'e.g. workshop, lecture, masterclass' } },
            { name: 'eventDate', type: 'date', required: true, index: true },
            { name: 'timeZone', type: 'text', defaultValue: 'UTC' },
            { name: 'registrationDeadline', type: 'date', index: true, admin: { description: 'Registration cutoff date' } },
            { name: 'participantLimit', type: 'number' },
            { name: 'format', type: 'select', required: true, options: ['online', 'offline', 'hybrid'], index: true },
            { name: 'country', type: 'text', index: true },
            { name: 'venue', type: 'text', admin: { condition: (_, siblingData) => siblingData?.format !== 'online', description: 'Physical location' } },
            { name: 'onlineLink', type: 'text', admin: { condition: (_, siblingData) => siblingData?.format !== 'offline', description: 'Zoom/Google Meet link' } },
          ],
        },
        {
          label: 'Details & SEO',
          fields: [
            { name: 'speaker', type: 'text' },
            textListField('languages', 'Languages'),
            textListField('materials', 'Materials'),
            { name: 'seoTitle', type: 'text' },
            { name: 'seoDescription', type: 'textarea' },
          ],
        },
      ],
    },
  ],
};
