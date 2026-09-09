import type { CollectionConfig } from 'payload';

import { EDITABLE_PAGE_TEXT_PAGES } from '../../page-texts';
import { adminOrModerator, anyone } from '../access';
import { auditAfterChange, auditAfterDelete } from '../audit';

/**
 * Slots for page images that the site renders in fixed places (hero pictures,
 * cover images, illustration blocks). Each slot is identified by a stable
 * `slotKey` that the front-end knows about (see `src/page-media.ts`).
 *
 * - No row for a slot  → the site shows the built-in fallback image.
 * - Row with `image`    → the site shows the uploaded image instead.
 * - Row with `hidden`   → the site shows nothing in that place.
 *
 * Managed through the «Дерево медиа» admin view, not edited row-by-row.
 */
export const PageMediaSlots: CollectionConfig = {
  slug: 'page-media-slots',
  admin: {
    hidden: true,
    useAsTitle: 'label',
    group: 'Content',
    description:
      'Изображения страниц сайта. Управляются через «Дерево медиа» в боковом меню.',
    defaultColumns: ['page', 'blockName', 'label', 'slotKey', 'hidden'],
  },
  access: {
    read: anyone,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  hooks: {
    afterChange: [auditAfterChange('page-media-slots')],
    afterDelete: [auditAfterDelete('page-media-slots')],
  },
  fields: [
    {
      name: 'slotKey',
      label: 'Ключ слота',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Служебный идентификатор места на сайте. Не редактировать.',
      },
    },
    {
      name: 'page',
      label: 'Страница',
      type: 'select',
      index: true,
      options: EDITABLE_PAGE_TEXT_PAGES as unknown as Array<{ label: string; value: string }>,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'blockName',
      label: 'Название блока',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'label',
      label: 'Где используется',
      type: 'text',
      admin: {
        description: 'Человеческое описание места на сайте.',
      },
    },
    {
      name: 'image',
      label: 'Изображение',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Загруженное изображение, которое заменит стандартное.',
      },
    },
    {
      name: 'hidden',
      label: 'Скрыть на сайте',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Если включено — на сайте в этом месте не будет изображения.',
      },
    },
  ],
};
