import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { publicContentVersions, publishedField, sortOrderField, syncPublishedDraftBeforeChange, textListField } from '../fields';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { localizedAfterChange, localizedAfterDelete, originalLanguageField } from '../localization';
import { publicPreview } from '../preview';
import { slugBeforeValidate } from '../slug';

export const Opportunities: CollectionConfig = {
  slug: 'opportunities',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'External & internal opportunities for students (grants, internships, olympiads, etc.)',
    defaultColumns: ['title', 'organization', 'opportunityType', 'deadline', 'format', 'isPublished'],
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
    beforeValidate: [slugBeforeValidate('opportunities')],
    beforeChange: [syncPublishedDraftBeforeChange],
    afterChange: [localizedAfterChange('opportunities'), auditAfterChange('opportunities')],
    afterDelete: [localizedAfterDelete('opportunities'), auditAfterDelete('opportunities')],
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
            { name: 'organization', label: 'Организация', type: 'text', required: true, index: true },
            { name: 'opportunityType', label: 'Тип возможности', type: 'text', required: true, index: true, admin: { description: 'Например: чемпионат, олимпиада, стажировка, грант' } },
            {
              name: 'source',
              label: 'Источник',
              type: 'select',
              options: [
                { label: 'Navykus', value: 'navykus' },
                { label: 'Проверено', value: 'verified' },
                { label: 'Партнёр', value: 'partner' },
              ],
              defaultValue: 'verified',
            },
            { name: 'category', label: 'Категория', type: 'text', admin: { description: 'ID категории фронтенда, например: championships, olympiads, internships, projects' } },
            {
              name: 'direction',
              label: 'Направление',
              type: 'select',
              options: [
                { label: 'Бизнес', value: 'business' },
                { label: 'Наука', value: 'science' },
                { label: 'Технологии', value: 'tech' },
                { label: 'Социальное', value: 'social' },
                { label: 'Креатив', value: 'creative' },
                { label: 'Лидерство', value: 'leadership' },
              ],
              defaultValue: 'social',
            },
            {
              name: 'participation',
              label: 'Участие',
              type: 'select',
              options: [
                { label: 'Индивидуальное', value: 'individual' },
                { label: 'Командное', value: 'team' },
                { label: 'Оба варианта', value: 'both' },
              ],
              defaultValue: 'both',
            },
            { name: 'shortDescription', label: 'Короткое описание', type: 'textarea', required: true },
            { name: 'fullDescription', label: 'Полное описание', type: 'textarea', admin: { description: 'Подробное описание (необязательно)' } },
            { name: 'logoUrl', label: 'Ссылка на логотип', type: 'text' },
            { name: 'imageUrl', label: 'Ссылка на изображение', type: 'text', admin: { description: 'Изображение карточки/деталей. Если пусто, используется логотип.' } },
          ],
        },
        {
          label: 'Условия и детали',
          fields: [
            { name: 'country', label: 'Страна', type: 'text', index: true },
            { name: 'city', label: 'Город', type: 'text' },
            {
              name: 'format',
              label: 'Формат',
              type: 'select',
              options: [
                { label: 'Онлайн', value: 'online' },
                { label: 'Офлайн', value: 'offline' },
                { label: 'Гибрид', value: 'hybrid' },
              ],
              index: true,
            },
            { name: 'ageMin', label: 'Возраст от', type: 'number' },
            { name: 'ageMax', label: 'Возраст до', type: 'number' },
            { name: 'cost', label: 'Стоимость', type: 'text', admin: { description: 'Описание стоимости (например: "Бесплатно", "$50")' } },
            { name: 'funding', label: 'Есть финансирование', type: 'checkbox', defaultValue: false, index: true },
            { name: 'deadline', label: 'Дедлайн', type: 'date', index: true },
            { name: 'startDate', label: 'Дата начала', type: 'date' },
            { name: 'finalDeadline', label: 'Окончательный дедлайн', type: 'checkbox', defaultValue: false },
            { name: 'registrationOpen', label: 'Регистрация открыта', type: 'checkbox', defaultValue: true },
            { name: 'seats', label: 'Мест', type: 'number', defaultValue: 0 },
            { name: 'savedCount', label: 'Сохранений', type: 'number', defaultValue: 0 },
            { name: 'editorPick', label: 'Выбор редакции', type: 'checkbox', defaultValue: false },
            { name: 'recommended', label: 'Рекомендовано', type: 'checkbox', defaultValue: false },
            { name: 'portfolioValue', label: 'Ценность для портфолио', type: 'number', defaultValue: 0 },
            { name: 'publishedAt', label: 'Дата публикации', type: 'date' },
            textListField('languages', 'Языки'),
            textListField('skills', 'Навыки'),
            textListField('keywords', 'Ключевые слова'),
            textListField('grades', 'Классы/курсы'),
            textListField('requirements', 'Требования'),
            textListField('benefits', 'Преимущества'),
            textListField('documents', 'Документы'),
          ],
        },
        {
          label: 'Ссылки и SEO',
          fields: [
            { name: 'officialUrl', label: 'Официальная ссылка', type: 'text', required: true, admin: { description: 'Внешняя ссылка на заявку' } },
            { name: 'internalApplicationsEnabled', label: 'Внутренние заявки включены', type: 'checkbox', defaultValue: false },
            { name: 'seoTitle', label: 'SEO-заголовок', type: 'text' },
            { name: 'seoDescription', label: 'SEO-описание', type: 'textarea' },
          ],
        },
      ],
    },
  ],
};
