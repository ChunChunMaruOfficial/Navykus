import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiUrl } from '../api';
import { useLocalizedData } from '../i18n/useLocalizedData';
import type { ParticipationScenario } from '../types';

type CmsScenarioDoc = {
  id: string | number;
  title: string;
  who: string;
  why: string;
  ctaText: string;
  actionType: 'apply' | 'team' | 'activity' | 'general';
};

const mapCmsScenario = (doc: CmsScenarioDoc): ParticipationScenario => ({
  id: String(doc.id),
  title: doc.title,
  who: doc.who,
  why: doc.why,
  ctaText: doc.ctaText,
  actionType: doc.actionType || 'general',
});

export const useCmsScenarios = () => {
  const { t } = useTranslation();
  const { scenarios: fallbackScenarios } = useLocalizedData();
  const [cmsScenarios, setCmsScenarios] = useState<ParticipationScenario[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch(apiUrl('/api/scenarios?limit=50&depth=1&sort=sortOrder&where[isPublished][equals]=true'))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch scenarios');
        return res.json();
      })
      .then((data: { docs?: CmsScenarioDoc[] } | CmsScenarioDoc[]) => {
        if (!isMounted) return;
        const docs = Array.isArray(data) ? data : (data.docs || []);
        setCmsScenarios(docs.map(mapCmsScenario));
      })
      .catch(() => {
        if (isMounted) setCmsScenarios([]);
      });

    return () => {
      isMounted = false;
    };
  }, [t]);

  return useMemo(() => {
    if (!cmsScenarios?.length) return fallbackScenarios;
    return cmsScenarios;
  }, [cmsScenarios, fallbackScenarios]);
};
