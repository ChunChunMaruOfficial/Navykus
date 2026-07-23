import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { legacyIdField, publishedField, sortOrderField } from '../fields';

export const Scenarios: CollectionConfig = {
  slug: 'scenarios',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'actionType', 'sortOrder'],
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
    { name: 'title', type: 'text', required: true, admin: { description: 'Scenario title, e.g. "Хочу попробовать"' } },
    { name: 'who', type: 'textarea', required: true, admin: { description: 'Who this scenario is for' } },
    { name: 'why', type: 'textarea', required: true, admin: { description: 'Why participate' } },
    { name: 'ctaText', type: 'text', required: true, admin: { description: 'Button text' } },
    {
      name: 'actionType',
      type: 'select',
      required: true,
      defaultValue: 'general',
      options: [
        { label: 'Подать заявку', value: 'apply' },
        { label: 'Поиск команды', value: 'team' },
        { label: 'Активности', value: 'activity' },
        { label: 'Общее', value: 'general' },
      ],
    },
  ],
};
