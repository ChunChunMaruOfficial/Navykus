import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

import { PAGE_TEXT_KEY_INFO } from '../admin/pageTextBlockMap';
import { EDITABLE_PAGE_TEXT_PAGES, type EditablePageTextPage } from '../page-texts';

type MigrationDb = MigrateUpArgs['db'];

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
  const rows = (await db.all(sql.raw(`PRAGMA table_info(${quoteValue(table)})`))) as Array<{ name?: string }>;
  return rows.some((row) => row.name === column);
};

const ensureBlockNameColumn = async (db: MigrationDb) => {
  if (await columnExists(db, 'page_texts', 'block_name')) return;
  await db.run(sql.raw(`ALTER TABLE \`page_texts\` ADD COLUMN \`block_name\` TEXT;`));
};

export async function up({ db }: MigrateUpArgs): Promise<void> {
  if (!(await tableExists(db, 'page_texts'))) return;
  await ensureBlockNameColumn(db);

  // If there is an existing draft 'block_name' indexed flag, add index for performance (idempotent)
  try {
    await db.run(sql.raw(`CREATE INDEX IF NOT EXISTS \`page_texts_block_name_idx\` ON \`page_texts\` (\`block_name\`);`));
  } catch {
    // ignore if index creation is not supported in current sqlite client
  }

  // For every known key in PAGE_TEXT_KEY_INFO, set block_name based on map (only when currently empty / different from map).
  for (const [translationKey, info] of Object.entries(PAGE_TEXT_KEY_INFO)) {
    const page = info.page as EditablePageTextPage;
    const blockName = String(info.blockName || '').slice(0, 200);
    if (!blockName) continue;
    const row = await getFirst<{ id?: string | number; block_name?: string | null }>(
      db,
      `SELECT id, block_name FROM \`page_texts\` WHERE \`page\` = ${quoteValue(page)} AND \`translation_key\` = ${quoteValue(translationKey)} LIMIT 1`,
    );
    if (!row?.id) continue;
    if (row.block_name && String(row.block_name).trim() === blockName) continue;
    await db.run(sql.raw(`UPDATE \`page_texts\` SET \`block_name\` = ${quoteValue(blockName)} WHERE \`id\` = ${quoteValue(String(row.id))};`));
  }

  // Fallback: records whose block_name is still NULL for a page -> "<page label> — Прочее"
  for (const pageOption of EDITABLE_PAGE_TEXT_PAGES) {
    const fallback = `${pageOption.label} — Прочее`;
    await db.run(sql.raw(`UPDATE \`page_texts\` SET \`block_name\` = ${quoteValue(fallback)} WHERE \`page\` = ${quoteValue(pageOption.value)} AND (\`block_name\` IS NULL OR TRIM(\`block_name\`) = '');`));
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  if (!(await tableExists(db, 'page_texts'))) return;
  if (await columnExists(db, 'page_texts', 'block_name')) {
    await db.run(sql.raw(`UPDATE \`page_texts\` SET \`block_name\` = NULL;`));
  }
}
