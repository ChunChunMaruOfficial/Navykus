import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { getPayload } from 'payload';
import { createClient } from '@libsql/client';

import config from '../src/payload.config';
import {
  ACTIVITY_CATEGORY_VALUES,
  CONTENT_LANGUAGE_VALUES,
  OPPORTUNITY_CATEGORY_VALUES,
  OPPORTUNITY_COST_VALUES,
} from '../src/payload/options';
import { databaseUrl, projectRoot } from '../src/payload/paths';
import { EDITABLE_PAGE_TEXT_PAGES, flattenLocaleText, getEditablePageTextKeys } from '../src/page-texts';
import { PAGE_TEXT_KEY_INFO } from '../src/admin/pageTextBlockMap';

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>;

let payloadPromise: Promise<PayloadInstance> | undefined;

let schemaClient: ReturnType<typeof createClient> | undefined;

const getSchemaClient = () => {
  if (!schemaClient) {
    schemaClient = createClient({ url: databaseUrl });
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

const ensureDevelopmentSchema = async () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, run schema push once to add new columns
  }

  await ensureColumn('users', 'first_name', 'text');
  await ensureColumn('users', 'last_name', 'text');
  await ensureColumn('users', 'account_status', 'text');

  await executeSafe(`CREATE TABLE IF NOT EXISTS experts (
    id integer PRIMARY KEY NOT NULL,
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
  await executeSafe('CREATE INDEX IF NOT EXISTS experts_photo_idx ON experts (photo_id);');
  await executeSafe('CREATE INDEX IF NOT EXISTS experts_tournament_id_idx ON experts (tournament_id_id);');
  await executeSafe('CREATE INDEX IF NOT EXISTS experts_updated_at_idx ON experts (updated_at);');
  await executeSafe('CREATE INDEX IF NOT EXISTS experts_created_at_idx ON experts (created_at);');

  // The `scenarios`, `pillars`, `stats` and `trust_points` tables belong to CMS collections
  // that were removed (their copy now lives in page texts, see migrateLegacyContentToPageTexts).
  // The tables are intentionally left in place as a read-only backup.

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
  // Чемпионат как объект: собственные фото (обложка для главной + фото в шапке).
  await ensureColumn('tournaments', 'cover_image_id', 'integer REFERENCES media(id) ON DELETE set null');
  await ensureColumn('tournaments', 'hero_image_id', 'integer REFERENCES media(id) ON DELETE set null');
  await executeSafe('CREATE INDEX IF NOT EXISTS tournaments_cover_image_idx ON tournaments (cover_image_id);');
  await executeSafe('CREATE INDEX IF NOT EXISTS tournaments_hero_image_idx ON tournaments (hero_image_id);');
  await ensureColumn('_tournaments_v', 'version_cover_image_id', 'integer REFERENCES media(id) ON DELETE set null');
  await ensureColumn('_tournaments_v', 'version_hero_image_id', 'integer REFERENCES media(id) ON DELETE set null');
  await executeSafe('CREATE INDEX IF NOT EXISTS _tournaments_v_version_version_cover_image_idx ON _tournaments_v (version_cover_image_id);');
  await executeSafe('CREATE INDEX IF NOT EXISTS _tournaments_v_version_version_hero_image_idx ON _tournaments_v (version_hero_image_id);');
  // Блок «О чемпионате»: собственный заголовок и фото.
  await ensureColumn('tournaments', 'about_heading', 'text');
  await ensureColumn('tournaments', 'about_image_id', 'integer REFERENCES media(id) ON DELETE set null');
  await executeSafe('CREATE INDEX IF NOT EXISTS tournaments_about_image_idx ON tournaments (about_image_id);');
  await ensureColumn('_tournaments_v', 'version_about_heading', 'text');
  await ensureColumn('_tournaments_v', 'version_about_image_id', 'integer REFERENCES media(id) ON DELETE set null');
  await executeSafe('CREATE INDEX IF NOT EXISTS _tournaments_v_version_version_about_image_idx ON _tournaments_v (version_about_image_id);');
  // Активности и возможности: картинка загружается файлом (раньше — только ссылкой).
  await ensureColumn('events', 'image_id', 'integer REFERENCES media(id) ON DELETE set null');
  await executeSafe('CREATE INDEX IF NOT EXISTS events_image_idx ON events (image_id);');
  await ensureColumn('_events_v', 'version_image_id', 'integer REFERENCES media(id) ON DELETE set null');
  await executeSafe('CREATE INDEX IF NOT EXISTS _events_v_version_version_image_idx ON _events_v (version_image_id);');
  await ensureColumn('opportunities', 'image_id', 'integer REFERENCES media(id) ON DELETE set null');
  await executeSafe('CREATE INDEX IF NOT EXISTS opportunities_image_idx ON opportunities (image_id);');
  await ensureColumn('_opportunities_v', 'version_image_id', 'integer REFERENCES media(id) ON DELETE set null');
  await executeSafe('CREATE INDEX IF NOT EXISTS _opportunities_v_version_version_image_idx ON _opportunities_v (version_image_id);');
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
  for (const table of ['activities']) {
    await ensureColumn(table, 'original_language', "text DEFAULT 'ru'");
    await ensureColumn(table, 'seo_title', 'text');
    await ensureColumn(table, 'seo_description', 'text');
  }
  await ensureColumn('team_members', 'original_language', "text DEFAULT 'ru'");
  await ensureColumn('team_members', 'email', 'text');
  await ensureColumn('team_members', 'portfolio_link', 'text');
  await ensureColumn('team_members', 'source_type', 'text');
  await ensureColumn('team_members', 'source_id', 'text');
  await ensureColumn('team_members', 'source_context', 'text');
  await ensureColumn('team_members', 'tournament_id_id', 'integer REFERENCES tournaments(id)');
  await ensureColumn('team_members', 'seo_title', 'text');
  await ensureColumn('team_members', 'seo_description', 'text');
  await ensureColumn('team_members', '_status', "text DEFAULT 'published'");
  await ensureColumn('team_members', 'moderation_status', "text DEFAULT 'pending' NOT NULL");
  await ensureColumn('team_members', 'moderation_comment', 'text');
  await ensureColumn('team_members', 'reviewed_at', 'text');
  await executeSafe(`CREATE TABLE IF NOT EXISTS team_members_rels (
    id integer PRIMARY KEY,
    \`order\` integer,
    parent_id integer NOT NULL,
    path text NOT NULL,
    media_id integer,
    FOREIGN KEY (parent_id) REFERENCES team_members(id) ON DELETE cascade,
    FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE cascade
  );`);
  await executeSafe('CREATE INDEX IF NOT EXISTS team_members_rels_order_idx ON team_members_rels (`order`);');
  await executeSafe('CREATE INDEX IF NOT EXISTS team_members_rels_parent_idx ON team_members_rels (parent_id);');
  await executeSafe('CREATE INDEX IF NOT EXISTS team_members_rels_path_idx ON team_members_rels (path);');
  await executeSafe('CREATE INDEX IF NOT EXISTS team_members_rels_media_id_idx ON team_members_rels (media_id);');
  // Media: optional page/block grouping metadata (used by the media tree).
  await ensureColumn('media', 'page', 'text');
  await ensureColumn('media', 'block_name', 'text');
  await ensureColumn('media', 'sort_order', 'numeric DEFAULT 0');
  await ensureColumn('media', 'is_published', 'integer DEFAULT true');
  await executeSafe('CREATE INDEX IF NOT EXISTS media_page_idx ON media (page);');
  await executeSafe('CREATE INDEX IF NOT EXISTS media_block_name_idx ON media (block_name);');

  // Page image slots: admin-managed replacements for the site's fixed images.
  await executeSafe(`CREATE TABLE IF NOT EXISTS page_media_slots (
    id integer PRIMARY KEY NOT NULL,
    slot_key text NOT NULL,
    page text,
    block_name text,
    label text,
    image_id integer REFERENCES media(id) ON DELETE set null,
    hidden integer DEFAULT false,
    updated_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    created_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );`);
  await executeSafe('CREATE UNIQUE INDEX IF NOT EXISTS page_media_slots_slot_key_idx ON page_media_slots (slot_key);');
  await executeSafe('CREATE INDEX IF NOT EXISTS page_media_slots_page_idx ON page_media_slots (page);');
  await executeSafe('CREATE INDEX IF NOT EXISTS page_media_slots_block_name_idx ON page_media_slots (block_name);');
  await executeSafe('CREATE INDEX IF NOT EXISTS page_media_slots_image_idx ON page_media_slots (image_id);');
  await executeSafe('CREATE INDEX IF NOT EXISTS page_media_slots_updated_at_idx ON page_media_slots (updated_at);');
  await executeSafe('CREATE INDEX IF NOT EXISTS page_media_slots_created_at_idx ON page_media_slots (created_at);');
  await ensureColumn('payload_locked_documents_rels', 'page_media_slots_id', 'integer REFERENCES page_media_slots(id)');
  await executeSafe('CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_page_media_slots_id_idx ON payload_locked_documents_rels (page_media_slots_id);');

  await ensureColumn('experts', 'original_language', "text DEFAULT 'ru'");
  await ensureColumn('experts', 'seo_title', 'text');
  await ensureColumn('experts', 'seo_description', 'text');
  await ensureColumn('experts', '_status', "text DEFAULT 'published'");
  await ensureColumn('faqs', 'original_language', "text DEFAULT 'ru'");
  await ensureColumn('faqs', 'seo_title', 'text');
  await ensureColumn('faqs', 'seo_description', 'text');
  await ensureColumn('faqs', '_status', "text DEFAULT 'published'");
  await executeSafe('CREATE INDEX IF NOT EXISTS team_members_moderation_status_idx ON team_members (moderation_status);');
  await executeSafe("UPDATE team_members SET moderation_status = 'approved' WHERE is_approved = 1 AND (moderation_status IS NULL OR moderation_status = '' OR moderation_status = 'pending');");
  for (const table of ['tournaments', 'events', 'opportunities', 'experts', 'faqs']) {
    await reconcileDraftPublishedColumns(table);
  }
  await reconcileTeamMemberPublicationColumns();
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
    contacts_email text DEFAULT 'info@navykus.tech',
    contacts_postal_address text DEFAULT '',
    updated_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    created_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );`);
  await executeSafe('CREATE INDEX IF NOT EXISTS operator_settings_updated_at_idx ON operator_settings (updated_at);');
  await executeSafe('CREATE INDEX IF NOT EXISTS operator_settings_created_at_idx ON operator_settings (created_at);');
  await ensureColumn('payload_locked_documents_rels', 'operator_settings_id', 'integer REFERENCES operator_settings(id)');
  await executeSafe('CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_operator_settings_id_idx ON payload_locked_documents_rels (operator_settings_id);');
  await ensureColumn('payload_locked_documents_rels', 'experts_id', 'integer REFERENCES experts(id)');
  await ensureColumn('payload_locked_documents_rels', 'content_localizations_id', 'integer REFERENCES content_localizations(id)');
  await executeSafe('CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_experts_id_idx ON payload_locked_documents_rels (experts_id);');
  await executeSafe('CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_content_localizations_id_idx ON payload_locked_documents_rels (content_localizations_id);');

  await syncCmsTextFixes();
  await migrateLegacyContentToPageTexts();
  await ensurePageTextRows();
  await ensureSingleActiveChampionship();
  await normalizeEventAndOpportunityCodes();
};

/**
 * One-off, idempotent corrections to CMS-stored copy that ships with the codebase.
 * Every write is guarded so a manual edit made by an editor in the admin panel is
 * never overwritten (we only touch rows that still hold the previous seeded value).
 */
const syncCmsTextFixes = async () => {
  const pageTexts = await getFirst<{ name?: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'page_texts' LIMIT 1",
  );
  if (!pageTexts?.name) return;

  const client = getSchemaClient();
  const now = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

  // --- «Жюри и наставники» → «Жюри» -----------------------------------------
  await client.execute({
    sql: `UPDATE page_texts SET value = ?, updated_at = ${now}
          WHERE translation_key = 'ui.app.2060fe9f62' AND value = 'Жюри и наставники кубка'`,
    args: ['Жюри кубка'],
  });
  await client.execute({
    sql: `UPDATE page_texts SET block_name = 'Жюри кубка', updated_at = ${now}
          WHERE block_name = 'Жюри и наставники кубка'`,
  });

  const hasLocalizations = await getFirst<{ name?: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'content_localizations' LIMIT 1",
  );
  if (hasLocalizations?.name) {
    const juryCupByLang: Record<string, [string, string]> = {
      en: ['Cup jury and mentors', 'Cup jury'],
      kk: ['Кубок қазылары мен тәлімгерлері', 'Кубок қазылары'],
      uz: ["Kubok hakamlar hay'ati va mentorlar", "Kubok hakamlar hay'ati"],
      ar: ['لجنة تحكيم الكأس والمرشدون', 'لجنة تحكيم الكأس'],
      de: ['Jury und Mentoren des Cups', 'Jury des Cups'],
      es: ['Jurado y mentores de la copa', 'Jurado de la copa'],
      tr: ['Kupa jürisi ve mentorlar', 'Kupa jürisi'],
    };
    for (const [lang, [oldValue, newValue]] of Object.entries(juryCupByLang)) {
      await client.execute({
        sql: `UPDATE content_localizations
              SET localized_data = json_set(localized_data, '$.value', ?), updated_at = ${now}
              WHERE source_collection = 'page-texts' AND language = ?
                AND source_id IN (SELECT CAST(id AS TEXT) FROM page_texts WHERE translation_key = 'ui.app.2060fe9f62')
                AND json_extract(localized_data, '$.value') = ?`,
        args: [newValue, lang, oldValue],
      });
    }
  }

  // --- Тексты страницы «О проекте», которых не было в дереве «Тексты страниц» -
  const aboutRows: Array<[string, string, string]> = [
    ['ui.aboutprojectpage.faqHeading', 'Часто задаваемые вопросы', 'Часто задаваемые вопросы'],
    ['ui.aboutprojectpage.ctaApply', 'Подать заявку', 'Финальный призыв'],
    ['ui.aboutprojectpage.ctaFindTeam', 'НАЙТИ КОМАНДУ', 'Финальный призыв'],
  ];
  for (const [key, value, blockName] of aboutRows) {
    await client.execute({
      sql: `INSERT INTO page_texts (page, translation_key, label, value, block_name, is_published, sort_order, updated_at, created_at)
            SELECT 'about', ?, ?, ?, ?, 1, 900, ${now}, ${now}
            WHERE NOT EXISTS (SELECT 1 FROM page_texts WHERE translation_key = ?)`,
      args: [key, key.replace(/^ui\./, ''), value, blockName, key],
    });
  }
};

const nowSql = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";
const sqlList = (values: readonly string[]) => values.map((value) => `'${value.replace(/'/g, "''")}'`).join(', ');

