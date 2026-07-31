import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

type MigrationDb = MigrateUpArgs['db'];

const quoteIdent = (name: string) => `\`${name.replace(/`/g, '``')}\``;
const quoteValue = (value: string) => `'${value.replace(/'/g, "''")}'`;

const getFirst = async <T extends Record<string, unknown>>(db: MigrationDb, query: string) => {
  const rows = await db.all(sql.raw(query)) as T[];
  return rows[0];
};

const columnExists = async (db: MigrationDb, table: string, column: string) => {
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
  // TeamPosts/TeamResponses configs require originalLanguageField (index: true, default 'ru'),
  // but the columns were missing from the tables — creating a team-post/team-response failed
  // with a DB insert error. Add the column and its index, matching the config/generated schema.
  await addColumnIfMissing(db, 'team_posts', 'original_language', "text DEFAULT 'ru'");
  await addColumnIfMissing(db, 'team_responses', 'original_language', "text DEFAULT 'ru'");
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`team_posts_original_language_idx\` ON \`team_posts\` (\`original_language\`);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`team_responses_original_language_idx\` ON \`team_responses\` (\`original_language\`);`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`team_posts_original_language_idx\`;`);
  await db.run(sql`DROP INDEX IF EXISTS \`team_responses_original_language_idx\`;`);
  await db.run(sql`ALTER TABLE \`team_posts\` DROP COLUMN \`original_language\`;`);
  await db.run(sql`ALTER TABLE \`team_responses\` DROP COLUMN \`original_language\`;`);
}
