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
  title: doc.title?.trim() || '',
  who: doc.who?.trim() || '',
  why: doc.why?.trim() || '',
  ctaText: doc.ctaText?.trim() || '',
  actionType: doc.actionType || 'general',
});

const hasVisibleScenarioText = (doc: ParticipationScenario) =>
  Boolean(doc.title || doc.who || doc.why || doc.ctaText);

export const useCmsScenarios = () => {
  const language = useCmsLanguage();
  return useCmsCollection<CmsScenarioDoc, ParticipationScenario>({
    path: `/api/scenarios?limit=50&depth=1&sort=sortOrder&where[isPublished][equals]=true&lang=${encodeURIComponent(language)}`,
    map: mapCmsScenario,
    filter: hasVisibleScenarioText,
  }).data || [];
};
