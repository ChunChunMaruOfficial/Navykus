import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`users_interests\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_interests_order_idx\` ON \`users_interests\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_interests_parent_id_idx\` ON \`users_interests\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users_skills\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_skills_order_idx\` ON \`users_skills\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_skills_parent_id_idx\` ON \`users_skills\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users_languages\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_languages_order_idx\` ON \`users_languages\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_languages_parent_id_idx\` ON \`users_languages\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users_social_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`url\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_social_links_order_idx\` ON \`users_social_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_social_links_parent_id_idx\` ON \`users_social_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`events_languages\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`events_languages_order_idx\` ON \`events_languages\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`events_languages_parent_id_idx\` ON \`events_languages\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`events_materials\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`events_materials_order_idx\` ON \`events_materials\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`events_materials_parent_id_idx\` ON \`events_materials\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`events\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`legacy_id\` text,
  	\`sort_order\` numeric DEFAULT 0,
  	\`is_published\` integer DEFAULT true,
  	\`title\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`short_description\` text NOT NULL,
  	\`full_description\` text,
  	\`image_url\` text,
  	\`event_type\` text NOT NULL,
  	\`event_date\` text NOT NULL,
  	\`time_zone\` text DEFAULT 'UTC',
  	\`registration_deadline\` text,
  	\`participant_limit\` numeric,
  	\`format\` text NOT NULL,
  	\`country\` text,
  	\`venue\` text,
  	\`online_link\` text,
  	\`speaker\` text,
  	\`seo_title\` text,
  	\`seo_description\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`events_legacy_id_idx\` ON \`events\` (\`legacy_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`events_slug_idx\` ON \`events\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`events_event_type_idx\` ON \`events\` (\`event_type\`);`)
  await db.run(sql`CREATE INDEX \`events_event_date_idx\` ON \`events\` (\`event_date\`);`)
  await db.run(sql`CREATE INDEX \`events_registration_deadline_idx\` ON \`events\` (\`registration_deadline\`);`)
  await db.run(sql`CREATE INDEX \`events_format_idx\` ON \`events\` (\`format\`);`)
  await db.run(sql`CREATE INDEX \`events_country_idx\` ON \`events\` (\`country\`);`)
  await db.run(sql`CREATE INDEX \`events_updated_at_idx\` ON \`events\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`events_created_at_idx\` ON \`events\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`opportunities_languages\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`opportunities\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`opportunities_languages_order_idx\` ON \`opportunities_languages\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`opportunities_languages_parent_id_idx\` ON \`opportunities_languages\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`opportunities_requirements\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`opportunities\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`opportunities_requirements_order_idx\` ON \`opportunities_requirements\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`opportunities_requirements_parent_id_idx\` ON \`opportunities_requirements\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`opportunities_benefits\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`opportunities\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`opportunities_benefits_order_idx\` ON \`opportunities_benefits\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`opportunities_benefits_parent_id_idx\` ON \`opportunities_benefits\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`opportunities_documents\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`opportunities\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`opportunities_documents_order_idx\` ON \`opportunities_documents\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`opportunities_documents_parent_id_idx\` ON \`opportunities_documents\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`opportunities\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`legacy_id\` text,
  	\`sort_order\` numeric DEFAULT 0,
  	\`is_published\` integer DEFAULT true,
  	\`title\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`organization\` text NOT NULL,
  	\`opportunity_type\` text NOT NULL,
  	\`short_description\` text NOT NULL,
  	\`full_description\` text,
  	\`logo_url\` text,
  	\`country\` text,
  	\`format\` text,
  	\`age_min\` numeric,
  	\`age_max\` numeric,
  	\`cost\` text,
  	\`funding\` integer DEFAULT false,
  	\`deadline\` text,
  	\`official_url\` text,
  	\`internal_applications_enabled\` integer DEFAULT false,
  	\`seo_title\` text,
  	\`seo_description\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`opportunities_legacy_id_idx\` ON \`opportunities\` (\`legacy_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`opportunities_slug_idx\` ON \`opportunities\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`opportunities_organization_idx\` ON \`opportunities\` (\`organization\`);`)
  await db.run(sql`CREATE INDEX \`opportunities_opportunity_type_idx\` ON \`opportunities\` (\`opportunity_type\`);`)
  await db.run(sql`CREATE INDEX \`opportunities_country_idx\` ON \`opportunities\` (\`country\`);`)
  await db.run(sql`CREATE INDEX \`opportunities_format_idx\` ON \`opportunities\` (\`format\`);`)
  await db.run(sql`CREATE INDEX \`opportunities_funding_idx\` ON \`opportunities\` (\`funding\`);`)
  await db.run(sql`CREATE INDEX \`opportunities_deadline_idx\` ON \`opportunities\` (\`deadline\`);`)
  await db.run(sql`CREATE INDEX \`opportunities_updated_at_idx\` ON \`opportunities\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`opportunities_created_at_idx\` ON \`opportunities\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`team_posts_required_skills\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`team_posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`team_posts_required_skills_order_idx\` ON \`team_posts_required_skills\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`team_posts_required_skills_parent_id_idx\` ON \`team_posts_required_skills\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`team_posts_own_skills\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`team_posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`team_posts_own_skills_order_idx\` ON \`team_posts_own_skills\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`team_posts_own_skills_parent_id_idx\` ON \`team_posts_own_skills\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`team_posts_interests\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`team_posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`team_posts_interests_order_idx\` ON \`team_posts_interests\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`team_posts_interests_parent_id_idx\` ON \`team_posts_interests\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`team_posts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`title\` text NOT NULL,
  	\`description\` text NOT NULL,
  	\`status\` text DEFAULT 'draft',
  	\`championship_id\` text,
  	\`project_name\` text,
  	\`communication_language\` text,
  	\`time_zone\` text,
  	\`working_format\` text,
  	\`open_positions\` numeric DEFAULT 1,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`team_posts_user_idx\` ON \`team_posts\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`team_posts_status_idx\` ON \`team_posts\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`team_posts_updated_at_idx\` ON \`team_posts\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`team_posts_created_at_idx\` ON \`team_posts\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`team_responses\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`post_id\` integer NOT NULL,
  	\`sender_id\` integer NOT NULL,
  	\`recipient_id\` integer NOT NULL,
  	\`kind\` text DEFAULT 'response',
  	\`message\` text NOT NULL,
  	\`status\` text DEFAULT 'pending',
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`post_id\`) REFERENCES \`team_posts\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`sender_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`recipient_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`team_responses_post_idx\` ON \`team_responses\` (\`post_id\`);`)
  await db.run(sql`CREATE INDEX \`team_responses_sender_idx\` ON \`team_responses\` (\`sender_id\`);`)
  await db.run(sql`CREATE INDEX \`team_responses_recipient_idx\` ON \`team_responses\` (\`recipient_id\`);`)
  await db.run(sql`CREATE INDEX \`team_responses_kind_idx\` ON \`team_responses\` (\`kind\`);`)
  await db.run(sql`CREATE INDEX \`team_responses_status_idx\` ON \`team_responses\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`team_responses_updated_at_idx\` ON \`team_responses\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`team_responses_created_at_idx\` ON \`team_responses\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`scenarios\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`legacy_id\` text,
  	\`sort_order\` numeric DEFAULT 0,
  	\`is_published\` integer DEFAULT true,
  	\`title\` text NOT NULL,
  	\`who\` text NOT NULL,
  	\`why\` text NOT NULL,
  	\`cta_text\` text NOT NULL,
  	\`action_type\` text DEFAULT 'general' NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`scenarios_legacy_id_idx\` ON \`scenarios\` (\`legacy_id\`);`)
  await db.run(sql`CREATE INDEX \`scenarios_updated_at_idx\` ON \`scenarios\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`scenarios_created_at_idx\` ON \`scenarios\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`application_status_history\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`application_id\` integer NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`actor_id\` integer,
  	\`previous_status\` text,
  	\`status\` text NOT NULL,
  	\`comment\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`application_id\`) REFERENCES \`applications\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`actor_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`application_status_history_application_idx\` ON \`application_status_history\` (\`application_id\`);`)
  await db.run(sql`CREATE INDEX \`application_status_history_user_idx\` ON \`application_status_history\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`application_status_history_actor_idx\` ON \`application_status_history\` (\`actor_id\`);`)
  await db.run(sql`CREATE INDEX \`application_status_history_updated_at_idx\` ON \`application_status_history\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`application_status_history_created_at_idx\` ON \`application_status_history\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`favorites\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`item_type\` text NOT NULL,
  	\`item_id\` text NOT NULL,
  	\`item_title\` text NOT NULL,
  	\`href\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`favorites_user_idx\` ON \`favorites\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`favorites_item_type_idx\` ON \`favorites\` (\`item_type\`);`)
  await db.run(sql`CREATE INDEX \`favorites_item_id_idx\` ON \`favorites\` (\`item_id\`);`)
  await db.run(sql`CREATE INDEX \`favorites_updated_at_idx\` ON \`favorites\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`favorites_created_at_idx\` ON \`favorites\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`notifications\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`user_id\` integer NOT NULL,
  	\`type\` text NOT NULL,
  	\`related_type\` text,
  	\`related_id\` text,
  	\`href\` text,
  	\`data\` text,
  	\`read_at\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`notifications_user_idx\` ON \`notifications\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`notifications_type_idx\` ON \`notifications\` (\`type\`);`)
  await db.run(sql`CREATE INDEX \`notifications_read_at_idx\` ON \`notifications\` (\`read_at\`);`)
  await db.run(sql`CREATE INDEX \`notifications_updated_at_idx\` ON \`notifications\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`notifications_created_at_idx\` ON \`notifications\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`contact_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text DEFAULT 'Site Contacts' NOT NULL,
  	\`email\` text DEFAULT 'info@navykus.org',
  	\`phone\` text DEFAULT '+7 (999) 000-00-00',
  	\`telegram\` text DEFAULT '@navykus_com',
  	\`address\` text DEFAULT '',
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`contact_settings_updated_at_idx\` ON \`contact_settings\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`contact_settings_created_at_idx\` ON \`contact_settings\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`blog_posts_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`blog_posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`blog_posts_tags_order_idx\` ON \`blog_posts_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`blog_posts_tags_parent_id_idx\` ON \`blog_posts_tags\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`blog_posts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`legacy_id\` text,
  	\`sort_order\` numeric DEFAULT 0,
  	\`title\` text NOT NULL,
  	\`excerpt\` text NOT NULL,
  	\`content\` text NOT NULL,
  	\`cover_id\` integer,
  	\`cover_alt\` text,
  	\`category\` text NOT NULL,
  	\`status\` text DEFAULT 'draft' NOT NULL,
  	\`author_id\` integer NOT NULL,
  	\`original_language\` text DEFAULT 'ru' NOT NULL,
  	\`slug\` text NOT NULL,
  	\`seo_title\` text,
  	\`seo_description\` text,
  	\`reading_time\` numeric,
  	\`views\` numeric DEFAULT 0,
  	\`likes\` numeric DEFAULT 0,
  	\`published_at\` text,
  	\`moderation_comment\` text,
  	\`is_approved\` integer DEFAULT false,
  	\`is_published\` integer DEFAULT false,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`cover_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`blog_posts_legacy_id_idx\` ON \`blog_posts\` (\`legacy_id\`);`)
  await db.run(sql`CREATE INDEX \`blog_posts_cover_idx\` ON \`blog_posts\` (\`cover_id\`);`)
  await db.run(sql`CREATE INDEX \`blog_posts_category_idx\` ON \`blog_posts\` (\`category\`);`)
  await db.run(sql`CREATE INDEX \`blog_posts_status_idx\` ON \`blog_posts\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`blog_posts_author_idx\` ON \`blog_posts\` (\`author_id\`);`)
  await db.run(sql`CREATE INDEX \`blog_posts_original_language_idx\` ON \`blog_posts\` (\`original_language\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`blog_posts_slug_idx\` ON \`blog_posts\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`blog_posts_updated_at_idx\` ON \`blog_posts\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`blog_posts_created_at_idx\` ON \`blog_posts\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`blog_post_localizations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`post_id\` integer NOT NULL,
  	\`language\` text NOT NULL,
  	\`title\` text NOT NULL,
  	\`excerpt\` text NOT NULL,
  	\`content\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`cover_alt\` text,
  	\`seo_title\` text,
  	\`seo_description\` text,
  	\`translation_status\` text DEFAULT 'pending' NOT NULL,
  	\`error_message\` text,
  	\`generated_at\` text,
  	\`attempts\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`post_id\`) REFERENCES \`blog_posts\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`blog_post_localizations_post_idx\` ON \`blog_post_localizations\` (\`post_id\`);`)
  await db.run(sql`CREATE INDEX \`blog_post_localizations_language_idx\` ON \`blog_post_localizations\` (\`language\`);`)
  await db.run(sql`CREATE INDEX \`blog_post_localizations_slug_idx\` ON \`blog_post_localizations\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`blog_post_localizations_translation_status_idx\` ON \`blog_post_localizations\` (\`translation_status\`);`)
  await db.run(sql`CREATE INDEX \`blog_post_localizations_updated_at_idx\` ON \`blog_post_localizations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`blog_post_localizations_created_at_idx\` ON \`blog_post_localizations\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`blog_moderation_history\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`post_id\` integer NOT NULL,
  	\`author_id\` integer,
  	\`actor_id\` integer,
  	\`previous_status\` text,
  	\`status\` text NOT NULL,
  	\`comment\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`post_id\`) REFERENCES \`blog_posts\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`actor_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`blog_moderation_history_post_idx\` ON \`blog_moderation_history\` (\`post_id\`);`)
  await db.run(sql`CREATE INDEX \`blog_moderation_history_author_idx\` ON \`blog_moderation_history\` (\`author_id\`);`)
  await db.run(sql`CREATE INDEX \`blog_moderation_history_actor_idx\` ON \`blog_moderation_history\` (\`actor_id\`);`)
  await db.run(sql`CREATE INDEX \`blog_moderation_history_updated_at_idx\` ON \`blog_moderation_history\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`blog_moderation_history_created_at_idx\` ON \`blog_moderation_history\` (\`created_at\`);`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_applications\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`ticket_id\` text NOT NULL,
  	\`user_id\` integer,
  	\`item_type\` text DEFAULT 'championship',
  	\`item_id\` text,
  	\`item_title\` text,
  	\`status\` text DEFAULT 'draft' NOT NULL,
  	\`name\` text NOT NULL,
  	\`email\` text NOT NULL,
  	\`grade\` text,
  	\`age\` text,
  	\`city\` text,
  	\`contact\` text,
  	\`interest\` text,
  	\`tournament_id\` text,
  	\`has_team\` text,
  	\`team_size\` text,
  	\`portfolio_link\` text,
  	\`cover_letter\` text,
  	\`custom_answers\` text,
  	\`admin_comment\` text,
  	\`internal_notes\` text,
  	\`submitted_at\` text,
  	\`cancelled_at\` text,
  	\`source\` text DEFAULT 'modal',
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_applications\`("id", "ticket_id", "user_id", "item_type", "item_id", "item_title", "status", "name", "email", "grade", "age", "city", "contact", "interest", "tournament_id", "has_team", "team_size", "portfolio_link", "cover_letter", "custom_answers", "admin_comment", "internal_notes", "submitted_at", "cancelled_at", "source", "updated_at", "created_at") SELECT "id", "ticket_id", "user_id", "item_type", "item_id", "item_title", "status", "name", "email", "grade", "age", "city", "contact", "interest", "tournament_id", "has_team", "team_size", "portfolio_link", "cover_letter", "custom_answers", "admin_comment", "internal_notes", "submitted_at", "cancelled_at", "source", "updated_at", "created_at" FROM \`applications\`;`)
  await db.run(sql`DROP TABLE \`applications\`;`)
  await db.run(sql`ALTER TABLE \`__new_applications\` RENAME TO \`applications\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`applications_ticket_id_idx\` ON \`applications\` (\`ticket_id\`);`)
  await db.run(sql`CREATE INDEX \`applications_user_idx\` ON \`applications\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`applications_item_type_idx\` ON \`applications\` (\`item_type\`);`)
  await db.run(sql`CREATE INDEX \`applications_item_id_idx\` ON \`applications\` (\`item_id\`);`)
  await db.run(sql`CREATE INDEX \`applications_status_idx\` ON \`applications\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`applications_updated_at_idx\` ON \`applications\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`applications_created_at_idx\` ON \`applications\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`first_name\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`last_name\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`avatar_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`avatar_url\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`avatar_alt\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`avatar_position_x\` numeric DEFAULT 50;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`avatar_position_y\` numeric DEFAULT 50;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`avatar_scale\` numeric DEFAULT 1;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`biography\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`portfolio\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`country\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`city\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`date_of_birth\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`age_group\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`school\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`school_grade\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`preferred_language\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`preferred_language_mode\` text DEFAULT 'auto';`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`team_search_available\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`public_profile\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`privacy_show_city\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`privacy_show_school\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`privacy_show_age\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`privacy_show_email\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`privacy_show_social_links\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`account_status\` text DEFAULT 'active' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`email_verified\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`verification_code\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`verification_code_expires\` text;`)
  await db.run(sql`CREATE INDEX \`users_avatar_idx\` ON \`users\` (\`avatar_id\`);`)
  await db.run(sql`CREATE INDEX \`users_country_idx\` ON \`users\` (\`country\`);`)
  await db.run(sql`CREATE INDEX \`users_city_idx\` ON \`users\` (\`city\`);`)
  await db.run(sql`CREATE INDEX \`users_age_group_idx\` ON \`users\` (\`age_group\`);`)
  await db.run(sql`CREATE INDEX \`users_school_grade_idx\` ON \`users\` (\`school_grade\`);`)
  await db.run(sql`CREATE INDEX \`users_team_search_available_idx\` ON \`users\` (\`team_search_available\`);`)
  await db.run(sql`CREATE INDEX \`users_public_profile_idx\` ON \`users\` (\`public_profile\`);`)
  await db.run(sql`ALTER TABLE \`tournaments\` ADD \`is_featured\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`experts\` ADD \`type\` text DEFAULT 'expert' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`experts\` ADD \`photo_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`experts\` ADD \`tournament_id_id\` integer REFERENCES tournaments(id);`)
  await db.run(sql`CREATE INDEX \`experts_photo_idx\` ON \`experts\` (\`photo_id\`);`)
  await db.run(sql`CREATE INDEX \`experts_tournament_id_idx\` ON \`experts\` (\`tournament_id_id\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`events_id\` integer REFERENCES events(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`opportunities_id\` integer REFERENCES opportunities(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`team_posts_id\` integer REFERENCES team_posts(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`team_responses_id\` integer REFERENCES team_responses(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`scenarios_id\` integer REFERENCES scenarios(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`application_status_history_id\` integer REFERENCES application_status_history(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`favorites_id\` integer REFERENCES favorites(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`notifications_id\` integer REFERENCES notifications(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`contact_settings_id\` integer REFERENCES contact_settings(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`blog_posts_id\` integer REFERENCES blog_posts(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`blog_post_localizations_id\` integer REFERENCES blog_post_localizations(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`blog_moderation_history_id\` integer REFERENCES blog_moderation_history(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_events_id_idx\` ON \`payload_locked_documents_rels\` (\`events_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_opportunities_id_idx\` ON \`payload_locked_documents_rels\` (\`opportunities_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_team_posts_id_idx\` ON \`payload_locked_documents_rels\` (\`team_posts_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_team_responses_id_idx\` ON \`payload_locked_documents_rels\` (\`team_responses_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_scenarios_id_idx\` ON \`payload_locked_documents_rels\` (\`scenarios_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_application_status_history_idx\` ON \`payload_locked_documents_rels\` (\`application_status_history_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_favorites_id_idx\` ON \`payload_locked_documents_rels\` (\`favorites_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_notifications_id_idx\` ON \`payload_locked_documents_rels\` (\`notifications_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_contact_settings_id_idx\` ON \`payload_locked_documents_rels\` (\`contact_settings_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_blog_posts_id_idx\` ON \`payload_locked_documents_rels\` (\`blog_posts_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_blog_post_localizations_id_idx\` ON \`payload_locked_documents_rels\` (\`blog_post_localizations_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_blog_moderation_history_id_idx\` ON \`payload_locked_documents_rels\` (\`blog_moderation_history_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`users_interests\`;`)
  await db.run(sql`DROP TABLE \`users_skills\`;`)
  await db.run(sql`DROP TABLE \`users_languages\`;`)
  await db.run(sql`DROP TABLE \`users_social_links\`;`)
  await db.run(sql`DROP TABLE \`events_languages\`;`)
  await db.run(sql`DROP TABLE \`events_materials\`;`)
  await db.run(sql`DROP TABLE \`events\`;`)
  await db.run(sql`DROP TABLE \`opportunities_languages\`;`)
  await db.run(sql`DROP TABLE \`opportunities_requirements\`;`)
  await db.run(sql`DROP TABLE \`opportunities_benefits\`;`)
  await db.run(sql`DROP TABLE \`opportunities_documents\`;`)
  await db.run(sql`DROP TABLE \`opportunities\`;`)
  await db.run(sql`DROP TABLE \`team_posts_required_skills\`;`)
  await db.run(sql`DROP TABLE \`team_posts_own_skills\`;`)
  await db.run(sql`DROP TABLE \`team_posts_interests\`;`)
  await db.run(sql`DROP TABLE \`team_posts\`;`)
  await db.run(sql`DROP TABLE \`team_responses\`;`)
  await db.run(sql`DROP TABLE \`scenarios\`;`)
  await db.run(sql`DROP TABLE \`application_status_history\`;`)
  await db.run(sql`DROP TABLE \`favorites\`;`)
  await db.run(sql`DROP TABLE \`notifications\`;`)
  await db.run(sql`DROP TABLE \`contact_settings\`;`)
  await db.run(sql`DROP TABLE \`blog_posts_tags\`;`)
  await db.run(sql`DROP TABLE \`blog_posts\`;`)
  await db.run(sql`DROP TABLE \`blog_post_localizations\`;`)
  await db.run(sql`DROP TABLE \`blog_moderation_history\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`role\` text DEFAULT 'user' NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`INSERT INTO \`__new_users\`("id", "name", "role", "updated_at", "created_at", "email", "reset_password_token", "reset_password_expiration", "salt", "hash", "login_attempts", "lock_until") SELECT "id", "name", "role", "updated_at", "created_at", "email", "reset_password_token", "reset_password_expiration", "salt", "hash", "login_attempts", "lock_until" FROM \`users\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`ALTER TABLE \`__new_users\` RENAME TO \`users\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`__new_experts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`legacy_id\` text,
  	\`sort_order\` numeric DEFAULT 0,
  	\`is_published\` integer DEFAULT true,
  	\`name\` text NOT NULL,
  	\`role\` text NOT NULL,
  	\`expertise\` text NOT NULL,
  	\`description\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`INSERT INTO \`__new_experts\`("id", "legacy_id", "sort_order", "is_published", "name", "role", "expertise", "description", "updated_at", "created_at") SELECT "id", "legacy_id", "sort_order", "is_published", "name", "role", "expertise", "description", "updated_at", "created_at" FROM \`experts\`;`)
  await db.run(sql`DROP TABLE \`experts\`;`)
  await db.run(sql`ALTER TABLE \`__new_experts\` RENAME TO \`experts\`;`)
  await db.run(sql`CREATE INDEX \`experts_legacy_id_idx\` ON \`experts\` (\`legacy_id\`);`)
  await db.run(sql`CREATE INDEX \`experts_updated_at_idx\` ON \`experts\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`experts_created_at_idx\` ON \`experts\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`__new_applications\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`ticket_id\` text NOT NULL,
  	\`status\` text DEFAULT 'new' NOT NULL,
  	\`name\` text NOT NULL,
  	\`email\` text NOT NULL,
  	\`grade\` text,
  	\`age\` text,
  	\`city\` text,
  	\`contact\` text,
  	\`interest\` text,
  	\`tournament_id\` text,
  	\`has_team\` text,
  	\`team_size\` text,
  	\`portfolio_link\` text,
  	\`cover_letter\` text,
  	\`source\` text DEFAULT 'modal',
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`INSERT INTO \`__new_applications\`("id", "ticket_id", "status", "name", "email", "grade", "age", "city", "contact", "interest", "tournament_id", "has_team", "team_size", "portfolio_link", "cover_letter", "source", "updated_at", "created_at") SELECT "id", "ticket_id", "status", "name", "email", "grade", "age", "city", "contact", "interest", "tournament_id", "has_team", "team_size", "portfolio_link", "cover_letter", "source", "updated_at", "created_at" FROM \`applications\`;`)
  await db.run(sql`DROP TABLE \`applications\`;`)
  await db.run(sql`ALTER TABLE \`__new_applications\` RENAME TO \`applications\`;`)
  await db.run(sql`CREATE INDEX \`applications_ticket_id_idx\` ON \`applications\` (\`ticket_id\`);`)
  await db.run(sql`CREATE INDEX \`applications_updated_at_idx\` ON \`applications\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`applications_created_at_idx\` ON \`applications\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`tournaments_id\` integer,
  	\`activities_id\` integer,
  	\`experts_id\` integer,
  	\`faqs_id\` integer,
  	\`team_members_id\` integer,
  	\`trust_points_id\` integer,
  	\`pillars_id\` integer,
  	\`stats_id\` integer,
  	\`applications_id\` integer,
  	\`community_leads_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tournaments_id\`) REFERENCES \`tournaments\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`activities_id\`) REFERENCES \`activities\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`experts_id\`) REFERENCES \`experts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`faqs_id\`) REFERENCES \`faqs\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`team_members_id\`) REFERENCES \`team_members\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`trust_points_id\`) REFERENCES \`trust_points\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pillars_id\`) REFERENCES \`pillars\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`stats_id\`) REFERENCES \`stats\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`applications_id\`) REFERENCES \`applications\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`community_leads_id\`) REFERENCES \`community_leads\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "tournaments_id", "activities_id", "experts_id", "faqs_id", "team_members_id", "trust_points_id", "pillars_id", "stats_id", "applications_id", "community_leads_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "tournaments_id", "activities_id", "experts_id", "faqs_id", "team_members_id", "trust_points_id", "pillars_id", "stats_id", "applications_id", "community_leads_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_tournaments_id_idx\` ON \`payload_locked_documents_rels\` (\`tournaments_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_activities_id_idx\` ON \`payload_locked_documents_rels\` (\`activities_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_experts_id_idx\` ON \`payload_locked_documents_rels\` (\`experts_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_faqs_id_idx\` ON \`payload_locked_documents_rels\` (\`faqs_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_team_members_id_idx\` ON \`payload_locked_documents_rels\` (\`team_members_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_trust_points_id_idx\` ON \`payload_locked_documents_rels\` (\`trust_points_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pillars_id_idx\` ON \`payload_locked_documents_rels\` (\`pillars_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_stats_id_idx\` ON \`payload_locked_documents_rels\` (\`stats_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_applications_id_idx\` ON \`payload_locked_documents_rels\` (\`applications_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_community_leads_id_idx\` ON \`payload_locked_documents_rels\` (\`community_leads_id\`);`)
  await db.run(sql`ALTER TABLE \`tournaments\` DROP COLUMN \`is_featured\`;`)
}
