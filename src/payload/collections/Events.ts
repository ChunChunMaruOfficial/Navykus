import type { CollectionConfig, Field } from 'payload';

import { adminOrModerator, anyone } from '../access';
import {
  autoSeoBeforeChange,
  fillNotNullDefaults,
  imageField,
  newlineListField,
  publicContentVersions,
  publishedField,
  sortOrderField,
  syncPublishedDraftBeforeChange,
  textListField,
  translationStatusField,
} from '../fields';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { localizedAfterChange, localizedAfterDelete, originalLanguageField } from '../localization';
import { ACTIVITY_CATEGORY_OPTIONS, CONTENT_LANGUAGE_OPTIONS } from '../options';
import { publicPreview } from '../preview';
import { slugBeforeValidate } from '../slug';

// Feeds the public «Активности» page (/activities/events): cards + the details modal.
export const Events: CollectionConfig = {
  slug: 'events',
  labels: {
    singular: 'Активность',
    plural: 'Активности',
  },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'Карточки на странице «Активности»: воркшопы, лекции, хакатоны, встречи. Пишите на исходном языке — переводы на все языки сайта делаются автоматически сразу после сохранения.',
    defaultColumns: ['title', 'eventType', 'eventDate', 'format', 'isPublished'],
    listSearchableFields: ['title', 'shortDescription', 'speaker'],
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
    beforeChange: [
      syncPublishedDraftBeforeChange,
      autoSeoBeforeChange('title', ['shortDescription', 'fullDescription']),
      fillNotNullDefaults({
        title: '',
        shortDescription: '',
        eventType: 'educational',
        format: 'online',
        eventDate: () => new Date().toISOString(),
      }),
    ],
    afterChange: [localizedAfterChange('events'), auditAfterChange('events')],
    afterDelete: [localizedAfterDelete('events'), auditAfterDelete('events')],
  },
  fields: [
    translationStatusField,
    publishedField,
    originalLanguageField,
    { ...sortOrderField, admin: { hidden: true } } as Field,
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Карточка',
          description: 'То, что видно в карточке на странице «Активности».',
          fields: [
            { name: 'title', label: 'Название', type: 'text', required: true },
            {
              type: 'row',
              fields: [
                {
                  name: 'eventType',
                  label: 'Категория',
                  type: 'select',
                  required: true,
                  defaultValue: 'educational',
                  options: [...ACTIVITY_CATEGORY_OPTIONS],
                  index: true,
                  admin: { width: '50%', description: 'Плашка на карточке и фильтр на странице.' },
                },
                {
                  name: 'format',
                  label: 'Формат',
                  type: 'select',
                  required: true,
                  defaultValue: 'online',
                  options: [
                    { label: 'Онлайн', value: 'online' },
                    { label: 'Офлайн', value: 'offline' },
                    { label: 'Гибрид', value: 'hybrid' },
                  ],
                  index: true,
                  admin: { width: '50%', description: 'Переводится на сайте автоматически.' },
                },
              ],
            },
            { name: 'shortDescription', label: 'Короткое описание', type: 'textarea', required: true, admin: { rows: 3, description: '1–2 предложения для карточки.' } },
            imageField('image', 'Картинка', 'Обложка карточки (16:9). Если пусто — цветной фон категории.'),
            // Legacy picture link: hidden (pictures are only uploaded as files), still used by the site as a fallback.
            { name: 'imageUrl', label: 'Картинка по ссылке', type: 'text', admin: { hidden: true } },
            { name: 'slug', label: 'Адрес (slug)', type: 'text', unique: true, index: true, admin: { hidden: true } }, // generated from the title (slugBeforeValidate)
          ],
        },
        {
          label: 'Дата и место',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'eventDate',
                  label: 'Дата и время',
                  type: 'date',
                  required: true,
                  index: true,
                  admin: {
                    width: '50%',
                    date: { pickerAppearance: 'dayAndTime' },
                    description: 'По ней сайт сортирует активности и ставит статус «Скоро» / «Завершено».',
                  },
                },
                {
                  name: 'showTime',
                  label: 'Показывать время на сайте',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: { width: '50%', style: { alignSelf: 'center' } },
                },
              ],
            },
            {
              name: 'displayDate',
              label: 'Дата текстом (необязательно)',
              type: 'text',
              admin: { placeholder: '12–14 сентября 2026', description: 'Если заполнено, сайт покажет этот текст вместо автоматической даты (переводится автоматически).' },
            },
            {
              type: 'row',
              fields: [
                { name: 'country', label: 'Страна / регион', type: 'text', index: true, admin: { width: '50%', placeholder: 'Казахстан' } },
                {
                  name: 'venue',
                  label: 'Место проведения',
                  type: 'text',
                  admin: { width: '50%', condition: (_, siblingData) => siblingData?.format !== 'online', description: 'Адрес или площадка.' },
                },
              ],
            },
            {
              name: 'onlineLink',
              label: 'Ссылка на трансляцию',
              type: 'text',
              admin: { condition: (_, siblingData) => siblingData?.format !== 'offline', description: 'Zoom / Google Meet. На сайте не показывается.' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'registrationDeadline',
                  label: 'Дедлайн регистрации',
                  type: 'date',
                  index: true,
                  admin: { width: '50%', date: { pickerAppearance: 'dayOnly' }, description: 'Показывается в блоке «Предварительный опыт», если тот пуст.' },
                },
                { name: 'participantLimit', label: 'Лимит участников', type: 'number', min: 0, admin: { width: '50%', description: 'Показывается в блоке «Кому подходит» («до N участников»).' } },
              ],
            },
            {
              name: 'registrationUrl',
              label: 'Ссылка на регистрацию',
              type: 'text',
              required: true,
              admin: { placeholder: 'https://…', description: 'Куда ведёт кнопка «Принять участие».' },
            },
            { name: 'timeZone', label: 'Часовой пояс', type: 'text', defaultValue: 'UTC', admin: { hidden: true } },
          ],
        },
        {
          label: 'Подробности',
          description: 'Содержимое окна, которое открывается по клику на карточку.',
          fields: [
            { name: 'fullDescription', label: 'Полное описание', type: 'textarea', admin: { rows: 6, description: 'Если пусто — показывается короткое описание.' } },
            { name: 'audience', label: 'Кому подходит', type: 'textarea', admin: { rows: 3 } },
            { ...newlineListField('outcomesText', 'Что вы получите'), admin: { rows: 4, description: 'Один пункт на строку.' } } as Field,
            { name: 'prerequisites', label: 'Предварительный опыт', type: 'textarea', admin: { rows: 3, description: 'Если пусто — сайт покажет дедлайн регистрации.' } },
            { name: 'speaker', label: 'Спикер', type: 'text' },
            {
              name: 'languages',
              label: 'Языки проведения',
              type: 'array',
              labels: { singular: 'Язык', plural: 'Языки' },
              admin: { initCollapsed: false },
              fields: [
                { name: 'value', label: 'Язык', type: 'select', required: true, options: [...CONTENT_LANGUAGE_OPTIONS] },
              ],
            },
            { ...textListField('materials', 'Материалы'), admin: { description: 'Добавляются в блок «Что вы получите».' } } as Field,
            // SEO fields: generated automatically on save (autoSeoBeforeChange), never edited.
            { name: 'seoTitle', label: 'SEO-заголовок', type: 'text', admin: { hidden: true } },
            { name: 'seoDescription', label: 'SEO-описание', type: 'textarea', admin: { hidden: true } },
          ],
        },
      ],
    },
  ],
};
