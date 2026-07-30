import { useCmsCollection, useCmsLanguage } from './useCmsCollection';

export type CmsOpportunityDoc = {
  id: string | number;
  title: string;
  slug: string;
  organization: string;
  opportunityType: string;
  shortDescription: string;
  fullDescription?: string;
  logoUrl?: string;
  imageUrl?: string;
  country?: string;
  city?: string;
  format?: string;
  source?: string;
  category?: string;
  direction?: string;
  participation?: string;
  ageMin?: number;
  ageMax?: number;
  deadline?: string;
  startDate?: string;
  cost?: string;
  funding?: boolean;
  finalDeadline?: boolean;
  registrationOpen?: boolean;
  seats?: number;
  savedCount?: number;
  editorPick?: boolean;
  recommended?: boolean;
  portfolioValue?: number;
  officialUrl?: string;
  internalApplicationsEnabled?: boolean;
  languages?: Array<{ value: string }> | string[];
  skills?: Array<{ value: string }> | string[];
  keywords?: Array<{ value: string }> | string[];
  grades?: Array<{ value: string }> | string[];
  requirements?: Array<{ value: string }> | string[];
  benefits?: Array<{ value: string }> | string[];
  documents?: Array<{ value: string }> | string[];
  createdAt?: string;
  publishedAt?: string;
};

export type CmsMappedOpportunity = {
  id: string;
  slug: string;
  title: string;
  organization: string;
  type: string;
  shortDescription: string;
  fullDescription: string;
  logoUrl?: string;
  imageUrl?: string;
  country: string;
  city: string;
  format: string;
  source: string;
  category: string;
  direction: string;
  participation: string;
  ageMin?: number;
  ageMax?: number;
  deadline?: string;
  startDate?: string;
  cost: string;
  funding: boolean;
  finalDeadline: boolean;
  registrationOpen?: boolean;
  seats: number;
  savedCount: number;
  editorPick: boolean;
  recommended: boolean;
  portfolioValue: number;
  officialUrl?: string;
  internalApplicationsEnabled: boolean;
  languages: string[];
  skills: string[];
  keywords: string[];
  grades: string[];
  requirements: string[];
  benefits: string[];
  documents: string[];
  createdAt: string;
  publishedAt: string;
};

const listValues = (items: unknown): string[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object' && 'value' in item) return String((item as { value: string }).value || '');
    return '';
  }).filter(Boolean);
};

const mapCmsDoc = (doc: CmsOpportunityDoc): CmsMappedOpportunity => ({
  id: String(doc.id),
  slug: doc.slug || String(doc.id),
  title: doc.title,
  organization: doc.organization || '',
  type: doc.opportunityType || '',
  shortDescription: doc.shortDescription || '',
  fullDescription: doc.fullDescription || '',
  logoUrl: doc.logoUrl,
  imageUrl: doc.imageUrl,
  country: doc.country || 'Global',
  city: doc.city || '',
  format: doc.format || 'online',
  source: doc.source || 'verified',
  category: doc.category || doc.opportunityType || 'projects',
  direction: doc.direction || 'social',
  participation: doc.participation || 'both',
  ageMin: doc.ageMin,
  ageMax: doc.ageMax,
  deadline: doc.deadline,
  startDate: doc.startDate,
  cost: doc.cost || 'free',
  funding: doc.funding || false,
  finalDeadline: doc.finalDeadline ?? !!doc.deadline,
  registrationOpen: doc.registrationOpen,
  seats: doc.seats || 0,
  savedCount: doc.savedCount || 0,
  editorPick: doc.editorPick || false,
  recommended: doc.recommended || false,
  portfolioValue: doc.portfolioValue || 0,
  officialUrl: doc.officialUrl,
  internalApplicationsEnabled: doc.internalApplicationsEnabled || false,
  languages: listValues(doc.languages),
  skills: listValues(doc.skills),
  keywords: listValues(doc.keywords),
  grades: listValues(doc.grades),
  requirements: listValues(doc.requirements),
  benefits: listValues(doc.benefits),
  documents: listValues(doc.documents),
  createdAt: doc.createdAt || '',
  publishedAt: doc.publishedAt || doc.createdAt || '',
});

export const useCmsOpportunities = () => {
  const language = useCmsLanguage();
  const result = useCmsCollection<CmsOpportunityDoc, CmsMappedOpportunity>({
    path: `/api/opportunities?limit=50&lang=${encodeURIComponent(language)}`,
    map: mapCmsDoc,
  });

  return {
    opportunities: result.data || [],
    isLoading: result.isLoading,
    hasLoadError: result.hasLoadError,
  };
};
