import fs from 'node:fs';
import path from 'node:path';

import type { CollectionConfig } from 'payload';

import { EDITABLE_PAGE_TEXT_PAGES, flattenLocaleText } from '../../page-texts';
import { adminOrModerator, anyone, isAdmin, isModerator } from '../access';
import { projectRoot } from '../paths';

/** The Russian text a key has in the site's built-in locale file (what the site shows by default). */
const defaultRussianText = (translationKey: string) => {
  try {
    const localePath = path.join(projectRoot, 'src', 'i18n', 'locales', 'ru', 'translation.json');
    const flat = flattenLocaleText(JSON.parse(fs.readFileSync(localePath, 'utf8')), '', { includeArrays: true });
    const value = flat[translationKey];
    return typeof value === 'string' && value.trim() ? value : undefined;
  } catch {
    return undefined;
  }
};
import { auditAfterChange, auditAfterDelete } from '../audit';
import { localizedAfterChange, localizedAfterDelete } from '../localization';

export const PageTexts: CollectionConfig = {
  slug: 'page-texts',
  admin: {
    hidden: true,
    useAsTitle: 'label',
    group: 'Content',
    description: 'Русские тексты статичных страниц. Карточки, события, FAQ и формы редактируются в своих коллекциях. Для иерархического просмотра используйте «Дерево текстов» в боковом меню.',
    defaultColumns: ['page', 'blockName', 'label', 'value', 'isPublished'],
  },
  access: {
    read: anyone,
    create: adminOrModerator,
    update: adminOrModerator,
    delete: adminOrModerator,
  },
  hooks: {
    afterChange: [localizedAfterChange('page-texts'), auditAfterChange('page-texts')],
    afterDelete: [localizedAfterDelete('page-texts'), auditAfterDelete('page-texts')],
  },
  endpoints: [
    {
      // POST /payload-api/page-texts/restore-default { id }
      // «Вернуть исходный текст» in «Дерево текстов»: puts back the text the site shipped with.
      path: '/restore-default',
      method: 'post',
      handler: async (req) => {
        if (!(isAdmin(req.user) || isModerator(req.user))) {
          return Response.json({ message: 'Forbidden' }, { status: 403 });
        }
        const body = (typeof req.json === 'function' ? await req.json().catch(() => ({})) : {}) as Record<string, unknown>;
        const id = String(body.id || '');
        if (!id) return Response.json({ message: 'Unknown text' }, { status: 400 });
        const current = await req.payload.findByID({ collection: 'page-texts' as any, id, depth: 0, overrideAccess: true })
          .catch(() => null) as { translationKey?: string } | null;
        const defaultValue = current?.translationKey ? defaultRussianText(current.translationKey) : undefined;
        if (!defaultValue) return Response.json({ message: 'Исходный текст не найден' }, { status: 404 });
        const doc = await req.payload.update({
          collection: 'page-texts' as any,
          id,
          data: { value: defaultValue },
          overrideAccess: true,
          req,
        });
        return Response.json({ doc });
      },
    },
  ],
  fields: [
    {
      name: 'legacyId',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Служебный ID. Не редактировать.',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Порядок в списке CMS.',
      },
    },
    {
      name: 'isPublished',
      label: 'Опубликовано',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'page',
      label: 'Страница',
      type: 'select',
      required: true,
      index: true,
      options: EDITABLE_PAGE_TEXT_PAGES as unknown as Array<{ label: string; value: string }>,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'translationKey',
      label: 'Служебный ключ',
      type: 'text',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Нужен сайту, чтобы подставить текст в правильное место. Не редактировать.',
      },
    },
    {
      name: 'blockName',
      label: 'Название блока',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Имя блока внутри страницы (на русском). Используется для группировки текстов в дереве редактирования.',
      },
    },
    {
      name: 'label',
      label: 'Где используется',
      type: 'text',
      admin: {
        description: 'Подсказка для поиска нужной строки.',
      },
    },
    {
      name: 'value',
      label: 'Русский текст',
      type: 'textarea',
      admin: {
        rows: 8,
      },
    },
  ],
};
