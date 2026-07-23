import { useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../api';

export type CmsOpportunityDoc = {
  id: string | number;
  title: string;
  slug: string;
  organization: string;
  opportunityType: string;
  shortDescription: string;
  fullDescription?: string;
  logoUrl?: string;
  country?: string;
  format?: string;
  ageMin?: number;
  ageMax?: number;
  deadline?: string;
  cost?: string;
  funding?: boolean;
  officialUrl?: string;
  internalApplicationsEnabled?: boolean;
  languages?: Array<{ value: string }> | string[];
  requirements?: Array<{ value: string }> | string[];
  benefits?: Array<{ value: string }> | string[];
  documents?: Array<{ value: string }> | string[];
  createdAt?: string;
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
  country: string;
  format: string;
  ageMin?: number;
  ageMax?: number;
  deadline?: string;
  cost: string;
  funding: boolean;
  officialUrl?: string;
  internalApplicationsEnabled: boolean;
  languages: string[];
  requirements: string[];
  benefits: string[];
  documents: string[];
  createdAt: string;
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
  country: doc.country || 'Global',
  format: doc.format || 'online',
  ageMin: doc.ageMin,
  ageMax: doc.ageMax,
  deadline: doc.deadline,
  cost: doc.cost || 'free',
  funding: doc.funding || false,
  officialUrl: doc.officialUrl,
  internalApplicationsEnabled: doc.internalApplicationsEnabled || false,
  languages: listValues(doc.languages),
  requirements: listValues(doc.requirements),
  benefits: listValues(doc.benefits),
  documents: listValues(doc.documents),
  createdAt: doc.createdAt || '',
});

export const useCmsOpportunities = () => {
  const [opportunities, setOpportunities] = useState<CmsMappedOpportunity[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch(apiUrl('/api/opportunities?limit=50'))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch opportunities');
        return res.json();
      })
      .then((data: { docs: CmsOpportunityDoc[] }) => {
        if (!isMounted) return;
        setOpportunities(data.docs.map(mapCmsDoc));
      })
      .catch(() => {
        if (isMounted) setOpportunities([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return opportunities;
};
