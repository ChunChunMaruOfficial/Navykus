import { getPayload } from 'payload';
import { createClient } from '@libsql/client';

import config from '../src/payload.config';

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>;

let payloadPromise: Promise<PayloadInstance> | undefined;

const getFirst = async <T extends Record<string, unknown>>(query: string, args: Array<string | number | null> = []) => {
  const client = createClient({ url: process.env.DATABASE_URL || 'file:./payload.db' });
  const result = await client.execute({ sql: query, args });
  return result.rows[0] as unknown as T | undefined;
};

const ensureColumn = async (table: string, column: string, definition: string) => {
  const client = createClient({ url: process.env.DATABASE_URL || 'file:./payload.db' });
  const tableRow = await getFirst<{ name?: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
    [table],
  );
  if (!tableRow?.name) return;

  const columnRow = await getFirst<{ name?: string }>(
    `SELECT name FROM pragma_table_info('${table.replace(/'/g, "''")}') WHERE name = ? LIMIT 1`,
    [column],
  );
  if (columnRow?.name) return;

  await client.execute(`ALTER TABLE \`${table.replace(/`/g, '``')}\` ADD \`${column.replace(/`/g, '``')}\` ${definition};`);
};

const ensureDevelopmentSchema = async () => {
  if (process.env.NODE_ENV === 'production') return;

  await ensureColumn('users', 'avatar_url', 'text');
  await ensureColumn('users', 'avatar_alt', 'text');
  await ensureColumn('users', 'avatar_position_x', 'numeric DEFAULT 50');
  await ensureColumn('users', 'avatar_position_y', 'numeric DEFAULT 50');
  await ensureColumn('users', 'avatar_scale', 'numeric DEFAULT 1');
};

export const getPayloadClient = () => {
  if (!payloadPromise) {
    payloadPromise = ensureDevelopmentSchema().then(() => getPayload({ config }));
  }

  return payloadPromise;
};
