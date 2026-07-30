import type { Express, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';

import fs from 'node:fs';
import path from 'node:path';

import multer from 'multer';

import type { RequiredDataFromCollectionSlug } from 'payload';

import { getPayloadClient } from './payload';
import { applyLocalizations, languageFromRequest } from './content-localizations';
import { evaluatePassword } from './password-policy';
import { processPendingContentLocalizations, retryContentLocalization, SUPPORTED_CONTENT_COLLECTIONS } from '../src/payload/localization';
import { syncBlogPublicationData, syncPublishedDraftData, syncTeamMemberPublicationData } from '../src/payload/fields';
import { adminVerificationRecipient, normalizeEmail } from '../src/security/admin-auth';
import {
  ADMIN_CONTENT_TYPES,
  getAdminContentType,
  getAdminContentTypeByCollection,
  type AdminContentField,
  type AdminContentType,
} from '../src/content-admin-registry';

type Role = 'user' | 'moderator' | 'admin';
type PlatformUser = {
  id: string;
  email: string;
  role: Role;
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

type AuthenticatedRequest = Request & {
  platformUser?: PlatformUser;
};

const SESSION_COOKIE = 'navykus_session';
const USER_COLLECTION = 'users' as const;
type UserWriteData = RequiredDataFromCollectionSlug<typeof USER_COLLECTION>;
type ProfileUpdateData = Partial<UserWriteData> & Record<string, unknown>;
const STAFF_ROLES = new Set<Role>(['admin', 'moderator']);
const avatarUploadDir = path.resolve(process.cwd(), 'uploads', 'avatars');
const allowedAvatarTypes = new Map([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
]);
const APPLICATION_STATUSES = new Set([
  'draft',
  'submitted',
  'under_review',
  'clarification_required',
  'approved',
  'rejected',
  'cancelled',
]);
const SUPPORTED_LANGUAGES = new Set(['ru', 'en', 'kk', 'uz', 'ar', 'de', 'es', 'tr']);
const TEAM_MEMBER_MODERATION_STATUSES = new Set(['pending', 'approved', 'rejected', 'needs_edit']);
const TRANSLATION_STATUSES = new Set(['pending', 'in_progress', 'ready', 'failed']);

fs.mkdirSync(avatarUploadDir, { recursive: true });

const avatarUpload = multer({
  dest: avatarUploadDir,
  limits: {
    fileSize: 4 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const expectedMime = allowedAvatarTypes.get(extension);

    if (!expectedMime || expectedMime !== file.mimetype) {
      callback(new Error('UNSUPPORTED_FILE_TYPE'));
      return;
    }

    callback(null, true);
  },
});

const listValues = (items: unknown): string[] => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'value' in item) return String(item.value || '');
      return '';
    })
    .filter(Boolean);
};

const clampNumber = (value: unknown, min: number, max: number, fallback: number) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
};

const startsWithBytes = (buffer: Buffer, bytes: number[]) => {
  return bytes.every((byte, index) => buffer[index] === byte);
};

const isExpectedAvatarContent = async (file: Express.Multer.File) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const buffer = await fs.promises.readFile(file.path);

  if (extension === '.jpg' || extension === '.jpeg') {
    return startsWithBytes(buffer, [0xff, 0xd8, 0xff]);
  }
  if (extension === '.png') {
    return startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }
  if (extension === '.webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }

  return false;
};

const removeUploadedFile = async (file?: Express.Multer.File) => {
  if (!file) return;
  await fs.promises.unlink(file.path).catch(() => undefined);
};

const relationId = (value: unknown) => {
  if (typeof value === 'number' || typeof value === 'string') return String(value);
  if (value && typeof value === 'object' && 'id' in value) return String(value.id);
  return undefined;
};

const payloadId = (value: string | number) => {
  if (typeof value === 'number') return value;
  return /^\d+$/.test(value) ? Number(value) : value;
};

const parseCookies = (header?: string) => {
  const cookies = new Map<string, string>();
  if (!header) return cookies;

  header.split(';').forEach((part) => {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (!rawName || rawValue.length === 0) return;
    cookies.set(rawName, decodeURIComponent(rawValue.join('=')));
  });

  return cookies;
};

const getBearerToken = (req: Request) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice('Bearer '.length);
  return parseCookies(req.headers.cookie).get(SESSION_COOKIE);
};

const setSessionCookie = (res: Response, token: string, exp?: number) => {
  const maxAge = exp ? Math.max(0, exp * 1000 - Date.now()) : 7 * 24 * 60 * 60 * 1000;

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  });
};

const clearSessionCookie = (res: Response) => {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
};

const normalizeUser = (doc: Record<string, unknown>): PlatformUser => ({
  id: String(doc.id),
  email: String(doc.email || ''),
  role: (doc.role === 'admin' || doc.role === 'moderator' ? doc.role : 'user') as Role,
  accountStatus: (doc.accountStatus === 'blocked' || doc.accountStatus === 'pending' ? doc.accountStatus : 'active') as 'active' | 'blocked' | 'pending',
  emailVerified: Boolean(doc.emailVerified),
  firstName: typeof doc.firstName === 'string' ? doc.firstName : undefined,
  lastName: typeof doc.lastName === 'string' ? doc.lastName : undefined,
  name: typeof doc.name === 'string' ? doc.name : undefined,
  avatarUrl: typeof doc.avatarUrl === 'string' ? doc.avatarUrl : undefined,
  avatarAlt: typeof doc.avatarAlt === 'string' ? doc.avatarAlt : undefined,
  avatarPositionX: clampNumber(doc.avatarPositionX, 0, 100, 50),
  avatarPositionY: clampNumber(doc.avatarPositionY, 0, 100, 50),
  avatarScale: clampNumber(doc.avatarScale, 1, 2, 1),
  country: typeof doc.country === 'string' ? doc.country : undefined,
  city: typeof doc.city === 'string' ? doc.city : undefined,
  dateOfBirth: typeof doc.dateOfBirth === 'string' ? doc.dateOfBirth : undefined,
  ageGroup: typeof doc.ageGroup === 'string' ? doc.ageGroup : undefined,
  school: typeof doc.school === 'string' ? doc.school : undefined,
  schoolGrade: typeof doc.schoolGrade === 'string' ? doc.schoolGrade : undefined,
  biography: typeof doc.biography === 'string' ? doc.biography : undefined,
  interests: listValues(doc.interests),
  skills: listValues(doc.skills),
  languages: listValues(doc.languages),
  portfolio: typeof doc.portfolio === 'string' ? doc.portfolio : undefined,
  preferredLanguage: typeof doc.preferredLanguage === 'string' && SUPPORTED_LANGUAGES.has(doc.preferredLanguage) ? doc.preferredLanguage : undefined,
  preferredLanguageMode: doc.preferredLanguageMode === 'manual' ? 'manual' : 'auto',
  socialLinks: Array.isArray(doc.socialLinks)
    ? doc.socialLinks
      .map((link) => {
        if (!link || typeof link !== 'object') return undefined;
        return {
          label: String((link as unknown as Record<string, unknown>).label || ''),
          url: String((link as unknown as Record<string, unknown>).url || ''),
        };
      })
      .filter((link): link is { label: string; url: string } => Boolean(link?.label && link.url))
    : [],
  teamSearchAvailable: Boolean(doc.teamSearchAvailable),
  publicProfile: Boolean(doc.publicProfile),
  privacy: {
    showCity: Boolean((doc.privacy as Record<string, unknown> | undefined)?.showCity),
    showSchool: Boolean((doc.privacy as Record<string, unknown> | undefined)?.showSchool),
    showAge: Boolean((doc.privacy as Record<string, unknown> | undefined)?.showAge),
    showEmail: Boolean((doc.privacy as Record<string, unknown> | undefined)?.showEmail),
    showSocialLinks: Boolean((doc.privacy as Record<string, unknown> | undefined)?.showSocialLinks),
  },
});

const publicParticipant = (doc: Record<string, unknown>) => {
  const user = normalizeUser(doc);
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || user.email.split('@')[0];

  return {
    id: user.id,
    name: displayName,
    country: user.country,
    city: user.privacy.showCity ? user.city : undefined,
    ageGroup: user.privacy.showAge ? user.ageGroup : undefined,
    school: user.privacy.showSchool ? user.school : undefined,
    interests: user.interests,
    skills: user.skills,
    languages: user.languages,
    biography: user.biography,
    portfolio: user.portfolio,
    socialLinks: user.privacy.showSocialLinks ? user.socialLinks : [],
    email: user.privacy.showEmail ? user.email : undefined,
    teamSearchAvailable: user.teamSearchAvailable,
    avatarUrl: user.avatarUrl,
    avatarAlt: user.avatarAlt,
    avatarPositionX: user.avatarPositionX,
    avatarPositionY: user.avatarPositionY,
    avatarScale: user.avatarScale,
  };
};