/** Runs `run` once per database; the marker lives in a tiny bookkeeping table. */
const runOnce = async (name: string, run: () => Promise<void>) => {
  await executeSafe(`CREATE TABLE IF NOT EXISTS navykus_data_fixes (
    name text PRIMARY KEY NOT NULL,
    applied_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );`);
  const done = await getFirst<{ name?: string }>('SELECT name FROM navykus_data_fixes WHERE name = ? LIMIT 1', [name]);
  if (done?.name) return;
  await run();
  await getSchemaClient().execute({ sql: 'INSERT OR IGNORE INTO navykus_data_fixes (name) VALUES (?)', args: [name] });
};

// Same hash as `contentHash` in src/payload/localization.ts for a page-texts source
// (page texts have no originalLanguage field, so the source language is always 'ru').
const pageTextContentHash = (value: string) =>
  createHash('sha256').update(JSON.stringify({ sourceLanguage: 'ru', content: { value: value.trim() } })).digest('hex');

type LegacyTextMigration = {
  table: string;
  collection: string;
  page: 'home' | 'activities';
  blockName: string;
  limit: number;
  /** [db column, localized-data key, page-text key with {n} for the 1-based position] */
  fields: Array<[string, string, string]>;
};

const LEGACY_TEXT_MIGRATIONS: LegacyTextMigration[] = [
  {
    table: 'pillars', collection: 'pillars', page: 'home', blockName: 'Что такое Навыкус — карточки', limit: 3,
    fields: [['label', 'label', 'ui.app.pillar{n}Label'], ['title', 'title', 'ui.app.pillar{n}Title'], ['description', 'description', 'ui.app.pillar{n}Text']],
  },
  {
    table: 'trust_points', collection: 'trust-points', page: 'home', blockName: 'Блок доверия — карточки', limit: 6,
    fields: [['title', 'title', 'ui.app.trust{n}Title'], ['description', 'description', 'ui.app.trust{n}Text']],
  },
  {
    table: 'stats', collection: 'stats', page: 'home', blockName: 'Цифры и статистика', limit: 1,
    fields: [['value', 'value', 'ui.app.statValue'], ['label', 'label', 'ui.app.statLabel']],
  },
  {
    table: 'scenarios', collection: 'scenarios', page: 'activities', blockName: 'Сценарии участия', limit: 2,
    fields: [['title', 'title', 'ui.activitiespage.scenario{n}Title'], ['who', 'who', 'ui.activitiespage.scenario{n}Text'], ['cta_text', 'ctaText', 'ui.activitiespage.scenario{n}Cta']],
  },
];

