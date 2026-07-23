import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { legacyIdField, publishedField, sortOrderField } from '../fields';

export const Experts: CollectionConfig = {
  slug: 'experts',
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    defaultColumns: ['name', 'type', 'tournamentId', 'role'],
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
    { name: 'name', type: 'text', required: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'expert',
      options: [
        { label: 'Жюри', value: 'jury' },
        { label: 'Наставник', value: 'mentor' },
        { label: 'Эксперт', value: 'expert' },
      ],
      admin: {
        description: 'Роль в чемпионате: жюри, наставник или эксперт',
      },
    },
    { name: 'role', type: 'text', required: true },
    { name: 'expertise', type: 'textarea', required: true },
    { name: 'description', type: 'textarea', required: true },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Фото эксперта/наставника/жюри',
      },
    },
    {
      name: 'tournamentId',
      type: 'relationship',
      relationTo: 'tournaments',
      hasMany: false,
      admin: {
        description: 'К какому чемпионату привязан эксперт',
      },
    },
  ],
};
