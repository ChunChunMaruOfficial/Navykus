import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

import { PAGE_TEXT_KEY_INFO } from '../admin/pageTextBlockMap';
import { EDITABLE_PAGE_TEXT_PAGES, type EditablePageTextPage } from '../page-texts';

// Legacy block names produced by earlier heuristic runs (old headings/labels that
// are no longer the canonical names). They must be reset too, otherwise rows with
// old names like "Наша Миссия" (capital М) or "Подать заявку на участие" would
// never be remapped to the new grouping.
const LEGACY_BLOCK_NAMES = new Set([
  'О проекте — Прочее',
  'Главная — Прочее',
  'Активности — Прочее',
  'Чемпионат — Прочее',
  'Поиск команды — Прочее',
  'Юридические страницы — Прочее',
  'Общие тексты — Прочее',
  'Прочее',
  // old heuristic headings (old generator ran without section context)
  'Наша Миссия',
  'Что вы получаете:',
  'Хочешь стать частью международного сообщества?',
  'Готов начать свой путь?',
  'Подача анкет сейчас закрыта',
  'Разберитесь в реальных вызовах экологии и урбанистики',
  'Подать заявку на участие',
  'Анкета отправлена на модерацию!',
  'Жюри и наставники кубка',
  'активных школьников',
  'Эта страница ушла с маршрута',
  'Найти команду',
  'Часто задаваемые вопросы',
  'События для школьников',
  'Контакты и Поддержка',
  'Что такое Навыкус?',
  'Креатив, дизайн и смыслы рулят!',
  'Максимальный рост для каждого',
  'Без команды? Мы решим эту проблему!',
  'Как выбрать активность?',
  'О проекте',
]);

type MigrationDb = MigrateUpArgs['db'];

const quoteValue = (value: string) => `'${value.replace(/'/g, "''")}'`;

const runAll = async (db: MigrationDb, query: string) => {
  const rows = await db.all(sql.raw(query)) as unknown;
  return (Array.isArray(rows) ? rows : []) as Array<Record<string, unknown>>;
};

const tableExists = async (db: MigrationDb, table: string) => {
  const rows = await runAll(
    db,
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ${quoteValue(table)} LIMIT 1`,
  );
  return rows.length > 0;
};

/**
 * Re-groups page_texts.block_name according to the curated PAGE_TEXT_KEY_INFO map
 * (block names taken from real on-page sections/headings, so the admin tree shows
 * meaningful collapsible blocks instead of "Прочее").
 *
 * Admin-curated block names (set manually via the tree editor) are preserved:
 * only the old auto-generated defaults ("<Страница> — Прочее", "Прочее", NULL/empty)
 * are remapped.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  if (!(await tableExists(db, 'page_texts'))) return;

  // 1) Reset old auto-generated/heuristic block names to NULL so the canonical map
  //    can be applied uniformly. Manually renamed blocks are kept untouched.
  for (const legacyName of LEGACY_BLOCK_NAMES) {
    await db.run(
      sql.raw(`UPDATE \`page_texts\` SET \`block_name\` = NULL WHERE \`block_name\` = ${quoteValue(legacyName)};`),
    );
  }
  // Names of the form "<Страница> — Прочее" (any page label)
  await db.run(
    sql.raw(`UPDATE \`page_texts\` SET \`block_name\` = NULL WHERE \`block_name\` LIKE '%— Прочее';`),
  );

  // 2) Apply curated block names per (page, translation_key) in bulk via CASE.
  const pages = EDITABLE_PAGE_TEXT_PAGES.map((page) => page.value) as EditablePageTextPage[];
  for (const page of pages) {
    const entries = Object.entries(PAGE_TEXT_KEY_INFO).filter(
      ([, info]) => info.page === page && info.blockName,
    );
    if (!entries.length) continue;

    const whenClauses = entries
      .map(([key, info]) => `WHEN ${quoteValue(key)} THEN ${quoteValue(String(info.blockName).slice(0, 200))}`)
      .join('\n        ');
    const keyList = entries.map(([key]) => quoteValue(key)).join(', ');

    await db.run(
      sql.raw(
        `UPDATE \`page_texts\` SET \`block_name\` = CASE \`translation_key\`\n` +
          `        ${whenClauses}\n` +
          `      END\n` +
          `WHERE \`page\` = ${quoteValue(page)}\n` +
          `  AND \`translation_key\` IN (${keyList});`,
      ),
    );
  }

  // 3) Any rows still without a block (unknown keys): put them in a clearly
  //    labeled archive block instead of the old generic "Прочее".
  await db.run(
    sql.raw(
      `UPDATE \`page_texts\` SET \`block_name\` = 'Архив (не на сайте)' WHERE \`block_name\` IS NULL OR TRIM(\`block_name\`) = '';`,
    ),
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  if (!(await tableExists(db, 'page_texts'))) return;
  // No-op: previous grouping was the generic "… — Прочее" defaults, restoring
  // them automatically is not meaningful. Down intentionally leaves data as-is.
  void db;
}