/**
 * The «Stats», «Scenarios», «Pillars» and «Trust points» CMS collections were removed; their
 * copy is shown on the site through page texts now («Дерево текстов»). This moves whatever the
 * editors had in those collections — including the ready AI translations — into page texts once,
 * so nothing on the site changes. The legacy tables are kept untouched as a backup.
 */
const migrateLegacyContentToPageTexts = async () => {
  if (!(await hasTable('page_texts'))) return;
  await runOnce('legacy-collections-to-page-texts', async () => {
    const client = getSchemaClient();
    const hasLocalizations = await hasTable('content_localizations');

    for (const migration of LEGACY_TEXT_MIGRATIONS) {
      if (!(await hasTable(migration.table))) continue;
      const rows = (await client.execute(
        `SELECT * FROM ${tableName(migration.table)} WHERE is_published = 1 OR is_published IS NULL ORDER BY sort_order, id LIMIT ${migration.limit}`,
      )).rows as unknown as Array<Record<string, unknown>>;

      for (const [index, row] of rows.entries()) {
        const translations = hasLocalizations
          ? (await client.execute({
              sql: `SELECT language, localized_data FROM content_localizations
                    WHERE source_collection = ? AND source_id = ? AND translation_status = 'ready'`,
              args: [migration.collection, String(row.id)],
            })).rows as unknown as Array<{ language: string; localized_data: string }>
          : [];

        for (const [column, localizedKey, keyTemplate] of migration.fields) {
          const value = typeof row[column] === 'string' ? String(row[column]).trim() : '';
          if (!value) continue;
          const translationKey = keyTemplate.replace('{n}', String(index + 1));
          const inserted = await client.execute({
            sql: `INSERT INTO page_texts (page, translation_key, label, value, block_name, is_published, sort_order, updated_at, created_at)
                  SELECT ?, ?, ?, ?, ?, 1, ?, ${nowSql}, ${nowSql}
                  WHERE NOT EXISTS (SELECT 1 FROM page_texts WHERE translation_key = ?)`,
            args: [migration.page, translationKey, translationKey.replace(/^ui\./, ''), value, migration.blockName, 800 + index, translationKey],
          });
          if (!inserted.rowsAffected || !hasLocalizations) continue;
          const pageTextId = String(inserted.lastInsertRowid);
          for (const translation of translations) {
            let localized: Record<string, unknown> = {};
            try { localized = JSON.parse(translation.localized_data || '{}'); } catch { /* ignore broken rows */ }
            const translated = typeof localized[localizedKey] === 'string' ? String(localized[localizedKey]).trim() : '';
            if (!translated) continue;
            await client.execute({
              sql: `INSERT OR IGNORE INTO content_localizations
                      (source_collection, source_id, language, localized_data, translation_status, content_hash, error_message, generated_at, attempts, updated_at, created_at)
                    VALUES ('page-texts', ?, ?, ?, 'ready', ?, '', ${nowSql}, 0, ${nowSql}, ${nowSql})`,
              args: [pageTextId, translation.language, JSON.stringify({ value: translated }), pageTextContentHash(value)],
            });
          }
        }
      }
    }

    // Queue records of removed collections would otherwise be retried by the translation worker forever.
    if (hasLocalizations) {
      await executeSafe("DELETE FROM content_localizations WHERE source_collection IN ('pillars', 'scenarios', 'stats', 'trust-points');");
    }
  });
};