const publicApplication = (doc: unknown) => {
  const record = { ...(doc as Record<string, unknown>) };
  delete record.internalNotes;
  delete record.internal_notes;
  return record;
};

const publicTeamMemberModeration = (doc: unknown) => {
  const record = doc as Record<string, unknown>;
  return {
    id: String(record.id),
    name: String(record.name || ''),
    age: Number(record.age || 0),
    country: String(record.country || ''),
    city: typeof record.city === 'string' ? record.city : undefined,
    shortBio: String(record.shortBio || ''),
    interests: listValues(record.interests),
    skills: listValues(record.skills),
    targetRoles: Array.isArray(record.targetRoles) ? record.targetRoles.map(String) : [],
    targetProject: typeof record.targetProject === 'string' ? record.targetProject : undefined,
    whyLooking: String(record.whyLooking || ''),
    contact: String(record.contact || ''),
    contactType: String(record.contactType || ''),
    moderationStatus: String(record.moderationStatus || (record.isApproved ? 'approved' : 'pending')),
    moderationComment: typeof record.moderationComment === 'string' ? record.moderationComment : undefined,
    isApproved: Boolean(record.isApproved),
    reviewedAt: typeof record.reviewedAt === 'string' ? record.reviewedAt : undefined,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : undefined,
  };
};

const publicTranslationRecord = (doc: unknown) => {
  const record = doc as Record<string, unknown>;
  return {
    id: String(record.id),
    sourceCollection: String(record.sourceCollection || ''),
    sourceId: String(record.sourceId || ''),
    language: String(record.language || ''),
    translationStatus: String(record.translationStatus || ''),
    attempts: Number(record.attempts || 0),
    errorMessage: typeof record.errorMessage === 'string' ? record.errorMessage : undefined,
    generatedAt: typeof record.generatedAt === 'string' ? record.generatedAt : undefined,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : undefined,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : undefined,
  };
};

const writeAdminAudit = async (
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  actor: Pick<PlatformUser, 'id' | 'email'> | undefined,
  action: string,
  collection: string,
  documentId = '',
  summary?: string,
) => {
  await payload.create({
    collection: 'audit-logs' as any,
    data: {
      action,
      collection,
      documentId,
      actorId: actor?.id,
      actorEmail: actor?.email,
      changedFields: [],
      summary: summary || `${action} ${collection}:${documentId}`,
    },
    overrideAccess: true,
  }).catch(() => undefined);
};

const getAuthenticatedUser = async (req: Request) => {
  const token = getBearerToken(req);
  if (!token) return undefined;

  const payload = await getPayloadClient();
  const result = await payload.auth({
    headers: new Headers({
      Authorization: `Bearer ${token}`,
      DisableAutologin: 'true',
    }),
  }).catch(() => undefined);

  if (!result?.user) return undefined;
  const user = normalizeUser(result.user as unknown as Record<string, unknown>);
  return user.accountStatus === 'blocked' ? undefined : user;
};

const requireUser = async (req: AuthenticatedRequest, res: Response) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ code: 'AUTH_REQUIRED' });
    return undefined;
  }
  req.platformUser = user;
  return user;
};

const requireStaff = async (req: AuthenticatedRequest, res: Response) => {
  const user = await requireUser(req, res);
  if (!user) return undefined;
  if (!STAFF_ROLES.has(user.role)) {
    res.status(403).json({ code: 'FORBIDDEN' });
    return undefined;
  }
  return user;
};

const pickProfileUpdate = (body: Record<string, unknown>): ProfileUpdateData => {
  const list = (value: unknown) => Array.isArray(value) ? value.map(String).filter(Boolean).map((item) => ({ value: item })) : [];
  const bool = (value: unknown) => Boolean(value);
  const socialLinks = Array.isArray(body.socialLinks)
    ? body.socialLinks.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const link = item as Record<string, unknown>;
      const label = typeof link.label === 'string' ? link.label.trim() : '';
      const url = typeof link.url === 'string' ? link.url.trim() : '';
      return label && url ? [{ label, url }] : [];
    })
    : [];

  return {
    firstName: typeof body.firstName === 'string' ? body.firstName.trim() : undefined,
    lastName: typeof body.lastName === 'string' ? body.lastName.trim() : undefined,
    name: [body.firstName, body.lastName].filter((item) => typeof item === 'string' && item.trim()).join(' '),
    country: typeof body.country === 'string' ? body.country.trim() : undefined,
    city: typeof body.city === 'string' ? body.city.trim() : undefined,
    dateOfBirth: typeof body.dateOfBirth === 'string' ? body.dateOfBirth : undefined,
    ageGroup: typeof body.ageGroup === 'string' ? body.ageGroup.trim() : undefined,
    school: typeof body.school === 'string' ? body.school.trim() : undefined,
    schoolGrade: typeof body.schoolGrade === 'string' ? body.schoolGrade.trim() : undefined,
    biography: typeof body.biography === 'string' ? body.biography.trim() : undefined,
    interests: list(body.interests),
    skills: list(body.skills),
    languages: list(body.languages),
    portfolio: typeof body.portfolio === 'string' ? body.portfolio.trim() : undefined,
    preferredLanguage: typeof body.preferredLanguage === 'string' && SUPPORTED_LANGUAGES.has(body.preferredLanguage) ? (body.preferredLanguage as UserWriteData['preferredLanguage']) : undefined,
    preferredLanguageMode: body.preferredLanguageMode === 'manual' ? 'manual' : 'auto',
    socialLinks,
    avatarPositionX: clampNumber(body.avatarPositionX, 0, 100, 50),
    avatarPositionY: clampNumber(body.avatarPositionY, 0, 100, 50),
    avatarScale: clampNumber(body.avatarScale, 1, 2, 1),
    teamSearchAvailable: bool(body.teamSearchAvailable),
    publicProfile: bool(body.publicProfile),
    privacy: {
      showCity: bool((body.privacy as Record<string, unknown> | undefined)?.showCity),
      showSchool: bool((body.privacy as Record<string, unknown> | undefined)?.showSchool),
      showAge: bool((body.privacy as Record<string, unknown> | undefined)?.showAge),
      showEmail: bool((body.privacy as Record<string, unknown> | undefined)?.showEmail),
      showSocialLinks: bool((body.privacy as Record<string, unknown> | undefined)?.showSocialLinks),
    },
  };
};

const createNotification = async (data: {
  user: string;
  type: string;
  relatedType?: string;
  relatedId?: string;
  href?: string;
  values?: Record<string, unknown>;
}) => {
  const payload = await getPayloadClient();
  await payload.create({
    collection: 'notifications' as any,
    data: {
      user: payloadId(data.user),
      type: data.type,
      relatedType: data.relatedType,
      relatedId: data.relatedId,
      href: data.href,
      data: data.values || {},
    },
    overrideAccess: true,
  });
};

const pageOptions = (req: Request) => ({
  page: Math.max(1, Number(req.query.page || 1)),
  limit: Math.min(50, Math.max(1, Number(req.query.limit || 12))),
});

const payloadUserForStaff = async (payload: Awaited<ReturnType<typeof getPayloadClient>>, staff: PlatformUser) => {
  const result = await payload.find({
    collection: USER_COLLECTION,
    where: { email: { equals: staff.email } },
    limit: 1,
    overrideAccess: true,
  });
  return result.docs[0];
};

const payloadRequestForStaff = async (payload: Awaited<ReturnType<typeof getPayloadClient>>, staff: PlatformUser) => {
  const user = await payloadUserForStaff(payload, staff);
  if (!user) throw new Error('ADMIN_PAYLOAD_USER_NOT_FOUND');
  return { user, payload } as any;
};

const listPayloadValues = (value: unknown) => {
  if (typeof value === 'string') {
    return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean).map((item) => ({ value: item }));
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object' && 'value' in item) return String((item as Record<string, unknown>).value || '').trim();
      return '';
    })
    .filter(Boolean)
    .map((item) => ({ value: item }));
};

const multiSelectValues = (value: unknown) => {
  if (typeof value === 'string') return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
  if (!Array.isArray(value)) return [];
  return value.map(String).map((item) => item.trim()).filter(Boolean);
};

const sanitizeAdminFieldValue = (field: AdminContentField, rawValue: unknown, isCreate: boolean) => {
  const value = rawValue === undefined && isCreate ? field.defaultValue : rawValue;
  if (value === undefined) return undefined;

  if (field.type === 'checkbox') return Boolean(value);
  if (field.type === 'number') {
    if (value === '' || value === null) return field.required ? 0 : null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : field.required ? 0 : null;
  }
  if (field.type === 'list') return listPayloadValues(value);
  if (field.type === 'multiselect') return multiSelectValues(value);
  if (field.type === 'select') {
    const text = String(value || '').trim();
    if (!text) return field.required ? field.defaultValue || field.options?.[0] : undefined;
    if (field.options?.length && !field.options.includes(text)) return field.defaultValue || field.options[0];
    return text;
  }
  if (field.type === 'date') {
    const text = String(value || '').trim();
    return text || (field.required ? new Date().toISOString() : null);
  }
  if (field.type === 'hidden') return value;
  return String(value ?? '').trim();
};

