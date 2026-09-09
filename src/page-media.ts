import type { EditablePageTextPage } from './page-texts';

/**
 * Fixed image slots the site renders in known places (hero pictures, cover
 * images, illustration blocks). Admins can replace or hide each slot through
 * the «Дерево медиа» view; the CMS stores overrides in the `page-media-slots`
 * collection keyed by `slotKey`.
 *
 * `fallbackSrc` is the built-in image shipped with the site, shown whenever the
 * CMS has no override for the slot.
 */
export type PageImageSlot = {
  slotKey: string;
  page: EditablePageTextPage;
  blockName: string;
  label: string;
  fallbackSrc: string;
  /** i18n key used for the alt text when the CMS image has none of its own. */
  altKey: string;
  aspectRatio?: string;
};

export const PAGE_MEDIA_SLOTS: readonly PageImageSlot[] = [
  {
    slotKey: 'home.nearest-championship.cover',
    page: 'home',
    blockName: 'Ближайший чемпионат',
    label: 'Обложка блока «Ближайший чемпионат» на главной',
    fallbackSrc: '/images/championship/championship-presentation.jpg',
    altKey: 'ui.enhancements.championshipCardAlt',
    aspectRatio: '32 / 7',
  },
  {
    slotKey: 'about.hero.image',
    page: 'about',
    blockName: 'Hero о проекте',
    label: 'Главное изображение на странице «О проекте»',
    fallbackSrc: '/images/about/about-community.jpg',
    altKey: 'ui.enhancements.aboutHeroAlt',
    aspectRatio: '4 / 3',
  },
  {
    slotKey: 'about.mission.image',
    page: 'about',
    blockName: 'Миссия проекта',
    label: 'Изображение в блоке «Миссия проекта»',
    fallbackSrc: '/images/about/mentor-discussion.jpg',
    altKey: 'ui.enhancements.aboutMissionAlt',
    aspectRatio: '4 / 3',
  },
  {
    slotKey: 'championship.hero.image',
    page: 'championship',
    blockName: 'Hero чемпионата',
    label: 'Главное изображение на странице «Чемпионат»',
    fallbackSrc: '/images/championship/championship-presentation.jpg',
    altKey: 'ui.enhancements.championshipHeroAlt',
    aspectRatio: '4 / 3',
  },
  {
    slotKey: 'championship.case.image',
    page: 'championship',
    blockName: 'Кейс чемпионата',
    label: 'Изображение в блоке «Кейс чемпионата»',
    fallbackSrc: '/images/championship/technology-case.jpg',
    altKey: 'ui.enhancements.championshipCaseAlt',
    aspectRatio: '16 / 10',
  },
  {
    slotKey: 'find-team.hero.image',
    page: 'find-team',
    blockName: 'Hero поиска команды',
    label: 'Главное изображение на странице «Поиск команды»',
    fallbackSrc: '/images/find-team/team-discussion.jpg',
    altKey: 'ui.enhancements.findTeamHeroAlt',
    aspectRatio: '4 / 3',
  },
] as const;

export const PAGE_MEDIA_SLOT_MAP: Record<string, PageImageSlot> = Object.fromEntries(
  PAGE_MEDIA_SLOTS.map((slot) => [slot.slotKey, slot]),
);

export type PageMediaOverride = {
  url: string | null;
  alt: string | null;
  hidden: boolean;
};
