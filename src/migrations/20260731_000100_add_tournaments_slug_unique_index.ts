import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Collection config declares slug as unique: true and the generated schema has
  // uniqueIndex("tournaments_slug_idx"), but the index was missing from the DB.
  // Guard: if duplicate non-empty slugs already exist (e.g. on production), creating
  // a UNIQUE index would throw and leave the migration permanently un-applied
  // (retried on every deploy). Mirror the runtime guard in server/payload.ts.
  const { rows } = await db.run(sql`
    SELECT COUNT(*) AS c FROM (
      SELECT slug FROM \`tournaments\`
      WHERE slug IS NOT NULL AND slug <> ''
      GROUP BY slug HAVING COUNT(*) > 1
    )
  `);
  const duplicateSlugs = Number((rows as unknown as Array<{ c: number }>)?.[0]?.c || 0);

  if (duplicateSlugs === 0) {
    await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS \`tournaments_slug_idx\` ON \`tournaments\` (\`slug\`);`);
  } else {
    console.warn(
      `[migration 20260731_000100] tournaments: найдены дубликаты slug (${duplicateSlugs}) — unique-индекс не создан`,
    );
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`tournaments_slug_idx\`;`);
}
