import { useCmsCollection, useCmsLanguage } from './useCmsCollection';

type CmsStatDoc = {
  id: string | number;
  value: string;
  label: string;
};

type Stat = { value: string; label: string };

const mapCmsStat = (doc: CmsStatDoc): Stat => ({
  value: doc.value?.trim() || '',
  label: doc.label?.trim() || '',
});

const hasVisibleStatText = (stat: Stat) =>
  Boolean(stat.value || stat.label);

export const useCmsStats = () => {
  const language = useCmsLanguage();
  return useCmsCollection<CmsStatDoc, Stat>({
    path: `/api/stats?limit=20&depth=1&sort=sortOrder&where[isPublished][equals]=true&lang=${encodeURIComponent(language)}`,
    map: mapCmsStat,
    filter: hasVisibleStatText,
  }).data || [];
};
