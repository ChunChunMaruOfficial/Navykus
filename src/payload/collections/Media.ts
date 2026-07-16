import path from 'node:path';

import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    group: 'System',
  },
  upload: {
    staticDir: path.resolve(process.cwd(), 'uploads', 'media'),
  },
  access: {
    read: anyone,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
};
