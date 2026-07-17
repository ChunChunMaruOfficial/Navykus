import type { CollectionConfig } from 'payload';

import type { Field } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { legacyIdField, publishedField, sortOrderField, textListField } from '../fields';

export const Tournaments: CollectionConfig = {
  slug: 'tournaments',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'Case championships & competitions for students',
    defaultColumns: ['title', 'type', 'date', 'registrationDeadline', 'maxParticipants', 'isFeatured', 'isPublished'],
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
      name: 'isFeatured',
      type: 'checkbox',
      label: 'Featured on homepage',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Mark this championship to appear on the homepage',
      },
    } as Field,
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'type', type: 'text', required: true, admin: { description: 'e.g. "Кейс-чемпионат", "Хакатон"' } },
            { name: 'description', type: 'textarea', required: true },
          ],
        },
        {
          label: 'Schedule',
          fields: [
            { name: 'date', type: 'text', required: true, admin: { description: 'Event date(s)' } },
            { name: 'registrationDeadline', type: 'text', required: true, admin: { description: 'Registration cutoff date' } },
          ],
        },
        {
          label: 'Details',
          fields: [
            { name: 'maxParticipants', type: 'number', required: true },
            textListField('skills', 'Required Skills'),
            textListField('mentors', 'Mentors'),
            { name: 'suitableFor', type: 'textarea', admin: { description: 'Who this is suitable for' } },
            { name: 'format', type: 'textarea', admin: { description: 'Format description (e.g. online, offline, hybrid)' } },
          ],
        },
      ],
    },
  ],
};
