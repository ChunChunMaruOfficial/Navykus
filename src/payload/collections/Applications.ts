import type { CollectionConfig } from 'payload';

import { authenticated } from '../access';

export const Applications: CollectionConfig = {
  slug: 'applications',
  admin: {
    useAsTitle: 'name',
    group: 'Submissions',
  },
  access: {
    read: authenticated,
    create: () => true,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    { name: 'ticketId', type: 'text', required: true, index: true },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: ['new', 'confirmed', 'contacted', 'rejected'],
      required: true,
    },
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'grade', type: 'text' },
    { name: 'age', type: 'text' },
    { name: 'city', type: 'text' },
    { name: 'contact', type: 'text' },
    { name: 'interest', type: 'text' },
    { name: 'tournamentId', type: 'text' },
    { name: 'hasTeam', type: 'text' },
    { name: 'teamSize', type: 'text' },
    { name: 'portfolioLink', type: 'text' },
    { name: 'coverLetter', type: 'textarea' },
    {
      name: 'attachments',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'modal',
      options: ['modal', 'inline', 'championship', 'find-team', 'api'],
    },
  ],
};

