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

const tables = ['activities', 'pillars', 'scenarios', 'stats', 'trust_points'];

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of tables) {
    await addColumnIfMissing(db, table, 'original_language', "text DEFAULT 'ru'");
    await addColumnIfMissing(db, table, 'seo_title', 'text');
    await addColumnIfMissing(db, table, 'seo_description', 'text');
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of tables) {
    await dropColumnIfExists(db, table, 'seo_description');
    await dropColumnIfExists(db, table, 'seo_title');
    await dropColumnIfExists(db, table, 'original_language');
  }
}
