import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n/languages';
import {
  EDITABLE_PAGE_TEXT_PAGES,
  flattenLocaleText,
  getEditablePageTextKeys,
  pageTextLegacyId,
  type EditablePageTextPage,
} from '../page-texts';

type MigrationDb = MigrateUpArgs['db'];

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

const readDefaultLocale = () => {
  const file = path.resolve(process.cwd(), 'src', 'i18n', 'locales', DEFAULT_LANGUAGE, 'translation.json');
  return flattenLocaleText(JSON.parse(fs.readFileSync(file, 'utf8')));
};

const contentHash = (value: string) =>
  createHash('sha256').update(JSON.stringify({ sourceLanguage: DEFAULT_LANGUAGE, content: { value: value.trim() } })).digest('hex');

const insertPageText = async ({
  db,
  page,
  translationKey,
  value,
  sortOrder,
}: {
  db: MigrationDb;
  page: EditablePageTextPage;
  translationKey: string;
  value: string;
  sortOrder: number;
}) => {
  const label = translationKey.replace(/^ui\./, '').replace(/^common\./, 'common.');
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
    ${quoteValue(pageTextLegacyId(page, DEFAULT_LANGUAGE, translationKey))},
    ${sortOrder},
    1,
    ${quoteValue(page)},
    ${quoteValue(translationKey)},
    ${quoteValue(label)},
    ${quoteValue(value)},
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  );`));
};

const enqueuePageTextTranslations = async (
  db: MigrationDb,
  page: EditablePageTextPage,
  translationKey: string,
) => {
  if (!(await tableExists(db, 'content_localizations'))) return;

  const row = await getFirst<{ id?: string | number; value?: string }>(
    db,
    `SELECT id, value FROM \`page_texts\` WHERE \`page\` = ${quoteValue(page)} AND \`translation_key\` = ${quoteValue(translationKey)} LIMIT 1`,
  );
  if (!row?.id) return;

  const hash = contentHash(String(row.value || ''));
  for (const language of SUPPORTED_LANGUAGES) {
    if (language === DEFAULT_LANGUAGE) continue;
    await db.run(sql.raw(`
      INSERT INTO \`content_localizations\` (
        \`source_collection\`,
        \`source_id\`,
        \`language\`,
        \`localized_data\`,
        \`translation_status\`,
        \`content_hash\`,
        \`attempts\`,
        \`error_message\`,
        \`updated_at\`,
        \`created_at\`
      ) VALUES (
        'page-texts',
        ${quoteValue(String(row.id))},
        ${quoteValue(language as SupportedLanguage)},
        '{}',
        'pending',
        ${quoteValue(hash)},
        0,
        '',
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      )
      ON CONFLICT(\`source_collection\`, \`source_id\`, \`language\`) DO UPDATE SET
        \`translation_status\` = CASE
          WHEN \`content_localizations\`.\`content_hash\` = excluded.\`content_hash\`
            AND \`content_localizations\`.\`translation_status\` = 'ready'
          THEN \`content_localizations\`.\`translation_status\`
          ELSE 'pending'
        END,
        \`localized_data\` = CASE
          WHEN \`content_localizations\`.\`content_hash\` = excluded.\`content_hash\`
            AND \`content_localizations\`.\`translation_status\` = 'ready'
          THEN \`content_localizations\`.\`localized_data\`
          ELSE '{}'
        END,
        \`content_hash\` = excluded.\`content_hash\`,
        \`error_message\` = '',
        \`updated_at\` = excluded.\`updated_at\`;
    `));
  }
};

export async function up({ db }: MigrateUpArgs): Promise<void> {
  if (!(await tableExists(db, 'page_texts'))) return;

  const flatLocale = readDefaultLocale();
  for (const pageOption of EDITABLE_PAGE_TEXT_PAGES) {
    const page = pageOption.value;
    const keys = getEditablePageTextKeys(page, flatLocale);
    for (const [index, translationKey] of keys.entries()) {
      await insertPageText({
        db,
        page,
        translationKey,
        value: flatLocale[translationKey],
        sortOrder: index,
      });
      await enqueuePageTextTranslations(db, page, translationKey);
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  if (!(await tableExists(db, 'page_texts'))) return;

  await db.run(sql.raw(`
    DELETE FROM \`content_localizations\`
    WHERE \`source_collection\` = 'page-texts'
      AND \`source_id\` IN (
        SELECT CAST(\`id\` AS text)
        FROM \`page_texts\`
        WHERE \`page\` IN ('global', 'find-team', 'legal')
      );
  `));
  await db.run(sql`DELETE FROM \`page_texts\` WHERE \`page\` IN ('global', 'find-team', 'legal');`);
}
