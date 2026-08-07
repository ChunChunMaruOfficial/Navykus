import { useTranslation } from 'react-i18next';

import { apiAssetUrl } from '../api';
import type { ActivityCategory, ActivityItem, ActivityStatus } from '../types';
import { useCmsCollection } from './useCmsCollection';

type CmsEventDoc = {
  id: string | number;
  title?: string;
  slug?: string;
  shortDescription?: string;
  fullDescription?: string;
  imageUrl?: string;
  eventType?: string;
  eventDate?: string;
  timeZone?: string;
  registrationDeadline?: string;
  participantLimit?: number;
  format?: 'online' | 'offline' | 'hybrid';
  country?: string;
  venue?: string;
  onlineLink?: string;
  registrationUrl?: string;
  speaker?: string;
  languages?: Array<{ value: string }> | string[];
  materials?: Array<{ value: string }> | string[];
};

const listValues = (items: unknown): string[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object' && 'value' in item) return String((item as { value?: string }).value || '');
    return '';
  }).filter(Boolean);
};

const categoryByEventType = (eventType?: string): ActivityCategory => {
  const value = (eventType || '').toLowerCase();
  if (value.includes('hack') || value.includes('project') || value.includes('case')) return 'project';
  if (value.includes('network') || value.includes('forum') || value.includes('meet')) return 'social';
  if (value.includes('workshop') || value.includes('master')) return 'workshop';
  if (value.includes('team')) return 'team';
  if (value.includes('online') || value.includes('webinar')) return 'online-meeting';
  return 'educational';
};

const eventStatus = (eventDate?: string): ActivityStatus => {
  if (!eventDate) return 'coming';
  const date = new Date(eventDate);
  if (Number.isNaN(date.getTime())) return 'coming';
  return date.getTime() >= Date.now() ? 'coming' : 'completed';
};

const formatEventDate = (eventDate?: string, language = 'ru') => {
  if (!eventDate) return '';
  const date = new Date(eventDate);
  if (Number.isNaN(date.getTime())) return eventDate;
  return new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const mapCmsEvent = (doc: CmsEventDoc, language: string): ActivityItem => {
  const materials = listValues(doc.materials);
  const languages = listValues(doc.languages);
  const format = [doc.format, doc.country, doc.venue].filter(Boolean).join(' · ');
  const registrationLine = doc.registrationDeadline
    ? `${new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(doc.registrationDeadline))}`
    : '';

  return {
    id: String(doc.id),
    title: doc.title || doc.slug || String(doc.id),
    shortDescription: doc.shortDescription || '',
    fullDescription: doc.fullDescription || doc.shortDescription || '',
    format: format || doc.format || '',
    date: formatEventDate(doc.eventDate, language),
    imageUrl: apiAssetUrl(doc.imageUrl) || '',
    category: categoryByEventType(doc.eventType),
    status: eventStatus(doc.eventDate),
    who: [doc.speaker, doc.participantLimit ? `${doc.participantLimit} participants` : '', doc.country].filter(Boolean).join(' · '),
    benefits: [...languages, ...materials],
    prerequisites: registrationLine ? `Registration deadline: ${registrationLine}` : '',
    ctaText: 'Apply',
    ctaLink: doc.registrationUrl,
  };
};

export const useCmsEvents = () => {
  const { i18n } = useTranslation();
  const language = (i18n.resolvedLanguage || i18n.language || 'ru').split('-')[0];
  const result = useCmsCollection<CmsEventDoc, ActivityItem>({
    path: `/api/events?limit=50&lang=${encodeURIComponent(language)}`,
    map: (doc) => mapCmsEvent(doc, language),
  });
  const events = result.data || [];

  return { events, isLoading: result.isLoading };
};
