import type { CollectionBeforeValidateHook, CollectionConfig, Field } from 'payload';

import { adminOrModerator, anyone } from '../access';
import {
  fillNotNullDefaults,
  publicContentVersions,
  publishedField,
  sortOrderField,
  syncPublishedDraftBeforeChange,
  textListField,
  translationStatusField,
} from '../fields';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { localizedAfterChange, localizedAfterDelete, originalLanguageField } from '../localization';
import { CONTENT_LANGUAGE_OPTIONS, OPPORTUNITY_CATEGORY_OPTIONS, OPPORTUNITY_COST_OPTIONS } from '../options';
import { publicPreview } from '../preview';
import { slugBeforeValidate } from '../slug';

// `opportunityType` is a legacy NOT NULL column; the site derives everything from `category`.
const opportunityTypeFromCategory: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  if (!data) return data;
  const current = typeof data.opportunityType === 'string' ? data.opportunityType.trim() : '';
  if (!current) data.opportunityType = data.category || originalDoc?.category || 'projects';
  return data;
};

// Feeds the «Возможности» catalogue on the activities page (/activities/opportunities).
export const Opportunities: CollectionConfig = {
  slug: 'opportunities',
  labels: {
    singular: 'Возможность',
    plural: 'Возможности',
  },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'Каталог «Возможности»: олимпиады, стажировки, гранты, летние школы. Пишите на исходном языке — переводы на все языки сайта делаются автоматически сразу после сохранения.',
    defaultColumns: ['title', 'organization', 'category', 'deadline', 'format', 'isPublished'],
    listSearchableFields: ['title', 'organization', 'shortDescription'],
    preview: publicPreview('opportunities'),
  },
  versions: publicContentVersions,
  access: {
    read: anyone,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  hooks: {
    beforeValidate: [slugBeforeValidate('opportunities'), opportunityTypeFromCategory],
    beforeChange: [
      syncPublishedDraftBeforeChange,
      fillNotNullDefaults({ title: '', organization: '', opportunityType: 'projects', shortDescription: '' }),
    ],
    afterChange: [localizedAfterChange('opportunities'), auditAfterChange('opportunities')],
    afterDelete: [localizedAfterDelete('opportunities'), auditAfterDelete('opportunities')],
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
          description: 'То, что видно в карточке каталога.',
          fields: [
            { name: 'title', label: 'Название', type: 'text', required: true },
            { name: 'organization', label: 'Организатор', type: 'text', required: true, index: true, admin: { description: 'Показывается под названием.' } },
            {
              type: 'row',
              fields: [
                {
                  name: 'category',
                  label: 'Категория',
                  type: 'select',
                  required: true,
                  defaultValue: 'projects',
                  options: [...OPPORTUNITY_CATEGORY_OPTIONS],
                  admin: { width: '50%', description: 'Фильтр «Категория» в каталоге.' },
                },
                {
                  name: 'direction',
                  label: 'Направление',
                  type: 'select',
                  defaultValue: 'social',
                  options: [
                    { label: 'Бизнес', value: 'business' },
                    { label: 'Наука', value: 'science' },
                    { label: 'Технологии', value: 'tech' },
                    { label: 'Социальное', value: 'social' },
                    { label: 'Креатив', value: 'creative' },
                    { label: 'Лидерство', value: 'leadership' },
                  ],
                  admin: { width: '50%' },
                },
              ],
            },
            { name: 'shortDescription', label: 'Короткое описание', type: 'textarea', required: true, admin: { rows: 3, description: '1–2 предложения для карточки.' } },
            {
              name: 'image',
              label: 'Картинка',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Обложка карточки (16:9).' },
            },
            {
              type: 'row',
              admin: { condition: (_, siblingData) => !siblingData?.image },
              fields: [
                { name: 'imageUrl', label: 'Картинка по ссылке', type: 'text', admin: { width: '50%', description: 'Если файл не загружен.' } },
                { name: 'logoUrl', label: 'Логотип по ссылке', type: 'text', admin: { width: '50%', description: 'Запасной вариант картинки.' } },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'source',
                  label: 'Источник',
                  type: 'select',
                  defaultValue: 'verified',
                  options: [
                    { label: 'Navykus', value: 'navykus' },
                    { label: 'Проверено', value: 'verified' },
                    { label: 'Партнёр', value: 'partner' },
                  ],
                  admin: { width: '50%', description: 'Плашка на карточке.' },
                },
                { name: 'editorPick', label: 'Выбор редакции', type: 'checkbox', defaultValue: false, admin: { width: '25%', style: { alignSelf: 'center' } } },
                { name: 'recommended', label: 'Рекомендуем', type: 'checkbox', defaultValue: false, admin: { width: '25%', style: { alignSelf: 'center' } } },
              ],
            },
          ],
        },
        {
          label: 'Условия',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'deadline', label: 'Дедлайн заявок', type: 'date', index: true, admin: { width: '33%', date: { pickerAppearance: 'dayOnly' }, description: 'Пусто — «приём заявок постоянно».' } },
                { name: 'startDate', label: 'Дата начала', type: 'date', admin: { width: '33%', date: { pickerAppearance: 'dayOnly' } } },
                { name: 'registrationOpen', label: 'Регистрация открыта', type: 'checkbox', defaultValue: true, admin: { width: '33%', style: { alignSelf: 'center' } } },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'format',
                  label: 'Формат',
                  type: 'select',
                  defaultValue: 'online',
                  options: [
                    { label: 'Онлайн', value: 'online' },
                    { label: 'Офлайн', value: 'offline' },
                    { label: 'Гибрид', value: 'hybrid' },
                  ],
                  index: true,
                  admin: { width: '33%' },
                },
                {
                  name: 'participation',
                  label: 'Участие',
                  type: 'select',
                  defaultValue: 'both',
                  options: [
                    { label: 'Индивидуальное', value: 'individual' },
                    { label: 'Командное', value: 'team' },
                    { label: 'Оба варианта', value: 'both' },
                  ],
                  admin: { width: '33%' },
                },
                {
                  name: 'cost',
                  label: 'Стоимость',
                  type: 'select',
                  defaultValue: 'free',
                  options: [...OPPORTUNITY_COST_OPTIONS],
                  admin: { width: '33%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'country', label: 'Страна', type: 'text', index: true, admin: { width: '50%', placeholder: 'Международно' } },
                { name: 'city', label: 'Город / где проходит', type: 'text', admin: { width: '50%', placeholder: 'Онлайн' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'ageMin', label: 'Возраст от', type: 'number', min: 0, max: 30, admin: { width: '25%' } },
                { name: 'ageMax', label: 'Возраст до', type: 'number', min: 0, max: 30, admin: { width: '25%' } },
                { name: 'finalDeadline', label: 'Дедлайн окончательный', type: 'checkbox', defaultValue: false, admin: { width: '50%', style: { alignSelf: 'center' }, description: 'Попадает в подборку «Скоро дедлайн» за 14 дней до срока.' } },
              ],
            },
            {
              name: 'languages',
              label: 'Языки',
              type: 'array',
              labels: { singular: 'Язык', plural: 'Языки' },
              fields: [
                { name: 'value', label: 'Язык', type: 'select', required: true, options: [...CONTENT_LANGUAGE_OPTIONS] },
              ],
            },
            {
              name: 'grades',
              label: 'Классы',
              type: 'array',
              labels: { singular: 'Класс', plural: 'Классы' },
              admin: { description: 'Номера классов, например 8, 9, 10. Используется фильтром «Класс».' },
              fields: [
                { name: 'value', label: 'Класс', type: 'text', required: true, validate: (value: unknown) => (/^\d{1,2}$/.test(String(value || '').trim()) ? true : 'Укажите номер класса цифрами, например 9') },
              ],
            },
          ],
        },
        {
          label: 'Подробности',
          description: 'Содержимое окна с подробностями.',
          fields: [
            { name: 'fullDescription', label: 'Полное описание', type: 'textarea', admin: { rows: 6, description: 'Если пусто — показывается короткое описание.' } },
            { ...textListField('skills', 'Навыки'), admin: { description: 'Первые три показываются тегами на карточке.' } } as Field,
            textListField('requirements', 'Требования'),
            { ...textListField('benefits', 'Что получит участник'), admin: { description: 'Блок «Что получите».' } } as Field,
            textListField('documents', 'Документы'),
            { name: 'officialUrl', label: 'Ссылка на заявку', type: 'text', required: true, admin: { placeholder: 'https://…', description: 'Куда ведёт кнопка подачи заявки.' } },
          ],
        },
        {
          label: 'Дополнительно',
          fields: [
            { name: 'slug', label: 'Адрес (slug)', type: 'text', unique: true, index: true, admin: { description: 'Заполняется автоматически из названия.' } },
            { ...textListField('keywords', 'Ключевые слова для поиска'), admin: { description: 'Не показываются, но помогают найти возможность поиском.' } } as Field,
            {
              type: 'row',
              fields: [
                { name: 'portfolioValue', label: 'Ценность для портфолио (0–100)', type: 'number', defaultValue: 0, min: 0, max: 100, admin: { width: '50%', description: '70 и выше — попадает в фильтр «Ценно для портфолио».' } },
                { name: 'savedCount', label: 'Популярность', type: 'number', defaultValue: 0, min: 0, admin: { width: '50%', description: 'Чем больше, тем выше в сортировке «Популярные».' } },
              ],
            },
            { name: 'publishedAt', label: 'Дата публикации', type: 'date', admin: { description: 'Для сортировки «Новые». Если пусто — дата создания.' } },
            // Legacy fields the site no longer reads; kept (hidden) so existing data is not lost.
            { name: 'opportunityType', label: 'Тип (устарело)', type: 'text', index: true, admin: { hidden: true } },
            { name: 'seats', label: 'Мест (устарело)', type: 'number', defaultValue: 0, admin: { hidden: true } },
            { name: 'funding', label: 'Есть финансирование (устарело)', type: 'checkbox', defaultValue: false, index: true, admin: { hidden: true } },
            { name: 'internalApplicationsEnabled', label: 'Внутренние заявки (устарело)', type: 'checkbox', defaultValue: false, admin: { hidden: true } },
            // Legacy SEO fields: opportunities open in a modal inside the catalogue, so they are not used.
            { name: 'seoTitle', label: 'SEO-заголовок', type: 'text', admin: { hidden: true } },
            { name: 'seoDescription', label: 'SEO-описание', type: 'textarea', admin: { hidden: true } },
          ],
        },
      ],
    },
  ],
};
