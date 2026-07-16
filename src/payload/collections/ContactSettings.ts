import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';

export const ContactSettings: CollectionConfig = {
  slug: 'contact-settings',
  admin: {
    useAsTitle: 'label',
    group: 'Settings',
    description: 'Contact information displayed in the site footer.',
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
      type: 'text',
      label: 'Email',
      defaultValue: 'info@navykus.org',
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Phone',
      defaultValue: '+7 (999) 000-00-00',
    },
    {
      name: 'telegram',
      type: 'text',
      label: 'Telegram',
      defaultValue: '@navykus_com',
    },
    {
      name: 'address',
      type: 'textarea',
      label: 'Address',
      defaultValue: '',
    },
  ],
};
