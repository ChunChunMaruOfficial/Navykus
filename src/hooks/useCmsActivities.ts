import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiUrl } from '../api';
import { useLocalizedData } from '../i18n/useLocalizedData';
import type { ActivityItem } from '../types';

type CmsActivityDoc = {
  id: string | number;
  title: string;
  shortDescription: string;
  fullDescription: string;
  format: string;
  date: string;
  imageUrl: string;
  category: string;
  status: string;
  who: string;
  benefits: Array<{ value: string }> | string[];
  prerequisites: string;
  ctaText: string;
  ctaLink?: string;
};

const mapCmsActivity = (doc: CmsActivityDoc): ActivityItem => ({
  id: String(doc.id),
  title: doc.title,
  shortDescription: doc.shortDescription,
  fullDescription: doc.fullDescription,
  format: doc.format,
  date: doc.date,
  imageUrl: doc.imageUrl,
  category: doc.category as ActivityItem['category'],
  status: doc.status as ActivityItem['status'],
  who: doc.who,
  benefits: Array.isArray(doc.benefits)
    ? doc.benefits.map((b) => (typeof b === 'string' ? b : b.value))
    : [],
  prerequisites: doc.prerequisites,
  ctaText: doc.ctaText,
  ctaLink: doc.ctaLink,
});

export const useCmsActivities = () => {
  const { t } = useTranslation();
  const { activities: fallbackActivities } = useLocalizedData();
  const [cmsActivities, setCmsActivities] = useState<ActivityItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(apiUrl('/api/activities?limit=50'))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch activities');
        return res.json();
      })
      .then((data: { docs?: CmsActivityDoc[] } | CmsActivityDoc[]) => {
        if (!isMounted) return;
        const docs = Array.isArray(data) ? data : (data.docs || []);
        const mapped = docs.map(mapCmsActivity);
        setCmsActivities(mapped);
      })
      .catch(() => {
        if (isMounted) setCmsActivities([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [t]);

  const activities = useMemo(() => {
    if (!cmsActivities?.length) return fallbackActivities;
    return cmsActivities;
  }, [cmsActivities, fallbackActivities]);

  return { activities, isLoading };
};
