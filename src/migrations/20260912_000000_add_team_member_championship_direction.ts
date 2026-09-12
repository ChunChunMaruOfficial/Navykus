import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

type MigrationDb = MigrateUpArgs['db'];

const quoteValue = (value: string) => `'${value.replace(/'/g, "''")}'`;

const exists = async (db: MigrationDb, query: string) => {
  const rows = (await db.all(sql.raw(query))) as Array<{ name?: string }>;
  return Boolean(rows[0]?.name);
};

const addColumn = async (db: MigrationDb, table: string, column: string, definition: string) => {
  if (!(await exists(db, `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ${quoteValue(table)} LIMIT 1`))) return;
  if (await exists(db, `SELECT name FROM pragma_table_info(${quoteValue(table)}) WHERE name = ${quoteValue(column)} LIMIT 1`)) return;
  await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD \`${column}\` ${definition};`));
};

/**
 * Mirrors `ensureDevelopmentSchema` (server/payload.ts, the authoritative mechanism): the key
 * direction of the championship an applicant picked in the championship application form.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumn(db, 'team_members', 'championship_direction', 'text');
  await addColumn(db, '_team_members_v', 'version_championship_direction', 'text');
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // SQLite column drops are destructive and unnecessary for a rollback here.
}
