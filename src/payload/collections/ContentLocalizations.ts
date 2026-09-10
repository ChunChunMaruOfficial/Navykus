import type { CollectionConfig } from 'payload';

import { adminOrModerator, isAdmin, isModerator } from '../access';
import { SUPPORTED_LANGUAGES } from '../../i18n/languages';
import {
  SUPPORTED_CONTENT_COLLECTIONS,
  TRANSLATION_STATUSES,
  translateSourceNow,
  type SupportedContentCollection,
} from '../localization';

export const ContentLocalizations: CollectionConfig = {
  slug: 'content-localizations',
  admin: {
    useAsTitle: 'sourceId',
    group: 'System',
    description: 'AI-generated localized copies for public CMS content.',
    defaultColumns: ['sourceCollection', 'sourceId', 'language', 'translationStatus', 'updatedAt'],
  },
  access: {
    read: adminOrModerator,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  endpoints: [
    {
      // POST /payload-api/content-localizations/translate-now { collection, id }
      // Used by the «Переводы» panel in the edit sidebar: redo all translations of one document now.
      path: '/translate-now',
      method: 'post',
      handler: async (req) => {
        if (!(isAdmin(req.user) || isModerator(req.user))) {
          return Response.json({ message: 'Forbidden' }, { status: 403 });
        }
        const body = (typeof req.json === 'function' ? await req.json().catch(() => ({})) : {}) as Record<string, unknown>;
        const collection = String(body.collection || '');
        const id = String(body.id || '');
        if (!(SUPPORTED_CONTENT_COLLECTIONS as readonly string[]).includes(collection) || !id) {
          return Response.json({ message: 'Unknown document' }, { status: 400 });
        }
        // Runs in the background; the panel polls the statuses.
        void translateSourceNow(req.payload, collection as SupportedContentCollection, id, { force: true }).catch((error) => {
          console.error(`[content-localization] translate-now ${collection}:${id} failed:`, error);
        });
        return Response.json({ status: 'started' }, { status: 202 });
      },
    },
  ],
  fields: [
    {
      name: 'sourceCollection',
      type: 'select',
      required: true,
      options: SUPPORTED_CONTENT_COLLECTIONS as unknown as string[],
      index: true,
    },
    { name: 'sourceId', type: 'text', required: true, index: true },
    {
      name: 'language',
      type: 'select',
      required: true,
      options: SUPPORTED_LANGUAGES as unknown as string[],
      index: true,
    },
    {
      name: 'localizedData',
      type: 'json',
      required: true,
      defaultValue: {},
    },
    {
      name: 'translationStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: TRANSLATION_STATUSES as unknown as string[],
      index: true,
      admin: { position: 'sidebar' },
    },
    { name: 'contentHash', type: 'text', index: true, admin: { position: 'sidebar' } },
    { name: 'errorMessage', type: 'textarea', admin: { position: 'sidebar' } },
    { name: 'generatedAt', type: 'date', admin: { position: 'sidebar' } },
    { name: 'attempts', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
};