const sanitizeAdminContentData = (
  type: AdminContentType,
  body: Record<string, unknown>,
  isCreate: boolean,
  payloadUserId: string | number,
  originalDoc?: Record<string, unknown>,
) => {
  const data: Record<string, unknown> = {};

  for (const field of type.fields) {
    const value = sanitizeAdminFieldValue(field, body[field.name], isCreate);
    if (value !== undefined) data[field.name] = value;
  }

  if (type.collection === 'blog-posts' && isCreate && !data.author) {
    data.author = payloadId(payloadUserId);
  }
  if (type.collection === 'experts' && data.tournamentId) {
    data.tournamentId = payloadId(String(data.tournamentId));
  }
  if (type.collection === 'blog-posts') {
    syncBlogPublicationData(data, originalDoc);
  } else if (type.collection === 'team-members') {
    syncTeamMemberPublicationData(data, originalDoc);
  } else if (type.supportsDraftStatus && (type.usesPublishedFlag || type.requiresPublishedFlag)) {
    syncPublishedDraftData(data, originalDoc);
  }

  return data;
};

const adminContentSearchWhere = (type: AdminContentType, q: unknown) => {
  const query = typeof q === 'string' ? q.trim() : '';
  if (!query) return {};
  return { or: type.searchFields.map((field) => ({ [field]: { like: query } })) };
};

const serializeAdminContentDoc = (type: AdminContentType, doc: Record<string, unknown>) => {
  const previewId = encodeURIComponent(String(doc.id || ''));
  const slug = typeof doc.slug === 'string' && doc.slug.trim() ? encodeURIComponent(doc.slug.trim()) : '';
  const publicPreviewUrl = type.key === 'opportunities' && slug
    ? `/activities/opportunities/${slug}?previewId=${previewId}`
    : type.key === 'blog' && slug
      ? `/blog/${slug}?previewId=${previewId}`
      : type.publicPath
        ? `${type.publicPath}?previewId=${previewId}`
        : undefined;
  return {
    ...doc,
    publicPreviewUrl,
  };
};

const cleanupContentLocalizations = async (
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  collection: string,
  id: string | number,
) => {
  if (!(SUPPORTED_CONTENT_COLLECTIONS as readonly string[]).includes(collection)) return;
  await payload.delete({
    collection: 'content-localizations' as any,
    where: {
      and: [
        { sourceCollection: { equals: collection } },
        { sourceId: { equals: String(id) } },
      ],
    },
    overrideAccess: true,
  }).catch(() => undefined);
};

const checkTranslationProvider = async () => {
  const provider = process.env.TRANSLATION_PROVIDER === 'libretranslate'
    ? 'libretranslate'
    : process.env.TRANSLATION_PROVIDER === 'mymemory'
      ? 'mymemory'
      : 'google';
  try {
    let response: globalThis.Response;
    if (provider === 'libretranslate') {
      response = await fetch(process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: 'test',
          source: 'en',
          target: 'de',
          format: 'text',
          ...(process.env.LIBRETRANSLATE_API_KEY ? { api_key: process.env.LIBRETRANSLATE_API_KEY } : {}),
        }),
        signal: AbortSignal.timeout(6000),
      });
    } else if (provider === 'google') {
      const url = new URL(process.env.GOOGLE_TRANSLATE_URL || 'https://translate.googleapis.com/translate_a/single');
      url.searchParams.set('client', 'gtx');
      url.searchParams.set('sl', 'en');
      url.searchParams.set('tl', 'de');
      url.searchParams.set('dt', 't');
      url.searchParams.set('q', 'test');
      response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    } else {
      const url = new URL(process.env.MYMEMORY_TRANSLATE_URL || 'https://api.mymemory.translated.net/get');
      url.searchParams.set('q', 'test');
      url.searchParams.set('langpair', 'en|de');
      if (process.env.MYMEMORY_EMAIL) url.searchParams.set('de', process.env.MYMEMORY_EMAIL);
      response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    }
    return {
      ok: response.ok,
      status: response.ok ? 'connected' : `http_${response.status}`,
      provider,
    };
  } catch (error) {
    return { ok: false, status: 'request_failed', provider, message: (error as Error).message };
  }
};

const systemHealth = async () => {
  const payload = await getPayloadClient();
  const db = await payload.find({ collection: USER_COLLECTION, limit: 0 })
    .then(() => ({ ok: true, status: 'connected' }))
    .catch((error) => ({ ok: false, status: 'failed', message: (error as Error).message }));
  const disk = await fs.promises.statfs(process.cwd())
    .then((stats) => {
      const freeBytes = Number(stats.bavail) * Number(stats.bsize);
      const totalBytes = Number(stats.blocks) * Number(stats.bsize);
      const usedPercent = totalBytes > 0 ? Math.round((1 - freeBytes / totalBytes) * 1000) / 10 : 0;
      return { ok: usedPercent < 90, status: usedPercent < 90 ? 'ok' : 'low_space', freeBytes, totalBytes, usedPercent };
    })
    .catch((error) => ({ ok: false, status: 'failed', message: (error as Error).message }));
  const translation = await checkTranslationProvider();
  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  return {
    generatedAt: new Date().toISOString(),
    service: { ok: true, status: 'online', uptimeSeconds: Math.round(process.uptime()) },
    db,
    translation,
    smtp: { ok: smtpConfigured, status: smtpConfigured ? 'configured' : 'missing_config' },
    disk,
  };
};

const publicContentWhere = (collection: string, extra: Record<string, unknown> = {}) => {
  const contentType = getAdminContentTypeByCollection(collection);
  const where: Record<string, unknown> = {};
  if (contentType?.requiresPublishedFlag || contentType?.usesPublishedFlag) where.isPublished = { equals: true };
  if (contentType?.supportsDraftStatus) where._status = { equals: 'published' };
  return { ...where, ...extra };
};

const catalogWhere = (collection: string, req: Request, searchFields: string[], extra: Record<string, unknown> = {}) => {
  const where: Record<string, unknown> = publicContentWhere(collection, extra);
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q) {
    where.or = searchFields.map((field) => ({ [field]: { like: q } }));
  }
  return where;
};

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

const CODE_TTL_MINUTES = 10;

