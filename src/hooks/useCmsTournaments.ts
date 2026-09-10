import { useCmsCollection, useCmsLanguage } from './useCmsCollection';

export type CmsTournamentDoc = {
  id: string | number;
  title: string;
  type: string;
  description: string;
  pitch?: string;
  aboutHeading?: string;
  date: string;
  registrationDeadline: string;
  maxParticipants: number;
  skills?: Array<{ value: string }> | string[];
  mentors?: Array<{ value: string }> | string[];
  suitableFor?: string;
  format?: string;
  targetAudience?: string;
  ageLimit?: string;
  teamsAllowed?: string;
  language?: string;
  expectedResult?: string;
  themesText?: string;
  evaluationCriteriaText?: string;
  coverImage?: string | null;
  heroImage?: string | null;
  aboutImage?: string | null;
  registrationStatus?: 'open' | 'suspended' | 'closed';
  seoTitle?: string;
  seoDescription?: string;
};

export type CmsMappedTournament = {
  id: string;
  title: string;
  type: string;
  description: string;
  pitch: string;
  aboutHeading: string;
  date: string;
  registrationDeadline: string;
  maxParticipants: number;
  skills: string[];
  mentors: string[];
  suitableFor: string;
  format: string;
  targetAudience: string;
  ageLimit: string;
  teamsAllowed: string;
  language: string;
  expectedResult: string;
  themesText: string;
  evaluationCriteriaText: string;
  coverImage: string;
  heroImage: string;
  aboutImage: string;
  registrationStatus: 'open' | 'suspended' | 'closed';
  seoTitle: string;
  seoDescription: string;
};

const listValues = (items: unknown): string[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object' && 'value' in item) return String((item as { value: string }).value || '');
    return '';
  }).filter(Boolean);
};

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const mapCmsDoc = (doc: CmsTournamentDoc): CmsMappedTournament => ({
  id: String(doc.id),
  title: text(doc.title),
  type: text(doc.type),
  description: text(doc.description),
  pitch: text(doc.pitch),
  aboutHeading: text(doc.aboutHeading),
  date: text(doc.date),
  registrationDeadline: text(doc.registrationDeadline),
  maxParticipants: Number(doc.maxParticipants) || 0,
  skills: listValues(doc.skills),
  mentors: listValues(doc.mentors),
  suitableFor: text(doc.suitableFor),
  format: text(doc.format),
  targetAudience: text(doc.targetAudience),
  ageLimit: text(doc.ageLimit),
  teamsAllowed: text(doc.teamsAllowed),
  language: text(doc.language),
  expectedResult: text(doc.expectedResult),
  themesText: text(doc.themesText),
  evaluationCriteriaText: text(doc.evaluationCriteriaText),
  coverImage: text(doc.coverImage),
  heroImage: text(doc.heroImage),
  aboutImage: text(doc.aboutImage),
  registrationStatus: ['open', 'suspended', 'closed'].includes(doc.registrationStatus || '')
    ? doc.registrationStatus as CmsMappedTournament['registrationStatus']
    : 'open',
  seoTitle: text(doc.seoTitle),
  seoDescription: text(doc.seoDescription),
});

const hasVisibleTournamentText = (doc: CmsMappedTournament) =>
  Boolean(doc.title || doc.description || doc.pitch || doc.type);

/** All published championships (active + archive). Used for filters, not for display. */
export const useCmsTournamentsState = () => {
  const language = useCmsLanguage();
  const collection = useCmsCollection<CmsTournamentDoc, CmsMappedTournament>({
    path: `/api/tournaments?limit=50&lang=${encodeURIComponent(language)}`,
    map: mapCmsDoc,
    filter: hasVisibleTournamentText,
  });
  return {
    ...collection,
    data: collection.data || [],
  };
};

export const useCmsTournaments = () => {
  return useCmsTournamentsState().data;
};

/**
 * The single active championship (the one editors see under «Чемпионат» in the CMS).
 * Drives both the home page block and the championship page.
 */
export const useActiveChampionship = () => {
  const language = useCmsLanguage();
  const collection = useCmsCollection<CmsTournamentDoc, CmsMappedTournament>({
    path: `/api/championships/active?lang=${encodeURIComponent(language)}`,
    map: mapCmsDoc,
    filter: hasVisibleTournamentText,
  });
  return {
    championship: collection.data?.[0] ?? null,
    isLoading: collection.isLoading,
    hasLoadError: collection.hasLoadError,
  };
};
