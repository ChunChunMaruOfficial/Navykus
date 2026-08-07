import type { CollectionConfig } from 'payload';

import { adminOnly, isAdmin, isModerator, ownUserOrAdmin } from '../access';
import { ADMIN_EMAIL, normalizeEmail } from '../../security/admin-auth';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: Number(process.env.PAYLOAD_TOKEN_EXPIRATION_SECONDS || 60 * 60 * 4),
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
  },
  admin: {
    useAsTitle: 'email',
    group: 'System',
    description: 'Staff accounts for Payload CMS access only.',
    defaultColumns: ['email', 'firstName', 'lastName', 'role', 'accountStatus'],
    listSearchableFields: ['email', 'firstName', 'lastName'],
  },
  access: {
    admin: ({ req: { user } }) => isAdmin(user) || isModerator(user),
    read: ownUserOrAdmin,
    create: adminOnly,
    update: ownUserOrAdmin,
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        const email = normalizeEmail(data?.email);

        if (email === ADMIN_EMAIL) {
          return {
            ...data,
            email: ADMIN_EMAIL,
            role: 'admin',
            accountStatus: 'active',
          };
        }

        return data;
      },
    ],
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
    },
    {
      name: 'lastName',
      type: 'text',
    },
    {
      name: 'accountStatus',
      type: 'select',
      defaultValue: 'active',
      required: true,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Blocked', value: 'blocked' },
        { label: 'Pending', value: 'pending' },
      ],
      access: {
        create: ({ req: { user } }) => isAdmin(user),
        update: ({ req: { user } }) => isAdmin(user),
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'moderator',
      required: true,
      options: [
        { label: 'Moderator', value: 'moderator' },
        { label: 'Admin', value: 'admin' },
      ],
      access: {
        create: ({ req: { user } }) => isAdmin(user),
        update: ({ req: { user } }) => isAdmin(user),
      },
      admin: {
        position: 'sidebar',
      },
    },
  ],
};
