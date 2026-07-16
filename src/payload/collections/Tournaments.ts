import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { legacyIdField, publishedField, sortOrderField, textListField } from '../fields';

export const Tournaments: CollectionConfig = {
  slug: 'tournaments',
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
    { name: 'type', type: 'text', required: true },
    { name: 'date', type: 'text', required: true },
    { name: 'registrationDeadline', type: 'text', required: true },
    { name: 'description', type: 'textarea', required: true },
    textListField('skills', 'Skills'),
    textListField('mentors', 'Mentors'),
    { name: 'maxParticipants', type: 'number', required: true },
    { name: 'suitableFor', type: 'textarea' },
    { name: 'format', type: 'textarea' },
  ],
};
