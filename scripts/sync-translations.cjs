const fs = require('fs');
const path = require('path');

const LANGS = ['de', 'es', 'tr', 'kk', 'uz', 'ar'];

// Read RU as reference
const ru = JSON.parse(fs.readFileSync('src/i18n/locales/ru/translation.json', 'utf8'));

// Deep merge: add missing keys from source to target
function deepMerge(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== 'object') target[k] = {};
      deepMerge(target[k], v);
    } else if (!(k in target)) {
      target[k] = v;
    }
  }
}

// For each language, merge all platform sub-sections from RU
for (const lang of LANGS) {
  const filePath = `src/i18n/locales/${lang}/translation.json`;
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    console.error(`Cannot read ${filePath}`);
    continue;
  }

  // Ensure platform section exists
  if (!data.platform) data.platform = {};

  // Merge each platform subsection from RU
  for (const [section, content] of Object.entries(ru.platform)) {
    if (typeof content === 'object' && content !== null) {
      if (!data.platform[section] || typeof data.platform[section] !== 'object') {
        data.platform[section] = {};
      }
      deepMerge(data.platform[section], content);
    } else if (!(section in data.platform)) {
      data.platform[section] = content;
    }
  }

  // Ensure meta has privacy/terms
  if (!data.meta) data.meta = {};
  if (!data.meta.privacy) {
    data.meta.privacy = { title: ru.meta.privacy?.title || 'Privacy Policy', description: ru.meta.privacy?.description || '' };
  }
  if (!data.meta.terms) {
    data.meta.terms = { title: ru.meta.terms?.title || 'Terms of Service', description: ru.meta.terms?.description || '' };
  }

  // Ensure ui section has legalpage and cookieconsent
  if (!data.ui) data.ui = {};
  if (ru.ui.legalpage && !data.ui.legalpage) {
    data.ui.legalpage = {};
    deepMerge(data.ui.legalpage, ru.ui.legalpage);
  }
  if (ru.ui.cookieconsent && !data.ui.cookieconsent) {
    data.ui.cookieconsent = {};
    deepMerge(data.ui.cookieconsent, ru.ui.cookieconsent);
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Updated ${filePath}`);
}

// Also sync to public/locales/
for (const lang of LANGS) {
  const srcPath = `src/i18n/locales/${lang}/translation.json`;
  const pubPath = `public/locales/${lang}/translation.json`;
  
  if (!fs.existsSync(pubPath)) {
    console.log(`Skipping ${pubPath} - does not exist`);
    continue;
  }
  
  const srcData = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
  let pubData;
  try {
    pubData = JSON.parse(fs.readFileSync(pubPath, 'utf8'));
  } catch {
    continue;
  }

  // Merge platform from src to public
  if (!pubData.platform) pubData.platform = {};
  for (const [section, content] of Object.entries(srcData.platform || {})) {
    if (typeof content === 'object' && content !== null) {
      if (!pubData.platform[section] || typeof pubData.platform[section] !== 'object') {
        pubData.platform[section] = {};
      }
      deepMerge(pubData.platform[section], content);
    } else if (!(section in pubData.platform)) {
      pubData.platform[section] = content;
    }
  }

  // Merge meta privacy/terms
  if (!pubData.meta) pubData.meta = {};
  if (srcData.meta?.privacy && !pubData.meta.privacy) pubData.meta.privacy = srcData.meta.privacy;
  if (srcData.meta?.terms && !pubData.meta.terms) pubData.meta.terms = srcData.meta.terms;

  // Merge ui sections
  if (!pubData.ui) pubData.ui = {};
  if (srcData.ui?.legalpage && !pubData.ui.legalpage) {
    pubData.ui.legalpage = {};
    deepMerge(pubData.ui.legalpage, srcData.ui.legalpage);
  }
  if (srcData.ui?.cookieconsent && !pubData.ui.cookieconsent) {
    pubData.ui.cookieconsent = {};
    deepMerge(pubData.ui.cookieconsent, srcData.ui.cookieconsent);
  }

  fs.writeFileSync(pubPath, JSON.stringify(pubData, null, 2) + '\n', 'utf8');
  console.log(`Updated ${pubPath}`);
}

console.log('\nDone! All translations synced from RU reference.');
console.log('Languages updated:', LANGS.join(', '));
