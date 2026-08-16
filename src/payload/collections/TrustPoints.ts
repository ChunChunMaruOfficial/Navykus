import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { legacyIdField, publishedField, seoFields, sortOrderField } from '../fields';
import { localizedAfterChange, localizedAfterDelete, originalLanguageField } from '../localization';
import { publicPreview } from '../preview';

export const TrustPoints: CollectionConfig = {
  slug: 'trust-points',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'sortOrder', 'isPublished'],
    preview: publicPreview('trust-points'),
  },
  access: {
    read: anyone,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  hooks: {
    afterChange: [localizedAfterChange('trust-points'), auditAfterChange('trust-points')],
    afterDelete: [localizedAfterDelete('trust-points'), auditAfterDelete('trust-points')],
  },
  fields: [
    legacyIdField,
    sortOrderField,
    publishedField,
    originalLanguageField,
    { name: 'title', type: 'text' },
    { name: 'description', type: 'textarea' },
    ...seoFields,
  ],
};
