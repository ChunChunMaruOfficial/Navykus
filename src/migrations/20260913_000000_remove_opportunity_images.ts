import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

type MigrationDb = MigrateUpArgs['db'];

const quoteValue = (value: string) => `'${value.replace(/'/g, "''")}'`;

const dropColumn = async (db: MigrationDb, table: string, column: string) => {
  const rows = (await db.all(sql.raw(
    `SELECT name FROM pragma_table_info(${quoteValue(table)}) WHERE name = ${quoteValue(column)} LIMIT 1`,
  ))) as Array<{ name?: string }>;
  if (!rows[0]?.name) return;
  await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\`;`));
};

/**
 * Mirrors `ensureDevelopmentSchema` (server/payload.ts, the authoritative mechanism):
 * «Возможности» have no pictures any more — the uploaded image and the legacy image/logo links are dropped.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql.raw('DROP INDEX IF EXISTS opportunities_image_idx;'));
  await db.run(sql.raw('DROP INDEX IF EXISTS _opportunities_v_version_version_image_idx;'));
  for (const [table, column] of [
    ['opportunities', 'image_id'],
    ['opportunities', 'image_url'],
    ['opportunities', 'logo_url'],
    ['_opportunities_v', 'version_image_id'],
    ['_opportunities_v', 'version_image_url'],
    ['_opportunities_v', 'version_logo_url'],
  ]) {
    await dropColumn(db, table, column);
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // The pictures were removed on purpose; nothing to restore.
}
