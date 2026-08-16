import type { SupportedLanguage } from './i18n/languages';

export type EditablePageTextPage = 'global' | 'home' | 'about' | 'championship' | 'activities' | 'find-team' | 'legal';

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
  { label: 'Общие тексты', value: 'global' },
  { label: 'Главная', value: 'home' },
  { label: 'О проекте', value: 'about' },
  { label: 'Чемпионат', value: 'championship' },
  { label: 'Активности', value: 'activities' },
  { label: 'Поиск команды', value: 'find-team' },
  { label: 'Юридические страницы', value: 'legal' },
] as const;

export const ALL_EDITABLE_PAGE_TEXT_PAGES = EDITABLE_PAGE_TEXT_PAGES.map((page) => page.value) as readonly EditablePageTextPage[];

const HOME_PAGE_KEYS = [
  'ui.app.19816f01',
  'ui.app.c8e427d5b3',
] as const;

const ABOUT_PAGE_KEYS = [
  'ui.aboutprojectpage.e260b399ab',
  'ui.aboutprojectpage.ac15bd8cf7',
  'ui.aboutprojectpage.2805697540',
  'ui.aboutprojectpage.0a09c52fdd',
  'ui.aboutprojectpage.10575c4831',
  'ui.aboutprojectpage.3841022721',
  'ui.aboutprojectpage.05c82da787',
  'ui.aboutprojectpage.c2b671bade',
  'ui.aboutprojectpage.4d60e65bd8',
  'ui.aboutprojectpage.91c8669da7',
  'ui.aboutprojectpage.31f9f3d409',
  'ui.aboutprojectpage.7a0e44e136',
  'ui.aboutprojectpage.2fed8f727b',
  'ui.aboutprojectpage.c1470c6ed2',
  'ui.aboutprojectpage.75cee92c36',
  'ui.aboutprojectpage.4af3da7a03',
  'ui.aboutprojectpage.825d7c88f4',
  'ui.aboutprojectpage.93290f394a',
  'ui.aboutprojectpage.863ce4f6d3',
  'ui.aboutprojectpage.0d298390c0',
  'ui.aboutprojectpage.89b0041826',
  'ui.aboutprojectpage.78677fd8cd',
  'ui.aboutprojectpage.9e915ff86f',
  'ui.aboutprojectpage.cba47258ca',
  'ui.aboutprojectpage.9c2513d649',
  'ui.aboutprojectpage.d5dce53393',
  'ui.aboutprojectpage.fff3f12699',
  'ui.aboutprojectpage.a3c3810f47',
  'ui.aboutprojectpage.5767a5f856',
  'ui.aboutprojectpage.fb3a394753',
  'ui.aboutprojectpage.7f6a7b6bbe',
  'ui.aboutprojectpage.cc18b5c571',
  'ui.aboutprojectpage.a270d6798d',
  'ui.aboutprojectpage.d210fb0d5a',
  'ui.aboutprojectpage.b23f0c7c43',
  'ui.aboutprojectpage.d5362b6b2b',
  'ui.aboutprojectpage.b95ecb3c05',
  'ui.aboutprojectpage.9d86488fb6',
  'ui.aboutprojectpage.c03dfac430',
  'ui.aboutprojectpage.9915e585a3',
  'ui.aboutprojectpage.f353fc8fab',
  'ui.aboutprojectpage.66695efbd6',
  'ui.aboutprojectpage.8c5ce0253e',
  'ui.aboutprojectpage.c22bfce55b',
  'ui.aboutprojectpage.3e7c3a9f22',
  'ui.aboutprojectpage.48d877aa9c',
  'ui.aboutprojectpage.3ba567b6ee',
  'ui.aboutprojectpage.20a478bc7a',
  'ui.aboutprojectpage.4d545fb6ff',
  'ui.aboutprojectpage.d1728b4c',
  'ui.aboutprojectpage.7cea9cf73e',
  'ui.enhancements.aboutHeroAlt',
  'ui.enhancements.aboutMissionAlt',
] as const;

