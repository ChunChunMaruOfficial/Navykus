import type { Access, CollectionConfig } from 'payload';

import { adminOrModerator, isAdmin, isModerator, ownerOrStaff } from '../access';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { localizedAfterChange, localizedAfterDelete, originalLanguageField } from '../localization';

const participantOrStaff: Access = ({ req: { user } }) => {
  if (!user) return false;
  if (isAdmin(user) || isModerator(user)) return true;

  return {
    or: [
      { sender: { equals: user.id } },
      { recipient: { equals: user.id } },
    ],
  };
};

export const TeamResponses: CollectionConfig = {
  slug: 'team-responses',
  admin: {
    useAsTitle: 'message',
    group: 'Community',
    defaultColumns: ['post', 'sender', 'recipient', 'status', 'createdAt'],
  },
  access: {
    read: participantOrStaff,
    create: ({ req: { user } }) => Boolean(user),
    update: ownerOrStaff('recipient'),
    delete: adminOrModerator,
  },
  hooks: {
    afterChange: [localizedAfterChange('team-responses'), auditAfterChange('team-responses')],
    afterDelete: [localizedAfterDelete('team-responses'), auditAfterDelete('team-responses')],
  },
  fields: [
    originalLanguageField,
    { name: 'post', type: 'relationship', relationTo: 'team-posts', required: true },
    { name: 'sender', type: 'relationship', relationTo: 'users', required: true },
    { name: 'recipient', type: 'relationship', relationTo: 'users', required: true },
    { name: 'kind', type: 'select', defaultValue: 'response', options: ['response', 'invitation'], index: true },
    { name: 'message', type: 'textarea', required: true },
    { name: 'status', type: 'select', defaultValue: 'pending', options: ['pending', 'accepted', 'rejected'], index: true },
  ],
};