/**
 * Exactly one championship is «active» (column is_featured): it is the one shown on the home
 * page and on /championship. Everything else is the archive. Repairs databases that have zero
 * or several active championships.
 */
const ensureSingleActiveChampionship = async () => {
  if (!(await hasTable('tournaments'))) return;
  const client = getSchemaClient();
  // «Формат участия» became a one-line field (the site only ever showed the first line).
  await runOnce('tournament-format-single-line', async () => {
    await executeSafe(`UPDATE tournaments SET format = replace(format, char(13), '') WHERE instr(format, char(13)) > 0;`);
    await executeSafe(`UPDATE tournaments SET format = trim(substr(format, 1, instr(format, char(10)) - 1)) WHERE instr(format, char(10)) > 0;`);
  });
  const active = (await client.execute(
    `SELECT id FROM tournaments WHERE is_featured = 1
     ORDER BY CASE WHEN _status = 'published' THEN 0 ELSE 1 END, sort_order, id`,
  )).rows as unknown as Array<{ id: number }>;
  let activeId = active[0]?.id;
  if (activeId == null) {
    const fallback = await getFirst<{ id?: number }>(
      `SELECT id FROM tournaments ORDER BY CASE WHEN _status = 'published' THEN 0 ELSE 1 END, sort_order, id LIMIT 1`,
    );
    activeId = fallback?.id;
  }
  if (activeId == null || (active.length === 1 && active[0].id === activeId)) return;
  await client.execute({ sql: 'UPDATE tournaments SET is_featured = CASE WHEN id = ? THEN 1 ELSE 0 END', args: [activeId] });
  if (await hasTable('_tournaments_v')) {
    await client.execute({
      sql: 'UPDATE _tournaments_v SET version_is_featured = CASE WHEN parent_id = ? THEN 1 ELSE 0 END WHERE latest = 1',
      args: [activeId],
    });
  }
};

