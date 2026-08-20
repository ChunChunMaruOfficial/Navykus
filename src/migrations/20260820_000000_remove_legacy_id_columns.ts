import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

type MigrationDb = MigrateUpArgs['db'];

const quoteIdent = (name: string) => `\`${name.replace(/`/g, '``')}\``;

const getFirst = async <T extends Record<string, unknown>>(db: MigrationDb, query: string) => {
  const rows = await db.all(sql.raw(query)) as T[];
  return rows[0];
};

const tableExists = async (db: MigrationDb, table: string) => {
  const result = await getFirst<{ name?: string }>(
    db,
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = '${table.replace(/'/g, "''")}' LIMIT 1`,
  );
  return Boolean(result?.name);
};

const columnExists = async (db: MigrationDb, table: string, column: string) => {
  if (!(await tableExists(db, table))) return false;
  const result = await getFirst<{ name?: string }>(
    db,
    `SELECT name FROM pragma_table_info('${table.replace(/'/g, "''")}') WHERE name = '${column.replace(/'/g, "''")}' LIMIT 1`,
  );
  return Boolean(result?.name);
};

const indexExists = async (db: MigrationDb, indexName: string) => {
  const result = await getFirst<{ name?: string }>(
    db,
    `SELECT name FROM sqlite_master WHERE type = 'index' AND name = '${indexName.replace(/'/g, "''")}' LIMIT 1`,
  );
  return Boolean(result?.name);
};

const dropIndexIfExists = async (db: MigrationDb, indexName: string) => {
  if (!(await indexExists(db, indexName))) return;
  await db.run(sql.raw(`DROP INDEX ${quoteIdent(indexName)};`));
};

const dropColumnIfExists = async (db: MigrationDb, table: string, column: string) => {
  if (!(await columnExists(db, table, column))) return;
  await db.run(sql.raw(`ALTER TABLE ${quoteIdent(table)} DROP COLUMN ${quoteIdent(column)};`));
};

const addColumnIfMissing = async (db: MigrationDb, table: string, column: string, definition: string) => {
  if (await columnExists(db, table, column)) return;
  if (!(await tableExists(db, table))) return;
  await db.run(sql.raw(`ALTER TABLE ${quoteIdent(table)} ADD ${quoteIdent(column)} ${definition};`));
};

// legacyId was a one-time import key from the original frontend data file. All
// runtime consumers now use the numeric document id, so the field was removed
// from every collection except page-texts (where it is a composite seed key).
// page_texts.legacy_id is intentionally kept.
const LEGACY_ID_TABLES = [
  'tournaments',
  'activities',
  'experts',
  'faqs',
  'events',
  'opportunities',
  'team_members',
  'trust_points',
  'pillars',
  'scenarios',
  'stats',
] as const;

const LEGACY_ID_INDEXES: Record<string, string> = {
  tournaments: 'tournaments_legacy_id_idx',
  activities: 'activities_legacy_id_idx',
  experts: 'experts_legacy_id_idx',
  faqs: 'faqs_legacy_id_idx',
  events: 'events_legacy_id_idx',
  opportunities: 'opportunities_legacy_id_idx',
  team_members: 'team_members_legacy_id_idx',
  trust_points: 'trust_points_legacy_id_idx',
  pillars: 'pillars_legacy_id_idx',
  scenarios: 'scenarios_legacy_id_idx',
  stats: 'stats_legacy_id_idx',
};

const VERSION_TABLES = [
  '_tournaments_v',
  '_experts_v',
  '_faqs_v',
  '_events_v',
  '_opportunities_v',
  '_team_members_v',
] as const;

const VERSION_LEGACY_ID_INDEXES: Record<string, string> = {
  _tournaments_v: '_tournaments_v_version_version_legacy_id_idx',
  _experts_v: '_experts_v_version_version_legacy_id_idx',
  _faqs_v: '_faqs_v_version_version_legacy_id_idx',
  _events_v: '_events_v_version_version_legacy_id_idx',
  _opportunities_v: '_opportunities_v_version_version_legacy_id_idx',
  _team_members_v: '_team_members_v_version_version_legacy_id_idx',
};

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of LEGACY_ID_TABLES) {
    await dropIndexIfExists(db, LEGACY_ID_INDEXES[table]);
    await dropColumnIfExists(db, table, 'legacy_id');
  }
  for (const table of VERSION_TABLES) {
    await dropIndexIfExists(db, VERSION_LEGACY_ID_INDEXES[table]);
    await dropColumnIfExists(db, table, 'version_legacy_id');
  }

  // team_members.tournamentId changed from text to a relationship on
  // tournaments. Payload stores relationships in a `<field>_id` integer column.
  // The old text column was always NULL in production, so no data copy is needed.
  await addColumnIfMissing(db, 'team_members', 'tournament_id_id', 'integer REFERENCES tournaments(id)');
  await addColumnIfMissing(db, '_team_members_v', 'version_tournament_id_id', 'integer REFERENCES tournaments(id)');
  await dropColumnIfExists(db, 'team_members', 'tournament_id');
  await dropColumnIfExists(db, '_team_members_v', 'version_tournament_id');
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await addColumnIfMissing(db, 'team_members', 'tournament_id', 'text');
  await addColumnIfMissing(db, '_team_members_v', 'version_tournament_id', 'text');
  await dropColumnIfExists(db, '_team_members_v', 'version_tournament_id_id');
  await dropColumnIfExists(db, 'team_members', 'tournament_id_id');
  for (const table of LEGACY_ID_TABLES) {
    await addColumnIfMissing(db, table, 'legacy_id', 'text');
  }
  for (const table of VERSION_TABLES) {
    await addColumnIfMissing(db, table, 'version_legacy_id', 'text');
  }
}
