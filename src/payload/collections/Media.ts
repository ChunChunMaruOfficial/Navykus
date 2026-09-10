import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { mediaUploadDir } from '../paths';
import { EDITABLE_PAGE_TEXT_PAGES } from '../../page-texts';

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    group: 'Content',
    // Not listed in the sidebar: images are managed through «Дерево медиа» and through the
    // upload fields of championships/activities/opportunities (their pickers still work).
    hidden: true,
    description: 'Медиафайлы, привязанные к страницам. Используйте «Дерево медиа» в боковом меню для иерархического просмотра и редактирования.',
    defaultColumns: ['page', 'blockName', 'alt', 'filename', 'mimeType', 'filesize', 'updatedAt'],
  },
  upload: {
    staticDir: mediaUploadDir,
    mimeTypes: [
      'image/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },
  access: {
    read: anyone,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'page',
      label: 'Страница',
      type: 'select',
      index: true,
      // Some databases have `media.page` as NOT NULL (legacy manual column). Uploads from
      // record fields (championship cover, activity image, portfolio files) have no page, so
      // default to «Общие тексты» instead of failing with a constraint error.
      defaultValue: 'global',
      options: EDITABLE_PAGE_TEXT_PAGES as unknown as Array<{ label: string; value: string }>,
      admin: {
        position: 'sidebar',
        description: 'Необязательно. Страница сайта, к которой относится это медиа.',
      },
    },
    {
      name: 'blockName',
      label: 'Название блока',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Имя блока внутри страницы (на русском). Используется для группировки в дереве медиа.',
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
  ],
};
