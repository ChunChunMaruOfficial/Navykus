import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

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

const transferExistingTranslations = async (db: MigrationDb) => {
  if (!(await columnExists(db, 'page_texts', 'language'))) return;
  const rows = await db.all(sql.raw(`
    SELECT
      translated.language AS language,
      translated.value AS value,
      source.id AS source_id
    FROM page_texts translated
    JOIN page_texts source
      ON source.page = translated.page
      AND source.translation_key = translated.translation_key
      AND source.language = 'ru'
    WHERE translated.language <> 'ru'
  `)) as Array<{ language: string; value: string; source_id: string | number }>;

  for (const row of rows) {
    const localizedData = JSON.stringify({ value: row.value || '' });
    await db.run(sql.raw(`
      INSERT INTO content_localizations (
        source_collection,
        source_id,
        language,
        localized_data,
        translation_status,
        generated_at,
        attempts,
        updated_at,
        created_at
      ) VALUES (
        'page-texts',
        ${quoteValue(String(row.source_id))},
        ${quoteValue(row.language)},
        ${quoteValue(localizedData)},
        'ready',
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
        0,
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      )
      ON CONFLICT(source_collection, source_id, language) DO UPDATE SET
        localized_data = excluded.localized_data,
        translation_status = 'ready',
        generated_at = excluded.generated_at,
        error_message = '',
        updated_at = excluded.updated_at;
    `));
  }
};

export async function up({ db }: MigrateUpArgs): Promise<void> {
  if (!(await tableExists(db, 'page_texts'))) return;

  await transferExistingTranslations(db);

  if (await columnExists(db, 'page_texts', 'language')) {
    await db.run(sql`DELETE FROM page_texts WHERE language <> 'ru';`);
    await db.run(sql`DROP INDEX IF EXISTS page_texts_page_language_key_idx;`);
    await db.run(sql`DROP INDEX IF EXISTS page_texts_language_idx;`);
    await dropColumnIfExists(db, 'page_texts', 'language');
  }

  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS page_texts_page_key_idx ON page_texts (page, translation_key);`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  if (!(await tableExists(db, 'page_texts'))) return;

  await db.run(sql`DROP INDEX IF EXISTS page_texts_page_key_idx;`);
  await addColumnIfMissing(db, 'page_texts', 'language', "text DEFAULT 'ru' NOT NULL");
  await db.run(sql`CREATE INDEX IF NOT EXISTS page_texts_language_idx ON page_texts (language);`);
  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS page_texts_page_language_key_idx ON page_texts (page, language, translation_key);`);
  await db.run(sql`DELETE FROM content_localizations WHERE source_collection = 'page-texts';`);
}
