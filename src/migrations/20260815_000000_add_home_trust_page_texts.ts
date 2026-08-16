import fs from 'node:fs';
import path from 'node:path';

import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

import { DEFAULT_LANGUAGE } from '../i18n/languages';
import { flattenLocaleText, pageTextLegacyId } from '../page-texts';

type MigrationDb = MigrateUpArgs['db'];

const HOME_TRUST_TEXTS = [
  {
    translationKey: 'ui.app.19816f01',
    label: 'Главная / Блок доверия / Заголовок',
    sortOrder: 0,
  },
  {
    translationKey: 'ui.app.c8e427d5b3',
    label: 'Главная / Блок доверия / Описание',
    sortOrder: 1,
  },
] as const;

const quoteValue = (value: string) => `'${value.replace(/'/g, "''")}'`;

const getFirst = async <T extends Record<string, unknown>>(db: MigrationDb, query: string) => {
  const rows = await db.all(sql.raw(query)) as T[];
  return rows[0];
};

const tableExists = async (db: MigrationDb, table: string) => {
  const result = await getFirst<{ name?: string }>(
    db,
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ${quoteValue(table)} LIMIT 1`,
  );
  return Boolean(result?.name);
};

const readRuLocale = () => {
  const file = path.resolve(process.cwd(), 'src', 'i18n', 'locales', DEFAULT_LANGUAGE, 'translation.json');
  return flattenLocaleText(JSON.parse(fs.readFileSync(file, 'utf8')));
};

export async function up({ db }: MigrateUpArgs): Promise<void> {
  if (!(await tableExists(db, 'page_texts'))) return;

  const flatLocale = readRuLocale();
  for (const item of HOME_TRUST_TEXTS) {
    const value = flatLocale[item.translationKey];
    if (typeof value !== 'string') continue;

    await db.run(sql.raw(`INSERT OR IGNORE INTO \`page_texts\` (
      \`legacy_id\`,
      \`sort_order\`,
      \`is_published\`,
      \`page\`,
      \`translation_key\`,
      \`label\`,
      \`value\`,
      \`updated_at\`,
      \`created_at\`
    ) VALUES (
      ${quoteValue(pageTextLegacyId('home', DEFAULT_LANGUAGE, item.translationKey))},
      ${item.sortOrder},
      1,
      'home',
      ${quoteValue(item.translationKey)},
      ${quoteValue(item.label)},
      ${quoteValue(value)},
      strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
      strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    );`));
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  if (!(await tableExists(db, 'page_texts'))) return;

  const legacyIds = HOME_TRUST_TEXTS
    .map((item) => quoteValue(pageTextLegacyId('home', DEFAULT_LANGUAGE, item.translationKey)))
    .join(', ');
  const keys = HOME_TRUST_TEXTS.map((item) => quoteValue(item.translationKey)).join(', ');

  await db.run(sql.raw(`
    DELETE FROM \`content_localizations\`
    WHERE \`source_collection\` = 'page-texts'
      AND \`source_id\` IN (
        SELECT CAST(\`id\` AS text)
        FROM \`page_texts\`
        WHERE \`legacy_id\` IN (${legacyIds})
          OR (\`page\` = 'home' AND \`translation_key\` IN (${keys}))
      );
  `));
  await db.run(sql.raw(`
    DELETE FROM \`page_texts\`
    WHERE \`legacy_id\` IN (${legacyIds})
      OR (\`page\` = 'home' AND \`translation_key\` IN (${keys}));
  `));
}
