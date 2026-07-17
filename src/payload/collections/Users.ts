import type { CollectionConfig } from 'payload';

import { adminOnly, isAdmin, ownUserOrAdmin } from '../access';
import { textListField } from '../fields';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'System',
    description: 'Platform users, moderators and administrators',
    defaultColumns: ['email', 'firstName', 'lastName', 'role', 'accountStatus', 'country'],
    listSearchableFields: ['email', 'firstName', 'lastName', 'country', 'city'],
  },
  access: {
    read: ownUserOrAdmin,
    create: () => true,
    update: ownUserOrAdmin,
    delete: adminOnly,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Profile',
          fields: [
            { name: 'name', type: 'text', admin: { description: 'Display name (optional if firstName/lastName used)' } },
            { name: 'firstName', type: 'text' },
            { name: 'lastName', type: 'text' },
            { name: 'avatar', type: 'relationship', relationTo: 'media' },
            { name: 'avatarUrl', type: 'text' },
            { name: 'avatarAlt', type: 'text' },
            { name: 'avatarPositionX', type: 'number', defaultValue: 50, min: 0, max: 100 },
            { name: 'avatarPositionY', type: 'number', defaultValue: 50, min: 0, max: 100 },
            { name: 'avatarScale', type: 'number', defaultValue: 1, min: 1, max: 2 },
            { name: 'biography', type: 'textarea' },
            { name: 'portfolio', type: 'text' },
          ],
        },
        {
          label: 'Location & School',
          fields: [
            { name: 'country', type: 'text', index: true },
            { name: 'city', type: 'text', index: true },
            { name: 'dateOfBirth', type: 'text', admin: { description: 'Date of birth (ISO format)' } },
            { name: 'ageGroup', type: 'text', index: true },
            { name: 'school', type: 'text' },
            { name: 'schoolGrade', type: 'text', index: true },
          ],
        },
        {
          label: 'Interests & Skills',
          fields: [
            textListField('interests', 'Interests'),
            textListField('skills', 'Skills'),
            textListField('languages', 'Languages'),
          ],
        },
        {
          label: 'Settings',
          fields: [
            {
              name: 'preferredLanguage',
              type: 'select',
              options: [
                { label: 'Russian', value: 'ru' },
                { label: 'English', value: 'en' },
                { label: 'Kazakh', value: 'kk' },
                { label: 'Uzbek', value: 'uz' },
                { label: 'Arabic', value: 'ar' },
                { label: 'German', value: 'de' },
                { label: 'Spanish', value: 'es' },
                { label: 'Turkish', value: 'tr' },
              ],
            },
            {
              name: 'preferredLanguageMode',
              type: 'select',
              defaultValue: 'auto',
              options: [
                { label: 'Auto', value: 'auto' },
                { label: 'Manual', value: 'manual' },
              ],
            },
            {
              name: 'socialLinks',
              type: 'array',
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'url', type: 'text', required: true },
              ],
            },
            { name: 'teamSearchAvailable', type: 'checkbox', defaultValue: false, index: true },
            { name: 'publicProfile', type: 'checkbox', defaultValue: false, index: true },
            {
              name: 'privacy',
              type: 'group',
              label: 'Privacy Settings',
              fields: [
                { name: 'showCity', type: 'checkbox', defaultValue: true },
                { name: 'showSchool', type: 'checkbox', defaultValue: false },
                { name: 'showAge', type: 'checkbox', defaultValue: true },
                { name: 'showEmail', type: 'checkbox', defaultValue: false },
                { name: 'showSocialLinks', type: 'checkbox', defaultValue: true },
              ],
            },
          ],
        },
      ],
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
      defaultValue: 'user',
      required: true,
      options: [
        { label: 'User', value: 'user' },
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
