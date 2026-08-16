import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n/languages';
import { localizableContentFields, type SupportedContentCollection } from '../payload/localization';

type MigrationDb = MigrateUpArgs['db'];

const quoteValue = (value: string) => `'${value.replace(/'/g, "''")}'`;

const getRows = async <T extends Record<string, unknown>>(db: MigrationDb, query: string) =>
  (await db.all(sql.raw(query))) as T[];

const getFirst = async <T extends Record<string, unknown>>(db: MigrationDb, query: string) => {
  const rows = await getRows<T>(db, query);
  return rows[0];
};

const tableExists = async (db: MigrationDb, table: string) => {
  const result = await getFirst<{ name?: string }>(
    db,
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ${quoteValue(table)} LIMIT 1`,
  );
  return Boolean(result?.name);
};

const hashForFields = (fields: readonly string[], row: Record<string, unknown>, sourceLanguage: string) => {
  const content: Record<string, unknown> = {};
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(row, field)) continue;
    const value = row[field];
    if (Array.isArray(value)) {
      const list = (value as Array<unknown>)
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && 'value' in item) return String((item as Record<string, unknown>).value || '');
          return '';
        })
        .map((item) => String(item || '').trim())
        .filter(Boolean);
      if (list.length) content[field] = list;
    } else if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) content[field] = trimmed;
    } else if (value !== undefined && value !== null) {
      content[field] = value;
    }
  }
  if (Object.keys(content).length === 0) return null;
  return JSON.stringify({ sourceLanguage, content });
};

const findCollectionRows = (collection: SupportedContentCollection, db: MigrationDb): Promise<Array<Record<string, unknown>>> => {
  const table = String(collection).replace(/-/g, '_');
  return getRows(db, `SELECT * FROM \`${table}\` WHERE \`is_published\` = 1 OR \`is_published\` IS NULL`);
};

const enqueuePending = async (
  db: MigrationDb,
  collection: SupportedContentCollection,
  sourceId: string | number,
  language: SupportedLanguage,
  hash: string,
) => {
  await db.run(sql.raw(`
    INSERT INTO \`content_localizations\` (
      \`source_collection\`,
      \`source_id\`,
      \`language\`,
      \`localized_data\`,
      \`translation_status\`,
      \`content_hash\`,
      \`attempts\`,
      \`error_message\`,
      \`updated_at\`,
      \`created_at\`
    ) VALUES (
      ${quoteValue(collection)},
      ${quoteValue(String(sourceId))},
      ${quoteValue(language)},
      '{}',
      'pending',
      ${quoteValue(hash)},
      0,
      '',
      strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
      strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    )
    ON CONFLICT(\`source_collection\`, \`source_id\`, \`language\`) DO UPDATE SET
      \`content_hash\` = excluded.\`content_hash\`,
      \`error_message\` = '',
      \`updated_at\` = excluded.\`updated_at\`;
  `));
};

export async function up({ db }: MigrateUpArgs): Promise<void> {
  if (!(await tableExists(db, 'content_localizations'))) return;

  const collections: SupportedContentCollection[] = [
    'team-members',
    'activities',
    'experts',
    'faqs',
  ];

  for (const collection of collections) {
    const table = String(collection).replace(/-/g, '_');
    if (!(await tableExists(db, table))) continue;

    const fields = localizableContentFields(collection);
    let rows: Array<Record<string, unknown>> = [];
    try {
      rows = await findCollectionRows(collection, db);
    } catch {
      continue;
    }
    for (const row of rows) {
      const sourceId = String(row.id || '');
      if (!sourceId) continue;
      const sourceLanguageField = row.originalLanguage ? String(row.originalLanguage) : DEFAULT_LANGUAGE;
      const hash = hashForFields(fields, row, sourceLanguageField);
      if (!hash) continue;

      for (const language of SUPPORTED_LANGUAGES) {
        if (language === sourceLanguageField) continue;
        await enqueuePending(db, collection, sourceId, language as SupportedLanguage, hash);
      }
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  if (!(await tableExists(db, 'content_localizations'))) return;
  await db.run(sql.raw(`
    DELETE FROM \`content_localizations\`
    WHERE \`source_collection\` IN ('team-members','activities','experts','faqs');
  `));
}
