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

const repairEmptyVersionListTable = async (db: MigrationDb, table: string) => {
  if (!(await tableExists(db, table))) return;
  const count = await getFirst<{ count?: number }>(db, `SELECT COUNT(*) as count FROM ${quoteIdent(table)}`);
  if (Number(count?.count || 0) > 0) return;
  const idColumn = await getFirst<{ type?: string }>(
    db,
    `SELECT type FROM pragma_table_info(${quoteValue(table)}) WHERE name = 'id' LIMIT 1`,
  );
  if ((idColumn?.type || '').toLowerCase().includes('int')) return;
  await db.run(sql.raw(`DROP TABLE ${quoteIdent(table)};`));
};

const createTextListTable = async (db: MigrationDb, table: string) => {
  await db.run(sql.raw(`CREATE TABLE IF NOT EXISTS ${quoteIdent(table)} (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`value\` text NOT NULL,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`opportunities\`(\`id\`) ON DELETE cascade
  );`));
  await db.run(sql.raw(`CREATE INDEX IF NOT EXISTS ${quoteIdent(`${table}_order_idx`)} ON ${quoteIdent(table)} (\`_order\`);`));
  await db.run(sql.raw(`CREATE INDEX IF NOT EXISTS ${quoteIdent(`${table}_parent_id_idx`)} ON ${quoteIdent(table)} (\`_parent_id\`);`));
};

const createVersionTextListTable = async (db: MigrationDb, table: string) => {
  await db.run(sql.raw(`CREATE TABLE IF NOT EXISTS ${quoteIdent(table)} (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`value\` text,
    \`_uuid\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`_opportunities_v\`(\`id\`) ON DELETE cascade
  );`));
  await addColumnIfMissing(db, table, '_uuid', 'text');
  await db.run(sql.raw(`CREATE INDEX IF NOT EXISTS ${quoteIdent(`${table}_order_idx`)} ON ${quoteIdent(table)} (\`_order\`);`));
  await db.run(sql.raw(`CREATE INDEX IF NOT EXISTS ${quoteIdent(`${table}_parent_id_idx`)} ON ${quoteIdent(table)} (\`_parent_id\`);`));
};

export async function up({ db }: MigrateUpArgs): Promise<void> {
  const columns = [
    ['source', "text DEFAULT 'verified'"],
    ['category', 'text'],
    ['direction', "text DEFAULT 'social'"],
    ['participation', "text DEFAULT 'both'"],
    ['city', 'text'],
    ['image_url', 'text'],
    ['start_date', 'text'],
    ['final_deadline', 'integer DEFAULT false'],
    ['registration_open', 'integer DEFAULT true'],
    ['seats', 'numeric DEFAULT 0'],
    ['saved_count', 'numeric DEFAULT 0'],
    ['editor_pick', 'integer DEFAULT false'],
    ['recommended', 'integer DEFAULT false'],
    ['portfolio_value', 'numeric DEFAULT 0'],
    ['published_at', 'text'],
  ] as const;

  for (const [column, definition] of columns) {
    await addColumnIfMissing(db, 'opportunities', column, definition);
  }

  for (const table of ['opportunities_skills', 'opportunities_keywords', 'opportunities_grades']) {
    await createTextListTable(db, table);
  }

  const versionColumns = columns.map(([column, definition]) => [`version_${column}`, definition] as const);
  for (const [column, definition] of versionColumns) {
    await addColumnIfMissing(db, '_opportunities_v', column, definition);
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
    await repairEmptyVersionListTable(db, table);
    await createVersionTextListTable(db, table);
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of [
    'opportunities_skills',
    'opportunities_keywords',
    'opportunities_grades',
    '_opportunities_v_version_skills',
    '_opportunities_v_version_keywords',
    '_opportunities_v_version_grades',
  ]) {
    await db.run(sql.raw(`DROP TABLE IF EXISTS ${quoteIdent(table)};`));
  }
}
