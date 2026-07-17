import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { legacyIdField, publishedField, sortOrderField, textListField } from '../fields';

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'Online & offline events (workshops, lectures, meetups)',
    defaultColumns: ['title', 'eventType', 'eventDate', 'format', 'country', 'isPublished'],
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
