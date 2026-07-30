import type { Expert } from '../types';
import { useCmsCollection, useCmsLanguage } from './useCmsCollection';

type CmsExpertDoc = {
  id: string | number;
  name: string;
  type: 'jury' | 'mentor' | 'expert';
  role: string;
  expertise: string;
  description: string;
  photo?: { url?: string } | string;
  tournamentId?: { id: string | number } | string;
};

const mapCmsExpert = (doc: CmsExpertDoc): Expert => ({
  id: String(doc.id),
  name: doc.name,
  type: doc.type || 'expert',
  role: doc.role,
  expertise: doc.expertise,
  description: doc.description,
  photo: typeof doc.photo === 'object' && doc.photo ? (doc.photo as { url?: string }).url : undefined,
  tournamentId: typeof doc.tournamentId === 'object' && doc.tournamentId
    ? String((doc.tournamentId as { id: string | number }).id)
    : typeof doc.tournamentId === 'string' ? doc.tournamentId : undefined,
});

export const useCmsExperts = (tournamentId?: string) => {
  const language = useCmsLanguage();
  const filterParam = tournamentId ? `&tournamentId=${encodeURIComponent(tournamentId)}` : '';
  return useCmsCollection<CmsExpertDoc, Expert>({
    path: `/api/experts?limit=50&depth=2&sort=sortOrder${filterParam}&lang=${encodeURIComponent(language)}`,
    map: mapCmsExpert,
  }).data || [];
};
