import fs from 'node:fs';
import path from 'node:path';

import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n/languages';
import {
  EDITABLE_PAGE_TEXT_PAGES,
  flattenLocaleText,
  getEditablePageTextKeys,
  pageTextLegacyId,
  type EditablePageTextPage,
} from '../page-texts';

type MigrationDb = MigrateUpArgs['db'];

const quoteIdent = (name: string) => `\`${name.replace(/`/g, '``')}\``;
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

const columnExists = async (db: MigrationDb, table: string, column: string) => {
  if (!(await tableExists(db, table))) return false;
  const result = await getFirst<{ name?: string }>(
    db,
    `SELECT name FROM pragma_table_info(${quoteValue(table)}) WHERE name = ${quoteValue(column)} LIMIT 1`,
  );
  return Boolean(result?.name);
};

const addColumnIfMissing = async (db: MigrationDb, table: string, column: string, definition: string) => {
  if (await columnExists(db, table, column)) return;
  await db.run(sql.raw(`ALTER TABLE ${quoteIdent(table)} ADD ${quoteIdent(column)} ${definition};`));
};

const dropColumnIfExists = async (db: MigrationDb, table: string, column: string) => {
  if (!(await columnExists(db, table, column))) return;
  await db.run(sql.raw(`ALTER TABLE ${quoteIdent(table)} DROP COLUMN ${quoteIdent(column)};`));
};

const readLocale = (language: SupportedLanguage) => {
  const file = path.resolve(process.cwd(), 'src', 'i18n', 'locales', language, 'translation.json');
  return flattenLocaleText(JSON.parse(fs.readFileSync(file, 'utf8')));
};

const insertPageText = async ({
  db,
  page,
  language,
  translationKey,
  value,
  sortOrder,
}: {
  db: MigrationDb;
  page: EditablePageTextPage;
  language: SupportedLanguage;
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
    \`language\`,
    \`translation_key\`,
    \`label\`,
    \`value\`,
    \`updated_at\`,
    \`created_at\`
  ) VALUES (
    ${quoteValue(pageTextLegacyId(page, language, translationKey))},
    ${sortOrder},
    1,
    ${quoteValue(page)},
    ${quoteValue(language)},
    ${quoteValue(translationKey)},
    ${quoteValue(label)},
    ${quoteValue(value)},
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  );`));
};

const seedPageTexts = async (db: MigrationDb) => {
  for (const language of SUPPORTED_LANGUAGES) {
    const flatLocale = readLocale(language);
    for (const pageOption of EDITABLE_PAGE_TEXT_PAGES) {
      const page = pageOption.value;
      const keys = getEditablePageTextKeys(page, flatLocale);
      for (const [index, translationKey] of keys.entries()) {
        await insertPageText({
          db,
          page,
          language,
          translationKey,
          value: flatLocale[translationKey],
          sortOrder: index,
        });
      }
    }
  }
};

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`page_texts\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`legacy_id\` text,
    \`sort_order\` numeric DEFAULT 0,
    \`is_published\` integer DEFAULT true,
    \`page\` text NOT NULL,
    \`language\` text DEFAULT 'ru' NOT NULL,
    \`translation_key\` text NOT NULL,
    \`label\` text NOT NULL,
    \`value\` text NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );`);

  await db.run(sql`CREATE INDEX IF NOT EXISTS \`page_texts_legacy_id_idx\` ON \`page_texts\` (\`legacy_id\`);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`page_texts_page_idx\` ON \`page_texts\` (\`page\`);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`page_texts_language_idx\` ON \`page_texts\` (\`language\`);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`page_texts_translation_key_idx\` ON \`page_texts\` (\`translation_key\`);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`page_texts_updated_at_idx\` ON \`page_texts\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`page_texts_created_at_idx\` ON \`page_texts\` (\`created_at\`);`);
  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS \`page_texts_page_language_key_idx\` ON \`page_texts\` (\`page\`, \`language\`, \`translation_key\`);`);

  await addColumnIfMissing(db, 'payload_locked_documents_rels', 'page_texts_id', 'integer REFERENCES page_texts(id)');
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_page_texts_id_idx\` ON \`payload_locked_documents_rels\` (\`page_texts_id\`);`);

  await seedPageTexts(db);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_page_texts_id_idx\`;`);
  await dropColumnIfExists(db, 'payload_locked_documents_rels', 'page_texts_id');
  await db.run(sql`DROP TABLE IF EXISTS \`page_texts\`;`);
}
