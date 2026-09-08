import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Add new columns to media table
  await db.run(sql.raw(`ALTER TABLE media ADD COLUMN page TEXT DEFAULT 'global' NOT NULL;`));
  await db.run(sql.raw(`ALTER TABLE media ADD COLUMN blockName TEXT;`));
  await db.run(sql.raw(`ALTER TABLE media ADD COLUMN sortOrder INTEGER DEFAULT 0 NOT NULL;`));
  await db.run(sql.raw(`ALTER TABLE media ADD COLUMN isPublished INTEGER DEFAULT 1 NOT NULL;`));

  // Create indexes
  await db.run(sql.raw(`CREATE INDEX media_page_idx ON media (page);`));
  await db.run(sql.raw(`CREATE INDEX media_blockName_idx ON media (blockName);`));
  await db.run(sql.raw(`CREATE INDEX media_sortOrder_idx ON media (sortOrder);`));

  // Update existing records to have default page
  await db.run(sql.raw(`UPDATE media SET page = 'global' WHERE page IS NULL;`));
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Drop indexes
  await db.run(sql.raw(`DROP INDEX IF EXISTS media_page_idx;`));
  await db.run(sql.raw(`DROP INDEX IF EXISTS media_blockName_idx;`));
  await db.run(sql.raw(`DROP INDEX IF EXISTS media_sortOrder_idx;`));

  // SQLite doesn't support DROP COLUMN directly
  // Columns remain for rollback safety
}