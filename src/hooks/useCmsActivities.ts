import type { ActivityItem } from '../types';
import { useCmsCollection, useCmsLanguage } from './useCmsCollection';

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
  const language = useCmsLanguage();
  const result = useCmsCollection<CmsActivityDoc, ActivityItem>({
    path: `/api/activities?limit=50&lang=${encodeURIComponent(language)}`,
    map: mapCmsActivity,
  });

  return { activities: result.data || [], isLoading: result.isLoading };
};
