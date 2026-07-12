import type { CollectionConfig } from 'payload';

import { anyone, authenticated } from '../access';
import { legacyIdField, sortOrderField, textListField } from '../fields';

export const TeamMembers: CollectionConfig = {
  slug: 'team-members',
  admin: {
    useAsTitle: 'name',
    group: 'Community',
  },
  access: {
    read: anyone,
    create: anyone,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    legacyIdField,
    sortOrderField,
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
    { name: 'isApproved', type: 'checkbox', defaultValue: false },
  ],
};

