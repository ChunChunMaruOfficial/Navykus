import fs from 'node:fs';
import path from 'node:path';

import { createClient } from '@libsql/client';

const databaseUrl = process.env.DATABASE_URL || 'file:./payload.db';
const baseUrl = process.env.PLATFORM_TEST_BASE_URL?.replace(/\/+$/, '');
const errors: string[] = [];

const tableColumns: Record<string, string[]> = {
  users: ['email', 'role', 'account_status', 'email_verified'],
  tournaments: ['title', 'slug', 'seo_title', 'seo_description', '_status'],
  events: ['title', 'slug', 'original_language', '_status'],
  opportunities: ['title', 'slug', 'original_language', '_status'],
  activities: ['title', 'original_language', 'seo_title', 'seo_description'],
  pillars: ['title', 'original_language', 'seo_title', 'seo_description'],
  scenarios: ['title', 'original_language', 'seo_title', 'seo_description'],
  stats: ['value', 'label', 'original_language', 'seo_title', 'seo_description'],
  trust_points: ['title', 'original_language', 'seo_title', 'seo_description'],
  team_members: ['name', 'moderation_status', 'seo_title', 'seo_description', '_status'],
  experts: ['name', 'type', 'tournament_id_id', 'seo_title', 'seo_description', '_status'],
  faqs: ['page', 'question', 'answer', 'seo_title', 'seo_description', '_status'],
  blog_posts: ['title', 'slug', 'status', 'author_id', '_status'],
  contact_settings: ['label', 'email', 'telegram'],
  operator_settings: ['label', 'operator_name', 'contacts_email'],
  content_localizations: ['source_collection', 'source_id', 'language', 'translation_status', 'attempts'],
  audit_logs: ['action', 'collection', 'document_id', 'actor_email', 'summary'],
};

const sourceTables: Record<string, string> = {
  users: 'users',
  tournaments: 'tournaments',
  events: 'events',
  opportunities: 'opportunities',
  activities: 'activities',
  pillars: 'pillars',
  scenarios: 'scenarios',
  stats: 'stats',
  'trust-points': 'trust_points',
  'team-members': 'team_members',
  experts: 'experts',
  faqs: 'faqs',
  'blog-posts': 'blog_posts',
};

const sqlitePath = databaseUrl.startsWith('file:')
  ? path.resolve(process.cwd(), databaseUrl.replace(/^file:/, ''))
  : undefined;

if (sqlitePath && !fs.existsSync(sqlitePath)) {
  errors.push(`database file missing: ${sqlitePath}`);
}

const client = createClient({ url: databaseUrl });

const query = async <T extends Record<string, unknown>>(sql: string, args: Array<string | number> = []) => {
  const result = await client.execute({ sql, args });
  return result.rows as unknown as T[];
};

const tableExists = async (table: string) => {
  const rows = await query<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1", [table]);
  return Boolean(rows[0]);
};

const columnsFor = async (table: string) => {
  const rows = await query<{ name: string }>(`PRAGMA table_info(${table})`);
  return new Set(rows.map((row) => row.name));
};

const checkDatabase = async () => {
  for (const [table, requiredColumns] of Object.entries(tableColumns)) {
    if (!(await tableExists(table))) {
      errors.push(`missing table: ${table}`);
      continue;
    }

    const columns = await columnsFor(table);
    for (const column of requiredColumns) {
      if (!columns.has(column)) errors.push(`missing column: ${table}.${column}`);
    }
  }

  if (await tableExists('payload_migrations')) {
    const migrations = await query<{ name: string }>('SELECT name FROM payload_migrations');
    const migrationNames = new Set(migrations.map((migration) => migration.name));
    for (const migration of [
      '20260725_120000_add_tournament_display_fields',
      '20260725_130000_add_content_localizations',
      '20260725_140000_add_team_member_moderation',
      '20260729_123911',
      '20260729_170000_add_legacy_content_admin_fields',
      '20260729_171500_add_operator_settings',
    ]) {
      if (!migrationNames.has(migration)) errors.push(`missing migration record: ${migration}`);
    }
  }

  const admins = await query<{ email: string; role: string; account_status: string }>(
    "SELECT email, role, account_status FROM users WHERE lower(email)='admin@navykus.org'",
  );
  if (!admins[0]) {
    errors.push('admin@navykus.org missing');
  } else {
    if (admins[0].role !== 'admin') errors.push('admin@navykus.org is not admin');
    if (admins[0].account_status && admins[0].account_status !== 'active') errors.push('admin@navykus.org is not active');
  }

  const activeNonAdmins = await query<{ count: number }>(
    "SELECT COUNT(*) as count FROM users WHERE lower(email) <> 'admin@navykus.org' AND COALESCE(account_status, 'active') <> 'blocked'",
  );
  if (Number(activeNonAdmins[0]?.count || 0) > 0) {
    errors.push(`active non-primary users: ${activeNonAdmins[0].count}`);
  }

  if (await tableExists('content_localizations')) {
    for (const [sourceCollection, table] of Object.entries(sourceTables)) {
      const orphanRows = await query<{ count: number }>(
        `SELECT COUNT(*) as count
         FROM content_localizations l
         LEFT JOIN ${table} s ON CAST(s.id AS TEXT) = l.source_id
         WHERE l.source_collection = ? AND s.id IS NULL`,
        [sourceCollection],
      );
      if (Number(orphanRows[0]?.count || 0) > 0) {
        errors.push(`orphan localizations for ${sourceCollection}: ${orphanRows[0].count}`);
      }
    }
  }
};

const checkHttp = async () => {
  if (!baseUrl) return;

  const paths = [
    '/api/health',
    '/api/tournaments?lang=en&limit=1',
    '/api/events?lang=en&limit=1',
    '/api/opportunities?lang=en&limit=1',
    '/api/activities?lang=en&limit=1',
    '/api/faqs?page=about&lang=en',
    '/api/pillars?lang=en',
    '/api/scenarios?lang=en',
    '/api/experts?lang=en',
    '/api/trust-points?lang=en',
    '/api/stats?lang=en',
    '/api/team-members?lang=en',
    '/api/contact-settings?limit=1',
    '/api/operator-settings?limit=1',
    '/api/blog/posts?lang=en&limit=1',
    '/',
    '/championship',
    '/activities/events',
    '/activities/opportunities',
    '/blog',
    '/participants',
    '/platform/admin',
  ];

  for (const route of paths) {
    const response = await fetch(`${baseUrl}${route}`, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) errors.push(`${route}: HTTP ${response.status}`);
  }
};

try {
  await checkDatabase();
  await checkHttp();
} finally {
  client.close();
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`platform ok${baseUrl ? `: ${baseUrl}` : ''}`);