/**
 * Fields that the site reads as codes (event category, opportunity category/cost, language
 * lists) used to be free text in the CMS. They are selects now; legacy values are mapped to
 * the closest code so old records stay valid and editable.
 */
const normalizeEventAndOpportunityCodes = async () => {
  const eventCategoryCase = (column: string) => `CASE
      WHEN ${column} IN (${sqlList(ACTIVITY_CATEGORY_VALUES)}) THEN ${column}
      WHEN lower(${column}) LIKE '%hack%' OR lower(${column}) LIKE '%project%' OR lower(${column}) LIKE '%case%'
        OR ${column} LIKE '%хакатон%' OR ${column} LIKE '%проект%' OR ${column} LIKE '%кейс%' THEN 'project'
      WHEN lower(${column}) LIKE '%workshop%' OR lower(${column}) LIKE '%master%'
        OR ${column} LIKE '%воркшоп%' OR ${column} LIKE '%мастер%' THEN 'workshop'
      WHEN lower(${column}) LIKE '%webinar%' OR lower(${column}) LIKE '%online%'
        OR ${column} LIKE '%вебинар%' OR ${column} LIKE '%онлайн%' THEN 'online-meeting'
      WHEN lower(${column}) LIKE '%network%' OR lower(${column}) LIKE '%forum%' OR lower(${column}) LIKE '%meet%'
        OR ${column} LIKE '%форум%' OR ${column} LIKE '%нетворк%' OR ${column} LIKE '%встреч%' THEN 'social'
      WHEN lower(${column}) LIKE '%team%' OR ${column} LIKE '%команд%' THEN 'team'
      ELSE 'educational' END`;
  if (await hasTable('events')) {
    await executeSafe(`UPDATE events SET event_type = ${eventCategoryCase('event_type')} WHERE event_type IS NULL OR event_type NOT IN (${sqlList(ACTIVITY_CATEGORY_VALUES)});`);
  }
  if (await hasTable('_events_v')) {
    await executeSafe(`UPDATE _events_v SET version_event_type = ${eventCategoryCase('version_event_type')} WHERE version_event_type IS NOT NULL AND version_event_type NOT IN (${sqlList(ACTIVITY_CATEGORY_VALUES)});`);
  }

  const categoryCase = (column: string, typeColumn: string) => `CASE
      WHEN ${column} IN (${sqlList(OPPORTUNITY_CATEGORY_VALUES)}) THEN ${column}
      WHEN ${column} = 'olympiad' THEN 'olympiads'
      WHEN ${column} = 'internship' THEN 'internships'
      WHEN ${typeColumn} IN (${sqlList(OPPORTUNITY_CATEGORY_VALUES)}) THEN ${typeColumn}
      ELSE 'projects' END`;
  const costCase = (column: string) => `CASE
      WHEN ${column} IN (${sqlList(OPPORTUNITY_COST_VALUES)}) THEN ${column}
      WHEN ${column} IS NULL OR trim(${column}) = '' OR lower(${column}) LIKE '%free%' OR ${column} LIKE '%есплатн%' THEN 'free'
      WHEN lower(${column}) LIKE '%scholar%' OR ${column} LIKE '%типенд%' OR ${column} LIKE '%грант%' THEN 'scholarship'
      ELSE 'paid' END`;
  if (await hasTable('opportunities')) {
    await executeSafe(`UPDATE opportunities SET category = ${categoryCase('category', 'opportunity_type')} WHERE category IS NULL OR category NOT IN (${sqlList(OPPORTUNITY_CATEGORY_VALUES)});`);
    await executeSafe(`UPDATE opportunities SET cost = ${costCase('cost')} WHERE cost IS NULL OR cost NOT IN (${sqlList(OPPORTUNITY_COST_VALUES)});`);
  }
  if (await hasTable('_opportunities_v')) {
    await executeSafe(`UPDATE _opportunities_v SET version_category = ${categoryCase('version_category', 'version_opportunity_type')} WHERE version_category IS NOT NULL AND version_category NOT IN (${sqlList(OPPORTUNITY_CATEGORY_VALUES)});`);
    await executeSafe(`UPDATE _opportunities_v SET version_cost = ${costCase('version_cost')} WHERE version_cost IS NOT NULL AND version_cost NOT IN (${sqlList(OPPORTUNITY_COST_VALUES)});`);
  }

  // «Идёт сейчас» was machine-translated as «running» (jogging). Only rows that still hold
  // the broken value are touched, so an editor's own wording is never overwritten.
  if (await hasTable('content_localizations') && await hasTable('page_texts')) {
    const ongoingFixes: Record<string, [string, string]> = {
      en: ['Running now', 'Happening now'],
      kk: ['Қазір жүгіру', 'Қазір өтуде'],
      uz: ['Hozir yugurish', 'Hozir oʻtmoqda'],
      es: ['Corriendo ahora', 'En curso'],
      tr: ['Şimdi koşuyorum', 'Şu anda devam ediyor'],
      ar: ['تشغيل الآن', 'جارٍ الآن'],
    };
    for (const [language, [broken, fixed]] of Object.entries(ongoingFixes)) {
      await getSchemaClient().execute({
        sql: `UPDATE content_localizations SET localized_data = json_set(localized_data, '$.value', ?), updated_at = ${nowSql}
              WHERE source_collection = 'page-texts' AND language = ?
                AND source_id IN (SELECT CAST(id AS TEXT) FROM page_texts WHERE translation_key = 'ui.activitiespage.2f96e6c2aa')
                AND json_extract(localized_data, '$.value') = ?`,
        args: [fixed, language, broken],
      });
    }
  }

  // The upload hint listed PPT/TXT/ZIP, which the server rejects. Replace only the old wording.
  if (await hasTable('page_texts')) {
    const client = getSchemaClient();
    await client.execute(`UPDATE page_texts SET value = replace(value, 'PDF, DOC, PPT, TXT, ZIP, PNG', 'PDF, DOC, DOCX, JPG, PNG, WebP'), updated_at = ${nowSql}
      WHERE translation_key = 'ui.applicationmodal.6272f20d22' AND value LIKE 'PDF, DOC, PPT, TXT, ZIP, PNG%'`);
    if (await hasTable('content_localizations')) {
      await client.execute(`UPDATE content_localizations
        SET localized_data = json_set(localized_data, '$.value',
              replace(replace(json_extract(localized_data, '$.value'), 'PDF, DOC, PPT, TXT, ZIP, PNG', 'PDF, DOC, DOCX, JPG, PNG, WebP'), 'PDF، DOC، PPT، TXT، ZIP، PNG', 'PDF، DOC، DOCX، JPG، PNG، WebP')),
            updated_at = ${nowSql}
        WHERE source_collection = 'page-texts'
          AND source_id IN (SELECT CAST(id AS TEXT) FROM page_texts WHERE translation_key = 'ui.applicationmodal.6272f20d22')
          AND (json_extract(localized_data, '$.value') LIKE '%PPT, TXT, ZIP%' OR json_extract(localized_data, '$.value') LIKE '%PPT، TXT، ZIP%')`);
    }
  }

  // Organizer, city and skills of opportunities are shown on the cards but were never translated.
  if (await hasTable('content_localizations')) {
    await runOnce('retranslate-opportunities-v2', async () => {
      await executeSafe("UPDATE content_localizations SET translation_status = 'pending', attempts = 0, error_message = '' WHERE source_collection = 'opportunities';");
    });
  }

  for (const table of ['events_languages', '_events_v_version_languages', 'opportunities_languages', '_opportunities_v_version_languages']) {
    if (!(await hasTable(table))) continue;
    await executeSafe(`UPDATE ${tableName(table)} SET value = lower(trim(value)) WHERE value IS NOT NULL AND value <> lower(trim(value));`);
    await executeSafe(`DELETE FROM ${tableName(table)} WHERE value IS NULL OR value NOT IN (${sqlList(CONTENT_LANGUAGE_VALUES)});`);
  }
};

