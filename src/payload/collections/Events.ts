import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { newlineListField, publicContentVersions, publishedField, sortOrderField, syncPublishedDraftBeforeChange, textListField } from '../fields';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { localizedAfterChange, localizedAfterDelete, originalLanguageField } from '../localization';
import { publicPreview } from '../preview';
import { slugBeforeValidate } from '../slug';

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'Online & offline events (workshops, lectures, meetups)',
    defaultColumns: ['title', 'eventType', 'eventDate', 'format', 'country', 'isPublished'],
    preview: publicPreview('events'),
  },
  versions: publicContentVersions,
  access: {
    read: anyone,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  hooks: {
    beforeValidate: [slugBeforeValidate('events')],
    beforeChange: [syncPublishedDraftBeforeChange],
    afterChange: [localizedAfterChange('events'), auditAfterChange('events')],
    afterDelete: [localizedAfterDelete('events'), auditAfterDelete('events')],
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
            { name: 'slug', label: 'Slug', type: 'text', unique: true, index: true, admin: { description: 'Генерируется автоматически из заголовка, если пусто.' } },
            { name: 'shortDescription', label: 'Короткое описание', type: 'textarea', required: true },
            { name: 'fullDescription', label: 'Полное описание', type: 'textarea', admin: { description: 'Подробное описание (необязательно)' } },
            { name: 'imageUrl', label: 'Ссылка на изображение', type: 'text' },
          ],
        },
        {
          label: 'Расписание и место',
          fields: [
            { name: 'eventType', label: 'Тип события', type: 'text', required: true, index: true, admin: { description: 'Например: воркшоп, лекция, мастер-класс' } },
            {
              name: 'eventDate',
              label: 'Дата события',
              type: 'date',
              required: true,
              index: true,
              admin: {
                date: {
                  pickerAppearance: 'dayAndTime',
                },
                description: 'Техническая дата для сортировки и статуса. Время можно не показывать на сайте ниже.',
              },
            },
            {
              name: 'displayDate',
              label: 'Дата на сайте',
              type: 'text',
              admin: {
                description: 'Необязательно. Если заполнено, сайт покажет этот текст вместо автоматической даты.',
              },
            },
            {
              name: 'showTime',
              label: 'Показывать время на сайте',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Выключено по умолчанию: на карточках и в модалке показывается только дата.',
              },
            },
            { name: 'timeZone', label: 'Часовой пояс', type: 'text', defaultValue: 'UTC' },
            {
              name: 'registrationDeadline',
              label: 'Дедлайн регистрации',
              type: 'date',
              index: true,
              admin: {
                date: {
                  pickerAppearance: 'dayOnly',
                },
                description: 'Дата без времени для блока предварительного опыта/условий.',
              },
            },
            { name: 'participantLimit', label: 'Лимит участников', type: 'number' },
            {
              name: 'format',
              label: 'Формат',
              type: 'select',
              required: true,
              options: [
                { label: 'Онлайн', value: 'online' },
                { label: 'Офлайн', value: 'offline' },
                { label: 'Гибрид', value: 'hybrid' },
              ],
              index: true,
            },
            { name: 'country', label: 'Страна', type: 'text', index: true },
            { name: 'venue', label: 'Место проведения', type: 'text', admin: { condition: (_, siblingData) => siblingData?.format !== 'online', description: 'Физический адрес' } },
            { name: 'onlineLink', label: 'Ссылка на трансляцию', type: 'text', admin: { condition: (_, siblingData) => siblingData?.format !== 'offline', description: 'Ссылка Zoom/Google Meet' } },
            { name: 'registrationUrl', label: 'Ссылка на регистрацию', type: 'text', required: true, admin: { description: 'Внешняя ссылка на регистрацию/заявку' } },
          ],
        },
        {
          label: 'Детали и SEO',
          fields: [
            { name: 'speaker', label: 'Спикер', type: 'text' },
            textListField('languages', 'Языки'),
            textListField('materials', 'Материалы'),
            {
              name: 'audience',
              label: 'Кому подходит',
              type: 'textarea',
              admin: {
                rows: 4,
                description: 'Текст для блока "Кому подходит" в модальном окне активности.',
              },
            },
            newlineListField('outcomesText', 'Что вы получите'),
            {
              name: 'prerequisites',
              label: 'Предварительный опыт',
              type: 'textarea',
              admin: {
                rows: 4,
                description: 'Если оставить пустым, сайт покажет дедлайн регистрации, если он заполнен.',
              },
            },
            { name: 'seoTitle', label: 'SEO-заголовок', type: 'text' },
            { name: 'seoDescription', label: 'SEO-описание', type: 'textarea' },
          ],
        },
      ],
    },
  ],
};
