import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

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
  await addColumnIfMissing(db, 'tournaments', 'pitch', 'text');
  await addColumnIfMissing(db, 'tournaments', 'registration_status', "text DEFAULT 'open'");
  await addColumnIfMissing(db, 'tournaments', 'target_audience', 'text');
  await addColumnIfMissing(db, 'tournaments', 'age_limit', 'text');
  await addColumnIfMissing(db, 'tournaments', 'teams_allowed', 'text');
  await addColumnIfMissing(db, 'tournaments', 'language', 'text');
  await addColumnIfMissing(db, 'tournaments', 'expected_result', 'text');
  await addColumnIfMissing(db, 'tournaments', 'themes_text', 'text');
  await addColumnIfMissing(db, 'tournaments', 'evaluation_criteria_text', 'text');
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`tournaments\` DROP COLUMN \`evaluation_criteria_text\`;`);
  await db.run(sql`ALTER TABLE \`tournaments\` DROP COLUMN \`themes_text\`;`);
  await db.run(sql`ALTER TABLE \`tournaments\` DROP COLUMN \`expected_result\`;`);
  await db.run(sql`ALTER TABLE \`tournaments\` DROP COLUMN \`language\`;`);
  await db.run(sql`ALTER TABLE \`tournaments\` DROP COLUMN \`teams_allowed\`;`);
  await db.run(sql`ALTER TABLE \`tournaments\` DROP COLUMN \`age_limit\`;`);
  await db.run(sql`ALTER TABLE \`tournaments\` DROP COLUMN \`target_audience\`;`);
  await db.run(sql`ALTER TABLE \`tournaments\` DROP COLUMN \`registration_status\`;`);
  await db.run(sql`ALTER TABLE \`tournaments\` DROP COLUMN \`pitch\`;`);
}
