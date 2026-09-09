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
 * Gives a championship (`tournaments`) its own cover / hero images, uploaded
 * straight onto the record in the CMS. The site falls back to the «Дерево медиа»
 * slot when a field is empty.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumn(db, 'tournaments', 'cover_image_id', 'integer REFERENCES media(id) ON DELETE set null');
  await addColumn(db, 'tournaments', 'hero_image_id', 'integer REFERENCES media(id) ON DELETE set null');
  await db.run(sql.raw('CREATE INDEX IF NOT EXISTS tournaments_cover_image_idx ON tournaments (cover_image_id);'));
  await db.run(sql.raw('CREATE INDEX IF NOT EXISTS tournaments_hero_image_idx ON tournaments (hero_image_id);'));

  await addColumn(db, '_tournaments_v', 'version_cover_image_id', 'integer REFERENCES media(id) ON DELETE set null');
  await addColumn(db, '_tournaments_v', 'version_hero_image_id', 'integer REFERENCES media(id) ON DELETE set null');
  await db.run(
    sql.raw(
      'CREATE INDEX IF NOT EXISTS _tournaments_v_version_version_cover_image_idx ON _tournaments_v (version_cover_image_id);',
    ),
  );
  await db.run(
    sql.raw(
      'CREATE INDEX IF NOT EXISTS _tournaments_v_version_version_hero_image_idx ON _tournaments_v (version_hero_image_id);',
    ),
  );
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // SQLite column drops are destructive and unnecessary for a rollback here.
}
