import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiUrl } from '../api';
import { useLocalizedData } from '../i18n/useLocalizedData';
import type { Pillar } from '../types';

type CmsPillarDoc = {
  id: string | number;
  label: string;
  title: string;
  description: string;
};

const mapCmsPillar = (doc: CmsPillarDoc): Pillar => ({
  label: doc.label,
  title: doc.title,
  description: doc.description,
});

export const useCmsPillars = () => {
  const { t } = useTranslation();
  const { pillars: fallbackPillars } = useLocalizedData();
  const [cmsPillars, setCmsPillars] = useState<Pillar[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch(apiUrl('/api/pillars?limit=50&depth=1&sort=sortOrder'))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch pillars');
        return res.json();
      })
      .then((data: { docs?: CmsPillarDoc[] } | CmsPillarDoc[]) => {
        if (!isMounted) return;
        const docs = Array.isArray(data) ? data : (data.docs || []);
        setCmsPillars(docs.map(mapCmsPillar));
      })
      .catch(() => {
        if (isMounted) setCmsPillars([]);
      });

    return () => {
      isMounted = false;
    };
  }, [t]);

  return useMemo(() => {
    if (!cmsPillars?.length) return fallbackPillars;
    return cmsPillars;
  }, [cmsPillars, fallbackPillars]);
};
