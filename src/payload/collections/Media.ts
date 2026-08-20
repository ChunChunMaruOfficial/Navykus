import type { CollectionConfig } from 'payload';

import { adminOrModerator, anyone } from '../access';
import { mediaUploadDir } from '../paths';

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    group: 'System',
    defaultColumns: ['alt', 'filename', 'mimeType', 'filesize', 'updatedAt'],
  },
  upload: {
    staticDir: mediaUploadDir,
    mimeTypes: [
      'image/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
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
