import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../src/i18n/languages';

/**
 * `src/i18n/locales` is the single source of truth for translations.
 * This module copies every language's translation.json into
 * `public/locales`, which is what the browser loads at runtime
 * (`/locales/{{lng}}/translation.json`).
 *
 * Writes are best-effort: on Windows a transient file lock (antivirus etc.)
 * can make a single writeFileSync throw, and an uncaught error would crash
 * the dev server or the build. Per-file failures are logged and skipped —
 * the next sync retries them, and the previous (usually identical) content
 * stays in place.
 */
const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const SOURCE_DIR = path.join(projectRoot, 'src', 'i18n', 'locales');
const TARGET_DIR = path.join(projectRoot, 'public', 'locales');

const writeLocale = (language: string) => {
  const source = path.join(SOURCE_DIR, language, 'translation.json');
  if (!existsSync(source)) {
    console.error(`[sync-locales] source missing: ${source}`);
    return;
  }
  try {
    const targetDir = path.join(TARGET_DIR, language);
    mkdirSync(targetDir, { recursive: true });
    // read/write instead of cpSync: cpSync can throw EEXIST on Windows
    // when the destination file already exists.
    writeFileSync(path.join(targetDir, 'translation.json'), readFileSync(source));
  } catch (error) {
    console.error(`[sync-locales] failed to sync "${language}":`, error);
  }
};

/** Sync every supported language (build, CLI). */
export const syncLocales = () => {
  for (const language of SUPPORTED_LANGUAGES) {
    writeLocale(language);
  }
};

/** Sync only the language whose source file changed (dev watcher). */
export const syncLocaleFile = (filePath: string) => {
  const relative = path.relative(SOURCE_DIR, filePath);
  const language = relative.split(path.sep)[0] as SupportedLanguage | undefined;
  if (!language || !(SUPPORTED_LANGUAGES as readonly string[]).includes(language)) return false;
  writeLocale(language);
  return true;
};
