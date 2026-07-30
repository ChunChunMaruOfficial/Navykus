import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

type MigrationDb = MigrateUpArgs['db'];

const quoteIdent = (name: string) => `\`${name.replace(/`/g, "``")}\``;
const quoteValue = (value: string) => `'${value.replace(/'/g, "''")}'`;

const getFirst = async <T extends Record<string, unknown>>(db: MigrationDb, query: string) => {
  const rows = await db.all(sql.raw(query)) as T[];
  return rows[0];
};

const tableExists = async (db: MigrationDb, table: string) => {
  const result = await getFirst<{ name?: string }>(db, `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ${quoteValue(table)} LIMIT 1`);
  return Boolean(result?.name);
};

const columnExists = async (db: MigrationDb, table: string, column: string) => {
  if (!(await tableExists(db, table))) return false;
  const result = await getFirst<{ name?: string }>(db, `SELECT name FROM pragma_table_info(${quoteValue(table)}) WHERE name = ${quoteValue(column)} LIMIT 1`);
  return Boolean(result?.name);
};

const addColumnIfMissing = async (db: MigrationDb, table: string, column: string, definition: string) => {
  if (await columnExists(db, table, column)) return;
  await db.run(sql.raw(`ALTER TABLE ${quoteIdent(table)} ADD ${quoteIdent(column)} ${definition};`));
};

