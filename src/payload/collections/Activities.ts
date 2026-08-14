import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { legacyIdField, publishedField, seoFields, sortOrderField, textListField } from '../fields';
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
    legacyIdField,
    sortOrderField,
    publishedField,
    originalLanguageField,
    { name: 'title', type: 'text', required: true },
    { name: 'shortDescription', label: 'Короткое описание', type: 'textarea', required: true },
    { name: 'fullDescription', label: 'Полное описание', type: 'textarea', required: true },
    { name: 'format', label: 'Формат', type: 'text', required: true },
    { name: 'date', label: 'Дата на сайте', type: 'text', required: true },
    { name: 'imageUrl', type: 'text', required: true },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: ['educational', 'project', 'social', 'online-meeting', 'workshop', 'team'],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: ['coming', 'ongoing', 'completed'],
    },
    { name: 'who', label: 'Кому подходит', type: 'textarea', required: true },
    textListField('benefits', 'Что вы получите'),
    { name: 'prerequisites', label: 'Предварительный опыт', type: 'textarea', required: true },
    { name: 'ctaText', label: 'Текст кнопки', type: 'text', required: true },
    { name: 'ctaLink', label: 'Ссылка кнопки', type: 'text' },
    ...seoFields,
  ],
};
