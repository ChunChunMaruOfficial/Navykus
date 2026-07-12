import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const localesDir = path.join(rootDir, 'src', 'i18n', 'locales');
const sourceDirs = ['src'];
const sourceFiles = ['index.html'];
const languages = ['ru', 'en', 'kk', 'uz', 'ar', 'de', 'es', 'tr'];

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const readJson = (filePath: string): JsonValue => {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as JsonValue;
};

const flatten = (value: JsonValue, prefix = '', out = new Map<string, string>()) => {
  if (typeof value === 'string') {
    out.set(prefix, value);
    return out;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => flatten(item, `${prefix}[${index}]`, out));
    return out;
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => {
      flatten(item, prefix ? `${prefix}.${key}` : key, out);
    });
  }

  return out;
};

const walk = (dir: string, files: string[] = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'uploads', '.git', 'locales'].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
};

const errors: string[] = [];
const warnings: string[] = [];
const locales = new Map<string, Map<string, string>>();

for (const language of languages) {
  const filePath = path.join(localesDir, language, 'translation.json');
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing locale file: ${filePath}`);
    continue;
  }

  const flat = flatten(readJson(filePath));
  locales.set(language, flat);

  for (const [key, value] of flat) {
    if (!value.trim()) {
      errors.push(`${language}: empty value at ${key}`);
    }
    if (/\?{2,}|\uFFFD/.test(value)) {
      errors.push(`${language}: corrupted value at ${key}`);
    }
  }
}

const ru = locales.get('ru');
if (ru) {
  for (const language of languages.filter((item) => item !== 'ru')) {
    const current = locales.get(language);
    if (!current) continue;

    for (const key of ru.keys()) {
      if (!current.has(key)) {
        errors.push(`${language}: missing key ${key}`);
      }
    }
    for (const key of current.keys()) {
      if (!ru.has(key)) {
        errors.push(`${language}: extra key ${key}`);
      }
    }
    for (const [key, value] of current) {
      const source = ru.get(key);
      if (
        source &&
        source === value &&
        /[\u0400-\u04FF]/.test(source) &&
        !/^data\.teamMembers\[\d+\]\.contact$/.test(key)
      ) {
        warnings.push(`${language}: value equals ru at ${key}`);
      }
    }
  }
}

for (const sourceDir of sourceDirs) {
  const absoluteDir = path.join(rootDir, sourceDir);
  for (const filePath of walk(absoluteDir)) {
    const normalized = filePath.replace(/\\/g, '/');
    if (normalized.includes('/src/i18n/locales/')) continue;
    const content = fs.readFileSync(filePath, 'utf8');
    if (/[\u0400-\u04FF]/.test(content)) {
      errors.push(`Hardcoded Cyrillic in source: ${path.relative(rootDir, filePath)}`);
    }
  }
}

for (const sourceFile of sourceFiles) {
  const filePath = path.join(rootDir, sourceFile);
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');
  if (/[\u0400-\u04FF]/.test(content)) {
    errors.push(`Hardcoded Cyrillic in source: ${sourceFile}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

if (warnings.length) {
  console.warn(`i18n warnings:\n${warnings.join('\n')}`);
}

console.log(`i18n check passed for ${languages.length} locales and ${ru?.size ?? 0} keys.`);
