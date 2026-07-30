import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { legacyIdField, publicContentVersions, publishedField, seoFields, sortOrderField, syncPublishedDraftBeforeChange } from '../fields';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { localizedAfterChange, localizedAfterDelete, originalLanguageField } from '../localization';
import { publicPreview } from '../preview';

export const Experts: CollectionConfig = {
  slug: 'experts',
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    defaultColumns: ['name', 'type', 'tournamentId', 'role'],
    preview: publicPreview('experts'),
  },
  versions: publicContentVersions,
  access: {
    read: anyone,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  hooks: {
    beforeChange: [syncPublishedDraftBeforeChange],
    afterChange: [localizedAfterChange('experts'), auditAfterChange('experts')],
    afterDelete: [localizedAfterDelete('experts'), auditAfterDelete('experts')],
  },
  fields: [
    legacyIdField,
    sortOrderField,
    publishedField,
    originalLanguageField,
    { name: 'name', type: 'text', required: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'expert',
      options: [
        { label: 'Жюри', value: 'jury' },
        { label: 'Наставник', value: 'mentor' },
        { label: 'Эксперт', value: 'expert' },
      ],
      admin: {
        description: 'Роль в чемпионате: жюри, наставник или эксперт',
      },
    },
    { name: 'role', type: 'text', required: true },
    { name: 'expertise', type: 'textarea', required: true },
    { name: 'description', type: 'textarea', required: true },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Фото эксперта, наставника или жюри',
      },
    },
    {
      name: 'tournamentId',
      type: 'relationship',
      relationTo: 'tournaments',
      hasMany: false,
      admin: {
        description: 'К какому чемпионату привязан эксперт',
      },
    },
    ...seoFields,
  ],
};
