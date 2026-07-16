import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { legacyIdField, publishedField, sortOrderField, textListField } from '../fields';

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'eventType', 'eventDate', 'isPublished'],
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
    { name: 'shortDescription', type: 'textarea', required: true },
    { name: 'fullDescription', type: 'textarea' },
    { name: 'imageUrl', type: 'text' },
    { name: 'eventType', type: 'text', required: true, index: true },
    { name: 'eventDate', type: 'date', required: true, index: true },
    { name: 'timeZone', type: 'text', defaultValue: 'UTC' },
    { name: 'format', type: 'select', required: true, options: ['online', 'offline', 'hybrid'], index: true },
    { name: 'country', type: 'text', index: true },
    { name: 'venue', type: 'text' },
    { name: 'speaker', type: 'text' },
    { name: 'participantLimit', type: 'number' },
    { name: 'registrationDeadline', type: 'date', index: true },
    { name: 'onlineLink', type: 'text', admin: { condition: (_, siblingData) => siblingData?.format !== 'offline' } },
    textListField('languages', 'Languages'),
    textListField('materials', 'Materials'),
    { name: 'seoTitle', type: 'text' },
    { name: 'seoDescription', type: 'textarea' },
  ],
};
