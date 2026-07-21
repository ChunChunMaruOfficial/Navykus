const libsql = require('@libsql/client');
const client = libsql.createClient({ url: 'file:./payload.db' });
(async () => {
  const tables = await client.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'users%' ORDER BY name`);
  console.log('TABLES:', tables.rows.map(r => r.name).join(', '));
  const cols = await client.execute(`PRAGMA table_info(users)`);
  console.log('users cols:', cols.rows.map(r => r.name).join(', '));
  try {
    const test = await client.execute({ sql: `SELECT COUNT(*) as c FROM "users"`, args: [] });
    console.log('users count:', test.rows[0].c);
  } catch (e) { console.log('COUNT err:', e.message); }
})();
