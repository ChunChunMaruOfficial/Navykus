import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { autoSeoBeforeChange, hiddenSeoFields, publicContentVersions, publishedField, sortOrderField, syncPublishedDraftBeforeChange } from '../fields';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { localizedAfterChange, localizedAfterDelete, originalLanguageField } from '../localization';
import { publicPreview } from '../preview';

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  admin: {
    useAsTitle: 'question',
    group: 'Content',
    defaultColumns: ['question', 'page', 'isPublished', 'sortOrder'],
    preview: publicPreview('faqs'),
  },
  versions: publicContentVersions,
  access: {
    read: anyone,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  hooks: {
    beforeChange: [syncPublishedDraftBeforeChange, autoSeoBeforeChange('question', ['answer'])],
    afterChange: [localizedAfterChange('faqs'), auditAfterChange('faqs')],
    afterDelete: [localizedAfterDelete('faqs'), auditAfterDelete('faqs')],
  },
  fields: [
    sortOrderField,
    publishedField,
    originalLanguageField,
    {
      name: 'page',
      label: 'Страница',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Главная', value: 'home' },
        { label: 'О проекте', value: 'about' },
        { label: 'Чемпионат', value: 'championship' },
        { label: 'Активности', value: 'activities' },
        { label: 'Поиск команды', value: 'find-team' },
        { label: 'Возможности', value: 'opportunities' },
      ],
    },
    { name: 'question', label: 'Вопрос', type: 'text', required: true },
    { name: 'answer', label: 'Ответ', type: 'textarea', required: true },
    ...hiddenSeoFields,
  ],
};
