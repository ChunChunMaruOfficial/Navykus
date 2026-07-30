import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

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

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`content_localizations\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`source_collection\` text NOT NULL,
    \`source_id\` text NOT NULL,
    \`language\` text NOT NULL,
    \`localized_data\` text DEFAULT '{}' NOT NULL,
    \`translation_status\` text DEFAULT 'pending' NOT NULL,
    \`content_hash\` text,
    \`error_message\` text,
    \`generated_at\` text,
    \`attempts\` numeric DEFAULT 0,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );`);

  await db.run(sql`CREATE INDEX IF NOT EXISTS \`content_localizations_source_collection_idx\` ON \`content_localizations\` (\`source_collection\`);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`content_localizations_source_id_idx\` ON \`content_localizations\` (\`source_id\`);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`content_localizations_language_idx\` ON \`content_localizations\` (\`language\`);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`content_localizations_translation_status_idx\` ON \`content_localizations\` (\`translation_status\`);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`content_localizations_content_hash_idx\` ON \`content_localizations\` (\`content_hash\`);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`content_localizations_updated_at_idx\` ON \`content_localizations\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`content_localizations_created_at_idx\` ON \`content_localizations\` (\`created_at\`);`);
  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS \`content_localizations_source_language_idx\` ON \`content_localizations\` (\`source_collection\`, \`source_id\`, \`language\`);`);

  await addColumnIfMissing(db, 'tournaments', 'original_language', "text DEFAULT 'ru' NOT NULL");
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`tournaments_original_language_idx\` ON \`tournaments\` (\`original_language\`);`);
  await addColumnIfMissing(db, 'events', 'original_language', "text DEFAULT 'ru' NOT NULL");
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`events_original_language_idx\` ON \`events\` (\`original_language\`);`);
  await addColumnIfMissing(db, 'opportunities', 'original_language', "text DEFAULT 'ru' NOT NULL");
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`opportunities_original_language_idx\` ON \`opportunities\` (\`original_language\`);`);
  await addColumnIfMissing(db, 'team_members', 'original_language', "text DEFAULT 'ru' NOT NULL");
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`team_members_original_language_idx\` ON \`team_members\` (\`original_language\`);`);

  await addColumnIfMissing(db, 'payload_locked_documents_rels', 'content_localizations_id', 'integer REFERENCES content_localizations(id)');
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_content_localizations_id_idx\` ON \`payload_locked_documents_rels\` (\`content_localizations_id\`);`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_content_localizations_id_idx\`;`);
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`content_localizations_id\`;`);
  await db.run(sql`DROP TABLE IF EXISTS \`content_localizations\`;`);
  await db.run(sql`DROP INDEX IF EXISTS \`tournaments_original_language_idx\`;`);
  await db.run(sql`ALTER TABLE \`tournaments\` DROP COLUMN \`original_language\`;`);
  await db.run(sql`DROP INDEX IF EXISTS \`events_original_language_idx\`;`);
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`original_language\`;`);
  await db.run(sql`DROP INDEX IF EXISTS \`opportunities_original_language_idx\`;`);
  await db.run(sql`ALTER TABLE \`opportunities\` DROP COLUMN \`original_language\`;`);
  await db.run(sql`DROP INDEX IF EXISTS \`team_members_original_language_idx\`;`);
  await db.run(sql`ALTER TABLE \`team_members\` DROP COLUMN \`original_language\`;`);
}
