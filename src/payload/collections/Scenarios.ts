import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { legacyIdField, publishedField, seoFields, sortOrderField } from '../fields';
import { localizedAfterChange, localizedAfterDelete, originalLanguageField } from '../localization';
import { publicPreview } from '../preview';

export const Scenarios: CollectionConfig = {
  slug: 'scenarios',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'actionType', 'sortOrder', 'isPublished'],
    preview: publicPreview('scenarios'),
  },
  access: {
    read: anyone,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  hooks: {
    afterChange: [localizedAfterChange('scenarios'), auditAfterChange('scenarios')],
    afterDelete: [localizedAfterDelete('scenarios'), auditAfterDelete('scenarios')],
  },
  fields: [
    legacyIdField,
    sortOrderField,
    publishedField,
    originalLanguageField,
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
    ...seoFields,
  ],
};
