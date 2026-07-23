import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiUrl } from '../api';
import { useLocalizedData } from '../i18n/useLocalizedData';

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
  const { t } = useTranslation();
  const { stats: fallbackStats } = useLocalizedData();
  const [cmsStats, setCmsStats] = useState<Stat[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch(apiUrl('/api/stats?limit=20&depth=1&sort=sortOrder&where[isPublished][equals]=true'))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
      })
      .then((data: { docs?: CmsStatDoc[] } | CmsStatDoc[]) => {
        if (!isMounted) return;
        const docs = Array.isArray(data) ? data : (data.docs || []);
        setCmsStats(docs.map(mapCmsStat));
      })
      .catch(() => {
        if (isMounted) setCmsStats([]);
      });

    return () => {
      isMounted = false;
    };
  }, [t]);

  return useMemo(() => {
    if (!cmsStats?.length) return fallbackStats;
    return cmsStats;
  }, [cmsStats, fallbackStats]);
};
