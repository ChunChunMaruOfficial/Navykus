import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone, ownerOrStaff } from '../access';
import { textListField } from '../fields';

export const TeamPosts: CollectionConfig = {
  slug: 'team-posts',
  admin: {
    useAsTitle: 'title',
    group: 'Community',
    defaultColumns: ['title', 'user', 'status', 'createdAt'],
  },
  access: {
    read: anyone,
    create: ({ req: { user } }) => Boolean(user),
    update: ownerOrStaff('user'),
    delete: ownerOrStaff('user'),
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea', required: true },
    { name: 'status', type: 'select', defaultValue: 'draft', options: ['draft', 'published', 'hidden'], index: true },
    { name: 'championshipId', type: 'text' },
    { name: 'projectName', type: 'text' },
    { name: 'communicationLanguage', type: 'text' },
    { name: 'timeZone', type: 'text' },
    { name: 'workingFormat', type: 'select', options: ['online', 'offline', 'hybrid'] },
    { name: 'openPositions', type: 'number', defaultValue: 1 },
    textListField('requiredSkills', 'Required skills'),
    textListField('ownSkills', 'Own skills'),
    textListField('interests', 'Interests'),
  ],
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        if (req.user && !data.user) {
          return { ...data, user: req.user.id };
        }
        return data;
      },
    ],
  },
};
