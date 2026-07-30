import type { ParticipationScenario } from '../types';
import { useCmsCollection, useCmsLanguage } from './useCmsCollection';

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
  const language = useCmsLanguage();
  return useCmsCollection<CmsScenarioDoc, ParticipationScenario>({
    path: `/api/scenarios?limit=50&depth=1&sort=sortOrder&where[isPublished][equals]=true&lang=${encodeURIComponent(language)}`,
    map: mapCmsScenario,
  }).data || [];
};
