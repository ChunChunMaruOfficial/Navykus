import type { CollectionConfig } from 'payload';

import type { Field } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { newlineListField, publicContentVersions, publishedField, seoFields, sortOrderField, syncPublishedDraftBeforeChange, textListField } from '../fields';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { localizedAfterChange, localizedAfterDelete, originalLanguageField } from '../localization';
import { publicPreview } from '../preview';
import { slugBeforeValidate } from '../slug';

export const Tournaments: CollectionConfig = {
  slug: 'tournaments',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'Case championships & competitions for students',
    defaultColumns: ['title', 'type', 'date', 'registrationDeadline', 'maxParticipants', 'isFeatured', 'isPublished'],
    preview: publicPreview('tournaments'),
  },
  versions: publicContentVersions,
  access: {
    read: anyone,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  hooks: {
    beforeValidate: [slugBeforeValidate('tournaments')],
    beforeChange: [syncPublishedDraftBeforeChange],
    afterChange: [localizedAfterChange('tournaments'), auditAfterChange('tournaments')],
    afterDelete: [localizedAfterDelete('tournaments'), auditAfterDelete('tournaments')],
  },
  fields: [
    sortOrderField,
    publishedField,
    originalLanguageField,
    {
      name: 'isFeatured',
      type: 'checkbox',
      label: 'Показывать на главной',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Отметьте, чтобы чемпионат появился на главной странице',
      },
    } as Field,
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Основное',
          fields: [
            { name: 'title', label: 'Заголовок', type: 'text', required: true },
            { name: 'slug', label: 'Slug', type: 'text', unique: true, index: true, admin: { description: 'Генерируется автоматически из заголовка, если пусто.' } },
            { name: 'type', label: 'Тип', type: 'text', required: true, admin: { description: 'Например: "Кейс-чемпионат", "Хакатон"' } },
            { name: 'description', label: 'Описание', type: 'textarea', required: true, admin: { rows: 10 } },
            { name: 'pitch', label: 'Короткий текст для хиро-блока', type: 'textarea', admin: { rows: 6, description: 'Если пусто, используется описание.' } },
          ],
        },
        {
          label: 'Расписание',
          fields: [
            { name: 'date', label: 'Дата проведения', type: 'text', required: true, admin: { description: 'Даты события (текстом)' } },
            { name: 'registrationDeadline', label: 'Дедлайн регистрации', type: 'text', required: true, admin: { description: 'Дата окончания регистрации' } },
            {
              name: 'registrationStatus',
              label: 'Статус регистрации',
              type: 'select',
              required: true,
              defaultValue: 'open',
              options: [
                { label: 'Открыта', value: 'open' },
                { label: 'Приостановлена', value: 'suspended' },
                { label: 'Закрыта', value: 'closed' },
              ],
            },
          ],
        },
        {
          label: 'Детали',
          fields: [
            { name: 'maxParticipants', label: 'Максимум участников', type: 'number', required: true },
            textListField('skills', 'Необходимые навыки'),
            textListField('mentors', 'Наставники'),
            { name: 'suitableFor', label: 'Кому подходит', type: 'textarea', admin: { rows: 5 } },
            {
              name: 'format',
              label: 'Формат участия',
              type: 'textarea',
              admin: {
                rows: 4,
                description: 'Карточка "Формат участия" на странице чемпионата. Первая строка - крупный текст, остальные строки - подпись. Пустое поле скрывает карточку.',
              },
            },
            { name: 'targetAudience', label: 'Целевая аудитория', type: 'textarea' },
            { name: 'ageLimit', label: 'Возраст', type: 'text' },
            { name: 'teamsAllowed', label: 'Команды', type: 'text' },
            { name: 'language', label: 'Язык', type: 'text' },
            { name: 'expectedResult', label: 'Что получите / результат', type: 'textarea' },
            newlineListField('themesText', 'Темы кейса'),
            newlineListField('evaluationCriteriaText', 'Критерии оценки'),
            ...seoFields,
          ],
        },
      ],
    },
  ],
};