const PAGE_FALLBACK_BLOCK: Record<string, string> = {
  global: 'Общие тексты — Прочее',
  home: 'Главная — Прочее',
  about: 'О проекте — Прочее',
  championship: 'Чемпионат — Прочее',
  activities: 'Активности — Прочее',
  'find-team': 'Поиск команды — Прочее',
  legal: 'Юридические страницы — Прочее',
};

/**
 * «Дерево текстов» only lists rows of `page_texts`. Every interface text of the site that is
 * editable (see src/page-texts.ts) gets a row here — new texts shipped with the code appear in
 * the tree automatically, with the Russian copy as the starting value. Existing rows (and the
 * editors' changes in them) are never touched.
 */
const ensurePageTextRows = async () => {
  if (!(await hasTable('page_texts'))) return;
  const localePath = path.join(projectRoot, 'src', 'i18n', 'locales', 'ru', 'translation.json');
  if (!fs.existsSync(localePath)) return;
  const flatLocale = flattenLocaleText(JSON.parse(fs.readFileSync(localePath, 'utf8')), '', { includeArrays: true });
  const existing = new Set(
    ((await getSchemaClient().execute('SELECT translation_key FROM page_texts')).rows as unknown as Array<{ translation_key: string }>)
      .map((row) => row.translation_key),
  );
  for (const { value: page } of EDITABLE_PAGE_TEXT_PAGES) {
    for (const key of getEditablePageTextKeys(page, flatLocale)) {
      if (existing.has(key)) continue;
      const value = flatLocale[key];
      if (typeof value !== 'string' || !value.trim()) continue;
      const policySection = key.match(/^privacypolicy\.sections\.(\d+)\./)?.[1];
      const blockName = key.startsWith('ui.opportunitiespage.')
        ? 'Каталог «Возможности»'
        : policySection !== undefined
          ? `Политика: ${Number(policySection) + 1}. ${(flatLocale[`privacypolicy.sections.${policySection}.title`] || '').slice(0, 60)}`
          : key.startsWith('privacypolicy.')
            ? 'Политика конфиденциальности'
            : PAGE_TEXT_KEY_INFO[key]?.page === page ? PAGE_TEXT_KEY_INFO[key].blockName : PAGE_FALLBACK_BLOCK[page];
      await getSchemaClient().execute({
        sql: `INSERT INTO page_texts (page, translation_key, label, value, block_name, is_published, sort_order, updated_at, created_at)
              VALUES (?, ?, ?, ?, ?, 1, 900, ${nowSql}, ${nowSql})`,
        args: [page, key, key.replace(/^ui\./, ''), value, blockName || null],
      });
      existing.add(key);
    }
  }
};

export const getPayloadClient = () => {
  if (!payloadPromise) {
    payloadPromise = ensureDevelopmentSchema().then(() => getPayload({ config }));
  }

  return payloadPromise;
};
