import type { CollectionConfig } from 'payload';

import { adminOrModerator, ownerOrStaff } from '../access';

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'type',
    group: 'Community',
    defaultColumns: ['user', 'type', 'readAt', 'createdAt'],
  },
  access: {
    read: ownerOrStaff('user'),
    create: adminOrModerator,
    update: ownerOrStaff('user'),
    delete: adminOrModerator,
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      index: true,
      options: [
        'application_submitted',
        'application_status_changed',
        'clarification_requested',
        'team_response_received',
        'team_response_accepted',
        'team_response_rejected',
        'team_invitation_received',
        'upcoming_deadline',
        'upcoming_event',
        'announcement',
        'blog_post_submitted',
        'blog_post_pending_review',
        'blog_post_approved',
        'blog_post_published',
        'blog_post_rejected',
        'blog_post_needs_revision',
      ],
    },
    {
      name: 'relatedType',
      type: 'select',
      options: ['application', 'championship', 'event', 'opportunity', 'participant', 'team-post', 'team-response', 'blog-post'],
    },
    { name: 'relatedId', type: 'text' },
    { name: 'href', type: 'text' },
    { name: 'data', type: 'json' },
    { name: 'readAt', type: 'text', index: true },
  ],
};