const sendVerificationEmail = async (payload: any, to: string, code: string, subject: string) => {
  if (!process.env.SMTP_HOST) return;
  const recipient = adminVerificationRecipient(to);
  try {
    await payload.sendEmail({
      to: recipient,
      from: `${process.env.SMTP_FROM_NAME || 'Navykus'} <${process.env.SMTP_FROM || 'noreply@navykus.online'}>`,
      subject,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h1 style="font-size: 24px; color: #1b1816;">${subject}</h1>
          <p style="font-size: 14px; color: #5b6472;">Ваш код подтверждения:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 0.5em; color: #bc4638; margin: 24px 0; text-align: center;">${code}</div>
          <p style="font-size: 12px; color: #5b6472;">Код действует ${CODE_TTL_MINUTES} минут. Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

export const registerPlatformRoutes = (app: Express) => {
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { code: 'AUTH_RATE_LIMIT' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/auth/', authLimiter);

  app.post('/api/auth/register', async (req: AuthenticatedRequest, res, next) => {
    try {
      const payload = await getPayloadClient();
      const body = req.body || {};
      const email = normalizeEmail(body.email);
      const password = String(body.password || '');

      if (!email || !password || password.length < 8 || password !== body.passwordConfirmation) {
        res.status(400).json({ code: 'AUTH_INVALID_REGISTRATION' });
        return;
      }
      if (!body.privacyAccepted || !body.termsAccepted) {
        res.status(400).json({ code: 'AUTH_AGREEMENT_REQUIRED' });
        return;
      }
      const passwordWarning = evaluatePassword(password).weak
        ? { weak: true, reasons: evaluatePassword(password).reasons }
        : undefined;

      const existingUser = await payload.find({
        collection: USER_COLLECTION,
        where: { email: { equals: email } },
        limit: 1,
        overrideAccess: true,
      });

      if (existingUser.docs.length > 0) {
        res.status(409).json({ code: 'AUTH_EMAIL_EXISTS' });
        return;
      }

      const userData: UserWriteData = {
        email,
        password,
        role: 'user',
        accountStatus: 'active',
        emailVerified: true,
        verificationCode: generateCode(),
        verificationCodeExpires: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString(),
        ...pickProfileUpdate(body),
      } as any;

      const created = await payload.create({
        collection: USER_COLLECTION,
        data: userData,
        overrideAccess: true,
      }) as any;

      await sendVerificationEmail(payload, email, created.verificationCode, 'Подтвердите вашу почту — Navykus');

      const login = await payload.login({
        collection: USER_COLLECTION,
        data: { email, password },
        overrideAccess: true,
      });

      if (!login.token || !login.user) {
        res.status(401).json({ code: 'AUTH_LOGIN_FAILED' });
        return;
      }
      const user = normalizeUser(login.user as unknown as Record<string, unknown>);
      if (user.accountStatus === 'blocked') {
        res.status(403).json({ code: 'ACCOUNT_BLOCKED' });
        return;
      }

      setSessionCookie(res, login.token, login.exp);
      res.status(201).json({ user, passwordWarning, token: login.token });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/auth/login', async (req, res, next) => {
    try {
      const payload = await getPayloadClient();
      const email = normalizeEmail(req.body?.email);
      const password = String(req.body?.password || '');
      if (!email || !password) {
        res.status(400).json({ code: 'AUTH_CREDENTIALS_REQUIRED' });
        return;
      }
      const login = await payload.login({
        collection: USER_COLLECTION,
        data: { email, password },
        overrideAccess: true,
      });

      if (!login.token || !login.user) {
        res.status(401).json({ code: 'AUTH_LOGIN_FAILED' });
        return;
      }
      const user = normalizeUser(login.user as unknown as Record<string, unknown>);
      if (user.accountStatus === 'blocked') {
        res.status(403).json({ code: 'ACCOUNT_BLOCKED' });
        return;
      }

      setSessionCookie(res, login.token, login.exp);
      await writeAdminAudit(payload, user, 'login', 'users', user.id, `login users:${user.id}`);
      res.json({ user, token: login.token });
    } catch (_error) {
      res.status(401).json({ code: 'AUTH_LOGIN_FAILED' });
    }
  });

  app.post('/api/auth/quick-login', async (req, res, next) => {
    try {
      const token = String(req.body?.token || '');
      if (!token) {
        res.status(400).json({ code: 'AUTH_TOKEN_REQUIRED' });
        return;
      }

      const payload = await getPayloadClient();
      const result = await payload.auth({
        headers: new Headers({
          Authorization: `Bearer ${token}`,
        }),
      }).catch(() => undefined);

      if (!result?.user) {
        res.status(401).json({ code: 'AUTH_TOKEN_INVALID' });
        return;
      }

      const user = normalizeUser(result.user as unknown as Record<string, unknown>);
      if (user.accountStatus === 'blocked') {
        res.status(403).json({ code: 'ACCOUNT_BLOCKED' });
        return;
      }

      setSessionCookie(res, token);
      res.json({ user });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    const payload = await getPayloadClient().catch(() => undefined);
    const user = await getAuthenticatedUser(req).catch(() => undefined);
    if (payload && user) {
      await writeAdminAudit(payload, user, 'logout', 'users', user.id, `logout users:${user.id}`);
    }
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      res.json({ user });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/auth/forgot-password', async (req, res, next) => {
    try {
      const payload = await getPayloadClient();
      const email = normalizeEmail(req.body?.email);
      if (!email) {
        res.status(400).json({ code: 'AUTH_EMAIL_REQUIRED' });
        return;
      }
      let token: string | undefined;
      try {
        const fpResult = await payload.forgotPassword({
          collection: USER_COLLECTION,
          data: { email },
          disableEmail: !process.env.SMTP_HOST,
          overrideAccess: true,
        });
        token = fpResult || undefined;
      } catch (_emailErr) {
        // Email sending failed, but the token may still be generated.
        // Return the reset token in dev, otherwise just report success.
      }
      res.json({ status: 'sent', resetToken: process.env.NODE_ENV === 'production' ? undefined : token || undefined });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/auth/reset-password', async (req, res, next) => {
    try {
      const payload = await getPayloadClient();
      const token = String(req.body?.token || '');
      const password = String(req.body?.password || '');
      if (!token || password.length < 8 || password !== req.body?.passwordConfirmation) {
        res.status(400).json({ code: 'AUTH_INVALID_RESET' });
        return;
      }
      await payload.resetPassword({
        collection: USER_COLLECTION,
        data: { token, password },
        overrideAccess: true,
      });
      const passwordWarning = evaluatePassword(password).weak
        ? { weak: true, reasons: evaluatePassword(password).reasons }
        : undefined;
      res.json({ status: 'reset', passwordWarning });
    } catch (_error) {
      res.status(400).json({ code: 'AUTH_INVALID_RESET' });
    }
  });

  app.post('/api/auth/send-code', async (req, res, next) => {
    try {
      const payload = await getPayloadClient();
      const email = normalizeEmail(req.body?.email);
      if (!email) {
        res.status(400).json({ code: 'AUTH_EMAIL_REQUIRED' });
        return;
      }
      const result = await payload.find({
        collection: USER_COLLECTION,
        where: { email: { equals: email } },
        limit: 1,
        overrideAccess: true,
      });

      if (result.docs.length === 0) {
        res.status(404).json({ code: 'AUTH_USER_NOT_FOUND' });
        return;
      }

      const userDoc = result.docs[0] as any;
      if (userDoc.accountStatus === 'blocked') {
        res.status(403).json({ code: 'ACCOUNT_BLOCKED' });
        return;
      }

      const code = generateCode();
      const expired = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

      await payload.update({
        collection: USER_COLLECTION,
        id: userDoc.id,
        data: { verificationCode: code, verificationCodeExpires: expired } as any,
        overrideAccess: true,
      });

      try {
        await sendVerificationEmail(payload, email, code, 'Код для входа — Navykus');
      } catch {
        res.status(502).json({ code: 'AUTH_EMAIL_SEND_FAILED' });
        return;
      }

      res.json({ status: 'sent' });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/auth/verify-code', async (req, res, next) => {
    try {
      const payload = await getPayloadClient();
      const email = normalizeEmail(req.body?.email);
      const code = String(req.body?.code || '').trim();

      if (!email || !code) {
        res.status(400).json({ code: 'AUTH_CODE_REQUIRED' });
        return;
      }
      const result = await payload.find({
        collection: USER_COLLECTION,
        where: { email: { equals: email } },
        limit: 1,
        overrideAccess: true,
      });

      if (result.docs.length === 0) {
        res.status(404).json({ code: 'AUTH_USER_NOT_FOUND' });
        return;
      }

      const userDoc = result.docs[0] as any;
      const storedCode = userDoc.verificationCode;
      const expiredAt = userDoc.verificationCodeExpires ? new Date(userDoc.verificationCodeExpires) : null;

      if (!storedCode || storedCode !== code) {
        res.status(400).json({ code: 'AUTH_CODE_INVALID' });
        return;
      }

      if (!expiredAt || expiredAt.getTime() < Date.now()) {
        res.status(400).json({ code: 'AUTH_CODE_EXPIRED' });
        return;
      }

      const user = normalizeUser(userDoc);
      if (user.accountStatus === 'blocked') {
        res.status(403).json({ code: 'ACCOUNT_BLOCKED' });
        return;
      }

      // Generate JWT token directly using payload secret
      const jwt = await import('jsonwebtoken');
      const token = jwt.sign(
        {
          id: userDoc.id,
          email: userDoc.email,
          collection: USER_COLLECTION,
          loginType: 'api',
        },
        process.env.PAYLOAD_SECRET || '',
        { expiresIn: '7d' },
      );

      await payload.update({
        collection: USER_COLLECTION,
        id: userDoc.id,
        data: { verificationCode: '', verificationCodeExpires: '', emailVerified: true, accountStatus: 'active' } as any,
        overrideAccess: true,
      });

      setSessionCookie(res, token, Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60);
      res.json({ user, token });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/auth/verify-email', async (req, res, next) => {
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      const payload = await getPayloadClient();

      const userDoc = await payload.findByID({
        collection: USER_COLLECTION,
        id: user.id,
        overrideAccess: true,
      }) as any;

      const code = String(req.body?.code || '').trim();
      const storedCode = userDoc.verificationCode;
      const expiredAt = userDoc.verificationCodeExpires ? new Date(userDoc.verificationCodeExpires) : null;

      if (!storedCode || storedCode !== code) {
        res.status(400).json({ code: 'AUTH_CODE_INVALID' });
        return;
      }
      if (!expiredAt || expiredAt.getTime() < Date.now()) {
        res.status(400).json({ code: 'AUTH_CODE_EXPIRED' });
        return;
      }

      await payload.update({
        collection: USER_COLLECTION,
        id: user.id,
        data: {
          emailVerified: true,
          verificationCode: '',
          verificationCodeExpires: '',
          accountStatus: 'active',
        } as any,
        overrideAccess: true,
      });

      res.json({ status: 'verified' });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/auth/resend-verification', async (req, res, next) => {
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      const payload = await getPayloadClient();

      const code = generateCode();
      const expired = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

      await payload.update({
        collection: USER_COLLECTION,
        id: user.id,
        data: { verificationCode: code, verificationCodeExpires: expired } as any,
        overrideAccess: true,
      });

      await sendVerificationEmail(payload, user.email, code, 'Подтвердите вашу почту — Navykus');

      res.json({ status: 'sent' });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/profile', async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      res.json({ user });
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/profile', async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      const payload = await getPayloadClient();
      const updated = await payload.update({
        collection: USER_COLLECTION,
        id: user.id,
        data: pickProfileUpdate(req.body || {}),
        overrideAccess: true,
      });
      res.json({ user: normalizeUser(updated as unknown as Record<string, unknown>) });
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/profile', async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      const payload = await getPayloadClient();

      if (user.role === 'admin') {
        const adminCount = await payload.find({
          collection: USER_COLLECTION,
          where: { role: { equals: 'admin' }, accountStatus: { not_equals: 'blocked' } },
          limit: 0,
          overrideAccess: true,
        });
        if (adminCount.totalDocs <= 1) {
          res.status(400).json({ code: 'USER_LAST_ADMIN_FORBIDDEN' });
          return;
        }
      }

      await payload.delete({
        collection: USER_COLLECTION,
        id: user.id,
        overrideAccess: true,
      });
      clearSessionCookie(res);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/profile/avatar', avatarUpload.single('avatar'), async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await requireUser(req, res);
      if (!user) {
        await removeUploadedFile(req.file);
        return;
      }
      if (!req.file) {
        res.status(400).json({ code: 'AVATAR_REQUIRED' });
        return;
      }
      if (!(await isExpectedAvatarContent(req.file))) {
        await removeUploadedFile(req.file);
        res.status(415).json({ code: 'AVATAR_INVALID' });
        return;
      }

      const payload = await getPayloadClient();
      const alt = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
      const media = await payload.create({
        collection: 'media' as any,
        data: {
          alt,
        },
        filePath: req.file.path,
        overrideAccess: true,
      });
      const mediaRecord = media as Record<string, unknown>;
      const avatarUrl = typeof mediaRecord.filename === 'string'
        ? `/media/${mediaRecord.filename}`
        : typeof mediaRecord.url === 'string'
          ? mediaRecord.url
          : undefined;

      const updated = await payload.update({
        collection: USER_COLLECTION,
        id: user.id,
        data: {
          avatar: media.id,
          avatarUrl,
          avatarAlt: alt,
          avatarPositionX: 50,
          avatarPositionY: 50,
          avatarScale: 1,
        } as ProfileUpdateData,
        overrideAccess: true,
      });

      await removeUploadedFile(req.file);
      res.status(201).json({ user: normalizeUser(updated as unknown as Record<string, unknown>) });
    } catch (error) {
      await removeUploadedFile(req.file);
      next(error);
    }
  });

  app.get('/api/participants', async (req, res, next) => {
    try {
      const payload = await getPayloadClient();
      const { page, limit } = pageOptions(req);
      const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
      const sort = req.query.sort === 'oldest' ? 'createdAt' : '-createdAt';
      const result = await payload.find({
        collection: USER_COLLECTION,
        where: { publicProfile: { equals: true } },
        page,
        limit,
        sort,
        overrideAccess: true,
      });
      await applyLocalizations(payload, 'users', result.docs as unknown as Array<Record<string, unknown>>, languageFromRequest(req));
      const docs = result.docs
        .map((doc) => publicParticipant(doc as unknown as Record<string, unknown>))
        .filter((participant) => {
          if (!q) return true;
          return [
            participant.name,
            participant.country,
            participant.city,
            participant.school,
            participant.biography,
            ...participant.interests,
            ...participant.skills,
            ...participant.languages,
          ].filter(Boolean).join(' ').toLowerCase().includes(q);
        });
      res.json({ docs, page: result.page, totalPages: result.totalPages, totalDocs: result.totalDocs });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/participants/:id', async (req, res, next) => {
    try {
      const payload = await getPayloadClient();
      const doc = await payload.findByID({
        collection: USER_COLLECTION,
        id: req.params.id,
        overrideAccess: true,
      });
      if (!doc || !(doc as unknown as Record<string, unknown>).publicProfile) {
        res.status(404).json({ code: 'PARTICIPANT_NOT_FOUND' });
        return;
      }
      const docs = [doc as unknown as Record<string, unknown>];
      await applyLocalizations(payload, 'users', docs, languageFromRequest(req));
      res.json({ participant: publicParticipant(docs[0]) });
    } catch (_error) {
      res.status(404).json({ code: 'PARTICIPANT_NOT_FOUND' });
    }
  });

  app.get('/api/profile/favorites', async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      const payload = await getPayloadClient();
      const type = typeof req.query.type === 'string' && req.query.type !== 'all' ? req.query.type : undefined;
      const result = await payload.find({
        collection: 'favorites' as any,
        where: {
          user: { equals: user.id },
          ...(type ? { itemType: { equals: type } } : {}),
        },
        limit: 100,
        sort: '-createdAt',
        overrideAccess: true,
      });
      res.json({ docs: result.docs });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/profile/favorites', async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      const payload = await getPayloadClient();
      const { itemType, itemId, itemTitle, href } = req.body || {};
      if (!itemType || !itemId || !itemTitle || !href) {
        res.status(400).json({ code: 'FAVORITE_INVALID' });
        return;
      }
      const existing = await payload.find({
        collection: 'favorites' as any,
        where: {
          user: { equals: user.id },
          itemType: { equals: itemType },
          itemId: { equals: itemId },
        },
        limit: 1,
        overrideAccess: true,
      });
      if (existing.docs[0]) {
        res.status(200).json({ favorite: existing.docs[0] });
        return;
      }
      const favorite = await payload.create({
        collection: 'favorites' as any,
        data: { user: payloadId(user.id), itemType, itemId, itemTitle, href },
        overrideAccess: true,
      });
      res.status(201).json({ favorite });
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/profile/favorites/:id', async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      const payload = await getPayloadClient();
      const favorite = await payload.findByID({ collection: 'favorites' as any, id: req.params.id, overrideAccess: true });
      if (relationId((favorite as unknown as Record<string, unknown>).user) !== user.id) {
        res.status(403).json({ code: 'FORBIDDEN' });
        return;
      }
      await payload.delete({ collection: 'favorites' as any, id: req.params.id, overrideAccess: true });
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/profile/notifications', async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      const payload = await getPayloadClient();
      const { page, limit } = pageOptions(req);
      const result = await payload.find({
        collection: 'notifications' as any,
        where: { user: { equals: user.id } },
        page,
        limit,
        sort: '-createdAt',
        overrideAccess: true,
      });
      const unread = await payload.count({
        collection: 'notifications' as any,
        where: { user: { equals: user.id }, readAt: { exists: false } },
        overrideAccess: true,
      });
      res.json({ ...result, unread: unread.totalDocs });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/profile/notifications/:id/read', async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      const payload = await getPayloadClient();
      const notification = await payload.findByID({ collection: 'notifications' as any, id: req.params.id, overrideAccess: true });
      if (relationId((notification as unknown as Record<string, unknown>).user) !== user.id) {
        res.status(403).json({ code: 'FORBIDDEN' });
        return;
      }
      const updated = await payload.update({
        collection: 'notifications' as any,
        id: req.params.id,
        data: { readAt: new Date().toISOString() },
        overrideAccess: true,
      });
      res.json({ notification: updated });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/profile/notifications/read-all', async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      const payload = await getPayloadClient();
      await payload.update({
        collection: 'notifications' as any,
        where: { user: { equals: user.id }, readAt: { exists: false } },
        data: { readAt: new Date().toISOString() },
        overrideAccess: true,
      });
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/profile/applications', async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      const payload = await getPayloadClient();
      const result = await payload.find({
        collection: 'applications' as any,
        where: { user: { equals: user.id } },
        limit: 100,
        sort: '-createdAt',
        overrideAccess: true,
      });
      res.json({ docs: result.docs.map(publicApplication) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/profile/applications', async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      const payload = await getPayloadClient();
      const body = req.body || {};
      const status = String(body.status || 'draft');
      if (!APPLICATION_STATUSES.has(status)) {
        res.status(400).json({ code: 'APPLICATION_STATUS_INVALID' });
        return;
      }
      if (!body.itemType || !body.itemId || !body.itemTitle) {
        res.status(400).json({ code: 'APPLICATION_TARGET_REQUIRED' });
        return;
      }
      const existing = await payload.find({
        collection: 'applications' as any,
        where: {
          user: { equals: user.id },
          itemType: { equals: body.itemType },
          itemId: { equals: body.itemId },
          status: { not_in: ['cancelled', 'rejected'] },
        },
        limit: 1,
        overrideAccess: true,
      });
      if (existing.docs[0]) {
        res.status(409).json({ code: 'APPLICATION_DUPLICATE', application: existing.docs[0] });
        return;
      }
      const ticketId = `NVK-${Date.now().toString(36).toUpperCase()}`;
      const application = await payload.create({
        collection: 'applications' as any,
        data: {
          ticketId,
          user: payloadId(user.id),
          status,
          itemType: body.itemType,
          itemId: body.itemId,
          itemTitle: body.itemTitle,
          name: body.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || user.email,
          email: user.email,
          country: user.country,
          city: user.city,
          grade: body.grade || user.schoolGrade,
          age: body.age || user.ageGroup,
          school: body.school || user.school,
          motivation: body.motivation,
          coverLetter: body.coverLetter || body.motivation,
          portfolioLink: body.portfolioLink || user.portfolio,
          customAnswers: body.customAnswers || {},
          submittedAt: status === 'submitted' ? new Date().toISOString() : undefined,
          source: body.itemType,
        },
        overrideAccess: true,
      });
      await payload.create({
        collection: 'application-status-history' as any,
        data: {
          application: payloadId(String((application as unknown as Record<string, unknown>).id)),
          user: payloadId(user.id),
          status,
          comment: body.comment,
        },
        overrideAccess: true,
      });
      await createNotification({
        user: user.id,
        type: 'application_submitted',
        relatedType: 'application',
        relatedId: String((application as unknown as Record<string, unknown>).id),
        href: '/profile/applications',
        values: { title: body.itemTitle, status },
      });
      res.status(201).json({ application: publicApplication(application) });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/profile/applications/:id', async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      const payload = await getPayloadClient();
      const existing = await payload.findByID({ collection: 'applications' as any, id: req.params.id, overrideAccess: true });
      if (relationId((existing as unknown as Record<string, unknown>).user) !== user.id) {
        res.status(403).json({ code: 'FORBIDDEN' });
        return;
      }
      const status = req.body?.action === 'cancel' ? 'cancelled' : String((existing as unknown as Record<string, unknown>).status || 'draft');
      const updated = await payload.update({
        collection: 'applications' as any,
        id: req.params.id,
        data: {
          ...('motivation' in req.body ? { coverLetter: req.body.motivation } : {}),
          ...(req.body.customAnswers ? { customAnswers: req.body.customAnswers } : {}),
          status,
          cancelledAt: status === 'cancelled' ? new Date().toISOString() : undefined,
        },
        overrideAccess: true,
      });
      res.json({ application: publicApplication(updated) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/team-posts', async (req, res, next) => {
    try {
      const payload = await getPayloadClient();
      const result = await payload.find({
        collection: 'team-posts' as any,
        where: { status: { equals: 'published' } },
        limit: 100,
        sort: '-createdAt',
        overrideAccess: true,
      });
      await applyLocalizations(payload, 'team-posts', result.docs as unknown as Array<Record<string, unknown>>, languageFromRequest(req));
      res.json({ docs: result.docs });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/profile/team', async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      const payload = await getPayloadClient();
      const language = languageFromRequest(req);
      const [posts, responses] = await Promise.all([
        payload.find({ collection: 'team-posts' as any, where: { user: { equals: user.id } }, limit: 100, overrideAccess: true }),
        payload.find({
          collection: 'team-responses' as any,
          where: { or: [{ sender: { equals: user.id } }, { recipient: { equals: user.id } }] },
          limit: 100,
          overrideAccess: true,
        }),
      ]);
      await Promise.all([
        applyLocalizations(payload, 'team-posts', posts.docs as unknown as Array<Record<string, unknown>>, language),
        applyLocalizations(payload, 'team-responses', responses.docs as unknown as Array<Record<string, unknown>>, language),
      ]);
      res.json({ posts: posts.docs, responses: responses.docs });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/profile/team-posts', async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      const payload = await getPayloadClient();
      const body = req.body || {};
      if (!body.title || !body.description) {
        res.status(400).json({ code: 'TEAM_POST_INVALID' });
        return;
      }
      const teamPostOriginalLanguage = typeof body.originalLanguage === 'string' && SUPPORTED_LANGUAGES.has(body.originalLanguage)
        ? body.originalLanguage
        : 'ru';
      const post = await payload.create({
        collection: 'team-posts' as any,
        data: {
          originalLanguage: teamPostOriginalLanguage,
          user: payloadId(user.id),
          title: body.title,
          description: body.description,
          status: body.status || 'draft',
          championshipId: body.championshipId,
          projectName: body.projectName,
          communicationLanguage: body.communicationLanguage,
          timeZone: body.timeZone,
          workingFormat: body.workingFormat || 'online',
          openPositions: Number(body.openPositions || 1),
          requiredSkills: listValues(body.requiredSkills).map((value) => ({ value })),
          ownSkills: listValues(body.ownSkills).map((value) => ({ value })),
          interests: listValues(body.interests).map((value) => ({ value })),
        },
        overrideAccess: true,
      });
      res.status(201).json({ post });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/team-posts/:id/responses', async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      const payload = await getPayloadClient();
      const post = await payload.findByID({ collection: 'team-posts' as any, id: req.params.id, overrideAccess: true });
      const recipient = relationId((post as unknown as Record<string, unknown>).user);
      if (!recipient || recipient === user.id) {
        res.status(400).json({ code: 'TEAM_RESPONSE_INVALID' });
        return;
      }
      const existing = await payload.find({
        collection: 'team-responses' as any,
        where: { post: { equals: req.params.id }, sender: { equals: user.id } },
        limit: 1,
        overrideAccess: true,
      });
      if (existing.docs[0]) {
        res.status(409).json({ code: 'TEAM_RESPONSE_DUPLICATE' });
        return;
      }
      const teamResponseOriginalLanguage = typeof req.body?.originalLanguage === 'string' && SUPPORTED_LANGUAGES.has(req.body.originalLanguage)
          ? req.body.originalLanguage
          : 'ru';
      const response = await payload.create({
        collection: 'team-responses' as any,
        data: {
          originalLanguage: teamResponseOriginalLanguage,
          post: payloadId(req.params.id),
          sender: payloadId(user.id),
          recipient: payloadId(recipient),
          kind: req.body?.kind || 'response',
          message: req.body?.message || '',
          status: 'pending',
        },
        overrideAccess: true,
      });
      await createNotification({
        user: recipient,
        type: req.body?.kind === 'invitation' ? 'team_invitation_received' : 'team_response_received',
        relatedType: 'team-response',
        relatedId: String((response as unknown as Record<string, unknown>).id),
        href: '/profile/team',
        values: { title: (post as unknown as Record<string, unknown>).title },
      });
      res.status(201).json({ response });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/team-responses/:id', async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await requireUser(req, res);
      if (!user) return;
      const status = String(req.body?.status || '');
      if (!['accepted', 'rejected'].includes(status)) {
        res.status(400).json({ code: 'TEAM_RESPONSE_STATUS_INVALID' });
        return;
      }
      const payload = await getPayloadClient();
      const existing = await payload.findByID({ collection: 'team-responses' as any, id: req.params.id, overrideAccess: true });
      if (relationId((existing as unknown as Record<string, unknown>).recipient) !== user.id) {
        res.status(403).json({ code: 'FORBIDDEN' });
        return;
      }
      const updated = await payload.update({
        collection: 'team-responses' as any,
        id: req.params.id,
        data: { status },
        overrideAccess: true,
      });
      const sender = relationId((existing as unknown as Record<string, unknown>).sender);
      if (sender) {
        await createNotification({
          user: sender,
          type: status === 'accepted' ? 'team_response_accepted' : 'team_response_rejected',
          relatedType: 'team-response',
          relatedId: req.params.id,
          href: '/profile/team',
          values: { status },
        });
      }
      res.json({ response: updated });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/championships', async (req, res, next) => {
    try {
      const payload = await getPayloadClient();
      const { page, limit } = pageOptions(req);
      const result = await payload.find({
        collection: 'tournaments' as any,
        where: catalogWhere('tournaments', req, ['title', 'description']),
        page,
        limit,
        sort: req.query.sort === 'oldest' ? 'createdAt' : '-createdAt',
        overrideAccess: true,
      });
      await applyLocalizations(payload, 'tournaments', result.docs as Array<Record<string, unknown>>, languageFromRequest(req));
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/championships/featured', async (req, res, next) => {
    try {
      const payload = await getPayloadClient();
      const result = await payload.find({
        collection: 'tournaments' as any,
        where: {
          isPublished: { equals: true },
          isFeatured: { equals: true },
          _status: { equals: 'published' },
        },
        limit: 1,
        overrideAccess: true,
      });
      if (result.docs.length === 0) {
        res.status(404).json({ code: 'NO_FEATURED_CHAMPIONSHIP' });
        return;
      }
      await applyLocalizations(payload, 'tournaments', result.docs as Array<Record<string, unknown>>, languageFromRequest(req));
      res.json({ doc: result.docs[0] });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/events', async (req, res, next) => {
    try {
      const payload = await getPayloadClient();
      const { page, limit } = pageOptions(req);
      const result = await payload.find({
        collection: 'events' as any,
        where: catalogWhere('events', req, ['title', 'shortDescription', 'fullDescription', 'speaker', 'country'], req.query.format ? { format: { equals: req.query.format } } : {}),
        page,
        limit,
        sort: req.query.sort === 'oldest' ? 'eventDate' : '-eventDate',
        overrideAccess: true,
      });
      await applyLocalizations(payload, 'events', result.docs as Array<Record<string, unknown>>, languageFromRequest(req));
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/opportunities', async (req, res, next) => {
    try {
      const payload = await getPayloadClient();
      const { page, limit } = pageOptions(req);
      const result = await payload.find({
        collection: 'opportunities' as any,
        where: catalogWhere('opportunities', req, ['title', 'shortDescription', 'fullDescription', 'organization', 'country'], req.query.format ? { format: { equals: req.query.format } } : {}),
        page,
        limit,
        sort: req.query.sort === 'deadline' ? 'deadline' : '-createdAt',
        overrideAccess: true,
      });
      await applyLocalizations(payload, 'opportunities', result.docs as Array<Record<string, unknown>>, languageFromRequest(req));
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/activities', async (req, res, next) => {
    try {
      const payload = await getPayloadClient();
      const { page, limit } = pageOptions(req);
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const where: Record<string, unknown> = {
        isPublished: { equals: true },
        ...(category ? { category: { equals: category } } : {}),
        ...(status ? { status: { equals: status } } : {}),
      };
      if (q) {
        where.or = [
          { title: { like: q } },
          { shortDescription: { like: q } },
          { fullDescription: { like: q } },
        ];
      }
      const result = await payload.find({
        collection: 'activities' as any,
        where,
        page,
        limit,
        sort: req.query.sort === 'oldest' ? 'createdAt' : '-sortOrder',
        overrideAccess: true,
      });
      await applyLocalizations(payload, 'activities', result.docs as Array<Record<string, unknown>>, languageFromRequest(req));
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/admin/content-types', async (req: AuthenticatedRequest, res, next) => {
    try {
      const staff = await requireStaff(req, res);
      if (!staff) return;
      res.json({ types: ADMIN_CONTENT_TYPES });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/admin/content/:type', async (req: AuthenticatedRequest, res, next) => {
    try {
      const staff = await requireStaff(req, res);
      if (!staff) return;
      const contentType = getAdminContentType(req.params.type);
      if (!contentType) {
        res.status(404).json({ code: 'ADMIN_CONTENT_TYPE_NOT_FOUND' });
        return;
      }
      const payload = await getPayloadClient();
      const payloadReq = await payloadRequestForStaff(payload, staff);
      const { page, limit } = pageOptions(req);
      const result = await payload.find({
        collection: contentType.collection as any,
        where: adminContentSearchWhere(contentType, req.query.q),
        page,
        limit,
        depth: 1,
        sort: typeof req.query.sort === 'string' ? req.query.sort : '-createdAt',
        req: payloadReq,
        overrideAccess: false,
      });
      res.json({
        ...result,
        type: contentType,
        docs: (result.docs as Array<Record<string, unknown>>).map((doc) => serializeAdminContentDoc(contentType, doc)),
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/admin/content/:type', async (req: AuthenticatedRequest, res, next) => {
    try {
      const staff = await requireStaff(req, res);
      if (!staff) return;
      const contentType = getAdminContentType(req.params.type);
      if (!contentType) {
        res.status(404).json({ code: 'ADMIN_CONTENT_TYPE_NOT_FOUND' });
        return;
      }
      const payload = await getPayloadClient();
      const payloadReq = await payloadRequestForStaff(payload, staff);
      const data = sanitizeAdminContentData(contentType, req.body || {}, true, payloadReq.user.id);
      const created = await payload.create({
        collection: contentType.collection as any,
        data: data as any,
        depth: 1,
        req: payloadReq,
        overrideAccess: false,
      });
      await writeAdminAudit(payload, staff, 'create', contentType.collection, String((created as Record<string, unknown>).id || ''));
      res.status(201).json({ doc: serializeAdminContentDoc(contentType, created as Record<string, unknown>) });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/admin/content/:type/:id', async (req: AuthenticatedRequest, res, next) => {
    try {
      const staff = await requireStaff(req, res);
      if (!staff) return;
      const contentType = getAdminContentType(req.params.type);
      if (!contentType) {
        res.status(404).json({ code: 'ADMIN_CONTENT_TYPE_NOT_FOUND' });
        return;
      }
      const payload = await getPayloadClient();
      const payloadReq = await payloadRequestForStaff(payload, staff);
      const originalDoc = await payload.findByID({
        collection: contentType.collection as any,
        id: payloadId(req.params.id),
        depth: 0,
        req: payloadReq,
        overrideAccess: false,
      }) as Record<string, unknown>;
      const data = sanitizeAdminContentData(contentType, req.body || {}, false, payloadReq.user.id, originalDoc);
      const updated = await payload.update({
        collection: contentType.collection as any,
        id: payloadId(req.params.id),
        data: data as any,
        depth: 1,
        req: payloadReq,
        overrideAccess: false,
      });
      await writeAdminAudit(payload, staff, 'update', contentType.collection, req.params.id);
      res.json({ doc: serializeAdminContentDoc(contentType, updated as Record<string, unknown>) });
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/admin/content/:type/:id', async (req: AuthenticatedRequest, res, next) => {
    try {
      const staff = await requireStaff(req, res);
      if (!staff) return;
      const contentType = getAdminContentType(req.params.type);
      if (!contentType) {
        res.status(404).json({ code: 'ADMIN_CONTENT_TYPE_NOT_FOUND' });
        return;
      }
      const payload = await getPayloadClient();
      const payloadReq = await payloadRequestForStaff(payload, staff);
      await payload.delete({
        collection: contentType.collection as any,
        id: payloadId(req.params.id),
        req: payloadReq,
        overrideAccess: false,
      });
      await cleanupContentLocalizations(payload, contentType.collection, req.params.id);
      await writeAdminAudit(payload, staff, 'delete', contentType.collection, req.params.id);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/admin/audit-logs', async (req: AuthenticatedRequest, res, next) => {
    try {
      const staff = await requireStaff(req, res);
      if (!staff) return;
      if (staff.role !== 'admin') {
        res.status(403).json({ code: 'FORBIDDEN' });
        return;
      }
      const payload = await getPayloadClient();
      const { page, limit } = pageOptions(req);
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const result = await payload.find({
        collection: 'audit-logs' as any,
        where: q ? {
          or: [
            { action: { like: q } },
            { collection: { like: q } },
            { documentId: { like: q } },
            { actorEmail: { like: q } },
            { summary: { like: q } },
          ],
        } : {},
        page,
        limit,
        sort: typeof req.query.sort === 'string' ? req.query.sort : '-createdAt',
        overrideAccess: true,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/admin/summary', async (req: AuthenticatedRequest, res, next) => {
    try {
      const staff = await requireStaff(req, res);
      if (!staff) return;
      const payload = await getPayloadClient();
const [users, applications, championships, events, opportunities, teamPosts, blogPending, teamMemberPending, translationsFailed] = await Promise.all([
        payload.count({ collection: USER_COLLECTION, overrideAccess: true }),
        payload.count({ collection: 'applications' as any, overrideAccess: true }),
        payload.count({ collection: 'tournaments' as any, where: { isPublished: { equals: true } }, overrideAccess: true }),
        payload.count({ collection: 'events' as any, where: { isPublished: { equals: true } }, overrideAccess: true }),
        payload.count({ collection: 'opportunities' as any, where: { isPublished: { equals: true } }, overrideAccess: true }),
        payload.count({ collection: 'team-posts' as any, overrideAccess: true }),
        payload.count({ collection: 'blog-posts' as any, where: { status: { equals: 'pending_review' } }, overrideAccess: true }),
        payload.count({ collection: 'team-members' as any, where: { moderationStatus: { equals: 'pending' } }, overrideAccess: true }),
        payload.count({ collection: 'content-localizations' as any, where: { translationStatus: { equals: 'failed' } }, overrideAccess: true }),
      ]);
      res.json({
        users: users.totalDocs,
        applications: applications.totalDocs,
        activeChampionships: championships.totalDocs,
        upcomingEvents: events.totalDocs,
        publishedOpportunities: opportunities.totalDocs,
        teamPosts: teamPosts.totalDocs,
        blogPending: blogPending.totalDocs,
        teamMemberPending: teamMemberPending.totalDocs,
        translationsFailed: translationsFailed.totalDocs,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/admin/health', async (req: AuthenticatedRequest, res, next) => {
    try {
      const staff = await requireStaff(req, res);
      if (!staff) return;
      res.json(await systemHealth());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/admin/team-members', async (req: AuthenticatedRequest, res, next) => {
    try {
      const staff = await requireStaff(req, res);
      if (!staff) return;
      const payload = await getPayloadClient();
      const { page, limit } = pageOptions(req);
      const status = typeof req.query.status === 'string' && TEAM_MEMBER_MODERATION_STATUSES.has(req.query.status)
        ? req.query.status
        : undefined;
      const result = await payload.find({
        collection: 'team-members' as any,
        where: status ? { moderationStatus: { equals: status } } : {},
        page,
        limit,
        sort: '-createdAt',
        overrideAccess: true,
      });
      res.json({ ...result, docs: result.docs.map(publicTeamMemberModeration) });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/admin/team-members/:id/moderation', async (req: AuthenticatedRequest, res, next) => {
    try {
      const staff = await requireStaff(req, res);
      if (!staff) return;
      const status = String(req.body?.moderationStatus || '');
      if (!TEAM_MEMBER_MODERATION_STATUSES.has(status)) {
        res.status(400).json({ code: 'TEAM_MEMBER_MODERATION_STATUS_INVALID' });
        return;
      }
      const payload = await getPayloadClient();
      const updated = await payload.update({
        collection: 'team-members' as any,
        id: req.params.id,
        data: {
          moderationStatus: status,
          moderationComment: typeof req.body?.moderationComment === 'string' ? req.body.moderationComment : undefined,
          reviewedAt: new Date().toISOString(),
          isApproved: status === 'approved',
        },
        overrideAccess: true,
      });
      res.json({ doc: publicTeamMemberModeration(updated) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/admin/translations', async (req: AuthenticatedRequest, res, next) => {
    try {
      const staff = await requireStaff(req, res);
      if (!staff) return;
      const payload = await getPayloadClient();
      const { page, limit } = pageOptions(req);
      const and: Array<Record<string, unknown>> = [];
      if (typeof req.query.status === 'string' && TRANSLATION_STATUSES.has(req.query.status)) {
        and.push({ translationStatus: { equals: req.query.status } });
      }
      if (typeof req.query.collection === 'string' && (SUPPORTED_CONTENT_COLLECTIONS as readonly string[]).includes(req.query.collection)) {
        and.push({ sourceCollection: { equals: req.query.collection } });
      }
      if (typeof req.query.language === 'string' && SUPPORTED_LANGUAGES.has(req.query.language)) {
        and.push({ language: { equals: req.query.language } });
      }
      const result = await payload.find({
        collection: 'content-localizations' as any,
        where: and.length ? { and } : {},
        page,
        limit,
        sort: req.query.sort === 'oldest' ? 'createdAt' : '-updatedAt',
        overrideAccess: true,
      });
      const counts = await Promise.all(
        Array.from(TRANSLATION_STATUSES).map(async (status) => ({
          status,
          totalDocs: (await payload.count({
            collection: 'content-localizations' as any,
            where: { translationStatus: { equals: status } },
            overrideAccess: true,
          })).totalDocs,
        })),
      );
      res.json({
        ...result,
        docs: result.docs.map(publicTranslationRecord),
        counts: Object.fromEntries(counts.map((item) => [item.status, item.totalDocs])),
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/admin/translations/:id/retry', async (req: AuthenticatedRequest, res, next) => {
    try {
      const staff = await requireStaff(req, res);
      if (!staff) return;
      const payload = await getPayloadClient();
      const updated = await retryContentLocalization(payload, req.params.id);
      await writeAdminAudit(payload, staff, 'retry_translation', 'content-localizations', req.params.id);
      res.json({ doc: publicTranslationRecord(updated) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/admin/translations/retry-failed', async (req: AuthenticatedRequest, res, next) => {
    try {
      const staff = await requireStaff(req, res);
      if (!staff) return;
      const payload = await getPayloadClient();
      const collection = typeof req.body?.collection === 'string' && (SUPPORTED_CONTENT_COLLECTIONS as readonly string[]).includes(req.body.collection)
        ? req.body.collection
        : undefined;
      const language = typeof req.body?.language === 'string' && SUPPORTED_LANGUAGES.has(req.body.language)
        ? req.body.language
        : undefined;
      const and: Array<Record<string, unknown>> = [{ translationStatus: { equals: 'failed' } }];
      if (collection) and.push({ sourceCollection: { equals: collection } });
      if (language) and.push({ language: { equals: language } });
      const failed = await payload.find({
        collection: 'content-localizations' as any,
        where: { and },
        limit: 50,
        depth: 0,
        overrideAccess: true,
      });
      for (const doc of failed.docs as Array<Record<string, unknown>>) {
        await payload.update({
          collection: 'content-localizations' as any,
          id: payloadId(doc.id as string | number),
          data: { translationStatus: 'pending', attempts: 0, errorMessage: '' },
          overrideAccess: true,
        });
      }
      const processed = await processPendingContentLocalizations(payload);
      await writeAdminAudit(payload, staff, 'retry_failed_translations', 'content-localizations', '', `retry_failed_translations queued=${failed.docs.length}`);
      res.json({ queued: failed.docs.length, processed });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/admin/users', async (req: AuthenticatedRequest, res, next) => {
    try {
      const staff = await requireStaff(req, res);
      if (!staff) return;
      const payload = await getPayloadClient();
      const { page, limit } = pageOptions(req);
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const where = q
        ? {
          or: [
            { email: { like: q } },
            { firstName: { like: q } },
            { lastName: { like: q } },
            { country: { like: q } },
          ],
        }
        : {};
      const result = await payload.find({
        collection: USER_COLLECTION,
        where,
        page,
        limit,
        sort: '-createdAt',
        overrideAccess: true,
      });
      res.json({
        ...result,
        docs: result.docs.map((doc) => normalizeUser(doc as unknown as Record<string, unknown>)),
      });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/admin/users/:id', async (req: AuthenticatedRequest, res, next) => {
    try {
      const actor = await requireStaff(req, res);
      if (!actor) return;
      if (actor.role !== 'admin') {
        res.status(403).json({ code: 'FORBIDDEN' });
        return;
      }
      const payload = await getPayloadClient();
      const target = normalizeUser(await payload.findByID({
        collection: USER_COLLECTION,
        id: req.params.id,
        overrideAccess: true,
      }) as unknown as Record<string, unknown>);

      const role = req.body?.role;
      const accountStatus = req.body?.accountStatus;
      if (role && !['user', 'moderator', 'admin'].includes(role)) {
        res.status(400).json({ code: 'USER_ROLE_INVALID' });
        return;
      }
      if (accountStatus && !['active', 'blocked', 'pending'].includes(accountStatus)) {
        res.status(400).json({ code: 'USER_STATUS_INVALID' });
        return;
      }
      if (target.id === actor.id && accountStatus === 'blocked') {
        res.status(400).json({ code: 'USER_SELF_BLOCK_FORBIDDEN' });
        return;
      }
      const adminCount = await payload.count({
        collection: USER_COLLECTION,
        where: { role: { equals: 'admin' }, accountStatus: { not_equals: 'blocked' } },
        overrideAccess: true,
      });
      if (target.role === 'admin' && adminCount.totalDocs <= 1 && (role !== 'admin' || accountStatus === 'blocked')) {
        res.status(400).json({ code: 'USER_LAST_ADMIN_FORBIDDEN' });
        return;
      }

      const updated = await payload.update({
        collection: USER_COLLECTION,
        id: req.params.id,
        data: {
          ...(role ? { role } : {}),
          ...(accountStatus ? { accountStatus } : {}),
        },
        overrideAccess: true,
      });
      res.json({ user: normalizeUser(updated as unknown as Record<string, unknown>) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/admin/applications', async (req: AuthenticatedRequest, res, next) => {
    try {
      const staff = await requireStaff(req, res);
      if (!staff) return;
      const payload = await getPayloadClient();
      const { page, limit } = pageOptions(req);
      const result = await payload.find({
        collection: 'applications' as any,
        where: req.query.status ? { status: { equals: req.query.status } } : {},
        page,
        limit,
        sort: '-createdAt',
        overrideAccess: true,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/admin/applications/:id/status', async (req: AuthenticatedRequest, res, next) => {
    try {
      const actor = await requireStaff(req, res);
      if (!actor) return;
      const status = String(req.body?.status || '');
      if (!APPLICATION_STATUSES.has(status)) {
        res.status(400).json({ code: 'APPLICATION_STATUS_INVALID' });
        return;
      }
      const payload = await getPayloadClient();
      const current = await payload.findByID({ collection: 'applications' as any, id: req.params.id, overrideAccess: true });
      const currentRecord = current as Record<string, unknown>;
      const applicantId = relationId(currentRecord.user);
      const updated = await payload.update({
        collection: 'applications' as any,
        id: req.params.id,
        data: {
          status,
          adminComment: req.body?.adminComment,
          internalNotes: req.body?.internalNotes,
        },
        overrideAccess: true,
      });
      if (applicantId) {
        await payload.create({
          collection: 'application-status-history' as any,
          data: {
            application: payloadId(req.params.id),
            user: payloadId(applicantId),
            actor: payloadId(actor.id),
            previousStatus: currentRecord.status,
            status,
            comment: req.body?.adminComment,
          },
          overrideAccess: true,
        });
        await createNotification({
          user: applicantId,
          type: status === 'clarification_required' ? 'clarification_requested' : 'application_status_changed',
          relatedType: 'application',
          relatedId: req.params.id,
          href: '/profile/applications',
          values: { status, title: currentRecord.itemTitle },
        });
      }
      res.json({ application: updated });
    } catch (error) {
      next(error);
    }
  });
};

