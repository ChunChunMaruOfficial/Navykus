import fs from 'node:fs';
import path from 'node:path';

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../src/i18n/languages';

type JsonObject = Record<string, unknown>;

// src/i18n/locales is the single source of truth; public/locales is generated from it.
const localesDir = path.resolve(process.cwd(), 'src', 'i18n', 'locales');
const shouldFix = process.argv.includes('--fix');
const reportExtraKeys = process.env.I18N_REPORT_EXTRA === 'true';

const isObject = (value: unknown): value is JsonObject =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

const readJson = (file: string) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonObject;
  } catch (error) {
    throw new Error(`${file}: ${(error as Error).message}`);
  }
};

const flatten = (value: unknown, prefix = ''): Record<string, unknown> => {
  if (!isObject(value)) return prefix ? { [prefix]: value } : {};
  return Object.entries(value).reduce<Record<string, unknown>>((acc, [key, nested]) => {
    Object.assign(acc, flatten(nested, prefix ? `${prefix}.${key}` : key));
    return acc;
  }, {});
};

const getValue = (source: JsonObject, key: string) =>
  key.split('.').reduce<unknown>((acc, part) => isObject(acc) ? acc[part] : undefined, source);

const setValue = (target: JsonObject, key: string, value: unknown) => {
  const parts = key.split('.');
  let current = target;
  for (const part of parts.slice(0, -1)) {
    if (!isObject(current[part])) current[part] = {};
    current = current[part] as JsonObject;
  }
  current[parts[parts.length - 1]] = value;
};

const errors: string[] = [];
const warnings: string[] = [];
const basePath = path.join(localesDir, DEFAULT_LANGUAGE, 'translation.json');
const baseJson = readJson(basePath);
const baseKeys = new Set(Object.keys(flatten(baseJson)));

for (const language of SUPPORTED_LANGUAGES) {
  const file = path.join(localesDir, language, 'translation.json');
  if (!fs.existsSync(file)) {
    errors.push(`${language}: missing ${file}`);
    continue;
  }

  const json = readJson(file);
  const flat = flatten(json);
  const keys = new Set(Object.keys(flat));
  const missing = [...baseKeys].filter((key) => !keys.has(key)).sort();
  const empty = Object.entries(flat)
    .filter(([, value]) => typeof value === 'string' && value.trim().length === 0)
    .map(([key]) => key);

  if (missing.length && shouldFix) {
    for (const key of missing) setValue(json, key, getValue(baseJson, key));
    fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
  } else if (missing.length) {
    errors.push(`${language}: missing ${missing.length} keys (${missing.slice(0, 8).join(', ')})`);
  }

  if (empty.length) {
    errors.push(`${language}: empty ${empty.length} values (${empty.slice(0, 8).join(', ')})`);
  }

  const extra = [...keys].filter((key) => !baseKeys.has(key)).sort();
  if (reportExtraKeys && extra.length) warnings.push(`${language}: ${extra.length} extra keys`);
}

for (const warning of warnings) console.warn(`i18n warning: ${warning}`);

if (errors.length) {
  console.error(errors.join('\n'));
  console.error('Run `npx tsx scripts/check-i18n.ts --fix` to fill missing keys from the base locale.');
  process.exit(1);
}

console.log(`i18n ok: ${SUPPORTED_LANGUAGES.length} languages checked`);
