import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { EDITABLE_PAGE_TEXT_PAGES, flattenLocaleText, getEditablePageTextKeys } from '../src/page-texts.ts';

const SRC_ROOT = path.resolve('src');

const PAGE_OF_FILE = {
  'App.tsx': 'home',
  'components/AboutProjectPage.tsx': 'about',
  'components/ActivitiesPage.tsx': 'activities',
  'components/ChampionshipPage.tsx': 'championship',
  'components/FindTeamPage.tsx': 'find-team',
  'components/LegalPage.tsx': 'legal',
  'components/OpportunitiesPage.tsx': 'global',
  'components/NotFoundPage.tsx': 'global',
  'components/CookieConsent.tsx': 'global',
  'components/ApplicationModal.tsx': 'global',
  'components/AppFooter.tsx': 'global',
  'components/TeamMemberApplicationForm.tsx': 'global',
};

const BLOCK_NAME_FROM_ID = {
  'navbar-system': 'Навигация',
  'hero-intro': 'Главный экран (Hero)',
  'what-is-navykus': 'Что такое Навыкус',
  'nearest-championship': 'Ближайший чемпионат',
  'embedded-application-form': 'Форма заявки',
  'trust-block': 'Блок доверия',
  'final-cta': 'Финальный призыв',
  'cookie-consent': 'Согласие на cookies',
  'application-modal': 'Модальное окно заявки',
  'find-team-hero': 'Hero поиска команды',
  'find-team-form': 'Форма поиска команды',
  'about-hero': 'Hero о проекте',
  'about-mission': 'Миссия проекта',
  'about-principles': 'Принципы',
  'activities-hero': 'Hero активностей',
  'activities-list': 'Список активностей',
  'championship-hero': 'Hero чемпионата',
  'championship-about': 'О чемпионате',
  'championship-case': 'Кейс чемпионата',
  'legal-consent': 'Согласия',
  'not-found': 'Страница не найдена',
  'opportunities-list': 'Список возможностей',
  'footer': 'Подвал сайта',
};

const keyToBlock = {};

function getAttrId(attr) {
  if (!attr) return null;
  if (attr.type === 'StringLiteral') return attr.value;
  if (attr.type === 'JSXExpressionContainer' && attr.expression && attr.expression.type === 'StringLiteral') return attr.expression.value;
  return null;
}

function findNearestBlockId(node) {
  let current = node;
  let candidate = { id: null, title: null };
  while (current) {
    if (current.type === 'JSXOpeningElement') {
      const attrs = current.attributes || [];
      for (const a of attrs) {
        if (a.type === 'JSXAttribute' && a.name && a.name.name === 'id') {
          candidate.id = candidate.id || getAttrId(a.value);
        }
        if (a.type === 'JSXAttribute' && a.name && a.name.name === 'dataBlockName') {
          candidate.title = candidate.title || getAttrId(a.value);
        }
      }
    }
    current = current.parent || null;
  }
  return candidate;
}

function getHeadingText(openingEl, flatLocale) {
  const parentEl = openingEl.parent;
  const children = (parentEl && parentEl.children) || [];
  let text = '';
  for (const c of children) {
    if (c && c.type === 'JSXText' && c.value) text += c.value;
    else if (c && c.type === 'JSXExpressionContainer' && c.expression && c.expression.type === 'CallExpression' && c.expression.callee && c.expression.callee.name === 't') {
      const a = c.expression.arguments && c.expression.arguments[0];
      if (a && a.type === 'StringLiteral') {
        const localeValue = flatLocale ? flatLocale[a.value] : undefined;
        if (typeof localeValue === 'string' && localeValue.trim()) text += localeValue;
        else text += '{' + a.value + '}';
      }
    }
  }
  return text.trim();
}

function isHeadingTag(tag) {
  return tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5';
}

