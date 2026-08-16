import type { Pillar } from '../types';
import { useCmsCollection, useCmsLanguage } from './useCmsCollection';

type CmsPillarDoc = {
  id: string | number;
  label: string;
  title: string;
  description: string;
};

const mapCmsPillar = (doc: CmsPillarDoc): Pillar => ({
  label: doc.label?.trim() || '',
  title: doc.title?.trim() || '',
  description: doc.description?.trim() || '',
});

const hasVisiblePillarText = (pillar: Pillar) =>
  Boolean(pillar.label || pillar.title || pillar.description);

export const useCmsPillars = () => {
  const language = useCmsLanguage();
  return useCmsCollection<CmsPillarDoc, Pillar>({
    path: `/api/pillars?limit=50&depth=1&sort=sortOrder&lang=${encodeURIComponent(language)}`,
    map: mapCmsPillar,
    filter: hasVisiblePillarText,
  }).data || [];
};
