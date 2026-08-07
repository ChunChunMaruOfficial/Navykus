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

const dropTableIfExists = async (db: MigrationDb, table: string) => {
  await db.run(sql.raw(`DROP TABLE IF EXISTS ${quoteIdent(table)};`));
};

const deleteBlogNotifications = async (db: MigrationDb) => {
  if (!(await tableExists(db, 'notifications'))) return;
  await db.run(sql.raw(`
    DELETE FROM ${quoteIdent('notifications')}
    WHERE type IN (
      'blog_post_submitted',
      'blog_post_pending_review',
      'blog_post_approved',
      'blog_post_published',
      'blog_post_rejected',
      'blog_post_needs_revision'
    )
    OR related_type = 'blog-post';
  `));
};

/**
 * Rebuilds `payload_locked_documents_rels` without blog (and other removed
 * public platform) relation columns. SQLite cannot DROP COLUMN for a column
 * referenced by a foreign key, so the table is recreated from its canonical
 * schema instead. The table only stores pointers to locked documents, so no
 * data is lost (removed relations hold no rows).
 */
const rebuildLockedDocsRels = async (db: MigrationDb) => {
  const table = 'payload_locked_documents_rels';
  if (!(await tableExists(db, table))) return;

  const targetColumns = [
    'id',
    'order',
    'parent_id',
    'path',
    'users_id',
    'media_id',
    'tournaments_id',
    'activities_id',
    'experts_id',
    'faqs_id',
    'events_id',
    'opportunities_id',
    'team_members_id',
    'trust_points_id',
    'pillars_id',
    'scenarios_id',
    'stats_id',
    'contact_settings_id',
    'operator_settings_id',
    'audit_logs_id',
    'content_localizations_id',
  ];

  const existingColumns: string[] = [];
  const info = await db.all(sql.raw(`PRAGMA table_info(${quoteIdent(table)});`)) as Array<{ name: string }>;
  for (const row of info) {
    if (targetColumns.includes(row.name)) existingColumns.push(row.name);
  }
  const columnsSql = existingColumns.map((name) => quoteIdent(name)).join(', ');

  const fkStatements = [
    'FOREIGN KEY (`parent_id`) REFERENCES `payload_locked_documents`(`id`) ON UPDATE no action ON DELETE cascade',
    'FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade',
    'FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade',
    'FOREIGN KEY (`tournaments_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE cascade',
    'FOREIGN KEY (`activities_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade',
    'FOREIGN KEY (`experts_id`) REFERENCES `experts`(`id`) ON UPDATE no action ON DELETE cascade',
    'FOREIGN KEY (`faqs_id`) REFERENCES `faqs`(`id`) ON UPDATE no action ON DELETE cascade',
    'FOREIGN KEY (`events_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade',
    'FOREIGN KEY (`opportunities_id`) REFERENCES `opportunities`(`id`) ON UPDATE no action ON DELETE cascade',
    'FOREIGN KEY (`team_members_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE cascade',
    'FOREIGN KEY (`trust_points_id`) REFERENCES `trust_points`(`id`) ON UPDATE no action ON DELETE cascade',
    'FOREIGN KEY (`pillars_id`) REFERENCES `pillars`(`id`) ON UPDATE no action ON DELETE cascade',
    'FOREIGN KEY (`scenarios_id`) REFERENCES `scenarios`(`id`) ON UPDATE no action ON DELETE cascade',
    'FOREIGN KEY (`stats_id`) REFERENCES `stats`(`id`) ON UPDATE no action ON DELETE cascade',
    'FOREIGN KEY (`contact_settings_id`) REFERENCES `contact_settings`(`id`) ON UPDATE no action ON DELETE cascade',
    'FOREIGN KEY (`operator_settings_id`) REFERENCES `operator_settings`(`id`) ON UPDATE no action ON DELETE cascade',
    'FOREIGN KEY (`audit_logs_id`) REFERENCES `audit_logs`(`id`) ON UPDATE no action ON DELETE cascade',
    'FOREIGN KEY (`content_localizations_id`) REFERENCES `content_localizations`(`id`) ON UPDATE no action ON DELETE cascade',
  ].filter((statement) => {
    const column = statement.match(/FOREIGN KEY \(`([^`]+)`\)/)?.[1];
    return Boolean(column && existingColumns.includes(column));
  });

  // The id column is the primary key; every other target column is nullable.
  const createColumns = existingColumns.map((name) => {
    if (name === 'id') return '`id` integer PRIMARY KEY NOT NULL';
    return `\`${name}\` integer`;
  });

  const tempTable = `${table}__new`;
  // Guard against a stale temp table left behind by a previously interrupted run.
  await dropTableIfExists(db, tempTable);
  await db.run(sql.raw(`
    CREATE TABLE ${quoteIdent(tempTable)} (
      ${createColumns.join(',\n\t')},
      ${fkStatements.join(',\n\t')}
    );
  `));

  if (existingColumns.length > 0) {
    await db.run(sql.raw(`
      INSERT INTO ${quoteIdent(tempTable)} (${columnsSql})
      SELECT ${columnsSql} FROM ${quoteIdent(table)};
    `));
  }

  await db.run(sql.raw(`DROP TABLE ${quoteIdent(table)};`));
  await db.run(sql.raw(`ALTER TABLE ${quoteIdent(tempTable)} RENAME TO ${quoteIdent(table)};`));

  const indexedColumns = ['order', 'parent_id', 'path'];
  for (const name of existingColumns) {
    if (name !== 'id' && name !== 'order' && name !== 'parent_id' && name !== 'path') {
      indexedColumns.push(name);
    }
  }
  for (const name of indexedColumns) {
    const indexName = `${table}_${name}_idx`;
    await db.run(sql.raw(`CREATE INDEX IF NOT EXISTS ${quoteIdent(indexName)} ON ${quoteIdent(table)} (${quoteIdent(name)});`));
  }
};

export async function up({ db }: MigrateUpArgs): Promise<void> {
  if (await tableExists(db, 'content_localizations')) {
    await db.run(sql.raw(`DELETE FROM ${quoteIdent('content_localizations')} WHERE source_collection = 'blog-posts';`));
  }
  await deleteBlogNotifications(db);

  await rebuildLockedDocsRels(db);

  for (const table of [
    '_blog_posts_v_version_tags',
    '_blog_posts_v',
    'blog_post_localizations',
    'blog_moderation_history',
    'blog_posts_tags',
    'blog_posts',
  ]) {
    await dropTableIfExists(db, table);
  }
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // Blog removal is intentionally destructive. Recreate from the historical migrations if rollback is required.
}
