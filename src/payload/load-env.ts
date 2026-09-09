// The admin panel runs as a separate Next.js app rooted at `admin/`, so Next's
// automatic .env loader only picks up `admin/.env*` — never the repo-root `.env`
// where the SMTP_* credentials live. Without this, `smtpEnabled` is false in the
// admin process, `email` is left undefined, and `payload.sendEmail()` (e.g. the
// moderation decision letters) silently no-ops.
//
// This module MUST be imported before `src/payload.config.ts` reads
// `process.env.SMTP_*`. Scoped to mail + site-URL keys only, so an operator can
// still set NODE_ENV / DATABASE_URL / PAYLOAD_SECRET on the host. Mirrors
// `server/env.ts` for the Express process.
import path from 'node:path';

import { config } from 'dotenv';

const ALLOWED_PREFIXES = ['SMTP_'];
const ALLOWED_KEYS = new Set(['PUBLIC_SITE_URL', 'SITE_URL', 'SERVER_URL']);

const parsed = config({ path: path.resolve(process.cwd(), '.env') }).parsed;
if (parsed) {
  for (const [key, value] of Object.entries(parsed)) {
    if (value === undefined) continue;
    if (ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix)) || ALLOWED_KEYS.has(key)) {
      // .env is authoritative for mail config: a stale PM2/shell SMTP_* var
      // shadowing the correct value is exactly the failure mode this guards.
      process.env[key] = value;
    }
  }
}
