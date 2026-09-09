import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

type MigrationDb = MigrateUpArgs['db'];

/**
 * Removes the CMS page-text rows for two blocks that were deleted from the site:
 *  - Home: "Сделай первый шаг навстречу проектам" (embedded application form)
 *  - Championship: "Подходит каждому активному школьнику" (suitability segmentation)
 *
 * Down is a no-op: the source strings live in the i18n locale files and are
 * re-seeded by the regular page-text sync when the keys exist there.
 */
const REMOVED_KEYS: Array<{ page: string; translationKey: string }> = [
  // Home — "Сделай первый шаг навстречу проектам" + inline application form
  ...[
    'ui.app.031b5a9779',
    'ui.app.8062a560c4',
    'ui.app.a63c2f5651',
    'ui.app.fb613f5591',
    'ui.app.eca55dace1',
    'ui.app.b35da1ef1c',
    'ui.app.8b4a2775bb',
    'ui.app.c1830703d0',
    'ui.app.b7cc349dbb',
    'ui.app.7acec174f3',
    'ui.app.1734a8f063',
    'ui.app.0751cc5d9c',
    'ui.app.7d521595ce',
    'ui.app.d3e56289ef',
    'ui.app.d52e1ae8a0',
    'ui.app.852dca4487',
    'ui.app.b0f4d8ce6d',
    'ui.app.ac41209943',
  ].map((translationKey) => ({ page: 'home', translationKey })),
  // Championship — "Подходит каждому активному школьнику" (suitability tabs)
  ...[
    'ui.championshippage.930fc92538',
    'ui.championshippage.228a84235a',
    'ui.championshippage.a950b9ee19',
    'ui.championshippage.ca26c61c13',
    'ui.championshippage.18b2b68608',
    'ui.championshippage.9913df95c5',
    'ui.championshippage.de56ba7e8b',
    'ui.championshippage.5e809fc67f',
    'ui.championshippage.8f11566b38',
    'ui.championshippage.7f6fbf84a6',
    'ui.championshippage.3015b9f8',
    'ui.championshippage.3cb46975e1',
    'ui.championshippage.d3da2f0b9c',
    'ui.championshippage.9dee187e5f',
    'ui.championshippage.9f228ac331',
    'ui.championshippage.a3e6b0b4fd',
    'ui.championshippage.6e3ec9704e',
    'ui.championshippage.cec289e2df',
    'ui.championshippage.fe12153d63',
    'ui.championshippage.5c275f89de',
    'ui.championshippage.188450882a',
    'ui.championshippage.63db68249b',
    'ui.championshippage.c174c67149',
  ].map((translationKey) => ({ page: 'championship', translationKey })),
];

const quoteValue = (value: string) => `'${value.replace(/'/g, "''")}'`;

const getFirst = async <T extends Record<string, unknown>>(db: MigrationDb, query: string) => {
  const rows = (await db.all(sql.raw(query))) as T[];
  return rows[0];
};

const tableExists = async (db: MigrationDb, table: string) => {
  const result = await getFirst<{ name?: string }>(
    db,
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ${quoteValue(table)} LIMIT 1`,
  );
  return Boolean(result?.name);
};

export async function up({ db }: MigrateUpArgs): Promise<void> {
  if (!(await tableExists(db, 'page_texts'))) return;

  const conditions = REMOVED_KEYS.map(
    ({ page, translationKey }) =>
      `(\`page\` = ${quoteValue(page)} AND \`translation_key\` = ${quoteValue(translationKey)})`,
  ).join(' OR ');

  if (await tableExists(db, 'content_localizations')) {
    await db.run(
      sql.raw(`
        DELETE FROM \`content_localizations\`
        WHERE \`source_collection\` = 'page-texts'
          AND \`source_id\` IN (
            SELECT CAST(\`id\` AS text) FROM \`page_texts\` WHERE ${conditions}
          );
      `),
    );
  }

  await db.run(sql.raw(`DELETE FROM \`page_texts\` WHERE ${conditions};`));
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // No-op: the removed blocks no longer exist on the site.
  void db;
}
