import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';

export const ContactSettings: CollectionConfig = {
  slug: 'contact-settings',
  admin: {
    useAsTitle: 'label',
    group: 'Settings',
    description: 'Contact information displayed in the site footer.',
    defaultColumns: ['label', 'email', 'updatedAt'],
  },
  access: {
    read: anyone,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      defaultValue: 'Site Contacts',
      admin: {
        description: 'Admin-only label to identify this settings entry.',
      },
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email',
      defaultValue: 'info@navykus.online',
    },
  ],
};
