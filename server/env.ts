// Ensure SMTP settings from the .env file always win over stale process
// environment variables. Without this, a leftover SMTP_PASS (e.g. cached by
// PM2 or a shell export) shadows the correct value from .env, which makes the
// SMTP server reject login (535) — and login-by-code emails never arrive while
// the UI still reports "sent".
//
// This module must be imported FIRST, before any config module reads
// process.env (src/payload.config.ts builds its SMTP adapter at import time).
import path from 'node:path';
import { config } from 'dotenv';

// Deliberately scoped to SMTP_* keys only: we want the .env file to be
// authoritative for mail configuration, without silently overriding every
// other environment variable (NODE_ENV, DATABASE_URL, PAYLOAD_SECRET, ...)
// that an operator may intentionally set on the host.
const envPath = path.resolve(process.cwd(), '.env');
const parsed = config({ path: envPath }).parsed;
if (parsed) {
  for (const [key, value] of Object.entries(parsed)) {
    if (key.startsWith('SMTP_') && value !== undefined) {
      process.env[key] = value;
    }
  }
}
// .env is missing or unreadable: config().parsed is undefined, so process.env
// is left untouched.
