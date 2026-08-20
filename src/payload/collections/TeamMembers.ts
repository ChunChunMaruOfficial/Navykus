import type { CollectionConfig } from 'payload';

import { adminOrModerator } from '../access';
import { publicContentVersions, seoFields, sortOrderField, syncTeamMemberPublicationBeforeChange, textListField } from '../fields';
import { auditAfterChange, auditAfterDelete } from '../audit';
import { localizedAfterChange, localizedAfterDelete, originalLanguageField } from '../localization';
import { publicPreview } from '../preview';

export const TeamMembers: CollectionConfig = {
  slug: 'team-members',
  admin: {
    useAsTitle: 'name',
    group: 'Community',
    preview: publicPreview('team-members'),
    defaultColumns: ['name', 'email', 'country', 'moderationStatus', 'isApproved', 'publishAction', 'updatedAt'],
  },
  versions: publicContentVersions,
  access: {
    // Public submission goes through POST /api/team-members (overrideAccess: true),
    // which always forces moderationStatus='pending' + isApproved=false. Direct
    // collection access is staff-only so nobody can self-approve (or read pending
    // profiles with contact info) via the Payload REST API.
    read: adminOrModerator,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  hooks: {
    beforeChange: [syncTeamMemberPublicationBeforeChange],
    afterChange: [localizedAfterChange('team-members'), auditAfterChange('team-members')],
    afterDelete: [localizedAfterDelete('team-members'), auditAfterDelete('team-members')],
  },
  fields: [
    sortOrderField,
    originalLanguageField,
    { name: 'name', label: 'Имя', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true, index: true },
    { name: 'age', label: 'Возраст', type: 'number', required: true },
    { name: 'country', label: 'Страна', type: 'text', required: true },
    { name: 'city', label: 'Город', type: 'text' },
    { name: 'shortBio', label: 'Коротко о себе', type: 'textarea', required: true },
    textListField('interests', 'Интересы'),
    textListField('skills', 'Навыки'),
    {
      name: 'targetRoles',
      label: 'Желаемые роли',
      type: 'select',
      hasMany: true,
      required: true,
      options: [
        { label: 'Разработчик', value: 'developer' },
        { label: 'Дизайнер', value: 'designer' },
        { label: 'Исследователь', value: 'researcher' },
        { label: 'Продакт-менеджер', value: 'product_manager' },
        { label: 'Маркетолог', value: 'marketer' },
        { label: 'Тимлид', value: 'team_lead' },
        { label: 'Аналитик', value: 'analyst' },
        { label: 'Другое', value: 'other' },
      ],
    },
    { name: 'targetProject', label: 'Целевой проект', type: 'text' },
    { name: 'whyLooking', label: 'Почему ищет команду', type: 'textarea', required: true },
    { name: 'contact', label: 'Контакт', type: 'text', required: true },
    {
      name: 'contactType',
      label: 'Тип контакта',
      type: 'select',
      required: true,
      options: [
        { label: 'Telegram', value: 'telegram' },
        { label: 'Email', value: 'email' },
      ],
    },
    {
      name: 'moderationStatus',
      label: 'Статус модерации',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Новая', value: 'pending' },
        { label: 'Одобрена', value: 'approved' },
        { label: 'Отклонена', value: 'rejected' },
        { label: 'Нужны правки', value: 'needs_edit' },
      ],
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Статус проверки анкеты участника.',
      },
    },
    { name: 'moderationComment', label: 'Комментарий модератора', type: 'textarea', admin: { position: 'sidebar' } },
    { name: 'reviewedAt', label: 'Дата проверки', type: 'date', admin: { position: 'sidebar' } },
    { name: 'isApproved', label: 'Одобрено', type: 'checkbox', defaultValue: false },
    {
      name: 'publishAction',
      type: 'ui',
      label: 'Публикация',
      admin: {
        components: {
          Cell: '../../../src/admin/components/PublishTeamMemberCell#PublishTeamMemberCell',
        },
      },
    },
    {
      name: 'portfolioLink',
      label: 'Ссылка на портфолио',
      type: 'text',
      admin: {
        description: 'Внешняя ссылка на портфолио из анкеты.',
      },
    },
    {
      name: 'portfolioFiles',
      label: 'Файлы портфолио',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      admin: {
        description: 'Файлы портфолио, загруженные из публичной анкеты.',
      },
    },
    {
      name: 'sourceType',
      label: 'Источник заявки',
      type: 'select',
      defaultValue: 'modal',
      options: ['modal', 'championship', 'event', 'opportunity', 'find-team', 'home', 'about', 'activities', 'api'],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'sourceId',
      label: 'ID источника',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'ID сущности-источника публичного CTA, если доступно.',
      },
    },
    {
      name: 'sourceContext',
      label: 'Контекст источника',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Человекочитаемое название/контекст источника.',
      },
    },
    {
      name: 'tournamentId',
      type: 'relationship',
      relationTo: 'tournaments',
      hasMany: false,
      admin: {
        position: 'sidebar',
        description: 'К какому чемпионату привязана заявка',
      },
    },
    ...seoFields,
  ],
};
