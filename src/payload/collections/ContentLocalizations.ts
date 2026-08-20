import type { CollectionConfig } from 'payload';

import { adminOrModerator } from '../access';
import { SUPPORTED_LANGUAGES } from '../../i18n/languages';
import { SUPPORTED_CONTENT_COLLECTIONS, TRANSLATION_STATUSES } from '../localization';

export const ContentLocalizations: CollectionConfig = {
  slug: 'content-localizations',
  admin: {
    useAsTitle: 'sourceId',
    group: 'System',
    description: 'AI-generated localized copies for public CMS content.',
    defaultColumns: ['sourceCollection', 'sourceId', 'language', 'translationStatus', 'updatedAt'],
  },
  access: {
    read: adminOrModerator,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  fields: [
    {
      name: 'sourceCollection',
      type: 'select',
      required: true,
      options: SUPPORTED_CONTENT_COLLECTIONS as unknown as string[],
      index: true,
    },
    { name: 'sourceId', type: 'text', required: true, index: true },
    {
      name: 'language',
      type: 'select',
      required: true,
      options: SUPPORTED_LANGUAGES as unknown as string[],
      index: true,
    },
    {
      name: 'localizedData',
      type: 'json',
      required: true,
      defaultValue: {},
    },
    {
      name: 'translationStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: TRANSLATION_STATUSES as unknown as string[],
      index: true,
      admin: { position: 'sidebar' },
    },
    { name: 'contentHash', type: 'text', index: true, admin: { position: 'sidebar' } },
    { name: 'errorMessage', type: 'textarea', admin: { position: 'sidebar' } },
    { name: 'generatedAt', type: 'date', admin: { position: 'sidebar' } },
    { name: 'attempts', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
};
