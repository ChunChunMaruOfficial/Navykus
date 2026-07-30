import { useCmsCollection, useCmsLanguage } from './useCmsCollection';

type CmsStatDoc = {
  id: string | number;
  value: string;
  label: string;
};

type Stat = { value: string; label: string };

const mapCmsStat = (doc: CmsStatDoc): Stat => ({
  value: doc.value,
  label: doc.label,
});

export const useCmsStats = () => {
  const language = useCmsLanguage();
  return useCmsCollection<CmsStatDoc, Stat>({
    path: `/api/stats?limit=20&depth=1&sort=sortOrder&where[isPublished][equals]=true&lang=${encodeURIComponent(language)}`,
    map: mapCmsStat,
  }).data || [];
};
