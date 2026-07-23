import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiUrl } from '../api';
import { useLocalizedData } from '../i18n/useLocalizedData';
import type { TrustPoint } from '../types';

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
  const { t } = useTranslation();
  const { trustPoints: fallbackTrustPoints } = useLocalizedData();
  const [cmsTrustPoints, setCmsTrustPoints] = useState<TrustPoint[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch(apiUrl('/api/trust-points?limit=50&depth=1&sort=sortOrder'))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch trust points');
        return res.json();
      })
      .then((data: { docs?: CmsTrustPointDoc[] } | CmsTrustPointDoc[]) => {
        if (!isMounted) return;
        const docs = Array.isArray(data) ? data : (data.docs || []);
        setCmsTrustPoints(docs.map(mapCmsTrustPoint));
      })
      .catch(() => {
        if (isMounted) setCmsTrustPoints([]);
      });

    return () => {
      isMounted = false;
    };
  }, [t]);

  return useMemo(() => {
    if (!cmsTrustPoints?.length) return fallbackTrustPoints;
    return cmsTrustPoints;
  }, [cmsTrustPoints, fallbackTrustPoints]);
};
