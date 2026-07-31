import { getPayload } from 'payload';
import { createClient } from '@libsql/client';

import config from '../src/payload.config';

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>;

let payloadPromise: Promise<PayloadInstance> | undefined;

let schemaClient: ReturnType<typeof createClient> | undefined;

const getSchemaClient = () => {
  if (!schemaClient) {
    schemaClient = createClient({ url: process.env.DATABASE_URL || 'file:./payload.db' });
  }
  return schemaClient;
};

const getFirst = async <T extends Record<string, unknown>>(query: string, args: Array<string | number | null> = []) => {
  const result = await getSchemaClient().execute({ sql: query, args });
  return result.rows[0] as unknown as T | undefined;
};

const ensureColumn = async (table: string, column: string, definition: string) => {
  const tableRow = await getFirst<{ name?: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
    [table],
  );
  if (!tableRow?.name) return;

  const columnRow = await getFirst<{ name?: string }>(
    `SELECT name FROM pragma_table_info('${table.replace(/'/g, "''")}') WHERE name = ? LIMIT 1`,
    [column],
  );
  if (columnRow?.name) return;

  await getSchemaClient().execute(`ALTER TABLE \`${table.replace(/`/g, '``')}\` ADD \`${column.replace(/`/g, '``')}\` ${definition};`);
};

const executeSafe = async (query: string) => {
  await getSchemaClient().execute(query);
};

const repairEmptyVersionListTable = async (table: string) => {
  const tableRow = await getFirst<{ name?: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
    [table],
  );
  if (!tableRow?.name) return;

  const rowCount = await getFirst<{ count?: number }>(`SELECT COUNT(*) as count FROM \`${table.replace(/`/g, '``')}\``);
  if (Number(rowCount?.count || 0) > 0) return;

  const idColumn = await getFirst<{ type?: string }>(
    `SELECT type FROM pragma_table_info('${table.replace(/'/g, "''")}') WHERE name = 'id' LIMIT 1`,
  );
  if ((idColumn?.type || '').toLowerCase().includes('int')) return;

  await executeSafe(`DROP TABLE \`${table.replace(/`/g, '``')}\`;`);
};

const tableName = (table: string) => `\`${table.replace(/`/g, '``')}\``;

const hasTable = async (table: string) => Boolean((await getFirst<{ name?: string }>(
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
  [table],
))?.name);

const reconcileDraftPublishedColumns = async (table: string) => {
  if (!(await hasTable(table))) return;
  const escaped = tableName(table);
  await executeSafe(`UPDATE ${escaped} SET is_published = 0 WHERE _status = 'draft';`);
  await executeSafe(`UPDATE ${escaped} SET _status = 'draft' WHERE is_published = 0;`);
  await executeSafe(`UPDATE ${escaped} SET _status = 'published' WHERE is_published = 1 AND (_status IS NULL OR _status = '');`);
  await executeSafe(`UPDATE ${escaped} SET is_published = 1 WHERE _status = 'published' AND is_published IS NULL;`);
};

const reconcileTeamMemberPublicationColumns = async () => {
  if (!(await hasTable('team_members'))) return;
  // moderation_status is the single source of truth. The old order derived
  // is_approved from _status first, which silently UN-approved members that were
  // approved but still _status='draft' (a state the sync hook could produce), and
  // never published approved members stuck at _status='draft'. Now approval
  // always yields published and everything else is draft + not approved.
  await executeSafe("UPDATE team_members SET is_approved = 0, _status = 'draft' WHERE moderation_status IS NULL OR moderation_status <> 'approved';");
  await executeSafe("UPDATE team_members SET is_approved = 1, _status = 'published' WHERE moderation_status = 'approved';");
};

const reconcileBlogPublicationColumns = async () => {
  if (!(await hasTable('blog_posts'))) return;
  await executeSafe("UPDATE blog_posts SET status = 'draft' WHERE _status = 'draft' AND status = 'published';");
  await executeSafe("UPDATE blog_posts SET _status = 'draft' WHERE status <> 'published' OR is_published = 0;");
  await executeSafe("UPDATE blog_posts SET is_published = 0 WHERE status <> 'published' OR _status = 'draft';");
  await executeSafe("UPDATE blog_posts SET is_approved = CASE WHEN status IN ('approved', 'published') THEN 1 ELSE 0 END;");
  await executeSafe("UPDATE blog_posts SET _status = 'published', is_published = 1, is_approved = 1 WHERE status = 'published' AND (_status IS NULL OR _status = '' OR _status = 'published');");
};

