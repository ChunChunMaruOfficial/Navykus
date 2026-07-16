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
  await db.run(sql.raw(`ALTER TABLE ${quoteIdent(table)} ADD ${quoteIdent(column)} ${definition};`));
};

const countRows = async (db: MigrationDb, table: string) => {
  if (!(await tableExists(db, table))) return 0;
  const result = await getFirst<{ count: number }>(db, `SELECT count(*) as count FROM ${quoteIdent(table)}`);
  return Number(result?.count ?? 0);
};

const assertRowsPreserved = async (db: MigrationDb, before: Map<string, number>) => {
  for (const [table, previousCount] of before) {
    const currentCount = await countRows(db, table);
    if (currentCount < previousCount) {
      throw new Error(`Migration validation failed: ${table} row count changed from ${previousCount} to ${currentCount}`);
    }
  }
};

export async function up({ db }: MigrateUpArgs): Promise<void> {
  const protectedCounts = new Map<string, number>();
  for (const table of ['users', 'tournaments', 'applications', 'community_leads', 'media']) {
    protectedCounts.set(table, await countRows(db, table));
  }

  await addColumnIfMissing(db, 'users', 'role', "text DEFAULT 'user' NOT NULL");
  await addColumnIfMissing(db, 'users', 'first_name', 'text');
  await addColumnIfMissing(db, 'users', 'last_name', 'text');
  await addColumnIfMissing(db, 'users', 'avatar_id', 'integer');
  await addColumnIfMissing(db, 'users', 'country', 'text');
  await addColumnIfMissing(db, 'users', 'city', 'text');
  await addColumnIfMissing(db, 'users', 'date_of_birth', 'text');
  await addColumnIfMissing(db, 'users', 'age_group', 'text');
  await addColumnIfMissing(db, 'users', 'school', 'text');
  await addColumnIfMissing(db, 'users', 'school_grade', 'text');
  await addColumnIfMissing(db, 'users', 'biography', 'text');
  await addColumnIfMissing(db, 'users', 'portfolio', 'text');
  await addColumnIfMissing(db, 'users', 'team_search_available', 'integer DEFAULT false');
  await addColumnIfMissing(db, 'users', 'public_profile', 'integer DEFAULT false');
  await addColumnIfMissing(db, 'users', 'account_status', "text DEFAULT 'active' NOT NULL");
  await addColumnIfMissing(db, 'users', 'privacy_show_city', 'integer DEFAULT true');
  await addColumnIfMissing(db, 'users', 'privacy_show_school', 'integer DEFAULT false');
  await addColumnIfMissing(db, 'users', 'privacy_show_age', 'integer DEFAULT true');
  await addColumnIfMissing(db, 'users', 'privacy_show_email', 'integer DEFAULT false');
  await addColumnIfMissing(db, 'users', 'privacy_show_social_links', 'integer DEFAULT true');

  await db.run(sql`CREATE TABLE IF NOT EXISTS \`users_interests\` (\`_order\` integer NOT NULL, \`_parent_id\` integer NOT NULL, \`id\` text PRIMARY KEY NOT NULL, \`value\` text NOT NULL, FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON DELETE cascade);`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`users_skills\` (\`_order\` integer NOT NULL, \`_parent_id\` integer NOT NULL, \`id\` text PRIMARY KEY NOT NULL, \`value\` text NOT NULL, FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON DELETE cascade);`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`users_languages\` (\`_order\` integer NOT NULL, \`_parent_id\` integer NOT NULL, \`id\` text PRIMARY KEY NOT NULL, \`value\` text NOT NULL, FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON DELETE cascade);`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`users_social_links\` (\`_order\` integer NOT NULL, \`_parent_id\` integer NOT NULL, \`id\` text PRIMARY KEY NOT NULL, \`label\` text NOT NULL, \`url\` text NOT NULL, FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON DELETE cascade);`);

  await addColumnIfMissing(db, 'applications', 'user_id', 'integer');
  await addColumnIfMissing(db, 'applications', 'item_type', "text DEFAULT 'championship'");
  await addColumnIfMissing(db, 'applications', 'item_id', 'text');
  await addColumnIfMissing(db, 'applications', 'item_title', 'text');
  await addColumnIfMissing(db, 'applications', 'custom_answers', 'text');
  await addColumnIfMissing(db, 'applications', 'admin_comment', 'text');
  await addColumnIfMissing(db, 'applications', 'internal_notes', 'text');
  await addColumnIfMissing(db, 'applications', 'submitted_at', 'text');
  await addColumnIfMissing(db, 'applications', 'cancelled_at', 'text');

  await db.run(sql`CREATE TABLE IF NOT EXISTS \`events\` (\`id\` integer PRIMARY KEY NOT NULL, \`legacy_id\` text, \`sort_order\` numeric DEFAULT 0, \`is_published\` integer DEFAULT true, \`title\` text NOT NULL, \`slug\` text NOT NULL, \`short_description\` text NOT NULL, \`full_description\` text, \`image_url\` text, \`event_type\` text NOT NULL, \`event_date\` text NOT NULL, \`time_zone\` text DEFAULT 'UTC', \`format\` text NOT NULL, \`country\` text, \`venue\` text, \`speaker\` text, \`participant_limit\` numeric, \`registration_deadline\` text, \`online_link\` text, \`seo_title\` text, \`seo_description\` text, \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL);`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`events_languages\` (\`_order\` integer NOT NULL, \`_parent_id\` integer NOT NULL, \`id\` text PRIMARY KEY NOT NULL, \`value\` text NOT NULL, FOREIGN KEY (\`_parent_id\`) REFERENCES \`events\`(\`id\`) ON DELETE cascade);`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`events_materials\` (\`_order\` integer NOT NULL, \`_parent_id\` integer NOT NULL, \`id\` text PRIMARY KEY NOT NULL, \`value\` text NOT NULL, FOREIGN KEY (\`_parent_id\`) REFERENCES \`events\`(\`id\`) ON DELETE cascade);`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS \`opportunities\` (\`id\` integer PRIMARY KEY NOT NULL, \`legacy_id\` text, \`sort_order\` numeric DEFAULT 0, \`is_published\` integer DEFAULT true, \`title\` text NOT NULL, \`slug\` text NOT NULL, \`organization\` text NOT NULL, \`opportunity_type\` text NOT NULL, \`short_description\` text NOT NULL, \`full_description\` text, \`logo_url\` text, \`country\` text, \`format\` text, \`age_min\` numeric, \`age_max\` numeric, \`deadline\` text, \`cost\` text, \`funding\` integer DEFAULT false, \`official_url\` text, \`internal_applications_enabled\` integer DEFAULT false, \`seo_title\` text, \`seo_description\` text, \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL);`);
  for (const table of ['opportunities_languages', 'opportunities_requirements', 'opportunities_benefits', 'opportunities_documents']) {
    await db.run(sql.raw(`CREATE TABLE IF NOT EXISTS ${quoteIdent(table)} (\`_order\` integer NOT NULL, \`_parent_id\` integer NOT NULL, \`id\` text PRIMARY KEY NOT NULL, \`value\` text NOT NULL, FOREIGN KEY (\`_parent_id\`) REFERENCES \`opportunities\`(\`id\`) ON DELETE cascade);`));
  }

  await db.run(sql`CREATE TABLE IF NOT EXISTS \`team_posts\` (\`id\` integer PRIMARY KEY NOT NULL, \`user_id\` integer NOT NULL, \`title\` text NOT NULL, \`description\` text NOT NULL, \`status\` text DEFAULT 'draft', \`championship_id\` text, \`project_name\` text, \`communication_language\` text, \`time_zone\` text, \`working_format\` text, \`open_positions\` numeric DEFAULT 1, \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE cascade);`);
  for (const table of ['team_posts_required_skills', 'team_posts_own_skills', 'team_posts_interests']) {
    await db.run(sql.raw(`CREATE TABLE IF NOT EXISTS ${quoteIdent(table)} (\`_order\` integer NOT NULL, \`_parent_id\` integer NOT NULL, \`id\` text PRIMARY KEY NOT NULL, \`value\` text NOT NULL, FOREIGN KEY (\`_parent_id\`) REFERENCES \`team_posts\`(\`id\`) ON DELETE cascade);`));
  }
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`team_responses\` (\`id\` integer PRIMARY KEY NOT NULL, \`post_id\` integer NOT NULL, \`sender_id\` integer NOT NULL, \`recipient_id\` integer NOT NULL, \`kind\` text DEFAULT 'response', \`message\` text NOT NULL, \`status\` text DEFAULT 'pending', \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL);`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`application_status_history\` (\`id\` integer PRIMARY KEY NOT NULL, \`application_id\` integer NOT NULL, \`user_id\` integer NOT NULL, \`actor_id\` integer, \`previous_status\` text, \`status\` text NOT NULL, \`comment\` text, \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL);`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`favorites\` (\`id\` integer PRIMARY KEY NOT NULL, \`user_id\` integer NOT NULL, \`item_type\` text NOT NULL, \`item_id\` text NOT NULL, \`item_title\` text NOT NULL, \`href\` text NOT NULL, \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL);`);
  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS \`favorites_unique_user_item_idx\` ON \`favorites\` (\`user_id\`, \`item_type\`, \`item_id\`);`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`notifications\` (\`id\` integer PRIMARY KEY NOT NULL, \`user_id\` integer NOT NULL, \`type\` text NOT NULL, \`related_type\` text, \`related_id\` text, \`href\` text, \`data\` text, \`read_at\` text, \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL);`);

  for (const column of ['events_id', 'opportunities_id', 'team_posts_id', 'team_responses_id', 'application_status_history_id', 'favorites_id', 'notifications_id']) {
    await addColumnIfMissing(db, 'payload_locked_documents_rels', column, 'integer');
  }

  await assertRowsPreserved(db, protectedCounts);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of [
    'notifications',
    'favorites',
    'application_status_history',
    'team_responses',
    'team_posts_interests',
    'team_posts_own_skills',
    'team_posts_required_skills',
    'team_posts',
    'opportunities_documents',
    'opportunities_benefits',
    'opportunities_requirements',
    'opportunities_languages',
    'opportunities',
    'events_materials',
    'events_languages',
    'events',
    'users_social_links',
    'users_languages',
    'users_skills',
    'users_interests',
  ]) {
    await db.run(sql.raw(`DROP TABLE IF EXISTS ${quoteIdent(table)};`));
  }
}
