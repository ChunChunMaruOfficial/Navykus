import type { Express, Request, Response } from 'express';

import fs from 'node:fs';
import path from 'node:path';

import multer from 'multer';

import type { RequiredDataFromCollectionSlug } from 'payload';

import { getPayloadClient } from './payload';
import { evaluatePassword } from './password-policy';

type Role = 'user' | 'moderator' | 'admin';
type PlatformUser = {
  id: string;
  email: string;
  role: Role;
  accountStatus: 'active' | 'blocked' | 'pending';
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

const catalogWhere = (req: Request, searchFields: string[], extra: Record<string, unknown> = {}) => {
  const where: Record<string, unknown> = {
    isPublished: { equals: true },
    ...extra,
  };
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q) {
    where.or = searchFields.map((field) => ({ [field]: { like: q } }));
  }
  return where;
};

export const registerPlatformRoutes = (app: Express) => {
  app.post('/api/auth/register', async (req: AuthenticatedRequest, res, next) => {
    try {
      const payload = await getPayloadClient();
      const body = req.body || {};
      const email = String(body.email || '').trim().toLowerCase();
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
        ...pickProfileUpdate(body),
      };

      await payload.create({
        collection: USER_COLLECTION,
        data: userData,
        overrideAccess: true,
      });

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
      res.status(201).json({ user, passwordWarning });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/auth/login', async (req, res, next) => {
    try {
      const payload = await getPayloadClient();
      const email = String(req.body?.email || '').trim().toLowerCase();
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
      res.json({ user });
    } catch (_error) {
      res.status(401).json({ code: 'AUTH_LOGIN_FAILED' });
    }
  });

  app.post('/api/auth/logout', (_req, res) => {
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
      const email = String(req.body?.email || '').trim().toLowerCase();
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
      res.json({ participant: publicParticipant(doc as unknown as Record<string, unknown>) });
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
      const [posts, responses] = await Promise.all([
        payload.find({ collection: 'team-posts' as any, where: { user: { equals: user.id } }, limit: 100, overrideAccess: true }),
        payload.find({
          collection: 'team-responses' as any,
          where: { or: [{ sender: { equals: user.id } }, { recipient: { equals: user.id } }] },
          limit: 100,
          overrideAccess: true,
        }),
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
      const post = await payload.create({
        collection: 'team-posts' as any,
        data: {
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
      const response = await payload.create({
        collection: 'team-responses' as any,
        data: {
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
        where: catalogWhere(req, ['title', 'description']),
        page,
        limit,
        sort: req.query.sort === 'oldest' ? 'createdAt' : '-createdAt',
        overrideAccess: true,
      });
      res.json(result);
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
        where: catalogWhere(req, ['title', 'shortDescription', 'fullDescription', 'speaker', 'country'], req.query.format ? { format: { equals: req.query.format } } : {}),
        page,
        limit,
        sort: req.query.sort === 'oldest' ? 'eventDate' : '-eventDate',
        overrideAccess: true,
      });
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
        where: catalogWhere(req, ['title', 'shortDescription', 'fullDescription', 'organization', 'country'], req.query.format ? { format: { equals: req.query.format } } : {}),
        page,
        limit,
        sort: req.query.sort === 'deadline' ? 'deadline' : '-createdAt',
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
const [users, applications, championships, events, opportunities, teamPosts, blogPending] = await Promise.all([
        payload.count({ collection: USER_COLLECTION, overrideAccess: true }),
        payload.count({ collection: 'applications' as any, overrideAccess: true }),
        payload.count({ collection: 'tournaments' as any, where: { isPublished: { equals: true } }, overrideAccess: true }),
        payload.count({ collection: 'events' as any, where: { isPublished: { equals: true } }, overrideAccess: true }),
        payload.count({ collection: 'opportunities' as any, where: { isPublished: { equals: true } }, overrideAccess: true }),
        payload.count({ collection: 'team-posts' as any, overrideAccess: true }),
        payload.count({ collection: 'blog-posts' as any, where: { status: { equals: 'pending_review' } }, overrideAccess: true }),
      ]);
      res.json({
        users: users.totalDocs,
        applications: applications.totalDocs,
        activeChampionships: championships.totalDocs,
        upcomingEvents: events.totalDocs,
        publishedOpportunities: opportunities.totalDocs,
        teamPosts: teamPosts.totalDocs,
        blogPending: blogPending.totalDocs,
      });
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

