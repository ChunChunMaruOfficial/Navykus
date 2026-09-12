import type { CollectionConfig, Field } from 'payload';

import { adminOrModerator, anyone } from '../access';
import {
  archiveOtherChampionshipsAfterChange,
  defaultIsActiveChampionship,
  promoteChampionshipAfterDelete,
} from '../championship';
import {
  autoSeoBeforeChange,
  fillNotNullDefaults,
  imageField,
  newlineListField,
  publicContentVersions,
  publishedField,
  hiddenSeoFields,
  sortOrderField,
  syncPublishedDraftBeforeChange,
  textListField,
  translationStatusField,
} from '../fields';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { localizedAfterChange, localizedAfterDelete, originalLanguageField } from '../localization';
import { publicPreview } from '../preview';
import { slugBeforeValidate } from '../slug';

// One record = one championship. The sidebar entry «Чемпионат» always opens the ACTIVE one
// (see ChampionshipRedirect); older championships live in «Архив чемпионатов».
export const Tournaments: CollectionConfig = {
  slug: 'tournaments',
  labels: {
    singular: 'Чемпионат',
    plural: 'Чемпионат',
  },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'Текущий чемпионат: всё, что показывается в блоке чемпионата на главной и на странице «Чемпионат». Прошлые чемпионаты — в разделе «Архив чемпионатов».',
    defaultColumns: ['title', 'date', 'registrationStatus', 'isFeatured', 'updatedAt'],
    preview: publicPreview('tournaments'),
    components: {
      views: {
        list: {
          Component: '../../../src/admin/components/ChampionshipRedirect#default',
        },
      },
    },
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
    beforeChange: [
      syncPublishedDraftBeforeChange,
      fillNotNullDefaults({ title: '', type: '', description: '', date: '', registrationDeadline: '', maxParticipants: 0 }),
      autoSeoBeforeChange('title', ['pitch', 'description']),
    ],
    afterChange: [archiveOtherChampionshipsAfterChange, localizedAfterChange('tournaments'), auditAfterChange('tournaments')],
    afterDelete: [promoteChampionshipAfterDelete, localizedAfterDelete('tournaments'), auditAfterDelete('tournaments')],
  },
  fields: [
    {
      name: 'isFeatured',
      type: 'checkbox',
      label: 'Активный чемпионат (показывается на сайте)',
      defaultValue: defaultIsActiveChampionship,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Активный чемпионат может быть только один. Чтобы сделать активным другой, откройте «Архив чемпионатов» и нажмите «Сделать активным» — текущий автоматически уйдёт в архив.',
      },
    } as Field,
    translationStatusField,
    publishedField,
    originalLanguageField,
    { ...sortOrderField, admin: { ...(sortOrderField as { admin?: Record<string, unknown> }).admin, hidden: true } } as Field,
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Шапка и регистрация',
          description: 'Верх страницы «Чемпионат» и заголовок карточки на главной.',
          fields: [
            { name: 'title', label: 'Название', type: 'text', required: true, admin: { description: 'Крупный заголовок в шапке страницы чемпионата и в карточке на главной.' } },
            { name: 'pitch', label: 'Короткий текст под названием', type: 'textarea', admin: { rows: 3, description: 'Одно-два предложения под названием в шапке страницы чемпионата. Если пусто — показывается «Описание».' } },
            {
              type: 'row',
              fields: [
                {
                  name: 'registrationStatus',
                  label: 'Статус регистрации',
                  type: 'select',
                  required: true,
                  defaultValue: 'open',
                  options: [
                    { label: 'Открыта — форма заявки работает', value: 'open' },
                    { label: 'Приостановлена — лимит почти исчерпан', value: 'suspended' },
                    { label: 'Закрыта — форма скрыта', value: 'closed' },
                  ],
                  admin: { width: '50%', description: 'Плашка в шапке и доступность формы заявки.' },
                },
                { name: 'registrationDeadline', label: 'Дедлайн заявок', type: 'text', required: true, admin: { width: '50%', placeholder: '24 июля 2026', description: 'Текстом. Показывается в плашке «Подача анкет открыта • До …», в карточке фактов и на главной.' } },
              ],
            },
            imageField('heroImage', 'Фото в шапке страницы', 'Справа от названия, пропорции примерно 4:3. Если пусто — берётся обложка, затем фото из «Дерева медиа».'),
            { name: 'slug', label: 'Адрес (slug)', type: 'text', unique: true, index: true, admin: { hidden: true } }, // generated from the title (slugBeforeValidate)
          ],
        },
        {
          label: 'Карточки фактов',
          description: 'Шесть карточек под шапкой страницы чемпионата. Пустое поле — карточка скрыта или показывает прочерк.',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'date', label: 'Даты проведения', type: 'text', required: true, admin: { width: '50%', placeholder: '1–30 сентября 2026', description: 'Карточка «Даты проведения» и строка «Сроки» на главной.' } },
                { name: 'format', label: 'Формат участия', type: 'text', admin: { width: '50%', placeholder: 'Онлайн', description: 'Карточка «Формат участия» и плашка в карточке на главной.' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'ageLimit', label: 'Возраст участников', type: 'text', admin: { width: '33%', placeholder: '14–18 лет', description: 'Карточка «Кто участвует».' } },
                { name: 'language', label: 'Язык кубка', type: 'text', admin: { width: '33%', placeholder: 'Русский, English' } },
                { name: 'teamsAllowed', label: 'Состав команды', type: 'text', admin: { width: '33%', placeholder: '1–5 человек' } },
              ],
            },
          ],
        },
        {
          label: 'О чемпионате',
          description: 'Большой блок «О чемпионате» на странице чемпионата.',
          fields: [
            { name: 'aboutHeading', label: 'Заголовок блока', type: 'text', admin: { placeholder: 'Разберитесь в реальных вызовах экологии и урбанистики', description: 'Если пусто — показывается название чемпионата.' } },
            { name: 'description', label: 'Описание', type: 'textarea', required: true, admin: { rows: 8, description: 'Основной текст о чемпионате. Также показывается в карточке на главной.' } },
            imageField('aboutImage', 'Фото блока', 'Слева от описания, пропорции примерно 16:10. Если пусто — фото из «Дерева медиа».'),
            { ...newlineListField('themesText', 'Темы кейса'), admin: { rows: 5, description: 'Одна тема на строку. Каждая строка — отдельная пронумерованная карточка.' } } as Field,
            { ...newlineListField('evaluationCriteriaText', 'Что оценивает жюри'), admin: { rows: 5, description: 'Один критерий на строку.' } } as Field,
            { name: 'expectedResult', label: 'Ожидаемый результат', type: 'textarea', admin: { rows: 3, description: 'Блок «Ожидаемый результат». Пустое поле скрывает блок.' } },
          ],
        },
        {
          label: 'Карточка на главной',
          description: 'Блок «Ближайшее мероприятие» на главной странице. Название, описание и даты берутся из других вкладок.',
          fields: [
            imageField('coverImage', 'Обложка', 'Широкая полоса сверху карточки (примерно 32:7). Если пусто — фото из «Дерева медиа».'),
            { name: 'suitableFor', label: 'Кому подходит', type: 'textarea', admin: { rows: 3, description: 'Колонка «Кому подходит». Пустое поле скрывает колонку.' } },
            { name: 'maxParticipants', label: 'Мест в отборе', type: 'number', required: true, defaultValue: 0, min: 0, admin: { description: 'Колонка «Осталось мест». 0 — колонка скрыта.' } },
            { ...textListField('skills', 'Навыки (теги)'), admin: { description: 'Теги внизу карточки на главной. Если на странице чемпионата не заполнены «Темы кейса», показываются они.' } } as Field,
            { name: 'type', label: 'Тип чемпионата', type: 'text', required: true, defaultValue: 'Кейс-чемпионат', admin: { description: 'Например «Кейс-чемпионат». Используется в фильтре на странице «Поиск команды».' } },
          ],
        },
        {
          label: 'Жюри',
          description: 'Члены жюри этого чемпионата. Показываются на странице чемпионата и в карточке на главной (первые три).',
          fields: [
            {
              name: 'juryMembers',
              label: 'Состав жюри',
              type: 'array',
              labels: { singular: 'Член жюри', plural: 'Члены жюри' },
              admin: {
                initCollapsed: false,
                description: 'Добавьте по карточке на каждого человека. Порядок на сайте — как здесь (перетаскивайте карточки).',
                components: { RowLabel: '../../../src/admin/components/JuryRowLabel#JuryRowLabel' },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', label: 'Имя и фамилия', type: 'text', required: true, admin: { width: '50%' } },
                    { name: 'role', label: 'Кто это', type: 'text', admin: { width: '50%', placeholder: 'Эколог, преподаватель МГУ' } },
                  ],
                },
                imageField('photo', 'Фото', 'Небольшой портрет, лучше квадратный. Необязательно.'),
              ],
            },
          ],
        },
      ],
    },
    // SEO is generated from the Russian title/description on save (autoSeoBeforeChange) — not editable.
    ...hiddenSeoFields,
    // Legacy fields no longer shown on the site; kept so existing data is not lost.
    { ...textListField('mentors', 'Наставники (устарело)'), admin: { hidden: true } } as Field,
    { name: 'targetAudience', label: 'Целевая аудитория (устарело)', type: 'textarea', admin: { hidden: true } },
  ],
};
