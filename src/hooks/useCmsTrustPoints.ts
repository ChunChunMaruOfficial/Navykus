import type { TrustPoint } from '../types';
import { useCmsCollection, useCmsLanguage } from './useCmsCollection';

type CmsTrustPointDoc = {
  id: string | number;
  title: string;
  description: string;
};

const mapCmsTrustPoint = (doc: CmsTrustPointDoc): TrustPoint => ({
  id: String(doc.id),
  title: doc.title,
  description: doc.description,
});

export const useCmsTrustPoints = () => {
  const language = useCmsLanguage();
  return useCmsCollection<CmsTrustPointDoc, TrustPoint>({
    path: `/api/trust-points?limit=50&depth=1&sort=sortOrder&lang=${encodeURIComponent(language)}`,
    map: mapCmsTrustPoint,
  }).data || [];
};