const ensureDevelopmentSchema = async () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, run schema push once to add new columns
  }

  await ensureColumn('users', 'avatar_id', 'text');
  await ensureColumn('users', 'avatar_url', 'text');
  await ensureColumn('users', 'avatar_alt', 'text');
  await ensureColumn('users', 'avatar_position_x', 'numeric DEFAULT 50');
  await ensureColumn('users', 'avatar_position_y', 'numeric DEFAULT 50');
  await ensureColumn('users', 'avatar_scale', 'numeric DEFAULT 1');
  await ensureColumn('users', 'email_verified', 'boolean DEFAULT FALSE');
  await ensureColumn('users', 'verification_code', 'text');
  await ensureColumn('users', 'verification_code_expires', 'text');
  await ensureColumn('users', 'first_name', 'text');
  await ensureColumn('users', 'last_name', 'text');
  await ensureColumn('users', 'date_of_birth', 'text');
  await ensureColumn('users', 'age_group', 'text');
  await ensureColumn('users', 'school', 'text');
  await ensureColumn('users', 'school_grade', 'text');
  await ensureColumn('users', 'preferred_language', 'text');
  await ensureColumn('users', 'preferred_language_mode', 'text');
  await ensureColumn('users', 'team_search_available', 'boolean DEFAULT FALSE');
  await ensureColumn('users', 'public_profile', 'boolean DEFAULT FALSE');
  await ensureColumn('users', 'privacy_show_city', 'boolean DEFAULT FALSE');
  await ensureColumn('users', 'privacy_show_school', 'boolean DEFAULT FALSE');
  await ensureColumn('users', 'privacy_show_age', 'boolean DEFAULT FALSE');
  await ensureColumn('users', 'privacy_show_email', 'boolean DEFAULT FALSE');
  await ensureColumn('users', 'privacy_show_social_links', 'boolean DEFAULT FALSE');
  await ensureColumn('users', 'account_status', 'text');
  await ensureColumn('users', 'biography', 'text');
  await ensureColumn('users', 'portfolio', 'text');
  await ensureColumn('users', 'country', 'text');
  await ensureColumn('users', 'city', 'text');

  await executeSafe(`CREATE TABLE IF NOT EXISTS experts (
    id integer PRIMARY KEY NOT NULL,
    legacy_id text,
    sort_order numeric DEFAULT 0,
    is_published integer DEFAULT true,
    name text NOT NULL,
    type text DEFAULT 'expert' NOT NULL,
    role text NOT NULL,
    expertise text NOT NULL,
    description text NOT NULL,
    photo_id integer REFERENCES media(id),
    tournament_id_id integer REFERENCES tournaments(id),
    updated_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    created_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );`);
  await ensureColumn('experts', 'type', "text DEFAULT 'expert' NOT NULL");
  await ensureColumn('experts', 'photo_id', 'integer REFERENCES media(id)');
  await ensureColumn('experts', 'tournament_id_id', 'integer REFERENCES tournaments(id)');
  await executeSafe('CREATE INDEX IF NOT EXISTS experts_legacy_id_idx ON experts (legacy_id);');
  await executeSafe('CREATE INDEX IF NOT EXISTS experts_photo_idx ON experts (photo_id);');
  await executeSafe('CREATE INDEX IF NOT EXISTS experts_tournament_id_idx ON experts (tournament_id_id);');
  await executeSafe('CREATE INDEX IF NOT EXISTS experts_updated_at_idx ON experts (updated_at);');
  await executeSafe('CREATE INDEX IF NOT EXISTS experts_created_at_idx ON experts (created_at);');

  await executeSafe(`CREATE TABLE IF NOT EXISTS scenarios (
    id integer PRIMARY KEY NOT NULL,
    legacy_id text,
    sort_order numeric DEFAULT 0,
    is_published integer DEFAULT true,
    title text NOT NULL,
    who text NOT NULL,
    why text NOT NULL,
    cta_text text NOT NULL,
    action_type text DEFAULT 'general' NOT NULL,
    updated_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    created_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );`);
  await ensureColumn('scenarios', 'legacy_id', 'text');
  await ensureColumn('scenarios', 'sort_order', 'numeric DEFAULT 0');
  await ensureColumn('scenarios', 'is_published', 'integer DEFAULT true');
  await ensureColumn('scenarios', 'title', "text DEFAULT '' NOT NULL");
  await ensureColumn('scenarios', 'who', "text DEFAULT '' NOT NULL");
  await ensureColumn('scenarios', 'why', "text DEFAULT '' NOT NULL");
  await ensureColumn('scenarios', 'cta_text', "text DEFAULT '' NOT NULL");
  await ensureColumn('scenarios', 'action_type', "text DEFAULT 'general' NOT NULL");
  await ensureColumn('scenarios', 'updated_at', "text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL");
  await ensureColumn('scenarios', 'created_at', "text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL");
  await executeSafe('CREATE INDEX IF NOT EXISTS scenarios_legacy_id_idx ON scenarios (legacy_id);');
  await executeSafe('CREATE INDEX IF NOT EXISTS scenarios_updated_at_idx ON scenarios (updated_at);');
  await executeSafe('CREATE INDEX IF NOT EXISTS scenarios_created_at_idx ON scenarios (created_at);');

  await ensureColumn('tournaments', 'pitch', 'text');
  await ensureColumn('tournaments', 'registration_status', "text DEFAULT 'open'");
  await ensureColumn('tournaments', 'target_audience', 'text');
  await ensureColumn('tournaments', 'age_limit', 'text');
  await ensureColumn('tournaments', 'teams_allowed', 'text');
  await ensureColumn('tournaments', 'language', 'text');
  await ensureColumn('tournaments', 'expected_result', 'text');
  await ensureColumn('tournaments', 'themes_text', 'text');
  await ensureColumn('tournaments', 'evaluation_criteria_text', 'text');
  await ensureColumn('tournaments', 'original_language', "text DEFAULT 'ru'");
  await ensureColumn('tournaments', 'slug', 'text');
  // Конфиг/схема требуют unique slug для tournaments, но в существующей БД индекса не было.
  // Защита: при дубликатах slug (например, в проде) создание unique-индекса уронило бы
  // getPayloadClient() на старте — поэтому сначала проверяем и при дубликатах пропускаем.
  const duplicateSlugs = await getFirst<{ c?: number }>(
    "SELECT COUNT(*) as c FROM (SELECT slug FROM tournaments WHERE slug IS NOT NULL AND slug <> '' GROUP BY slug HAVING COUNT(*) > 1)",
  );
  if (Number(duplicateSlugs?.c || 0) === 0) {
    await executeSafe('CREATE UNIQUE INDEX IF NOT EXISTS tournaments_slug_idx ON tournaments (slug);');
  } else {
    console.warn(`[ensureDevelopmentSchema] tournaments: найдены дубликаты slug (${duplicateSlugs?.c}) — unique-индекс не создан`);
  }
  await ensureColumn('tournaments', 'seo_title', 'text');
  await ensureColumn('tournaments', 'seo_description', 'text');
  await ensureColumn('tournaments', '_status', "text DEFAULT 'published'");
  await ensureColumn('events', 'original_language', "text DEFAULT 'ru'");
  await ensureColumn('events', '_status', "text DEFAULT 'published'");
  await ensureColumn('opportunities', 'original_language', "text DEFAULT 'ru'");
  await ensureColumn('opportunities', '_status', "text DEFAULT 'published'");
  await ensureColumn('opportunities', 'source', "text DEFAULT 'verified'");
  await ensureColumn('opportunities', 'category', 'text');
  await ensureColumn('opportunities', 'direction', "text DEFAULT 'social'");
  await ensureColumn('opportunities', 'participation', "text DEFAULT 'both'");
  await ensureColumn('opportunities', 'city', 'text');
  await ensureColumn('opportunities', 'image_url', 'text');
  await ensureColumn('opportunities', 'start_date', 'text');
  await ensureColumn('opportunities', 'final_deadline', 'integer DEFAULT false');
  await ensureColumn('opportunities', 'registration_open', 'integer DEFAULT true');
  await ensureColumn('opportunities', 'seats', 'numeric DEFAULT 0');
  await ensureColumn('opportunities', 'saved_count', 'numeric DEFAULT 0');
  await ensureColumn('opportunities', 'editor_pick', 'integer DEFAULT false');
  await ensureColumn('opportunities', 'recommended', 'integer DEFAULT false');
  await ensureColumn('opportunities', 'portfolio_value', 'numeric DEFAULT 0');
  await ensureColumn('opportunities', 'published_at', 'text');
  for (const table of ['opportunities_skills', 'opportunities_keywords', 'opportunities_grades']) {
    await executeSafe(`CREATE TABLE IF NOT EXISTS ${table} (
      _order integer NOT NULL,
      _parent_id integer NOT NULL,
      id text PRIMARY KEY NOT NULL,
      value text NOT NULL,
      FOREIGN KEY (_parent_id) REFERENCES opportunities(id) ON DELETE cascade
    );`);
    await executeSafe(`CREATE INDEX IF NOT EXISTS ${table}_order_idx ON ${table} (_order);`);
    await executeSafe(`CREATE INDEX IF NOT EXISTS ${table}_parent_id_idx ON ${table} (_parent_id);`);
  }
  const opportunityVersionColumns = [
    ['version_source', "text DEFAULT 'verified'"],
    ['version_category', 'text'],
    ['version_direction', "text DEFAULT 'social'"],
    ['version_participation', "text DEFAULT 'both'"],
    ['version_city', 'text'],
    ['version_image_url', 'text'],
    ['version_start_date', 'text'],
    ['version_final_deadline', 'integer DEFAULT false'],
    ['version_registration_open', 'integer DEFAULT true'],
    ['version_seats', 'numeric DEFAULT 0'],
    ['version_saved_count', 'numeric DEFAULT 0'],
    ['version_editor_pick', 'integer DEFAULT false'],
    ['version_recommended', 'integer DEFAULT false'],
    ['version_portfolio_value', 'numeric DEFAULT 0'],
    ['version_published_at', 'text'],
  ] as const;
  for (const [column, definition] of opportunityVersionColumns) {
    await ensureColumn('_opportunities_v', column, definition);
  }
  for (const table of [
    '_opportunities_v_version_languages',
    '_opportunities_v_version_requirements',
    '_opportunities_v_version_benefits',
    '_opportunities_v_version_documents',
    '_opportunities_v_version_skills',
    '_opportunities_v_version_keywords',
    '_opportunities_v_version_grades',
  ]) {
    await repairEmptyVersionListTable(table);
    await executeSafe(`CREATE TABLE IF NOT EXISTS ${table} (
      _order integer NOT NULL,
      _parent_id integer NOT NULL,
      id integer PRIMARY KEY NOT NULL,
      value text,
      _uuid text,
      FOREIGN KEY (_parent_id) REFERENCES _opportunities_v(id) ON DELETE cascade
    );`);
    await ensureColumn(table, '_uuid', 'text');
    await executeSafe(`CREATE INDEX IF NOT EXISTS ${table}_order_idx ON ${table} (_order);`);
    await executeSafe(`CREATE INDEX IF NOT EXISTS ${table}_parent_id_idx ON ${table} (_parent_id);`);
  }
  for (const table of ['activities', 'pillars', 'scenarios', 'stats', 'trust_points']) {
    await ensureColumn(table, 'original_language', "text DEFAULT 'ru'");
    await ensureColumn(table, 'seo_title', 'text');
    await ensureColumn(table, 'seo_description', 'text');
  }
  await ensureColumn('team_members', 'original_language', "text DEFAULT 'ru'");
  await ensureColumn('team_members', 'seo_title', 'text');
  await ensureColumn('team_members', 'seo_description', 'text');
  await ensureColumn('team_members', '_status', "text DEFAULT 'published'");
  await ensureColumn('team_members', 'moderation_status', "text DEFAULT 'pending' NOT NULL");
  await ensureColumn('team_members', 'moderation_comment', 'text');
  await ensureColumn('team_members', 'reviewed_at', 'text');
  await ensureColumn('team_posts', 'original_language', "text DEFAULT 'ru'");
  await ensureColumn('team_responses', 'original_language', "text DEFAULT 'ru'");
  await ensureColumn('experts', 'original_language', "text DEFAULT 'ru'");
  await ensureColumn('experts', 'seo_title', 'text');
  await ensureColumn('experts', 'seo_description', 'text');
  await ensureColumn('experts', '_status', "text DEFAULT 'published'");
  await ensureColumn('faqs', 'original_language', "text DEFAULT 'ru'");
  await ensureColumn('faqs', 'seo_title', 'text');
  await ensureColumn('faqs', 'seo_description', 'text');
  await ensureColumn('faqs', '_status', "text DEFAULT 'published'");
  await ensureColumn('blog_posts', '_status', "text DEFAULT 'published'");
  await executeSafe('CREATE INDEX IF NOT EXISTS team_members_moderation_status_idx ON team_members (moderation_status);');
  await executeSafe("UPDATE team_members SET moderation_status = 'approved' WHERE is_approved = 1 AND (moderation_status IS NULL OR moderation_status = '' OR moderation_status = 'pending');");
  for (const table of ['tournaments', 'events', 'opportunities', 'experts', 'faqs']) {
    await reconcileDraftPublishedColumns(table);
  }
  await reconcileTeamMemberPublicationColumns();
  await reconcileBlogPublicationColumns();
  await executeSafe(`CREATE TABLE IF NOT EXISTS content_localizations (
    id integer PRIMARY KEY NOT NULL,
    source_collection text NOT NULL,
    source_id text NOT NULL,
    language text NOT NULL,
    localized_data text DEFAULT '{}' NOT NULL,
    translation_status text DEFAULT 'pending' NOT NULL,
    content_hash text,
    error_message text,
    generated_at text,
    attempts numeric DEFAULT 0,
    updated_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    created_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );`);
  await executeSafe('CREATE INDEX IF NOT EXISTS content_localizations_source_collection_idx ON content_localizations (source_collection);');
  await executeSafe('CREATE INDEX IF NOT EXISTS content_localizations_source_id_idx ON content_localizations (source_id);');
  await executeSafe('CREATE INDEX IF NOT EXISTS content_localizations_language_idx ON content_localizations (language);');
  await executeSafe('CREATE INDEX IF NOT EXISTS content_localizations_translation_status_idx ON content_localizations (translation_status);');
  await executeSafe('CREATE INDEX IF NOT EXISTS content_localizations_content_hash_idx ON content_localizations (content_hash);');
  await executeSafe('CREATE UNIQUE INDEX IF NOT EXISTS content_localizations_source_language_idx ON content_localizations (source_collection, source_id, language);');
  await executeSafe(`CREATE TABLE IF NOT EXISTS audit_logs (
    id integer PRIMARY KEY NOT NULL,
    action text NOT NULL,
    collection text NOT NULL,
    document_id text NOT NULL,
    actor_id text,
    actor_email text,
    summary text NOT NULL,
    updated_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    created_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );`);
  await executeSafe(`CREATE TABLE IF NOT EXISTS audit_logs_changed_fields (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer PRIMARY KEY NOT NULL,
    value text NOT NULL,
    FOREIGN KEY (_parent_id) REFERENCES audit_logs(id) ON UPDATE no action ON DELETE cascade
  );`);
  await executeSafe('CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs (action);');
  await executeSafe('CREATE INDEX IF NOT EXISTS audit_logs_collection_idx ON audit_logs (collection);');
  await executeSafe('CREATE INDEX IF NOT EXISTS audit_logs_document_id_idx ON audit_logs (document_id);');
  await executeSafe('CREATE INDEX IF NOT EXISTS audit_logs_actor_email_idx ON audit_logs (actor_email);');
  await executeSafe('CREATE INDEX IF NOT EXISTS audit_logs_changed_fields_parent_id_idx ON audit_logs_changed_fields (_parent_id);');
  await ensureColumn('payload_locked_documents_rels', 'audit_logs_id', 'integer REFERENCES audit_logs(id)');
  await executeSafe('CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_audit_logs_id_idx ON payload_locked_documents_rels (audit_logs_id);');
  await executeSafe(`CREATE TABLE IF NOT EXISTS operator_settings (
    id integer PRIMARY KEY NOT NULL,
    label text DEFAULT 'Operator Settings' NOT NULL,
    operator_name text DEFAULT '',
    operator_inn text DEFAULT '',
    operator_ogrn text DEFAULT '',
    operator_address text DEFAULT '',
    operator_registry_number text DEFAULT '',
    operator_registry_date text DEFAULT '',
    contacts_email text DEFAULT 'info@navykus.online',
    contacts_postal_address text DEFAULT '',
    updated_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    created_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );`);
  await executeSafe('CREATE INDEX IF NOT EXISTS operator_settings_updated_at_idx ON operator_settings (updated_at);');
  await executeSafe('CREATE INDEX IF NOT EXISTS operator_settings_created_at_idx ON operator_settings (created_at);');
  await ensureColumn('payload_locked_documents_rels', 'operator_settings_id', 'integer REFERENCES operator_settings(id)');
  await executeSafe('CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_operator_settings_id_idx ON payload_locked_documents_rels (operator_settings_id);');
  await ensureColumn('payload_locked_documents_rels', 'experts_id', 'integer REFERENCES experts(id)');
  await ensureColumn('payload_locked_documents_rels', 'scenarios_id', 'integer REFERENCES scenarios(id)');
  await ensureColumn('payload_locked_documents_rels', 'content_localizations_id', 'integer REFERENCES content_localizations(id)');
  await executeSafe('CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_experts_id_idx ON payload_locked_documents_rels (experts_id);');
  await executeSafe('CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_scenarios_id_idx ON payload_locked_documents_rels (scenarios_id);');
  await executeSafe('CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_content_localizations_id_idx ON payload_locked_documents_rels (content_localizations_id);');
};

export const getPayloadClient = () => {
  if (!payloadPromise) {
    payloadPromise = ensureDevelopmentSchema().then(() => getPayload({ config }));
  }

  return payloadPromise;
};
