import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { publishedField, seoFields, sortOrderField } from '../fields';
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
    sortOrderField,
    publishedField,
    originalLanguageField,
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Основное',
          fields: [
            { name: 'title', label: 'Заголовок', type: 'text', required: true, admin: { description: 'Название сценария, например: "Хочу попробовать"' } },
            { name: 'who', label: 'Для кого', type: 'textarea', required: true, admin: { description: 'Кому подходит этот сценарий' } },
            { name: 'why', label: 'Зачем участвовать', type: 'textarea', required: true, admin: { description: 'Почему стоит участвовать' } },
          ],
        },
        {
          label: 'Действие',
          fields: [
            { name: 'ctaText', label: 'Текст кнопки', type: 'text', required: true, admin: { description: 'Текст кнопки действия' } },
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
        },
        {
          label: 'SEO',
          fields: [...seoFields],
        },
      ],
    },
  ],
};
