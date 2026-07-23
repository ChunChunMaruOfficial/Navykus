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

export const getApiBaseUrl = () => {
  const configuredApiUrl = normalizeApiBaseUrl(env.VITE_API_URL);
  const configuredDevApiUrl = normalizeApiBaseUrl(env.VITE_DEV_API_URL);
  const isLocalBrowser = typeof window !== 'undefined' && isLocalHostname(window.location.hostname);

  if (env.DEV && isLocalBrowser) {
    if (configuredDevApiUrl) return configuredDevApiUrl;
    if (configuredApiUrl && isLocalHostname(getUrlHostname(configuredApiUrl))) return configuredApiUrl;
    return '';
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

const requestJson = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    ...init,
    headers: {
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error((payload as { code?: string }).code || 'API_ERROR');
    error.name = (payload as { code?: string }).code || 'API_ERROR';
    throw error;
  }

  return payload as T;
};

export interface ApplicationResponse {
  id: string;
  ticketId: string;
  status: 'confirmed' | 'pending';
}

export const submitApplication = async (
  form: ApplicationForm,
  source = 'modal',
): Promise<ApplicationResponse> => {
  const data = new FormData();

  Object.entries(form).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'projectFile' && value instanceof File) {
      data.append('projectFile', value);
      return;
    }
    if (key !== 'projectFile') {
      data.append(key, String(value));
    }
  });

  data.append('source', source);

  const response = await fetch(apiUrl('/api/applications'), {
    method: 'POST',
    credentials: 'include',
    body: data,
  });

  if (!response.ok) {
    throw new Error('Failed to submit application');
  }

  return response.json();
};

