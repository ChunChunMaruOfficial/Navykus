import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n/languages';
import {
  EDITABLE_PAGE_TEXT_PAGES,
  flattenLocaleText,
  getEditablePageTextKeys,
  type EditablePageTextPage,
} from '../page-texts';

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

const readLocale = (language: SupportedLanguage) => {
  const file = path.resolve(process.cwd(), 'src', 'i18n', 'locales', language, 'translation.json');
  return flattenLocaleText(JSON.parse(fs.readFileSync(file, 'utf8')));
};

const contentHash = (value: string) =>
  createHash('sha256').update(JSON.stringify({ sourceLanguage: DEFAULT_LANGUAGE, content: { value: value.trim() } })).digest('hex');

const upsertReadyLocalization = async ({
  db,
  sourceId,
  language,
  sourceValue,
  localizedValue,
}: {
  db: MigrationDb;
  sourceId: string | number;
  language: SupportedLanguage;
  sourceValue: string;
  localizedValue: string;
}) => {
  await db.run(sql.raw(`
    INSERT INTO \`content_localizations\` (
      \`source_collection\`,
      \`source_id\`,
      \`language\`,
      \`localized_data\`,
      \`translation_status\`,
      \`content_hash\`,
      \`generated_at\`,
      \`attempts\`,
      \`error_message\`,
      \`updated_at\`,
      \`created_at\`
    ) VALUES (
      'page-texts',
      ${quoteValue(String(sourceId))},
      ${quoteValue(language)},
      ${quoteValue(JSON.stringify({ value: localizedValue }))},
      'ready',
      ${quoteValue(contentHash(sourceValue))},
      strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
      0,
      '',
      strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
      strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    )
    ON CONFLICT(\`source_collection\`, \`source_id\`, \`language\`) DO UPDATE SET
      \`localized_data\` = excluded.\`localized_data\`,
      \`translation_status\` = 'ready',
      \`content_hash\` = excluded.\`content_hash\`,
      \`generated_at\` = excluded.\`generated_at\`,
      \`attempts\` = 0,
      \`error_message\` = '',
      \`updated_at\` = excluded.\`updated_at\`;
  `));
};

export async function up({ db }: MigrateUpArgs): Promise<void> {
  if (!(await tableExists(db, 'page_texts')) || !(await tableExists(db, 'content_localizations'))) return;

  const defaultLocale = readLocale(DEFAULT_LANGUAGE);
  const locales = Object.fromEntries(
    SUPPORTED_LANGUAGES.map((language) => [language, readLocale(language)]),
  ) as Record<SupportedLanguage, Record<string, string>>;

  for (const pageOption of EDITABLE_PAGE_TEXT_PAGES) {
    const page = pageOption.value as EditablePageTextPage;
    const keys = getEditablePageTextKeys(page, defaultLocale);
    for (const translationKey of keys) {
      const source = await getFirst<{ id?: string | number; value?: string }>(
        db,
        `SELECT id, value FROM \`page_texts\` WHERE \`page\` = ${quoteValue(page)} AND \`translation_key\` = ${quoteValue(translationKey)} LIMIT 1`,
      );
      if (!source?.id) continue;

      const sourceValue = String(source.value || '');
      if (sourceValue.trim() !== String(defaultLocale[translationKey] || '').trim()) continue;

      for (const language of SUPPORTED_LANGUAGES) {
        if (language === DEFAULT_LANGUAGE) continue;
        const localizedValue = locales[language][translationKey];
        if (typeof localizedValue !== 'string') continue;
        await upsertReadyLocalization({
          db,
          sourceId: source.id,
          language,
          sourceValue,
          localizedValue,
        });
      }
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  if (!(await tableExists(db, 'content_localizations'))) return;

  await db.run(sql.raw(`
    UPDATE \`content_localizations\`
    SET
      \`translation_status\` = 'pending',
      \`localized_data\` = '{}',
      \`generated_at\` = NULL,
      \`updated_at\` = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE \`source_collection\` = 'page-texts';
  `));
}
