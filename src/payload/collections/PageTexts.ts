import type { CollectionConfig } from 'payload';

import { EDITABLE_PAGE_TEXT_PAGES } from '../../page-texts';
import { adminOrModerator, anyone } from '../access';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { localizedAfterChange, localizedAfterDelete } from '../localization';

export const PageTexts: CollectionConfig = {
  slug: 'page-texts',
  admin: {
    useAsTitle: 'label',
    group: 'Content',
    description: 'Русские тексты страниц. Остальные языки обновляются автоматически через систему переводов.',
    defaultColumns: ['page', 'label', 'value', 'isPublished'],
  },
  access: {
    read: anyone,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  hooks: {
    afterChange: [localizedAfterChange('page-texts'), auditAfterChange('page-texts')],
    afterDelete: [localizedAfterDelete('page-texts'), auditAfterDelete('page-texts')],
  },
  fields: [
    {
      name: 'legacyId',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Служебный ID. Не редактировать.',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Порядок в списке CMS.',
      },
    },
    {
      name: 'isPublished',
      label: 'Опубликовано',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'page',
      label: 'Страница',
      type: 'select',
      required: true,
      index: true,
      options: EDITABLE_PAGE_TEXT_PAGES as unknown as Array<{ label: string; value: string }>,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'translationKey',
      label: 'Translation key',
      type: 'text',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Служебный ключ. Не редактировать.',
      },
    },
    {
      name: 'label',
      label: 'Где используется',
      type: 'text',
      required: true,
      admin: {
        description: 'Подсказка для поиска нужной строки.',
      },
    },
    {
      name: 'value',
      label: 'Русский текст',
      type: 'textarea',
      required: true,
      admin: {
        rows: 8,
      },
    },
  ],
};