// Preorder traversal with state of {lastBlockId, lastHeadingText}
function preorderTraverse(node, pageKey, state, flatLocale) {
  if (!node || typeof node !== 'object' || typeof node.type !== 'string') return;

  // Update lastHeadingText when encountering a JSX opening heading element BEFORE processing children
  if (node.type === 'JSXOpeningElement' && node.name) {
    const tag = node.name.name;
    if (isHeadingTag(tag)) {
      const headingText = getHeadingText(node, flatLocale);
      if (headingText && !/^(\{ui\.|ui\.)/.test(headingText) && headingText.length <= 80) {
        state.lastHeadingText = headingText;
      }
    }
  }

  if (node.type === 'CallExpression' && node.callee) {
    let name = '';
    if (node.callee.type === 'Identifier') name = node.callee.name;
    else if (node.callee.type === 'MemberExpression' && node.callee.object && node.callee.object.type === 'Identifier') name = node.callee.object.name;
    if (name === 't') {
      const arg = node.arguments && node.arguments[0];
      if (arg && arg.type === 'StringLiteral' && arg.value) {
        const key = arg.value;
        const blockMatch = findNearestBlockId(node);
        const blockId = blockMatch.id || null;
        let label = blockMatch.title;
        if (!label) {
          if (blockId && BLOCK_NAME_FROM_ID[blockId]) label = BLOCK_NAME_FROM_ID[blockId];
          else label = state.lastHeadingText;
        }
        let blockName = (label || '').trim();
        if (blockId && BLOCK_NAME_FROM_ID[blockId]) blockName = BLOCK_NAME_FROM_ID[blockId];
        if (blockName && /^(\{ui\.|ui\.)/.test(blockName)) blockName = null;
        if (blockName && blockName.length > 80) blockName = null;
        const entry = { page: pageKey, blockName: blockName || null, blockId };
        if (!keyToBlock[key]) keyToBlock[key] = entry;
        else {
          if ((blockId && !keyToBlock[key].blockId) || (!keyToBlock[key].blockName && entry.blockName)) keyToBlock[key] = entry;
        }
      }
    }
  }

  for (const key of Object.keys(node)) {
    if (key === 'parent' || key === 'loc' || key === 'start' || key === 'end' || key === 'range') continue;
    const v = node[key];
    if (!v) continue;
    if (Array.isArray(v)) {
      v.forEach((c) => preorderTraverse(c, pageKey, state, flatLocale));
    } else if (typeof v === 'object' && typeof v.type === 'string') {
      preorderTraverse(v, pageKey, state, flatLocale);
    }
  }
}

function attachParents(node) {
  if (!node || typeof node !== 'object') return;
  for (const k of Object.keys(node)) {
    if (k === 'parent') continue;
    const v = node[k];
    if (Array.isArray(v)) {
      v.forEach((c) => {
        if (c && typeof c === 'object') {
          c.parent = node;
          attachParents(c);
        }
      });
    } else if (v && typeof v === 'object' && typeof v.type === 'string') {
      v.parent = node;
      attachParents(v);
    }
  }
}

function parseFile(file, pageKey, flatLocale) {
  const full = path.resolve(SRC_ROOT, file);
  if (!fs.existsSync(full)) return;
  const code = fs.readFileSync(full, 'utf8');
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript', 'classProperties', 'decorators-legacy'],
    errorRecovery: true,
  });
  attachParents(ast);
  const state = { lastHeadingText: null };
  preorderTraverse(ast, pageKey, state, flatLocale);
}

function* walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walkDir(full);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) yield full;
  }
}

const FILE_PAGE_BY_REGEX = [
  [/components\/AboutProjectPage\.tsx$/, 'about'],
  [/components\/ActivitiesPage\.tsx$/, 'activities'],
  [/components\/ChampionshipPage\.tsx$/, 'championship'],
  [/components\/FindTeamPage\.tsx$/, 'find-team'],
  [/components\/LegalPage\.tsx$/, 'legal'],
  [/App\.tsx$/, 'home'],
  [/components\/AppFooter\.tsx$/, 'global'],
  [/components\/ApplicationModal\.tsx$/, 'global'],
  [/components\/CookieConsent\.tsx$/, 'global'],
  [/components\/TeamMemberApplicationForm\.tsx$/, 'global'],
  [/components\/NotFoundPage\.tsx$/, 'global'],
  [/components\/OpportunitiesPage\.tsx$/, 'global'],
];

const pageOfFile = (full) => {
  const rel = path.relative(SRC_ROOT, full).replace(/\\/g, '/');
  for (const [regex, page] of FILE_PAGE_BY_REGEX) {
    if (regex.test(rel)) return page;
  }
  return 'global';
};

