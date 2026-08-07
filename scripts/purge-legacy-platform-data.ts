import fs from 'node:fs/promises';
import path from 'node:path';

import { createClient } from '@libsql/client';

import { databaseUrl, projectRoot } from '../src/payload/paths';

const LEGACY_TABLES = [
  'application_status_history',
  'applications_rels',
  'applications',
  'favorites',
  'notifications',
  'team_responses',
  'team_posts',
  'community_leads',
] as const;

const client = createClient({ url: databaseUrl });

const tableExists = async (table: string) => {
  const result = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1",
    args: [table],
  });
  return Boolean(result.rows[0]);
};

const findLatestBackupDir = async () => {
  const backupsRoot = path.join(projectRoot, 'db-backups');
  const entries = await fs.readdir(backupsRoot, { withFileTypes: true }).catch(() => []);
  const dirs = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('legacy-platform-'))
    .map((entry) => path.join(backupsRoot, entry.name))
    .sort();
  return dirs.at(-1);
};

const requireExportMarker = async () => {
  const backupDir = process.env.LEGACY_PLATFORM_BACKUP_DIR || await findLatestBackupDir();
  if (!backupDir) throw new Error('No legacy platform backup directory found.');

  const markerPath = path.join(backupDir, 'EXPORT_COMPLETE.json');
  await fs.access(markerPath);
  return markerPath;
};

const main = async () => {
  const markerPath = await requireExportMarker();
  const dropTables = process.env.PURGE_DROP_LEGACY_TABLES === 'true';

  await client.execute('BEGIN');
  try {
    // Clear legacy tables first: several of them hold NOT NULL FK columns that
    // reference users (e.g. notifications.user_id), and deleting the users
    // first would fail (or trigger cascades) on those constraints.
    for (const table of LEGACY_TABLES) {
      if (!(await tableExists(table))) continue;
      if (dropTables) {
        await client.execute(`DROP TABLE ${table}`);
      } else {
        await client.execute(`DELETE FROM ${table}`);
      }
    }

    if (await tableExists('users')) {
      await client.execute("DELETE FROM users WHERE COALESCE(role, 'user') NOT IN ('admin', 'moderator')");
    }

    await client.execute('COMMIT');
  } catch (error) {
    await client.execute('ROLLBACK').catch(() => undefined);
    throw error;
  }

  console.log(`Legacy platform data purged after verified export marker: ${markerPath}`);
  if (!dropTables) console.log('Legacy tables were emptied, not dropped. Set PURGE_DROP_LEGACY_TABLES=true to drop them.');
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    client.close();
  });
