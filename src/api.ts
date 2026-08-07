import type { ApplicationForm, FaqItem, PageKey } from './types';

const env = (import.meta as any).env || {};

const normalizeApiBaseUrl = (value?: string) => {
  return typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
};

const isLocalHostname = (hostname: string) => {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
};

const getUrlHostname = (value: string) => {
  try {
    return new URL(value, typeof window === 'undefined' ? 'http://localhost' : window.location.origin).hostname;
  } catch {
    return '';
  }
};

const sameSiteHostname = (left: string, right: string) => {
  const normalize = (value: string) => value.toLowerCase().replace(/^www\./, '');
  return Boolean(left && right && normalize(left) === normalize(right));
};

export const getApiBaseUrl = () => {
  const configuredApiUrl = normalizeApiBaseUrl(env.VITE_API_URL);
  const configuredDevApiUrl = normalizeApiBaseUrl(env.VITE_DEV_API_URL);
  const isLocalBrowser = typeof window !== 'undefined' && isLocalHostname(window.location.hostname);

  if (env.DEV && isLocalBrowser) {
    if (configuredDevApiUrl) return configuredDevApiUrl;
    if (configuredApiUrl && isLocalHostname(getUrlHostname(configuredApiUrl))) return configuredApiUrl;
    return '';
  }

  if (typeof window !== 'undefined' && configuredApiUrl) {
    const configuredHostname = getUrlHostname(configuredApiUrl);
    if (configuredHostname && sameSiteHostname(configuredHostname, window.location.hostname)) return '';
  }

  return configuredApiUrl;
};

export const apiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  const apiBaseUrl = getApiBaseUrl();
  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const apiAssetUrl = (path?: string) => {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path;
  return apiUrl(path);
};

export interface ApplicationResponse {
  id: string;
  ticketId: string;
  status: 'confirmed' | 'pending' | 'moderation';
}

export const submitTeamMemberApplication = async (
  form: ApplicationForm,
  language = 'ru',
): Promise<ApplicationResponse> => {
  const data = new FormData();

  Object.entries(form).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'portfolioFiles' && Array.isArray(value)) {
      value.forEach((file) => {
        if (file instanceof File) data.append('portfolioFiles', file);
      });
      return;
    }
    if (Array.isArray(value)) {
      data.append(key, JSON.stringify(value));
      return;
    }
    if (key !== 'portfolioFiles') {
      data.append(key, String(value));
    }
  });

  data.append('originalLanguage', language);

  const response = await fetch(apiUrl('/api/team-members'), {
    method: 'POST',
    credentials: 'include',
    body: data,
  });

  if (!response.ok) {
    throw new Error('Failed to submit team member application');
  }

  return response.json();
};

export const submitApplication = submitTeamMemberApplication;

export const fetchFaqs = async (page: PageKey): Promise<FaqItem[]> => {
  const response = await fetch(apiUrl(`/api/faqs?page=${encodeURIComponent(page)}`), {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to load FAQs');
  }

  return response.json();
};

export type ContactSettings = {
  id: string | number;
  email?: string | null;
};
export type OperatorSettingsData = {
  operatorName?: string;
  operatorInn?: string;
  operatorOgrn?: string;
  operatorAddress?: string;
  operatorRegistryNumber?: string;
  operatorRegistryDate?: string;
  contactsEmail?: string;
  contactsPostalAddress?: string;
};

export const fetchOperatorSettings = async (): Promise<OperatorSettingsData | null> => {
  try {
    const response = await fetch(apiUrl('/api/operator-settings?limit=1&depth=1'), {
      credentials: 'include',
    });
    if (!response.ok) return null;
    const data = await response.json() as { docs: OperatorSettingsData[] };
    return data.docs?.[0] ?? null;
  } catch {
    return null;
  }
};

export const fetchContactSettings = async (): Promise<ContactSettings | null> => {
  try {
    const response = await fetch(apiUrl('/api/contact-settings?limit=1&depth=1'), {
      credentials: 'include',
    });
    if (!response.ok) return null;
    const data = await response.json() as { docs: ContactSettings[] };
    return data.docs?.[0] ?? null;
  } catch {
    return null;
  }
};
