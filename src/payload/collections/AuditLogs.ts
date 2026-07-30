import type { CollectionConfig } from 'payload';

import { adminOnly } from '../access';
import { textListField } from '../fields';

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  admin: {
    useAsTitle: 'summary',
    group: 'System',
    defaultColumns: ['action', 'collection', 'documentId', 'actorEmail', 'createdAt'],
  },
  access: {
    read: adminOnly,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: 'action', type: 'text', required: true, index: true },
    { name: 'collection', type: 'text', required: true, index: true },
    { name: 'documentId', type: 'text', required: true, index: true },
    { name: 'actorId', type: 'text', index: true },
    { name: 'actorEmail', type: 'text', index: true },
    textListField('changedFields', 'Changed fields'),
    { name: 'summary', type: 'textarea', required: true },
  ],
};
