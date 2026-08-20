import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { publishedField, seoFields, sortOrderField } from '../fields';
import { localizedAfterChange, localizedAfterDelete, originalLanguageField } from '../localization';
import { publicPreview } from '../preview';

export const Pillars: CollectionConfig = {
  slug: 'pillars',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['label', 'title', 'sortOrder', 'isPublished'],
    preview: publicPreview('pillars'),
  },
  access: {
    read: anyone,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  hooks: {
    afterChange: [localizedAfterChange('pillars'), auditAfterChange('pillars')],
    afterDelete: [localizedAfterDelete('pillars'), auditAfterDelete('pillars')],
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
            { name: 'label', label: 'Ярлык', type: 'text', required: true },
            { name: 'title', label: 'Заголовок', type: 'text', required: true },
            { name: 'description', label: 'Описание', type: 'textarea', required: true },
          ],
        },
        {
          label: 'SEO',
          fields: [...seoFields],
        },
      ],
    },
  ],
};
