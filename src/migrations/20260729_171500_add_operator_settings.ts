import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

type MigrationDb = MigrateUpArgs['db'];

const quoteIdent = (name: string) => `\`${name.replace(/`/g, '``')}\``;
const quoteValue = (value: string) => `'${value.replace(/'/g, "''")}'`;

const getFirst = async <T extends Record<string, unknown>>(db: MigrationDb, query: string) => {
  const rows = await db.all(sql.raw(query)) as T[];
  return rows[0];
};

const tableExists = async (db: MigrationDb, table: string) => {
  const result = await getFirst<{ name?: string }>(db, `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ${quoteValue(table)} LIMIT 1`);
  return Boolean(result?.name);
};

const columnExists = async (db: MigrationDb, table: string, column: string) => {
  if (!(await tableExists(db, table))) return false;
  const result = await getFirst<{ name?: string }>(db, `SELECT name FROM pragma_table_info(${quoteValue(table)}) WHERE name = ${quoteValue(column)} LIMIT 1`);
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

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`operator_settings\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`label\` text DEFAULT 'Operator Settings' NOT NULL,
    \`operator_name\` text DEFAULT '',
    \`operator_inn\` text DEFAULT '',
    \`operator_ogrn\` text DEFAULT '',
    \`operator_address\` text DEFAULT '',
    \`operator_registry_number\` text DEFAULT '',
    \`operator_registry_date\` text DEFAULT '',
    \`contacts_email\` text DEFAULT 'info@navykus.online',
    \`contacts_postal_address\` text DEFAULT '',
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`operator_settings_updated_at_idx\` ON \`operator_settings\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`operator_settings_created_at_idx\` ON \`operator_settings\` (\`created_at\`);`);
  await addColumnIfMissing(db, 'payload_locked_documents_rels', 'operator_settings_id', 'integer REFERENCES operator_settings(id)');
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_operator_settings_id_idx\` ON \`payload_locked_documents_rels\` (\`operator_settings_id\`);`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_operator_settings_id_idx\`;`);
  await dropColumnIfExists(db, 'payload_locked_documents_rels', 'operator_settings_id');
  await db.run(sql`DROP INDEX IF EXISTS \`operator_settings_updated_at_idx\`;`);
  await db.run(sql`DROP INDEX IF EXISTS \`operator_settings_created_at_idx\`;`);
  await db.run(sql`DROP TABLE IF EXISTS \`operator_settings\`;`);
}
