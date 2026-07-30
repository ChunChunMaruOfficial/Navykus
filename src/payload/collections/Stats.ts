import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { legacyIdField, publishedField, seoFields, sortOrderField } from '../fields';
import { localizedAfterChange, localizedAfterDelete, originalLanguageField } from '../localization';
import { publicPreview } from '../preview';

export const Stats: CollectionConfig = {
  slug: 'stats',
  admin: {
    useAsTitle: 'label',
    group: 'Content',
    defaultColumns: ['label', 'value', 'sortOrder', 'isPublished'],
    preview: publicPreview('stats'),
  },
  access: {
    read: anyone,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  hooks: {
    afterChange: [localizedAfterChange('stats'), auditAfterChange('stats')],
    afterDelete: [localizedAfterDelete('stats'), auditAfterDelete('stats')],
  },
  fields: [
    legacyIdField,
    sortOrderField,
    publishedField,
    originalLanguageField,
    { name: 'value', type: 'text', required: true, admin: { description: 'e.g. "15+", "1000+"' } },
    { name: 'label', type: 'text', required: true, admin: { description: 'e.g. "countries", "participants"' } },
    ...seoFields,
  ],
};
