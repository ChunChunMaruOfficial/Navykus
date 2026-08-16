import type { TrustPoint } from '../types';
import { useCmsCollection, useCmsLanguage } from './useCmsCollection';

type CmsTrustPointDoc = {
  id: string | number;
  title?: string | null;
  description?: string | null;
};

const mapCmsTrustPoint = (doc: CmsTrustPointDoc): TrustPoint => ({
  id: String(doc.id),
  title: doc.title?.trim() || '',
  description: doc.description?.trim() || '',
});

const hasVisibleTrustPointText = (doc: TrustPoint) =>
  Boolean(doc.title || doc.description);

export const useCmsTrustPoints = () => {
  const language = useCmsLanguage();
  return useCmsCollection<CmsTrustPointDoc, TrustPoint>({
    path: `/api/trust-points?limit=50&depth=1&sort=sortOrder&lang=${encodeURIComponent(language)}`,
    map: mapCmsTrustPoint,
    filter: hasVisibleTrustPointText,
  }).data || [];
};