// Load RU locale into flat record before parsing AST so we can resolve heading texts into Russian phrases
const ruLocaleRaw0 = JSON.parse(fs.readFileSync(path.resolve('src/i18n/locales/ru/translation.json'), 'utf8'));
const flatLocale0 = flattenLocaleText(ruLocaleRaw0);

for (const full of [...walkDir(SRC_ROOT)]) {
  parseFile(full, pageOfFile(full), flatLocale0);
}

// Extend with all keys from RU locale (using getEditablePageTextKeys to know each key's page)
const ruLocaleRaw = ruLocaleRaw0;
const flat = flatLocale0;

// Source-order mapping: page -> ordered list of keys (in the order they appear on the page)
const pageSourceOrder = {};
for (const pageOpt of EDITABLE_PAGE_TEXT_PAGES) {
  pageSourceOrder[pageOpt.value] = [];
}

for (const pageOpt of EDITABLE_PAGE_TEXT_PAGES) {
  const page = pageOpt.value;
  // getEditablePageTextKeys already preserves source order (configured keys first, then matched keys in JSON-object order)
  const keys = getEditablePageTextKeys(page, flat);
  for (const key of keys) {
    const fromAst = keyToBlock[key];
    let blockName = fromAst?.blockName || null;
    if (!blockName) {
      const parts = key.split('.');
      let ns = parts.slice(0, Math.min(2, parts.length)).join('.');
      if (key.startsWith('ui.enhancements.')) ns = 'ui.enhancements';
      else if (key.startsWith('ui.legalpage.')) ns = 'ui.legalpage';
      else if (key.startsWith('ui.applicationmodal.')) ns = 'ui.applicationmodal';
      else if (key.startsWith('ui.app.')) ns = 'ui.app';
      else if (key.startsWith('common.')) ns = 'common';
      else if (key.startsWith('languages.')) ns = 'languages';
      else if (key.startsWith('meta.')) ns = 'meta';

      const NS_NAME = {
        'ui.applicationmodal': 'Модальное окно заявки',
        'ui.cookieconsent': 'Согласие на cookies',
        'ui.enhancements': 'Изображения и подписи',
        'common': 'Общие слова',
        'languages': 'Языки',
        'meta': 'Метаданные и SEO',
      };
      const nsLabel = NS_NAME[ns];
      blockName = typeof nsLabel === 'string' ? nsLabel : `${pageOpt.label} — Прочее`;
    }
    keyToBlock[key] = { page, blockName: blockName || `${pageOpt.label} — Прочее` };
    pageSourceOrder[page].push(key);
  }
}

const dict = Object.entries(keyToBlock).sort((a, b) => a[0].localeCompare(b[0]));
const serialized = `// AUTO-GENERATED by scripts/generate-page-text-blocks.mjs. Do not edit by hand.
export type PageTextBlockInfo = {
  page: string;
  blockName: string;
};

export const PAGE_TEXT_KEY_INFO: Record<string, PageTextBlockInfo> = {
${dict.map(([key, info]) => `  ${JSON.stringify(key)}: { page: ${JSON.stringify(info.page)}, blockName: ${JSON.stringify(info.blockName || 'Прочее')} },`).join('\n')}
};

/**
 * Source-order mapping of editable page-text keys per page.
 * Keys appear in the order they show up on the rendered page (source-file order for explicit lists, JSON-object order for matcher-discovered keys).
 * Used by the admin tree view to sort texts within each page so editors can find them in the same order as on the site.
 */
export const PAGE_TEXT_SOURCE_ORDER: Record<string, string[]> = {
${EDITABLE_PAGE_TEXT_PAGES.map((p) => `  ${JSON.stringify(p.value)}: ${JSON.stringify(pageSourceOrder[p.value])},`).join('\n')}
};
`;
fs.mkdirSync(path.resolve('src/admin'), { recursive: true });
fs.writeFileSync(path.resolve('src/admin/pageTextBlockMap.ts'), serialized + '\n');
console.log('Generated pageTextBlockMap.ts with', dict.length, 'keys and source-order map for', EDITABLE_PAGE_TEXT_PAGES.length, 'pages');
