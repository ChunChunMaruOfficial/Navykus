import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

type MigrationDb = MigrateUpArgs['db'];

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

const removeBySource = async (db: MigrationDb, collection: string, table: string, where: string) => {
  if (!(await tableExists(db, table))) return;
  if (await tableExists(db, 'content_localizations')) {
    await db.run(sql.raw(`
      DELETE FROM content_localizations
      WHERE source_collection = ${quoteValue(collection)}
        AND source_id IN (SELECT CAST(id AS text) FROM ${table} WHERE ${where});
    `));
  }
  await db.run(sql.raw(`DELETE FROM ${table} WHERE ${where};`));
};

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await removeBySource(db, 'tournaments', 'tournaments', "title LIKE 'verify-%' OR slug LIKE 'dupslug-%'");
  await removeBySource(db, 'events', 'events', "title LIKE 'verify-%' OR slug LIKE 'dupslug-%'");
  await removeBySource(db, 'opportunities', 'opportunities', "title LIKE 'verify-%' OR slug LIKE 'dupslug-%'");
  await removeBySource(db, 'activities', 'activities', "title LIKE 'verify-%'");
  await removeBySource(db, 'experts', 'experts', "name LIKE 'verify-%'");
  await removeBySource(db, 'faqs', 'faqs', "question LIKE 'verify-%'");
  await removeBySource(db, 'pillars', 'pillars', "title LIKE 'verify-%'");
  await removeBySource(db, 'scenarios', 'scenarios', "title LIKE 'verify-%'");
  await removeBySource(db, 'trust-points', 'trust_points', "title LIKE 'verify-%'");
  await removeBySource(db, 'stats', 'stats', "label LIKE 'verify-%' OR value LIKE 'verify-%'");
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Verification artifacts are intentionally not restored.
}
