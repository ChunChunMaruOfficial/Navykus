import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';

export const OperatorSettings: CollectionConfig = {
  slug: 'operator-settings',
  admin: {
    useAsTitle: 'label',
    group: 'Settings',
    description:
      'Operator details displayed in the Privacy Policy (personal data operator section).',
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
      defaultValue: 'Operator Settings',
      admin: {
        description: 'Admin-only label to identify this settings entry.',
      },
    },
    {
      name: 'operatorName',
      type: 'text',
      label: 'Operator Name (full name or legal entity)',
      defaultValue: '',
      admin: {
        description:
          'Full name of the operator (for self-employed: full name; for legal entities: company name).',
      },
    },
    {
      name: 'operatorInn',
      type: 'text',
      label: 'INN (Tax ID)',
      defaultValue: '',
      admin: {
        description: 'Taxpayer Identification Number (ИНН).',
      },
    },
    {
      name: 'operatorOgrn',
      type: 'text',
      label: 'OGRN / OGRNIP',
      defaultValue: '',
      admin: {
        description:
          'Primary State Registration Number. Not required for self-employed individuals.',
      },
    },
    {
      name: 'operatorAddress',
      type: 'textarea',
      label: 'Operator Address (legal & postal)',
      defaultValue: '',
      admin: {
        description:
          'Legal and postal address for sending written requests from data subjects.',
      },
    },
    {
      name: 'operatorRegistryNumber',
      type: 'text',
      label: 'RKN Registry Number',
      defaultValue: '',
      admin: {
        description:
          'Registration number in the Roskomnadzor personal data operators register (assigned after submitting the notification).',
      },
    },
    {
      name: 'operatorRegistryDate',
      type: 'text',
      label: 'RKN Registry Entry Date',
      defaultValue: '',
      admin: {
        description:
          'Date of entry in the Roskomnadzor register (assigned after submitting the notification).',
      },
    },
    {
      name: 'contactsEmail',
      type: 'text',
      label: 'Contact Email for data subjects',
      defaultValue: 'info@navykus.online',
      admin: {
        description:
          'Email address where data subjects can send requests regarding their personal data.',
      },
    },
    {
      name: 'contactsPostalAddress',
      type: 'textarea',
      label: 'Postal Address for written requests',
      defaultValue: '',
      admin: {
        description:
          'Postal address for submitting written requests from data subjects.',
      },
    },
  ],
};
