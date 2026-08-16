import { useCmsCollection, useCmsLanguage } from './useCmsCollection';

export type CmsTournamentDoc = {
  id: string | number;
  title: string;
  type: string;
  description: string;
  pitch?: string;
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
  registrationStatus?: 'open' | 'suspended' | 'closed';
};

export type CmsMappedTournament = {
  id: string;
  title: string;
  type: string;
  description: string;
  pitch: string;
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
  registrationStatus: 'open' | 'suspended' | 'closed';
};

const listValues = (items: unknown): string[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object' && 'value' in item) return String((item as { value: string }).value || '');
    return '';
  }).filter(Boolean);
};

const mapCmsDoc = (doc: CmsTournamentDoc): CmsMappedTournament => ({
  id: String(doc.id),
  title: doc.title?.trim() || '',
  type: doc.type || '',
  description: doc.description || '',
  pitch: doc.pitch || '',
  date: doc.date || '',
  registrationDeadline: doc.registrationDeadline || '',
  maxParticipants: doc.maxParticipants || 0,
  skills: listValues(doc.skills),
  mentors: listValues(doc.mentors),
  suitableFor: doc.suitableFor || '',
  format: doc.format || '',
  targetAudience: doc.targetAudience || '',
  ageLimit: doc.ageLimit || '',
  teamsAllowed: doc.teamsAllowed || '',
  language: doc.language || '',
  expectedResult: doc.expectedResult || '',
  themesText: doc.themesText || '',
  evaluationCriteriaText: doc.evaluationCriteriaText || '',
  registrationStatus: ['open', 'suspended', 'closed'].includes(doc.registrationStatus || '')
    ? doc.registrationStatus as CmsMappedTournament['registrationStatus']
    : 'open',
});

const hasVisibleTournamentText = (doc: CmsMappedTournament) =>
  Boolean(doc.title || doc.description || doc.pitch || doc.type);

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
