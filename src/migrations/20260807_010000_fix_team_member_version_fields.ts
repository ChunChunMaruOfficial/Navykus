import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

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
  await db.run(sql.raw(`ALTER TABLE ${quoteIdent(table)} ADD COLUMN ${quoteIdent(column)} ${definition};`));
};

const indexExists = async (db: MigrationDb, indexName: string) => {
  const result = await getFirst<{ name?: string }>(
    db,
    `SELECT name FROM sqlite_master WHERE type = 'index' AND name = ${quoteValue(indexName)} LIMIT 1`,
  );
  return Boolean(result?.name);
};

const createIndexIfMissing = async (db: MigrationDb, indexName: string, table: string, column: string) => {
  if (await indexExists(db, indexName)) return;
  await db.run(sql.raw(`CREATE INDEX ${quoteIdent(indexName)} ON ${quoteIdent(table)} (${quoteIdent(column)});`));
};

/**
 * Backfills the team-members version table with fields added to the collection
 * after the original moderation migration (email, portfolio link, source
 * context and portfolio file relationships). Without these columns, creating
 * a new team member (or any later publish/version operation) fails with
 * "table _team_members_v has no column named version_email".
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  const table = '_team_members_v';
  if (!(await tableExists(db, table))) return;

  await addColumnIfMissing(db, table, 'version_email', 'text');
  await addColumnIfMissing(db, table, 'version_portfolio_link', 'text');
  await addColumnIfMissing(db, table, 'version_source_type', "text DEFAULT 'modal'");
  await addColumnIfMissing(db, table, 'version_source_id', 'text');
  await addColumnIfMissing(db, table, 'version_source_context', 'text');
  await addColumnIfMissing(db, table, 'version_tournament_id', 'text');

  await createIndexIfMissing(db, '_team_members_v_version_version_email_idx', table, 'version_email');
  await createIndexIfMissing(db, '_team_members_v_version_version_moderation_status_idx', table, 'version_moderation_status');
  await createIndexIfMissing(db, '_team_members_v_version_version_updated_at_idx', table, 'version_updated_at');
  await createIndexIfMissing(db, '_team_members_v_version_version_created_at_idx', table, 'version_created_at');
  await createIndexIfMissing(db, '_team_members_v_version_version__status_idx', table, 'version__status');
  await createIndexIfMissing(db, '_team_members_v_version_version_legacy_id_idx', table, 'version_legacy_id');
  await createIndexIfMissing(db, '_team_members_v_version_version_original_language_idx', table, 'version_original_language');

  // portfolioFiles relationship table for versions.
  const relsTable = '_team_members_v_rels';
  if (!(await tableExists(db, relsTable))) {
    await db.run(sql.raw(`
      CREATE TABLE ${quoteIdent(relsTable)} (
        \`id\` integer PRIMARY KEY NOT NULL,
        \`order\` integer,
        \`parent_id\` integer NOT NULL,
        \`path\` text NOT NULL,
        \`media_id\` integer,
        FOREIGN KEY (\`parent_id\`) REFERENCES ${quoteIdent(table)}(\`id\`) ON UPDATE no action ON DELETE cascade,
        FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
      );
    `));
  }
  await createIndexIfMissing(db, '_team_members_v_rels_order_idx', relsTable, 'order');
  await createIndexIfMissing(db, '_team_members_v_rels_parent_idx', relsTable, 'parent_id');
  await createIndexIfMissing(db, '_team_members_v_rels_path_idx', relsTable, 'path');
  await createIndexIfMissing(db, '_team_members_v_rels_media_id_idx', relsTable, 'media_id');
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // Backfill is additive; no down migration needed.
}
