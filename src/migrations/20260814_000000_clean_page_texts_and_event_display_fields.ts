import fs from 'node:fs';
import path from 'node:path';

import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

import { DEFAULT_LANGUAGE } from '../i18n/languages';
import {
  EDITABLE_PAGE_TEXT_PAGES,
  flattenLocaleText,
  getEditablePageTextKeys,
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

const readDefaultLocale = () => {
  const file = path.resolve(process.cwd(), 'src', 'i18n', 'locales', DEFAULT_LANGUAGE, 'translation.json');
  return flattenLocaleText(JSON.parse(fs.readFileSync(file, 'utf8')));
};

const cleanupPageTexts = async (db: MigrationDb) => {
  if (!(await tableExists(db, 'page_texts'))) return;

  const flatLocale = readDefaultLocale();
  const conditions = EDITABLE_PAGE_TEXT_PAGES.map((pageOption) => {
    const keys = getEditablePageTextKeys(pageOption.value, flatLocale);
    if (keys.length === 0) return '';
    return `(\`page\` = ${quoteValue(pageOption.value)} AND \`translation_key\` IN (${keys.map(quoteValue).join(',')}))`;
  }).filter(Boolean);

  if (conditions.length === 0) return;

  await db.run(sql.raw(`
    DELETE FROM \`page_texts\`
    WHERE NOT (${conditions.join(' OR ')});
  `));

  if (await tableExists(db, 'content_localizations')) {
    await db.run(sql.raw(`
      DELETE FROM \`content_localizations\`
      WHERE \`source_collection\` = 'page-texts'
        AND \`source_id\` NOT IN (SELECT CAST(\`id\` AS text) FROM \`page_texts\`);
    `));
  }
};

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing(db, 'events', 'display_date', 'text');
  await addColumnIfMissing(db, 'events', 'show_time', 'integer DEFAULT false');
  await addColumnIfMissing(db, 'events', 'audience', 'text');
  await addColumnIfMissing(db, 'events', 'outcomes_text', 'text');
  await addColumnIfMissing(db, 'events', 'prerequisites', 'text');

  await addColumnIfMissing(db, '_events_v', 'version_display_date', 'text');
  await addColumnIfMissing(db, '_events_v', 'version_show_time', 'integer DEFAULT false');
  await addColumnIfMissing(db, '_events_v', 'version_audience', 'text');
  await addColumnIfMissing(db, '_events_v', 'version_outcomes_text', 'text');
  await addColumnIfMissing(db, '_events_v', 'version_prerequisites', 'text');

  await cleanupPageTexts(db);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await dropColumnIfExists(db, '_events_v', 'version_prerequisites');
  await dropColumnIfExists(db, '_events_v', 'version_outcomes_text');
  await dropColumnIfExists(db, '_events_v', 'version_audience');
  await dropColumnIfExists(db, '_events_v', 'version_show_time');
  await dropColumnIfExists(db, '_events_v', 'version_display_date');

  await dropColumnIfExists(db, 'events', 'prerequisites');
  await dropColumnIfExists(db, 'events', 'outcomes_text');
  await dropColumnIfExists(db, 'events', 'audience');
  await dropColumnIfExists(db, 'events', 'show_time');
  await dropColumnIfExists(db, 'events', 'display_date');
}
