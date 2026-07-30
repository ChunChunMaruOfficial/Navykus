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
  await addColumnIfMissing(db, 'team_members', 'moderation_status', "text DEFAULT 'pending' NOT NULL");
  await addColumnIfMissing(db, 'team_members', 'moderation_comment', 'text');
  await addColumnIfMissing(db, 'team_members', 'reviewed_at', 'text');
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`team_members_moderation_status_idx\` ON \`team_members\` (\`moderation_status\`);`);
  await db.run(sql`UPDATE \`team_members\` SET \`moderation_status\` = CASE WHEN \`is_approved\` = 1 THEN 'approved' ELSE 'pending' END WHERE \`moderation_status\` IS NULL OR \`moderation_status\` = '';`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`team_members_moderation_status_idx\`;`);
  await db.run(sql`ALTER TABLE \`team_members\` DROP COLUMN \`moderation_status\`;`);
  await db.run(sql`ALTER TABLE \`team_members\` DROP COLUMN \`moderation_comment\`;`);
  await db.run(sql`ALTER TABLE \`team_members\` DROP COLUMN \`reviewed_at\`;`);
}
