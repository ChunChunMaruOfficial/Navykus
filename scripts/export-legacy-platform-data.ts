import fs from 'node:fs/promises';
import path from 'node:path';

import { createClient } from '@libsql/client';

import { databaseUrl, mediaUploadDir, projectRoot } from '../src/payload/paths';

const LEGACY_TABLES = [
  'applications',
  'applications_rels',
  'application_status_history',
  'favorites',
  'notifications',
  'team_posts',
  'team_responses',
  'community_leads',
] as const;

const SENSITIVE_COLUMN_PATTERNS = [
  /password/i,
  /^hash$/i,
  /^salt$/i,
  /token/i,
  /secret/i,
  /session/i,
  /verification/i,
  /reset/i,
  /lock_until/i,
  /login_attempts/i,
];

type Row = Record<string, unknown>;

const client = createClient({ url: databaseUrl });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.join(projectRoot, 'db-backups', `legacy-platform-${timestamp}`);
const dataDir = path.join(backupDir, 'data');
const filesDir = path.join(backupDir, 'files');

const tableExists = async (table: string) => {
  const result = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1",
    args: [table],
  });
  return Boolean(result.rows[0]);
};

const readRows = async (table: string, where = '') => {
  const result = await client.execute(`SELECT * FROM ${table}${where}`);
  return result.rows as unknown as Row[];
};

const sanitizeRow = (row: Row) => {
  const sanitized: Row = {};
  for (const [key, value] of Object.entries(row)) {
    if (SENSITIVE_COLUMN_PATTERNS.some((pattern) => pattern.test(key))) continue;
    sanitized[key] = value;
  }
  return sanitized;
};

const csvCell = (value: unknown) => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const writeDataset = async (name: string, rows: Row[]) => {
  const sanitized = rows.map(sanitizeRow);
  await fs.writeFile(path.join(dataDir, `${name}.json`), JSON.stringify(sanitized, null, 2), 'utf8');

  const columns = Array.from(new Set(sanitized.flatMap((row) => Object.keys(row))));
  const csv = [
    columns.join(','),
    ...sanitized.map((row) => columns.map((column) => csvCell(row[column])).join(',')),
  ].join('\n');
  await fs.writeFile(path.join(dataDir, `${name}.csv`), csv, 'utf8');
  return { name, rows: sanitized.length };
};

const exportLegacyMedia = async () => {
  if (!(await tableExists('applications_rels')) || !(await tableExists('media'))) return { rows: 0, files: 0 };

  const result = await client.execute(`
    SELECT DISTINCT media.*
    FROM applications_rels rels
    JOIN media ON media.id = rels.media_id
    WHERE rels.media_id IS NOT NULL
  `);
  const rows = result.rows as unknown as Row[];
  await writeDataset('legacy_attachment_media', rows);

  let copied = 0;
  await fs.mkdir(filesDir, { recursive: true });
  for (const row of rows) {
    const filename = typeof row.filename === 'string' ? row.filename : '';
    if (!filename) continue;
    const source = path.join(mediaUploadDir, filename);
    const target = path.join(filesDir, filename);
    try {
      await fs.copyFile(source, target);
      copied += 1;
    } catch {
      // Metadata is still exported even when the physical file is missing.
    }
  }

  return { rows: rows.length, files: copied };
};

const main = async () => {
  await fs.mkdir(dataDir, { recursive: true });

  const manifest: Array<{ name: string; rows: number }> = [];
  if (await tableExists('users')) {
    manifest.push(await writeDataset(
      'legacy_public_users',
      await readRows('users', " WHERE COALESCE(role, 'user') NOT IN ('admin', 'moderator')"),
    ));
  }

  for (const table of LEGACY_TABLES) {
    if (!(await tableExists(table))) {
      manifest.push({ name: table, rows: 0 });
      continue;
    }
    manifest.push(await writeDataset(table, await readRows(table)));
  }

  const media = await exportLegacyMedia();
  const marker = {
    completedAt: new Date().toISOString(),
    databaseUrl: databaseUrl.replace(/\/\/.*@/, '//***@'),
    manifest,
    media,
    sanitized: true,
    excludedColumnPatterns: SENSITIVE_COLUMN_PATTERNS.map(String),
  };

  await fs.writeFile(path.join(backupDir, 'EXPORT_COMPLETE.json'), JSON.stringify(marker, null, 2), 'utf8');
  console.log(`Legacy platform export written to ${backupDir}`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    client.close();
  });