const dropColumnIfExists = async (db: MigrationDb, table: string, column: string) => {
  if (!(await columnExists(db, table, column))) return;
  await db.run(sql.raw(`ALTER TABLE ${quoteIdent(table)} DROP COLUMN ${quoteIdent(column)};`));
};

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing(db, 'tournaments', 'slug', 'text')
  await addColumnIfMissing(db, 'tournaments', 'seo_title', 'text')
  await addColumnIfMissing(db, 'tournaments', 'seo_description', 'text')
  await addColumnIfMissing(db, 'tournaments', '_status', "text DEFAULT 'published'")
  await addColumnIfMissing(db, 'events', '_status', "text DEFAULT 'published'")
  await addColumnIfMissing(db, 'opportunities', '_status', "text DEFAULT 'published'")
  await addColumnIfMissing(db, 'team_members', 'seo_title', 'text')
  await addColumnIfMissing(db, 'team_members', 'seo_description', 'text')
  await addColumnIfMissing(db, 'team_members', '_status', "text DEFAULT 'published'")
  await addColumnIfMissing(db, 'experts', 'original_language', "text DEFAULT 'ru'")
  await addColumnIfMissing(db, 'experts', 'seo_title', 'text')
  await addColumnIfMissing(db, 'experts', 'seo_description', 'text')
  await addColumnIfMissing(db, 'experts', '_status', "text DEFAULT 'published'")
  await addColumnIfMissing(db, 'faqs', 'original_language', "text DEFAULT 'ru'")
  await addColumnIfMissing(db, 'faqs', 'seo_title', 'text')
  await addColumnIfMissing(db, 'faqs', 'seo_description', 'text')
  await addColumnIfMissing(db, 'faqs', '_status', "text DEFAULT 'published'")
  await addColumnIfMissing(db, 'blog_posts', '_status', "text DEFAULT 'published'")
  await addColumnIfMissing(db, 'payload_locked_documents_rels', 'audit_logs_id', 'integer REFERENCES audit_logs(id)')
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_audit_logs_id_idx\` ON \`payload_locked_documents_rels\` (\`audit_logs_id\`);`)

  await db.run(sql`CREATE TABLE IF NOT EXISTS \`_tournaments_v_version_skills\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_tournaments_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_tournaments_v_version_skills_order_idx\` ON \`_tournaments_v_version_skills\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_tournaments_v_version_skills_parent_id_idx\` ON \`_tournaments_v_version_skills\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`_tournaments_v_version_mentors\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_tournaments_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_tournaments_v_version_mentors_order_idx\` ON \`_tournaments_v_version_mentors\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_tournaments_v_version_mentors_parent_id_idx\` ON \`_tournaments_v_version_mentors\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`_tournaments_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_legacy_id\` text,
  	\`version_sort_order\` numeric DEFAULT 0,
  	\`version_is_published\` integer DEFAULT true,
  	\`version_original_language\` text DEFAULT 'ru',
  	\`version_is_featured\` integer DEFAULT false,
  	\`version_title\` text,
  	\`version_slug\` text,
  	\`version_type\` text,
  	\`version_description\` text,
  	\`version_pitch\` text,
  	\`version_date\` text,
  	\`version_registration_deadline\` text,
  	\`version_registration_status\` text DEFAULT 'open',
  	\`version_max_participants\` numeric,
  	\`version_suitable_for\` text,
  	\`version_format\` text,
  	\`version_target_audience\` text,
  	\`version_age_limit\` text,
  	\`version_teams_allowed\` text,
  	\`version_language\` text,
  	\`version_expected_result\` text,
  	\`version_themes_text\` text,
  	\`version_evaluation_criteria_text\` text,
  	\`version_seo_title\` text,
  	\`version_seo_description\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`tournaments\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_tournaments_v_parent_idx\` ON \`_tournaments_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_tournaments_v_version_version_legacy_id_idx\` ON \`_tournaments_v\` (\`version_legacy_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_tournaments_v_version_version_original_language_idx\` ON \`_tournaments_v\` (\`version_original_language\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_tournaments_v_version_version_slug_idx\` ON \`_tournaments_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_tournaments_v_version_version_updated_at_idx\` ON \`_tournaments_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_tournaments_v_version_version_created_at_idx\` ON \`_tournaments_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_tournaments_v_version_version__status_idx\` ON \`_tournaments_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_tournaments_v_created_at_idx\` ON \`_tournaments_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_tournaments_v_updated_at_idx\` ON \`_tournaments_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_tournaments_v_latest_idx\` ON \`_tournaments_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`_experts_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_legacy_id\` text,
  	\`version_sort_order\` numeric DEFAULT 0,
  	\`version_is_published\` integer DEFAULT true,
  	\`version_original_language\` text DEFAULT 'ru',
  	\`version_name\` text,
  	\`version_type\` text DEFAULT 'expert',
  	\`version_role\` text,
  	\`version_expertise\` text,
  	\`version_description\` text,
  	\`version_photo_id\` integer,
  	\`version_tournament_id_id\` integer,
  	\`version_seo_title\` text,
  	\`version_seo_description\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`experts\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_photo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_tournament_id_id\`) REFERENCES \`tournaments\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_experts_v_parent_idx\` ON \`_experts_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_experts_v_version_version_legacy_id_idx\` ON \`_experts_v\` (\`version_legacy_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_experts_v_version_version_original_language_idx\` ON \`_experts_v\` (\`version_original_language\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_experts_v_version_version_photo_idx\` ON \`_experts_v\` (\`version_photo_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_experts_v_version_version_tournament_id_idx\` ON \`_experts_v\` (\`version_tournament_id_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_experts_v_version_version_updated_at_idx\` ON \`_experts_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_experts_v_version_version_created_at_idx\` ON \`_experts_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_experts_v_version_version__status_idx\` ON \`_experts_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_experts_v_created_at_idx\` ON \`_experts_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_experts_v_updated_at_idx\` ON \`_experts_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_experts_v_latest_idx\` ON \`_experts_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`_faqs_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_legacy_id\` text,
  	\`version_sort_order\` numeric DEFAULT 0,
  	\`version_is_published\` integer DEFAULT true,
  	\`version_original_language\` text DEFAULT 'ru',
  	\`version_page\` text,
  	\`version_question\` text,
  	\`version_answer\` text,
  	\`version_seo_title\` text,
  	\`version_seo_description\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`faqs\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_faqs_v_parent_idx\` ON \`_faqs_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_faqs_v_version_version_legacy_id_idx\` ON \`_faqs_v\` (\`version_legacy_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_faqs_v_version_version_original_language_idx\` ON \`_faqs_v\` (\`version_original_language\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_faqs_v_version_version_page_idx\` ON \`_faqs_v\` (\`version_page\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_faqs_v_version_version_updated_at_idx\` ON \`_faqs_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_faqs_v_version_version_created_at_idx\` ON \`_faqs_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_faqs_v_version_version__status_idx\` ON \`_faqs_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_faqs_v_created_at_idx\` ON \`_faqs_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_faqs_v_updated_at_idx\` ON \`_faqs_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_faqs_v_latest_idx\` ON \`_faqs_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`_events_v_version_languages\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_events_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_events_v_version_languages_order_idx\` ON \`_events_v_version_languages\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_events_v_version_languages_parent_id_idx\` ON \`_events_v_version_languages\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`_events_v_version_materials\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_events_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_events_v_version_materials_order_idx\` ON \`_events_v_version_materials\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_events_v_version_materials_parent_id_idx\` ON \`_events_v_version_materials\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`_events_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_legacy_id\` text,
  	\`version_sort_order\` numeric DEFAULT 0,
  	\`version_is_published\` integer DEFAULT true,
  	\`version_original_language\` text DEFAULT 'ru',
  	\`version_title\` text,
  	\`version_slug\` text,
  	\`version_short_description\` text,
  	\`version_full_description\` text,
  	\`version_image_url\` text,
  	\`version_event_type\` text,
  	\`version_event_date\` text,
  	\`version_time_zone\` text DEFAULT 'UTC',
  	\`version_registration_deadline\` text,
  	\`version_participant_limit\` numeric,
  	\`version_format\` text,
  	\`version_country\` text,
  	\`version_venue\` text,
  	\`version_online_link\` text,
  	\`version_speaker\` text,
  	\`version_seo_title\` text,
  	\`version_seo_description\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_events_v_parent_idx\` ON \`_events_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_events_v_version_version_legacy_id_idx\` ON \`_events_v\` (\`version_legacy_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_events_v_version_version_original_language_idx\` ON \`_events_v\` (\`version_original_language\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_events_v_version_version_slug_idx\` ON \`_events_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_events_v_version_version_event_type_idx\` ON \`_events_v\` (\`version_event_type\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_events_v_version_version_event_date_idx\` ON \`_events_v\` (\`version_event_date\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_events_v_version_version_registration_deadline_idx\` ON \`_events_v\` (\`version_registration_deadline\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_events_v_version_version_format_idx\` ON \`_events_v\` (\`version_format\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_events_v_version_version_country_idx\` ON \`_events_v\` (\`version_country\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_events_v_version_version_updated_at_idx\` ON \`_events_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_events_v_version_version_created_at_idx\` ON \`_events_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_events_v_version_version__status_idx\` ON \`_events_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_events_v_created_at_idx\` ON \`_events_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_events_v_updated_at_idx\` ON \`_events_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_events_v_latest_idx\` ON \`_events_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`_opportunities_v_version_languages\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_opportunities_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_version_languages_order_idx\` ON \`_opportunities_v_version_languages\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_version_languages_parent_id_idx\` ON \`_opportunities_v_version_languages\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`_opportunities_v_version_requirements\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_opportunities_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_version_requirements_order_idx\` ON \`_opportunities_v_version_requirements\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_version_requirements_parent_id_idx\` ON \`_opportunities_v_version_requirements\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`_opportunities_v_version_benefits\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_opportunities_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_version_benefits_order_idx\` ON \`_opportunities_v_version_benefits\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_version_benefits_parent_id_idx\` ON \`_opportunities_v_version_benefits\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`_opportunities_v_version_documents\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_opportunities_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_version_documents_order_idx\` ON \`_opportunities_v_version_documents\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_version_documents_parent_id_idx\` ON \`_opportunities_v_version_documents\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`_opportunities_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_legacy_id\` text,
  	\`version_sort_order\` numeric DEFAULT 0,
  	\`version_is_published\` integer DEFAULT true,
  	\`version_original_language\` text DEFAULT 'ru',
  	\`version_title\` text,
  	\`version_slug\` text,
  	\`version_organization\` text,
  	\`version_opportunity_type\` text,
  	\`version_short_description\` text,
  	\`version_full_description\` text,
  	\`version_logo_url\` text,
  	\`version_country\` text,
  	\`version_format\` text,
  	\`version_age_min\` numeric,
  	\`version_age_max\` numeric,
  	\`version_cost\` text,
  	\`version_funding\` integer DEFAULT false,
  	\`version_deadline\` text,
  	\`version_official_url\` text,
  	\`version_internal_applications_enabled\` integer DEFAULT false,
  	\`version_seo_title\` text,
  	\`version_seo_description\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`opportunities\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_parent_idx\` ON \`_opportunities_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_version_version_legacy_id_idx\` ON \`_opportunities_v\` (\`version_legacy_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_version_version_original_language_idx\` ON \`_opportunities_v\` (\`version_original_language\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_version_version_slug_idx\` ON \`_opportunities_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_version_version_organization_idx\` ON \`_opportunities_v\` (\`version_organization\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_version_version_opportunity_type_idx\` ON \`_opportunities_v\` (\`version_opportunity_type\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_version_version_country_idx\` ON \`_opportunities_v\` (\`version_country\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_version_version_format_idx\` ON \`_opportunities_v\` (\`version_format\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_version_version_funding_idx\` ON \`_opportunities_v\` (\`version_funding\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_version_version_deadline_idx\` ON \`_opportunities_v\` (\`version_deadline\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_version_version_updated_at_idx\` ON \`_opportunities_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_version_version_created_at_idx\` ON \`_opportunities_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_version_version__status_idx\` ON \`_opportunities_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_created_at_idx\` ON \`_opportunities_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_updated_at_idx\` ON \`_opportunities_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_opportunities_v_latest_idx\` ON \`_opportunities_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`_team_members_v_version_interests\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_team_members_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_team_members_v_version_interests_order_idx\` ON \`_team_members_v_version_interests\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_team_members_v_version_interests_parent_id_idx\` ON \`_team_members_v_version_interests\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`_team_members_v_version_skills\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_team_members_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_team_members_v_version_skills_order_idx\` ON \`_team_members_v_version_skills\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_team_members_v_version_skills_parent_id_idx\` ON \`_team_members_v_version_skills\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`_team_members_v_version_target_roles\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_team_members_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_team_members_v_version_target_roles_order_idx\` ON \`_team_members_v_version_target_roles\` (\`order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_team_members_v_version_target_roles_parent_idx\` ON \`_team_members_v_version_target_roles\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`_team_members_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_legacy_id\` text,
  	\`version_sort_order\` numeric DEFAULT 0,
  	\`version_original_language\` text DEFAULT 'ru',
  	\`version_name\` text,
  	\`version_age\` numeric,
  	\`version_country\` text,
  	\`version_city\` text,
  	\`version_short_bio\` text,
  	\`version_target_project\` text,
  	\`version_why_looking\` text,
  	\`version_contact\` text,
  	\`version_contact_type\` text,
  	\`version_moderation_status\` text DEFAULT 'pending',
  	\`version_moderation_comment\` text,
  	\`version_reviewed_at\` text,
  	\`version_is_approved\` integer DEFAULT false,
  	\`version_seo_title\` text,
  	\`version_seo_description\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`team_members\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_team_members_v_parent_idx\` ON \`_team_members_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_team_members_v_version_version_legacy_id_idx\` ON \`_team_members_v\` (\`version_legacy_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_team_members_v_version_version_original_language_idx\` ON \`_team_members_v\` (\`version_original_language\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_team_members_v_version_version_moderation_status_idx\` ON \`_team_members_v\` (\`version_moderation_status\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_team_members_v_version_version_updated_at_idx\` ON \`_team_members_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_team_members_v_version_version_created_at_idx\` ON \`_team_members_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_team_members_v_version_version__status_idx\` ON \`_team_members_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_team_members_v_created_at_idx\` ON \`_team_members_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_team_members_v_updated_at_idx\` ON \`_team_members_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_team_members_v_latest_idx\` ON \`_team_members_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`audit_logs_changed_fields\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`audit_logs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`audit_logs_changed_fields_order_idx\` ON \`audit_logs_changed_fields\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`audit_logs_changed_fields_parent_id_idx\` ON \`audit_logs_changed_fields\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`audit_logs\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`action\` text NOT NULL,
  	\`collection\` text NOT NULL,
  	\`document_id\` text NOT NULL,
  	\`actor_id\` text,
  	\`actor_email\` text,
  	\`summary\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`audit_logs_action_idx\` ON \`audit_logs\` (\`action\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`audit_logs_collection_idx\` ON \`audit_logs\` (\`collection\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`audit_logs_document_id_idx\` ON \`audit_logs\` (\`document_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`audit_logs_actor_id_idx\` ON \`audit_logs\` (\`actor_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`audit_logs_actor_email_idx\` ON \`audit_logs\` (\`actor_email\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`audit_logs_updated_at_idx\` ON \`audit_logs\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`audit_logs_created_at_idx\` ON \`audit_logs\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`content_localizations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`source_collection\` text NOT NULL,
  	\`source_id\` text NOT NULL,
  	\`language\` text NOT NULL,
  	\`localized_data\` text DEFAULT '{}' NOT NULL,
  	\`translation_status\` text DEFAULT 'pending' NOT NULL,
  	\`content_hash\` text,
  	\`error_message\` text,
  	\`generated_at\` text,
  	\`attempts\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`content_localizations_source_collection_idx\` ON \`content_localizations\` (\`source_collection\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`content_localizations_source_id_idx\` ON \`content_localizations\` (\`source_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`content_localizations_language_idx\` ON \`content_localizations\` (\`language\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`content_localizations_translation_status_idx\` ON \`content_localizations\` (\`translation_status\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`content_localizations_content_hash_idx\` ON \`content_localizations\` (\`content_hash\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`content_localizations_updated_at_idx\` ON \`content_localizations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`content_localizations_created_at_idx\` ON \`content_localizations\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`_blog_posts_v_version_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_blog_posts_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_blog_posts_v_version_tags_order_idx\` ON \`_blog_posts_v_version_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_blog_posts_v_version_tags_parent_id_idx\` ON \`_blog_posts_v_version_tags\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`_blog_posts_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_legacy_id\` text,
  	\`version_sort_order\` numeric DEFAULT 0,
  	\`version_title\` text,
  	\`version_excerpt\` text,
  	\`version_content\` text,
  	\`version_cover_id\` integer,
  	\`version_cover_alt\` text,
  	\`version_category\` text,
  	\`version_status\` text DEFAULT 'draft',
  	\`version_author_id\` integer,
  	\`version_original_language\` text DEFAULT 'ru',
  	\`version_slug\` text,
  	\`version_seo_title\` text,
  	\`version_seo_description\` text,
  	\`version_reading_time\` numeric,
  	\`version_views\` numeric DEFAULT 0,
  	\`version_likes\` numeric DEFAULT 0,
  	\`version_published_at\` text,
  	\`version_moderation_comment\` text,
  	\`version_is_approved\` integer DEFAULT false,
  	\`version_is_published\` integer DEFAULT false,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`blog_posts\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_cover_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_author_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_blog_posts_v_parent_idx\` ON \`_blog_posts_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_blog_posts_v_version_version_legacy_id_idx\` ON \`_blog_posts_v\` (\`version_legacy_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_blog_posts_v_version_version_cover_idx\` ON \`_blog_posts_v\` (\`version_cover_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_blog_posts_v_version_version_category_idx\` ON \`_blog_posts_v\` (\`version_category\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_blog_posts_v_version_version_status_idx\` ON \`_blog_posts_v\` (\`version_status\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_blog_posts_v_version_version_author_idx\` ON \`_blog_posts_v\` (\`version_author_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_blog_posts_v_version_version_original_language_idx\` ON \`_blog_posts_v\` (\`version_original_language\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_blog_posts_v_version_version_slug_idx\` ON \`_blog_posts_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_blog_posts_v_version_version_updated_at_idx\` ON \`_blog_posts_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_blog_posts_v_version_version_created_at_idx\` ON \`_blog_posts_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_blog_posts_v_version_version__status_idx\` ON \`_blog_posts_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_blog_posts_v_created_at_idx\` ON \`_blog_posts_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_blog_posts_v_updated_at_idx\` ON \`_blog_posts_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_blog_posts_v_latest_idx\` ON \`_blog_posts_v\` (\`latest\`);`)

}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_tournaments_v_version_skills\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_tournaments_v_version_mentors\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_tournaments_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_experts_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_faqs_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_events_v_version_languages\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_events_v_version_materials\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_events_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_opportunities_v_version_languages\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_opportunities_v_version_requirements\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_opportunities_v_version_benefits\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_opportunities_v_version_documents\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_opportunities_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_team_members_v_version_interests\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_team_members_v_version_skills\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_team_members_v_version_target_roles\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_team_members_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`audit_logs_changed_fields\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`audit_logs\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_blog_posts_v_version_tags\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_blog_posts_v\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_audit_logs_id_idx\`;`)
  await dropColumnIfExists(db, 'payload_locked_documents_rels', 'audit_logs_id')
  await dropColumnIfExists(db, 'blog_posts', '_status')
  await dropColumnIfExists(db, 'faqs', '_status')
  await dropColumnIfExists(db, 'faqs', 'seo_description')
  await dropColumnIfExists(db, 'faqs', 'seo_title')
  await dropColumnIfExists(db, 'faqs', 'original_language')
  await dropColumnIfExists(db, 'experts', '_status')
  await dropColumnIfExists(db, 'experts', 'seo_description')
  await dropColumnIfExists(db, 'experts', 'seo_title')
  await dropColumnIfExists(db, 'experts', 'original_language')
  await dropColumnIfExists(db, 'team_members', '_status')
  await dropColumnIfExists(db, 'team_members', 'seo_description')
  await dropColumnIfExists(db, 'team_members', 'seo_title')
  await dropColumnIfExists(db, 'opportunities', '_status')
  await dropColumnIfExists(db, 'events', '_status')
  await dropColumnIfExists(db, 'tournaments', '_status')
  await dropColumnIfExists(db, 'tournaments', 'seo_description')
  await dropColumnIfExists(db, 'tournaments', 'seo_title')
  await dropColumnIfExists(db, 'tournaments', 'slug')
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
