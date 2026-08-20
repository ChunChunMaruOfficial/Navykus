import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { publishedField, seoFields, sortOrderField, textListField } from '../fields';
import { localizedAfterChange, localizedAfterDelete, originalLanguageField } from '../localization';
import { publicPreview } from '../preview';

export const Activities: CollectionConfig = {
  slug: 'activities',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'category', 'status', 'date', 'isPublished'],
    preview: publicPreview('activities'),
  },
  access: {
    read: anyone,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  hooks: {
    afterChange: [localizedAfterChange('activities'), auditAfterChange('activities')],
    afterDelete: [localizedAfterDelete('activities'), auditAfterDelete('activities')],
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
            { name: 'title', label: 'Заголовок', type: 'text', required: true },
            { name: 'shortDescription', label: 'Короткое описание', type: 'textarea', required: true },
            { name: 'fullDescription', label: 'Полное описание', type: 'textarea', required: true },
            { name: 'imageUrl', label: 'Ссылка на изображение', type: 'text', required: true },
            {
              name: 'category',
              label: 'Категория',
              type: 'select',
              required: true,
              options: [
                { label: 'Образовательная', value: 'educational' },
                { label: 'Проектная', value: 'project' },
                { label: 'Социальная', value: 'social' },
                { label: 'Онлайн-встреча', value: 'online-meeting' },
                { label: 'Воркшоп', value: 'workshop' },
                { label: 'Командная', value: 'team' },
              ],
            },
            {
              name: 'status',
              label: 'Статус',
              type: 'select',
              required: true,
              options: [
                { label: 'Скоро', value: 'coming' },
                { label: 'Идёт', value: 'ongoing' },
                { label: 'Завершено', value: 'completed' },
              ],
            },
          ],
        },
        {
          label: 'Детали',
          fields: [
            { name: 'format', label: 'Формат', type: 'text', required: true },
            { name: 'date', label: 'Дата на сайте', type: 'text', required: true },
            { name: 'who', label: 'Кому подходит', type: 'textarea', required: true },
            textListField('benefits', 'Что вы получите'),
            { name: 'prerequisites', label: 'Предварительный опыт', type: 'textarea', required: true },
            { name: 'ctaText', label: 'Текст кнопки', type: 'text', required: true },
            { name: 'ctaLink', label: 'Ссылка кнопки', type: 'text' },
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