const CHAMPIONSHIP_PAGE_KEYS = [
  'ui.championshippage.6bdc7661d3',
  'ui.championshippage.04d60f7ace',
  'ui.championshippage.a9e0cfbc2d',
  'ui.championshippage.26e1a772ee',
  'ui.championshippage.8d4a5a0ee6',
  'ui.championshippage.f94a9af829',
  'ui.championshippage.e70496e65c',
  'ui.championshippage.ff03252b22',
  'ui.championshippage.05679f1a9a',
  'ui.championshippage.d48444dfb4',
  'ui.championshippage.1185c79f59',
  'ui.championshippage.4ec991f17a',
  'ui.championshippage.593bb47761',
  'ui.championshippage.a7fbd7c9e4',
  'ui.championshippage.0df738a56f',
  'ui.championshippage.04aa324d68',
  'ui.championshippage.f30417ddf0',
  'ui.championshippage.5c807e4149',
  'ui.championshippage.9ab00a25e1',
  'ui.championshippage.d50e039adb',
  'ui.championshippage.930fc92538',
  'ui.championshippage.228a84235a',
  'ui.championshippage.a950b9ee19',
  'ui.championshippage.ca26c61c13',
  'ui.championshippage.18b2b68608',
  'ui.championshippage.9913df95c5',
  'ui.championshippage.de56ba7e8b',
  'ui.championshippage.5e809fc67f',
  'ui.championshippage.8f11566b38',
  'ui.championshippage.7f6fbf84a6',
  'ui.championshippage.3015b9f8',
  'ui.championshippage.3cb46975e1',
  'ui.championshippage.d3da2f0b9c',
  'ui.championshippage.9dee187e5f',
  'ui.championshippage.9f228ac331',
  'ui.championshippage.a3e6b0b4fd',
  'ui.championshippage.6e3ec9704e',
  'ui.championshippage.cec289e2df',
  'ui.championshippage.fe12153d63',
  'ui.championshippage.5c275f89de',
  'ui.championshippage.188450882a',
  'ui.championshippage.63db68249b',
  'ui.championshippage.c174c67149',
  'ui.championshippage.795d6a19a2',
  'ui.championshippage.5788077ace',
  'ui.championshippage.d2be300a17',
  'ui.championshippage.098019329a',
  'ui.enhancements.championshipHeroAlt',
  'ui.enhancements.championshipCaseAlt',
] as const;

const ACTIVITIES_PAGE_KEYS = [
  'ui.activitiespage.9bd00b51c2',
  'ui.activitiespage.d4bd169801',
  'ui.activitiespage.0b2e4667a1',
  'ui.activitiespage.9bc3c6004a',
  'ui.activitiespage.807368f2dd',
  'ui.activitiespage.e3f0e11656',
  'ui.activitiespage.62d6062e',
  'ui.activitiespage.5f082a56',
  'ui.activitiespage.97446fff',
  'ui.activitiespage.4dbca5f4b0',
  'ui.activitiespage.1f75230b6e',
  'ui.activitiespage.4710ead504',
  'ui.app.411ef17e3a',
  'ui.activitiespage.1a8a81bc71',
  'ui.activitiespage.160919e620',
] as const;

const GLOBAL_PAGE_KEYS = [] as const;
const FIND_TEAM_PAGE_KEYS = [] as const;
const LEGAL_PAGE_KEYS = [] as const;

export const editablePageTextKeys: Record<EditablePageTextPage, readonly string[]> = {
  global: GLOBAL_PAGE_KEYS,
  home: HOME_PAGE_KEYS,
  about: ABOUT_PAGE_KEYS,
  championship: CHAMPIONSHIP_PAGE_KEYS,
  activities: ACTIVITIES_PAGE_KEYS,
  'find-team': FIND_TEAM_PAGE_KEYS,
  legal: LEGAL_PAGE_KEYS,
};

