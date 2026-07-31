import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ─────────────────────────────────────────────────────────────────────────────
// Project-root anchored paths.
//
// The site API (Express, `server/index.ts`) and the Payload admin panel
// (Next.js, `next start admin`) are separate processes that may run from
// DIFFERENT working directories — Next.js runs the app from `admin/`. Using
// `process.cwd()` (e.g. `file:./payload.db`, `uploads/media`) made the two
// processes silently open DIFFERENT SQLite files and upload directories:
// the site showed championships stored in the root `payload.db`, while the
// admin read a separate empty `admin/payload.db`. All shared paths are
// therefore resolved against the repository root, so both processes always
// hit the same files regardless of their working directory.
// ─────────────────────────────────────────────────────────────────────────────

const isProjectRoot = (dir: string): boolean =>
  fs.existsSync(path.join(dir, 'package.json')) &&
  fs.existsSync(path.join(dir, 'src', 'payload.config.ts'));

// Prefer this module's own location: accurate when the config runs from source
// (site API via tsx). When bundled by Next.js for the admin panel, the module
// URL points inside `admin/.next/…`, so fall back to walking up from the
// working directory until the repository root is found.
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const candidateRoot = path.resolve(moduleDir, '..', '..');

const findProjectRoot = (): string => {
  if (isProjectRoot(candidateRoot)) return candidateRoot;
  let dir = process.cwd();
  for (let i = 0; i < 12; i += 1) {
    if (isProjectRoot(dir)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return candidateRoot;
};

export const projectRoot = findProjectRoot();

const defaultDbFile = path.join(projectRoot, 'payload.db');

/** Resolve a `DATABASE_URL` to an absolute file URL anchored at the project root. */
const resolveFileUrl = (rawUrl: string | undefined): string => {
  if (!rawUrl) return `file:${defaultDbFile}`;
  if (!rawUrl.startsWith('file:')) return rawUrl; // non-file URLs (Postgres, libsql remote, …)
  const filePart = rawUrl.slice('file:'.length);
  if (!filePart) return `file:${defaultDbFile}`;
  if (path.isAbsolute(filePart)) return `file:${filePart}`;
  // Relative like `./payload.db` → resolve against the project root.
  return `file:${path.resolve(projectRoot, filePart)}`;
};

export const databaseUrl = resolveFileUrl(process.env.DATABASE_URL);

export const mediaUploadDir = path.join(projectRoot, 'uploads', 'media');
