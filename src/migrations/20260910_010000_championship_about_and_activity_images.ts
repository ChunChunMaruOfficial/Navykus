import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

type MigrationDb = MigrateUpArgs['db'];

const quoteValue = (value: string) => `'${value.replace(/'/g, "''")}'`;

const getFirst = async <T extends Record<string, unknown>>(db: MigrationDb, query: string) => {
  const rows = (await db.all(sql.raw(query))) as T[];
  return rows[0];
};

const columnExists = async (db: MigrationDb, table: string, column: string) => {
  const row = await getFirst<{ name?: string }>(
    db,
    `SELECT name FROM pragma_table_info(${quoteValue(table)}) WHERE name = ${quoteValue(column)} LIMIT 1`,
  );
  return Boolean(row?.name);
};

const tableExists = async (db: MigrationDb, table: string) => {
  const row = await getFirst<{ name?: string }>(
    db,
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ${quoteValue(table)} LIMIT 1`,
  );
  return Boolean(row?.name);
};

const addColumn = async (db: MigrationDb, table: string, column: string, definition: string) => {
  if (!(await tableExists(db, table))) return;
  if (await columnExists(db, table, column)) return;
  await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD \`${column}\` ${definition};`));
};

/**
 * Mirrors the columns added in `ensureDevelopmentSchema` (server/payload.ts), which is the
 * authoritative schema mechanism: the «О чемпионате» heading/image of a championship and an
 * uploaded image for activities (events) and opportunities. The data fixes (single active
 * championship, legacy collections → page texts, select codes) live there as well.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  const media = 'integer REFERENCES media(id) ON DELETE set null';
  await addColumn(db, 'tournaments', 'about_heading', 'text');
  await addColumn(db, 'tournaments', 'about_image_id', media);
  await addColumn(db, '_tournaments_v', 'version_about_heading', 'text');
  await addColumn(db, '_tournaments_v', 'version_about_image_id', media);
  await addColumn(db, 'events', 'image_id', media);
  await addColumn(db, '_events_v', 'version_image_id', media);
  await addColumn(db, 'opportunities', 'image_id', media);
  await addColumn(db, '_opportunities_v', 'version_image_id', media);
  for (const [table, column, index] of [
    ['tournaments', 'about_image_id', 'tournaments_about_image_idx'],
    ['_tournaments_v', 'version_about_image_id', '_tournaments_v_version_version_about_image_idx'],
    ['events', 'image_id', 'events_image_idx'],
    ['_events_v', 'version_image_id', '_events_v_version_version_image_idx'],
    ['opportunities', 'image_id', 'opportunities_image_idx'],
    ['_opportunities_v', 'version_image_id', '_opportunities_v_version_version_image_idx'],
  ]) {
    if (await tableExists(db, table)) {
      await db.run(sql.raw(`CREATE INDEX IF NOT EXISTS ${index} ON ${table} (${column});`));
    }
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // SQLite column drops are destructive and unnecessary for a rollback here.
}
