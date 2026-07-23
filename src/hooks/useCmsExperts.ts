import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiUrl } from '../api';
import { useLocalizedData } from '../i18n/useLocalizedData';
import type { Expert } from '../types';

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
  const { t } = useTranslation();
  const { experts: fallbackExperts } = useLocalizedData();
  const [cmsExperts, setCmsExperts] = useState<Expert[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    const filterParam = tournamentId ? `&tournamentId=${encodeURIComponent(tournamentId)}` : '';

    fetch(apiUrl(`/api/experts?limit=50&depth=2&sort=sortOrder${filterParam}`))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch experts');
        return res.json();
      })
      .then((data: { docs?: CmsExpertDoc[] } | CmsExpertDoc[]) => {
        if (!isMounted) return;
        const docs = Array.isArray(data) ? data : (data.docs || []);
        setCmsExperts(docs.map(mapCmsExpert));
      })
      .catch(() => {
        if (isMounted) setCmsExperts([]);
      });

    return () => {
      isMounted = false;
    };
  }, [t, tournamentId]);

  return useMemo(() => {
    if (!cmsExperts?.length) return fallbackExperts;
    return cmsExperts;
  }, [cmsExperts, fallbackExperts]);
};
