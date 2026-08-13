import type { CollectionConfig } from 'payload';

import { SUPPORTED_LANGUAGES } from '../../i18n/languages';
import { EDITABLE_PAGE_TEXT_PAGES } from '../../page-texts';
import { adminOrModerator, anyone } from '../access';
import { legacyIdField, publishedField, sortOrderField } from '../fields';
import { auditAfterChange, auditAfterDelete } from '../audit';

export const PageTexts: CollectionConfig = {
  slug: 'page-texts',
  admin: {
    useAsTitle: 'label',
    group: 'Content',
    description: 'Editable static text for the About project and Championship pages.',
    defaultColumns: ['page', 'language', 'label', 'translationKey', 'isPublished', 'sortOrder'],
  },
  access: {
    read: anyone,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  hooks: {
    afterChange: [auditAfterChange('page-texts')],
    afterDelete: [auditAfterDelete('page-texts')],
  },
  fields: [
    legacyIdField,
    sortOrderField,
    publishedField,
    {
      name: 'page',
      type: 'select',
      required: true,
      index: true,
      options: EDITABLE_PAGE_TEXT_PAGES as unknown as Array<{ label: string; value: string }>,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'language',
      type: 'select',
      required: true,
      index: true,
      defaultValue: 'ru',
      options: SUPPORTED_LANGUAGES as unknown as string[],
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
        description: 'Do not change this unless the frontend key changed.',
      },
    },
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: {
        description: 'Human-readable label for searching in the admin panel.',
      },
    },
    {
      name: 'value',
      label: 'Text',
      type: 'textarea',
      required: true,
      admin: {
        rows: 6,
      },
    },
  ],
};
