import type { CollectionConfig } from 'payload';

import type { Field } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { legacyIdField, newlineListField, publicContentVersions, publishedField, seoFields, sortOrderField, syncPublishedDraftBeforeChange, textListField } from '../fields';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { localizedAfterChange, localizedAfterDelete, originalLanguageField } from '../localization';
import { publicPreview } from '../preview';
import { slugBeforeValidate } from '../slug';

export const Tournaments: CollectionConfig = {
  slug: 'tournaments',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'Case championships & competitions for students',
    defaultColumns: ['title', 'type', 'date', 'registrationDeadline', 'maxParticipants', 'isFeatured', 'isPublished'],
    preview: publicPreview('tournaments'),
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
    beforeChange: [syncPublishedDraftBeforeChange],
    afterChange: [localizedAfterChange('tournaments'), auditAfterChange('tournaments')],
    afterDelete: [localizedAfterDelete('tournaments'), auditAfterDelete('tournaments')],
  },
  fields: [
    legacyIdField,
    sortOrderField,
    publishedField,
    originalLanguageField,
    {
      name: 'isFeatured',
      type: 'checkbox',
      label: 'Featured on homepage',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Mark this championship to appear on the homepage',
      },
    } as Field,
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'slug', type: 'text', unique: true, index: true, admin: { description: 'Auto-generated from title when empty.' } },
            { name: 'type', type: 'text', required: true, admin: { description: 'e.g. "Кейс-чемпионат", "Хакатон"' } },
            { name: 'description', type: 'textarea', required: true, admin: { rows: 10 } },
            { name: 'pitch', type: 'textarea', admin: { rows: 6, description: 'Short hero text. Falls back to description.' } },
          ],
        },
        {
          label: 'Schedule',
          fields: [
            { name: 'date', type: 'text', required: true, admin: { description: 'Event date(s)' } },
            { name: 'registrationDeadline', type: 'text', required: true, admin: { description: 'Registration cutoff date' } },
            {
              name: 'registrationStatus',
              type: 'select',
              required: true,
              defaultValue: 'open',
              options: [
                { label: 'Open', value: 'open' },
                { label: 'Suspended', value: 'suspended' },
                { label: 'Closed', value: 'closed' },
              ],
            },
          ],
        },
        {
          label: 'Details',
          fields: [
            { name: 'maxParticipants', type: 'number', required: true },
            textListField('skills', 'Required Skills'),
            textListField('mentors', 'Mentors'),
            { name: 'suitableFor', type: 'textarea', admin: { description: 'Who this is suitable for' } },
            { name: 'format', type: 'textarea', admin: { description: 'Format description (e.g. online, offline, hybrid)' } },
            { name: 'targetAudience', type: 'textarea' },
            { name: 'ageLimit', type: 'text' },
            { name: 'teamsAllowed', type: 'text' },
            { name: 'language', type: 'text' },
            { name: 'expectedResult', type: 'textarea' },
            newlineListField('themesText', 'Case Themes'),
            newlineListField('evaluationCriteriaText', 'Evaluation Criteria'),
            ...seoFields,
          ],
        },
      ],
    },
  ],
};