const pageTextKeyMatchers: Record<EditablePageTextPage, readonly ((key: string) => boolean)[]> = {
  global: [
    (key) => key.startsWith('common.'),
    (key) => key.startsWith('languages.'),
    (key) => key.startsWith('ui.applicationmodal.'),
    (key) => key.startsWith('ui.cookieconsent.'),
    (key) => key.startsWith('ui.enhancements.file'),
    (key) => key.startsWith('meta.notFound.'),
    (key) => key.startsWith('meta.404.'),
  ],
  home: [
    (key) => key.startsWith('ui.app.') && key !== 'ui.app.411ef17e3a',
    (key) => key === 'meta.home.title',
    (key) => key === 'meta.home.description',
    (key) => key === 'ui.enhancements.championshipCardAlt',
    (key) => key === 'ui.enhancements.homeHeroAlt',
    (key) => key === 'ui.enhancements.homeParticipantsLabel',
    (key) => key === 'ui.enhancements.communityAlt',
    (key) => key === 'ui.enhancements.communityEyebrow',
    (key) => key === 'ui.enhancements.communityTitle',
    (key) => key === 'ui.enhancements.communityText',
    (key) => key === 'ui.enhancements.participationTitle',
    (key) => key === 'ui.enhancements.caseAlt',
    (key) => key === 'ui.enhancements.demoEyebrow',
    (key) => key === 'ui.enhancements.demoProjectTitle',
    (key) => key === 'ui.enhancements.demoProjectDescription',
    (key) => key === 'ui.enhancements.demoTagEco',
    (key) => key === 'ui.enhancements.demoTagResearch',
    (key) => key.startsWith('ui.enhancements.proof'),
    (key) => key.startsWith('ui.enhancements.step'),
  ],
  about: [
    (key) => key.startsWith('ui.aboutprojectpage.'),
    (key) => key === 'meta.about.title',
    (key) => key === 'ui.enhancements.aboutHeroAlt',
    (key) => key === 'ui.enhancements.aboutMissionAlt',
    (key) => key === 'ui.enhancements.aboutHeroPlaque',
    (key) => key === 'ui.enhancements.principleApplied',
    (key) => key === 'ui.enhancements.principleSafety',
    (key) => key === 'ui.enhancements.principleMentoring',
  ],
  championship: [
    (key) => key.startsWith('ui.championshippage.'),
    (key) => key === 'meta.championship.title',
    (key) => key === 'ui.enhancements.championshipHeroAlt',
    (key) => key === 'ui.enhancements.championshipCaseAlt',
  ],
  activities: [
    (key) => key.startsWith('ui.activitiespage.'),
    (key) => key === 'meta.activities.title',
  ],
  'find-team': [
    (key) => key.startsWith('ui.findteampage.'),
    (key) => key === 'ui.enhancements.findTeamHeroAlt',
    (key) => key === 'ui.enhancements.privateContact',
    (key) => key === 'meta.findTeam.title',
  ],
  legal: [
    (key) => key.startsWith('ui.legalpage.'),
  ],
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
  const configuredKeys = editablePageTextKeys[page];
  const matchedKeys = Object.keys(flatLocale).filter((key) =>
    pageTextKeyMatchers[page].some((matches) => matches(key)),
  );

  return Array.from(new Set([...configuredKeys, ...matchedKeys]))
    .filter((key) => typeof flatLocale[key] === 'string')
    .sort((left, right) => {
      const leftIndex = configuredKeys.indexOf(left);
      const rightIndex = configuredKeys.indexOf(right);
      if (leftIndex !== -1 || rightIndex !== -1) {
        if (leftIndex === -1) return 1;
        if (rightIndex === -1) return -1;
        return leftIndex - rightIndex;
      }
      return left.localeCompare(right);
    });
};

export const pageTextLegacyId = (
  page: EditablePageTextPage,
  language: SupportedLanguage,
  translationKey: string,
) => `${page}:${language}:${translationKey}`;
