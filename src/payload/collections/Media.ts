import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { mediaUploadDir } from '../paths';

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    group: 'System',
  },
  upload: {
    staticDir: mediaUploadDir,
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
