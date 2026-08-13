import type { SupportedLanguage } from './i18n/languages';

export type EditablePageTextPage = 'about' | 'championship';

export type PageTextDoc = {
  id: string | number;
  page: EditablePageTextPage;
  translationKey: string;
  label?: string | null;
  value: string;
  isPublished?: boolean | null;
  sortOrder?: number | null;
  translationPending?: boolean | null;
};

export const EDITABLE_PAGE_TEXT_PAGES = [
  { label: 'О проекте', value: 'about' },
  { label: 'Чемпионат', value: 'championship' },
] as const;

const SHARED_ABOUT_KEYS = [
  'ui.enhancements.aboutHeroAlt',
  'ui.enhancements.aboutMissionAlt',
  'ui.findteampage.f119ad282e',
  'ui.app.24cd8dc78d',
  'ui.app.d4b60991e4',
];

const SHARED_CHAMPIONSHIP_KEYS = [
  'common.loading',
  'common.error',
  'common.empty',
  'ui.enhancements.championshipHeroAlt',
  'ui.enhancements.championshipCaseAlt',
  'ui.findteampage.f119ad282e',
  'ui.app.24cd8dc78d',
  'ui.app.d13f387e64',
  'ui.app.aa324b069f',
  'ui.activitiespage.84d92abc92',
  'ui.applicationmodal.maxFilesError',
  'ui.applicationmodal.submitError',
  'ui.applicationmodal.6b0f724b4e',
  'ui.applicationmodal.15cd01515e',
  'ui.applicationmodal.moderationSuccess',
  'ui.applicationmodal.467dd34c6e',
  'ui.applicationmodal.21117adc83',
  'ui.applicationmodal.34fda9e41a',
  'ui.applicationmodal.portfolioSection',
  'ui.applicationmodal.portfolioTabFiles',
  'ui.applicationmodal.portfolioTabLink',
  'ui.applicationmodal.f5717f85ba',
  'ui.applicationmodal.6272f20d22',
  'ui.applicationmodal.b55a7aad35',
  'ui.applicationmodal.cf4f1950f8',
  'ui.enhancements.fileSizeError',
  'ui.enhancements.fileTypeError',
  'ui.app.02ce21d910',
  'ui.app.92ca287f55',
  'ui.app.a4bae5e597',
  'ui.app.0d65b9d27c',
  'ui.findteampage.bioRequired',
  'ui.findteampage.whyRequired',
  'ui.findteampage.rolesRequired',
  'ui.findteampage.19b22472b1',
  'ui.findteampage.2b4d128aaa',
  'ui.findteampage.e3ca2f8474',
  'ui.findteampage.112b3c45fd',
  'ui.findteampage.e825746a47',
  'ui.findteampage.93bb4d70fe',
  'ui.findteampage.ff8ca90dda',
  'ui.findteampage.5994c1f5c8',
  'ui.findteampage.d45e4de05b',
  'ui.findteampage.c8d0e2f4a7',
  'ui.findteampage.3765795ef8',
  'ui.findteampage.53fa567ce7',
  'ui.findteampage.e4f6b0a2c1',
  'ui.findteampage.a6b8c0d2e5',
  'ui.findteampage.20be1bd637',
  'ui.findteampage.43584e6c75',
  'ui.findteampage.0d5ce0304e',
];

export const editablePageTextPrefixes: Record<EditablePageTextPage, readonly string[]> = {
  about: ['ui.aboutprojectpage.'],
  championship: ['ui.championshippage.'],
};

export const editablePageTextExtraKeys: Record<EditablePageTextPage, readonly string[]> = {
  about: SHARED_ABOUT_KEYS,
  championship: SHARED_CHAMPIONSHIP_KEYS,
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

export const flattenLocaleText = (value: unknown, prefix = ''): Record<string, string> => {
  if (typeof value === 'string') return prefix ? { [prefix]: value } : {};
  if (!isObject(value)) return {};

  return Object.entries(value).reduce<Record<string, string>>((acc, [key, nested]) => {
    Object.assign(acc, flattenLocaleText(nested, prefix ? `${prefix}.${key}` : key));
    return acc;
  }, {});
};

export const getEditablePageTextKeys = (
  page: EditablePageTextPage,
  flatLocale: Record<string, string>,
) => {
  const prefixKeys = Object.keys(flatLocale).filter((key) =>
    editablePageTextPrefixes[page].some((prefix) => key.startsWith(prefix)),
  );
  return Array.from(new Set([...prefixKeys, ...editablePageTextExtraKeys[page]]))
    .filter((key) => typeof flatLocale[key] === 'string')
    .sort();
};

export const pageTextLegacyId = (
  page: EditablePageTextPage,
  language: SupportedLanguage,
  translationKey: string,
) => `${page}:${language}:${translationKey}`;
