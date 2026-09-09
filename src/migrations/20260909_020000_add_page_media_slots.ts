import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

type MigrationDb = MigrateUpArgs['db'];

const quoteValue = (value: string) => `'${value.replace(/'/g, "''")}'`;

const getFirst = async <T extends Record<string, unknown>>(db: MigrationDb, query: string) => {
  const rows = (await db.all(sql.raw(query))) as T[];
  return rows[0];
};

const columnExists = async (db: MigrationDb, table: string, column: string) => {
  const row = await getFirst<{ name?: string }>(
    db,
    `SELECT name FROM pragma_table_info(${quoteValue(table)}) WHERE name = ${quoteValue(column)} LIMIT 1`,
  );
  return Boolean(row?.name);
};

const addColumn = async (db: MigrationDb, table: string, column: string, definition: string) => {
  if (await columnExists(db, table, column)) return;
  await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD \`${column}\` ${definition};`));
};

/**
 * Adds optional page/block metadata to `media` and creates the
 * `page_media_slots` collection used by the «Дерево медиа» admin view to
 * override or hide the site's fixed page images.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumn(db, 'media', 'page', 'text');
  await addColumn(db, 'media', 'block_name', 'text');
  await addColumn(db, 'media', 'sort_order', 'numeric DEFAULT 0');
  await addColumn(db, 'media', 'is_published', 'integer DEFAULT true');
  await db.run(sql.raw('CREATE INDEX IF NOT EXISTS media_page_idx ON media (page);'));
  await db.run(sql.raw('CREATE INDEX IF NOT EXISTS media_block_name_idx ON media (block_name);'));

  await db.run(
    sql.raw(`CREATE TABLE IF NOT EXISTS page_media_slots (
      id integer PRIMARY KEY NOT NULL,
      slot_key text NOT NULL,
      page text,
      block_name text,
      label text,
      image_id integer REFERENCES media(id) ON DELETE set null,
      hidden integer DEFAULT false,
      updated_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      created_at text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
    );`),
  );
  await db.run(sql.raw('CREATE UNIQUE INDEX IF NOT EXISTS page_media_slots_slot_key_idx ON page_media_slots (slot_key);'));
  await db.run(sql.raw('CREATE INDEX IF NOT EXISTS page_media_slots_page_idx ON page_media_slots (page);'));
  await db.run(sql.raw('CREATE INDEX IF NOT EXISTS page_media_slots_block_name_idx ON page_media_slots (block_name);'));
  await db.run(sql.raw('CREATE INDEX IF NOT EXISTS page_media_slots_image_idx ON page_media_slots (image_id);'));
  await db.run(sql.raw('CREATE INDEX IF NOT EXISTS page_media_slots_updated_at_idx ON page_media_slots (updated_at);'));
  await db.run(sql.raw('CREATE INDEX IF NOT EXISTS page_media_slots_created_at_idx ON page_media_slots (created_at);'));

  await addColumn(db, 'payload_locked_documents_rels', 'page_media_slots_id', 'integer REFERENCES page_media_slots(id)');
  await db.run(
    sql.raw(
      'CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_page_media_slots_id_idx ON payload_locked_documents_rels (page_media_slots_id);',
    ),
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql.raw('DROP TABLE IF EXISTS page_media_slots;'));
}
