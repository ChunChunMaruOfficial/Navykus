import type { TFunction } from 'i18next';
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
  displayDate?: string;
  showTime?: boolean;
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
  audience?: string;
  outcomesText?: string;
  prerequisites?: string;
};

const listValues = (items: unknown): string[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object' && 'value' in item) return String((item as { value?: string }).value || '');
    return '';
  }).filter(Boolean);
};

const splitLines = (value?: string) =>
  (value || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const ACTIVITY_CATEGORIES: readonly ActivityCategory[] = ['educational', 'project', 'social', 'online-meeting', 'workshop', 'team'];

// `eventType` is a category code chosen in the CMS; the keyword guess only covers legacy free text.
const categoryByEventType = (eventType?: string): ActivityCategory => {
  if (ACTIVITY_CATEGORIES.includes(eventType as ActivityCategory)) return eventType as ActivityCategory;
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

const formatDate = (value?: string, language = 'ru', showTime = false) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  if (showTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  return new Intl.DateTimeFormat(language, options).format(date);
};

const FORMAT_LABEL_KEYS: Record<string, string> = {
  online: 'ui.activitiespage.formatOnline',
  offline: 'ui.activitiespage.formatOffline',
  hybrid: 'ui.activitiespage.formatHybrid',
};

const mapCmsEvent = (doc: CmsEventDoc, language: string, t: TFunction): ActivityItem => {
  const materials = listValues(doc.materials);
  const languageNames = listValues(doc.languages).map((code) => t(`languages.${code}`, { defaultValue: code }));
  const formatLabel = doc.format && FORMAT_LABEL_KEYS[doc.format] ? t(FORMAT_LABEL_KEYS[doc.format]) : '';
  const format = [formatLabel, doc.country, doc.format !== 'online' ? doc.venue : ''].filter(Boolean).join(' · ');
  const registrationLine = formatDate(doc.registrationDeadline, language);
  const outcomes = splitLines(doc.outcomesText);

  return {
    id: String(doc.id),
    title: doc.title?.trim() || '',
    shortDescription: doc.shortDescription || '',
    fullDescription: doc.fullDescription || doc.shortDescription || '',
    format,
    date: doc.displayDate?.trim() || formatDate(doc.eventDate, language, Boolean(doc.showTime)),
    imageUrl: apiAssetUrl(doc.imageUrl) || '',
    category: categoryByEventType(doc.eventType),
    status: eventStatus(doc.eventDate),
    who: [doc.audience?.trim(), doc.participantLimit ? t('ui.activitiespage.participantsLimit', { count: doc.participantLimit }) : ''].filter(Boolean).join(' · '),
    benefits: [...outcomes, ...materials],
    speaker: doc.speaker?.trim() || undefined,
    languages: languageNames,
    prerequisites: doc.prerequisites?.trim() || (registrationLine ? t('ui.activitiespage.registrationUntil', { date: registrationLine }) : ''),
    ctaText: '',
    ctaLink: doc.registrationUrl,
  };
};

const hasVisibleEventText = (event: ActivityItem) =>
  Boolean(event.title?.trim() || event.shortDescription?.trim() || event.fullDescription?.trim());

export const useCmsEvents = () => {
  const { i18n, t } = useTranslation();
  const language = (i18n.resolvedLanguage || i18n.language || 'ru').split('-')[0];
  const result = useCmsCollection<CmsEventDoc, ActivityItem>({
    path: `/api/events?limit=50&lang=${encodeURIComponent(language)}`,
    map: (doc) => mapCmsEvent(doc, language, t),
    filter: hasVisibleEventText,
  });
  const events = result.data || [];

  return { events, isLoading: result.isLoading };
};
