import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { legacyIdField, publicContentVersions, seoFields, sortOrderField, syncTeamMemberPublicationBeforeChange, textListField } from '../fields';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { localizedAfterChange, localizedAfterDelete, originalLanguageField } from '../localization';
import { publicPreview } from '../preview';

export const TeamMembers: CollectionConfig = {
  slug: 'team-members',
  admin: {
    useAsTitle: 'name',
    group: 'Community',
    preview: publicPreview('team-members'),
  },
  versions: publicContentVersions,
  access: {
    read: anyone,
    create: anyone,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  hooks: {
    beforeChange: [syncTeamMemberPublicationBeforeChange],
    afterChange: [localizedAfterChange('team-members'), auditAfterChange('team-members')],
    afterDelete: [localizedAfterDelete('team-members'), auditAfterDelete('team-members')],
  },
  fields: [
    legacyIdField,
    sortOrderField,
    originalLanguageField,
    { name: 'name', type: 'text', required: true },
    { name: 'age', type: 'number', required: true },
    { name: 'country', type: 'text', required: true },
    { name: 'city', type: 'text' },
    { name: 'shortBio', type: 'textarea', required: true },
    textListField('interests', 'Interests'),
    textListField('skills', 'Skills'),
    {
      name: 'targetRoles',
      type: 'select',
      hasMany: true,
      required: true,
      options: ['developer', 'designer', 'researcher', 'product_manager', 'marketer', 'team_lead', 'analyst', 'other'],
    },
    { name: 'targetProject', type: 'text' },
    { name: 'whyLooking', type: 'textarea', required: true },
    { name: 'contact', type: 'text', required: true },
    {
      name: 'contactType',
      type: 'select',
      required: true,
      options: ['telegram', 'email', 'discord'],
    },
    {
      name: 'moderationStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'New', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Needs edit', value: 'needs_edit' },
      ],
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Review status for participant-submitted profiles.',
      },
    },
    { name: 'moderationComment', type: 'textarea', admin: { position: 'sidebar' } },
    { name: 'reviewedAt', type: 'date', admin: { position: 'sidebar' } },
    { name: 'isApproved', type: 'checkbox', defaultValue: false },
    ...seoFields,
  ],
};