export const submitCommunityLead = async (payload: {
  name: string;
  age: string;
  location: string;
  contact: string;
  interest?: string;
}) => {
  const response = await fetch(apiUrl('/api/community-leads'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to submit community lead');
  }

  return response.json();
};

export const fetchFaqs = async (page: PageKey): Promise<FaqItem[]> => {
  const response = await fetch(apiUrl(`/api/faqs?page=${encodeURIComponent(page)}`), {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to load FAQs');
  }

  return response.json();
};

export type PlatformUser = {
  id: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  accountStatus: 'active' | 'blocked' | 'pending';
  emailVerified?: boolean;
  firstName?: string;
  lastName?: string;
  name?: string;
  avatarUrl?: string;
  avatarAlt?: string;
  avatarPositionX: number;
  avatarPositionY: number;
  avatarScale: number;
  country?: string;
  city?: string;
  dateOfBirth?: string;
  ageGroup?: string;
  school?: string;
  schoolGrade?: string;
  biography?: string;
  interests: string[];
  skills: string[];
  languages: string[];
  portfolio?: string;
  preferredLanguage?: string;
  preferredLanguageMode?: 'auto' | 'manual';
  socialLinks: Array<{ label: string; url: string }>;
  teamSearchAvailable: boolean;
  publicProfile: boolean;
  privacy: {
    showCity: boolean;
    showSchool: boolean;
    showAge: boolean;
    showEmail: boolean;
    showSocialLinks: boolean;
  };
};

const REMEMBERED_PLATFORM_ACCOUNT_KEY = 'navykus.rememberedPlatformAccount';

export type RememberedPlatformAccount = {
  email: string;
  token?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  savedAt: string;
};

const browserStorage = () => {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

export const getRememberedPlatformAccount = (): RememberedPlatformAccount | undefined => {
  const storage = browserStorage();
  if (!storage) return undefined;

  try {
    const raw = storage.getItem(REMEMBERED_PLATFORM_ACCOUNT_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<RememberedPlatformAccount>;
    if (!parsed.email || typeof parsed.email !== 'string') return undefined;
    return {
      email: parsed.email,
      token: typeof parsed.token === 'string' ? parsed.token : undefined,
      name: typeof parsed.name === 'string' ? parsed.name : undefined,
      firstName: typeof parsed.firstName === 'string' ? parsed.firstName : undefined,
      lastName: typeof parsed.lastName === 'string' ? parsed.lastName : undefined,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
    };
  } catch {
    return undefined;
  }
};

export const rememberPlatformAccount = (
  user: Pick<PlatformUser, 'email' | 'firstName' | 'lastName' | 'name'>,
  token?: string,
) => {
  const storage = browserStorage();
  if (!storage || !user.email) return;

  const remembered: RememberedPlatformAccount = {
    email: user.email,
    token,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    savedAt: new Date().toISOString(),
  };

  try {
    storage.setItem(REMEMBERED_PLATFORM_ACCOUNT_KEY, JSON.stringify(remembered));
  } catch {
    // Browser privacy settings can disable localStorage.
  }
};

export type FavoriteItem = {
  id: string | number;
  itemType: string;
  itemId: string;
  itemTitle: string;
  href: string;
  createdAt?: string;
};

export type PlatformApplication = {
  id: string | number;
  ticketId: string;
  status: string;
  itemType?: string;
  itemId?: string;
  itemTitle?: string;
  name?: string;
  email?: string;
  adminComment?: string;
  internalNotes?: string;
  createdAt?: string;
};

export type NotificationItem = {
  id: string | number;
  type: string;
  relatedType?: string;
  relatedId?: string;
  href?: string;
  data?: Record<string, unknown>;
  readAt?: string;
  createdAt?: string;
};

export type Participant = {
  id: string;
  name: string;
  country?: string;
  city?: string;
  ageGroup?: string;
  school?: string;
  interests: string[];
  skills: string[];
  languages: string[];
  biography?: string;
  portfolio?: string;
  socialLinks: Array<{ label: string; url: string }>;
  email?: string;
  avatarUrl?: string;
  avatarAlt?: string;
  avatarPositionX?: number;
  avatarPositionY?: number;
  avatarScale?: number;
  teamSearchAvailable: boolean;
};

export type CatalogDoc = {
  id: string | number;
  title: string;
  slug?: string;
  type?: string;
  eventType?: string;
  opportunityType?: string;
  organization?: string;
  shortDescription?: string;
  description?: string;
  fullDescription?: string;
  date?: string;
  eventDate?: string;
  deadline?: string;
  registrationDeadline?: string;
  format?: string;
  country?: string;
  isPublished?: boolean;
  status?: string;
  message?: string;
};

export type BlogPostDoc = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  cover?: string;
  coverAlt?: string;
  category: string;
  tags: string[];
  status: string;
  author: { id: string; name: string };
  originalLanguage: string;
  slug: string;
  seoTitle?: string;
  seoDescription?: string;
  readingTime: number;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  moderationComment?: string;
  translationPending?: boolean;
};

export type BlogLocalizationSummary = {
  language: string;
  translationStatus: string;
};

export type ContactSettings = {
  id: string | number;
  email?: string | null;
  phone?: string | null;
  telegram?: string | null;
  address?: string | null;
};

export type BlogModerationHistoryEntry = {
  id: string;
  previousStatus: string;
  status: string;
  comment?: string;
  actor: string;
  createdAt: string;
};

export const platformApi = {
  me: () => requestJson<{ user: PlatformUser }>('/api/auth/me'),
  login: (payload: { email: string; password: string }) =>
    requestJson<{ user: PlatformUser; token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload: Record<string, unknown>) =>
    requestJson<{ user: PlatformUser; token: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  quickLogin: (token: string) =>
    requestJson<{ user: PlatformUser }>('/api/auth/quick-login', { method: 'POST', body: JSON.stringify({ token }) }),
  logout: () => requestJson<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  sendCode: (email: string) =>
    requestJson<{ status: string }>('/api/auth/send-code', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyCode: (payload: { email: string; code: string }) =>
    requestJson<{ user: PlatformUser; token: string }>('/api/auth/verify-code', { method: 'POST', body: JSON.stringify(payload) }),
  verifyEmail: (code: string) =>
    requestJson<{ status: string }>('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ code }) }),
  resendVerification: () =>
    requestJson<{ status: string }>('/api/auth/resend-verification', { method: 'POST' }),
  deleteProfile: () => requestJson<{ ok: boolean }>('/api/profile', { method: 'DELETE' }),
  forgotPassword: (email: string) =>
    requestJson<{ status: string; resetToken?: string }>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (payload: { token: string; password: string; passwordConfirmation: string }) =>
    requestJson<{ status: string }>('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  updateProfile: (payload: Record<string, unknown>) =>
    requestJson<{ user: PlatformUser }>('/api/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  uploadAvatar: (file: File) => {
    const data = new FormData();
    data.append('avatar', file);
    return requestJson<{ user: PlatformUser }>('/api/profile/avatar', { method: 'POST', body: data });
  },
  participants: (query = '') =>
    requestJson<{ docs: Participant[]; totalDocs: number; totalPages: number }>(`/api/participants${query}`),
  participant: (id: string) => requestJson<{ participant: Participant }>(`/api/participants/${encodeURIComponent(id)}`),
  favorites: (type = 'all') => requestJson<{ docs: FavoriteItem[] }>(`/api/profile/favorites?type=${encodeURIComponent(type)}`),
  addFavorite: (payload: Omit<FavoriteItem, 'id' | 'createdAt'>) =>
    requestJson<{ favorite: FavoriteItem }>('/api/profile/favorites', { method: 'POST', body: JSON.stringify(payload) }),
  removeFavorite: (id: string | number) => requestJson<{ ok: boolean }>(`/api/profile/favorites/${id}`, { method: 'DELETE' }),
  notifications: () => requestJson<{ docs: NotificationItem[]; unread: number }>('/api/profile/notifications'),
  markNotificationRead: (id: string | number) =>
    requestJson<{ notification: NotificationItem }>(`/api/profile/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => requestJson<{ ok: boolean }>('/api/profile/notifications/read-all', { method: 'POST' }),
  applications: () => requestJson<{ docs: PlatformApplication[] }>('/api/profile/applications'),
  createApplication: (payload: Record<string, unknown>) =>
    requestJson<{ application: PlatformApplication }>('/api/profile/applications', { method: 'POST', body: JSON.stringify(payload) }),
  updateApplication: (id: string | number, payload: Record<string, unknown>) =>
    requestJson<{ application: PlatformApplication }>(`/api/profile/applications/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  teamDashboard: () => requestJson<{ posts: CatalogDoc[]; responses: CatalogDoc[] }>('/api/profile/team'),
  createTeamPost: (payload: Record<string, unknown>) =>
    requestJson<{ post: CatalogDoc }>('/api/profile/team-posts', { method: 'POST', body: JSON.stringify(payload) }),
  respondToTeamPost: (id: string | number, payload: Record<string, unknown>) =>
    requestJson<{ response: CatalogDoc }>(`/api/team-posts/${id}/responses`, { method: 'POST', body: JSON.stringify(payload) }),
  catalog: (type: 'championships' | 'events' | 'opportunities' | 'activities', query = '') =>
    requestJson<{ docs: CatalogDoc[]; totalDocs: number; totalPages: number }>(`/api/${type}${query}`),
  adminSummary: () => requestJson<Record<string, number>>('/api/admin/summary'),
  adminUsers: (query = '') => requestJson<{ docs: PlatformUser[] }>(`/api/admin/users${query}`),
  adminUpdateUser: (id: string, payload: Record<string, unknown>) =>
    requestJson<{ user: PlatformUser }>(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  adminApplications: () => requestJson<{ docs: PlatformApplication[] }>('/api/admin/applications'),
  adminUpdateApplication: (id: string | number, payload: Record<string, unknown>) =>
    requestJson<{ application: PlatformApplication }>(`/api/admin/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  createTeamMember: (payload: Record<string, unknown>) =>
    requestJson<{ doc: Record<string, unknown> }>('/api/team-members', { method: 'POST', body: JSON.stringify(payload) }),
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

export const blogApi = {
  list: (params: Record<string, string> = {}) =>
    requestJson<{ docs: BlogPostDoc[]; totalDocs: number; totalPages: number; page: number; language: string }>(`/api/blog/posts?${new URLSearchParams(params)}`),
  get: (slug: string, lang = 'ru') =>
    requestJson<{ post: BlogPostDoc }>(`/api/blog/posts/${encodeURIComponent(slug)}?lang=${lang}`),
  create: (payload: Record<string, unknown>) =>
    requestJson<{ post: BlogPostDoc }>('/api/blog/posts', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: Record<string, unknown>) =>
    requestJson<{ post: BlogPostDoc }>(`/api/blog/posts/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  delete: (id: string) =>
    requestJson<{ ok: boolean }>(`/api/blog/posts/${id}`, { method: 'DELETE' }),
  myPosts: () =>
    requestJson<{ docs: BlogPostDoc[] }>('/api/profile/blog'),
  history: (id: string) =>
    requestJson<{ docs: BlogModerationHistoryEntry[] }>(`/api/blog/posts/${id}/history`),
  adminList: (params: Record<string, string> = {}) =>
    requestJson<{ docs: (BlogPostDoc & { localizations: BlogLocalizationSummary[] })[] }>(`/api/admin/blog?${new URLSearchParams(params)}`),
};
