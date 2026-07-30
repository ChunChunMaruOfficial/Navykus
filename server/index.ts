import 'dotenv/config';

import fs from 'node:fs';
import path from 'node:path';

import express, { type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';

const requiredEnv = [
  'PAYLOAD_SECRET',
  'CORS_ORIGIN',
  'DATABASE_URL',
  'PAYLOAD_PUBLIC_SERVER_URL',
  'SERVER_URL',
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

import { execSync } from 'node:child_process';

import type { PageKey } from '../src/types';
import { SUPPORTED_LANGUAGES } from '../src/i18n/languages';
import { getAdminContentTypeByCollection } from '../src/content-admin-registry';
import { getPayloadClient } from './payload';
import { registerPlatformRoutes } from './platform';
import { registerBlogRoutes } from './blog';
import { startTranslationWorker } from './translation-worker';
import { applyLocalizations, languageFromRequest } from './content-localizations';
import {
  normalizeActivity,
  normalizeExpert,
  normalizeFaq,
  normalizePillar,
  normalizeScenario,
  normalizeStat,
  normalizeTeamMember,
  normalizeTournament,
  normalizeTrustPoint,
} from './normalizers';

const app = express();
app.set('trust proxy', 1);
const port = Number(process.env.API_PORT || process.env.PORT || 4000);
const uploadDir = path.resolve(process.cwd(), 'uploads', 'incoming');
const publicReadOnlyApiPrefixes = [
  '/api/content/home',
  '/api/tournaments',
  '/api/championships',
  '/api/events',
  '/api/activities',
  '/api/opportunities',
  '/api/faqs',
  '/api/pillars',
  '/api/scenarios',
  '/api/experts',
  '/api/trust-points',
  '/api/team-members',
  '/api/stats',
  '/api/contact-settings',
  '/api/operator-settings',
  '/api/blog/posts',
];

const isPublicReadOnlyApiRequest = (req: Request) => {
  if (req.method !== 'GET') return false;
  const requestPath = req.originalUrl.split('?')[0] || '';
  return publicReadOnlyApiPrefixes.some((prefix) => requestPath === prefix || requestPath.startsWith(`${prefix}/`));
};

fs.mkdirSync(uploadDir, { recursive: true });

const allowedUploadTypes = new Map([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
  ['.pdf', 'application/pdf'],
  ['.doc', 'application/msword'],
  ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
]);

const startsWithBytes = (buffer: Buffer, bytes: number[]) => {
  return bytes.every((byte, index) => buffer[index] === byte);
};

const isExpectedFileContent = async (file: Express.Multer.File) => {
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
  if (extension === '.pdf') {
    return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }
  if (extension === '.doc') {
    return startsWithBytes(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  }
  if (extension === '.docx') {
    return startsWithBytes(buffer, [0x50, 0x4b, 0x03, 0x04]);
  }

  return false;
};

const removeUploadedFile = async (file?: Express.Multer.File) => {
  if (!file) return;
  await fs.promises.unlink(file.path).catch(() => undefined);
};

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const expectedMime = allowedUploadTypes.get(extension);

    if (!expectedMime || expectedMime !== file.mimetype) {
      callback(new Error('UNSUPPORTED_FILE_TYPE'));
      return;
    }

    callback(null, true);
  },
});

const asyncRoute = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) => (req: Request, res: Response, next: NextFunction) => {
  void handler(req, res, next).catch(next);
};

app.use((req, res, next) => {
  const configuredOrigin = process.env.CORS_ORIGIN;
  if (!configuredOrigin) {
    console.error('CORS_ORIGIN environment variable is required in production');
    process.exit(1);
  }
  const configuredOrigins = configuredOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);
  const allowedOrigins = new Set([
    ...configuredOrigins,
    'https://navykus.online',
    'https://www.navykus.online',
  ]);
  const requestOrigin = req.headers.origin;
  const allowOrigin = requestOrigin && allowedOrigins.has(requestOrigin) ? requestOrigin : configuredOrigins[0] || configuredOrigin;
  res.header('Access-Control-Allow-Origin', allowOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  skip: isPublicReadOnlyApiRequest,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMIT_EXCEEDED' },
});

app.use('/api/', apiLimiter);

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use('/media', express.static(path.resolve(process.cwd(), 'uploads', 'media')));

registerPlatformRoutes(app);
registerBlogRoutes(app);
startTranslationWorker(getPayloadClient);

export const publicCollectionWhere = (collection: string, where: Record<string, unknown> = {}) => {
  const contentType = getAdminContentTypeByCollection(collection);
  const filters: Record<string, unknown> = {};

  if (contentType?.requiresPublishedFlag || contentType?.usesPublishedFlag) {
    filters.isPublished = { equals: true };
  }
  if (contentType?.supportsDraftStatus) {
    filters._status = { equals: 'published' };
  }

  return {
    ...filters,
    ...where,
  };
};

const findPublished = async (collection: string, where: Record<string, unknown> = {}) => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: collection as any,
    depth: 1,
    limit: 200,
    sort: 'sortOrder',
    where: publicCollectionWhere(collection, where),
    overrideAccess: true,
  });

  return result.docs;
};

const findApprovedTeamMembers = async () => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'team-members' as any,
    depth: 0,
    limit: 200,
    sort: '-createdAt',
    where: {
      isApproved: {
        equals: true,
      },
      _status: {
        equals: 'published',
      },
    },
    overrideAccess: true,
  });

  return result.docs;
};

const GIT_HASH = process.env.GIT_HASH || (() => { try { return execSync('git rev-parse --short HEAD', { encoding: 'utf-8', timeout: 3000 }).trim(); } catch { return 'dev'; } })();

app.get('/api/health', asyncRoute(async (_req, res) => {
  try {
    const payload = await getPayloadClient();
    await payload.find({ collection: 'users', limit: 0 });
    res.json({ ok: true, service: 'navykus-express-payload', db: 'connected', version: GIT_HASH, deployedAt: new Date().toISOString() });
  } catch {
    res.status(503).json({ ok: false, service: 'navykus-express-payload', db: 'disconnected', version: GIT_HASH });
  }
}));

app.get('/api/content/home', asyncRoute(async (req, res) => {
  const payload = await getPayloadClient();
  const language = languageFromRequest(req);
  const [tournaments, activities, experts, teamMembers, trustPoints, pillars, stats] = await Promise.all([
    findPublished('tournaments'),
    findPublished('activities'),
    findPublished('experts'),
    findApprovedTeamMembers(),
    findPublished('trust-points'),
    findPublished('pillars'),
    findPublished('stats'),
  ]);

  await Promise.all([
    applyLocalizations(payload, 'tournaments', tournaments as Array<Record<string, unknown>>, language),
    applyLocalizations(payload, 'activities', activities as Array<Record<string, unknown>>, language),
    applyLocalizations(payload, 'team-members', teamMembers as Array<Record<string, unknown>>, language),
    applyLocalizations(payload, 'experts', experts as Array<Record<string, unknown>>, language),
    applyLocalizations(payload, 'trust-points', trustPoints as Array<Record<string, unknown>>, language),
    applyLocalizations(payload, 'pillars', pillars as Array<Record<string, unknown>>, language),
    applyLocalizations(payload, 'stats', stats as Array<Record<string, unknown>>, language),
  ]);

  res.json({
    tournaments: tournaments.map(normalizeTournament),
    activities: activities.map(normalizeActivity),
    experts: experts.map(normalizeExpert),
    teamMembers: teamMembers.map(normalizeTeamMember),
    trustPoints: trustPoints.map(normalizeTrustPoint),
    pillars: pillars.map(normalizePillar),
    stats: stats.map(normalizeStat),
  });
}));

app.get('/api/tournaments', asyncRoute(async (req, res) => {
  const payload = await getPayloadClient();
  const docs = await findPublished('tournaments');
  await applyLocalizations(payload, 'tournaments', docs as Array<Record<string, unknown>>, languageFromRequest(req));
  res.json(docs.map(normalizeTournament));
}));

app.get('/api/activities', asyncRoute(async (req, res) => {
  const payload = await getPayloadClient();
  const docs = await findPublished('activities');
  await applyLocalizations(payload, 'activities', docs as Array<Record<string, unknown>>, languageFromRequest(req));
  res.json(docs.map(normalizeActivity));
}));

app.get('/api/faqs', asyncRoute(async (req, res) => {
  const payload = await getPayloadClient();
  const page = typeof req.query.page === 'string' ? req.query.page : undefined;
  const where = page ? { page: { equals: page } } : {};
  const docs = await findPublished('faqs', where);
  await applyLocalizations(payload, 'faqs', docs as Array<Record<string, unknown>>, languageFromRequest(req));
  const faqs = docs.map(normalizeFaq);

  if (page) {
    res.json(faqs.filter((faq) => faq.page === page));
    return;
  }

  res.json(
    faqs.reduce<Record<PageKey, typeof faqs>>((acc, faq) => {
      acc[faq.page] = [...(acc[faq.page] || []), faq];
      return acc;
    }, {} as Record<PageKey, typeof faqs>),
  );
}));

app.get('/api/pillars', asyncRoute(async (req, res) => {
  const payload = await getPayloadClient();
  const docs = await findPublished('pillars');
  await applyLocalizations(payload, 'pillars', docs as Array<Record<string, unknown>>, languageFromRequest(req));
  res.json(docs.map(normalizePillar));
}));

app.get('/api/scenarios', asyncRoute(async (req, res) => {
  const payload = await getPayloadClient();
  const docs = await findPublished('scenarios');
  await applyLocalizations(payload, 'scenarios', docs as Array<Record<string, unknown>>, languageFromRequest(req));
  res.json(docs.map(normalizeScenario));
}));

app.get('/api/experts', asyncRoute(async (req, res) => {
  const payload = await getPayloadClient();
  const tournamentId = typeof req.query.tournamentId === 'string' ? req.query.tournamentId.trim() : '';
  const docs = await findPublished('experts');
  await applyLocalizations(payload, 'experts', docs as Array<Record<string, unknown>>, languageFromRequest(req));
  const normalized = docs.map(normalizeExpert);
  const filtered = tournamentId ? normalized.filter((expert) => expert.tournamentId === tournamentId) : normalized;
  res.json(filtered);
}));

app.get('/api/trust-points', asyncRoute(async (req, res) => {
  const payload = await getPayloadClient();
  const docs = await findPublished('trust-points');
  await applyLocalizations(payload, 'trust-points', docs as Array<Record<string, unknown>>, languageFromRequest(req));
  res.json(docs.map(normalizeTrustPoint));
}));

app.get('/api/stats', asyncRoute(async (req, res) => {
  const payload = await getPayloadClient();
  const docs = await findPublished('stats');
  await applyLocalizations(payload, 'stats', docs as Array<Record<string, unknown>>, languageFromRequest(req));
  res.json(docs.map(normalizeStat));
}));

app.get('/api/contact-settings', asyncRoute(async (req, res) => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'contact-settings' as any,
    depth: Number(req.query.depth || 0),
    limit: Math.min(10, Math.max(1, Number(req.query.limit || 1))),
    sort: '-updatedAt',
    overrideAccess: true,
  });
  res.json(result);
}));

app.get('/api/operator-settings', asyncRoute(async (req, res) => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'operator-settings' as any,
    depth: Number(req.query.depth || 0),
    limit: Math.min(10, Math.max(1, Number(req.query.limit || 1))),
    sort: '-updatedAt',
    overrideAccess: true,
  });
  res.json(result);
}));

app.get('/api/team-members', asyncRoute(async (req, res) => {
  const payload = await getPayloadClient();
  const docs = await findApprovedTeamMembers();
  await applyLocalizations(payload, 'team-members', docs as Array<Record<string, unknown>>, languageFromRequest(req));
  res.json(docs.map(normalizeTeamMember));
}));

app.post('/api/applications', upload.single('projectFile'), asyncRoute(async (req, res) => {
  const payload = await getPayloadClient();
  const body = req.body || {};

  if (!body.name || !body.email) {
    await removeUploadedFile(req.file);
    res.status(400).json({ code: 'APPLICATION_REQUIRED_FIELDS' });
    return;
  }

  const attachmentIds: Array<string | number> = [];

  if (req.file) {
    if (!(await isExpectedFileContent(req.file))) {
      await removeUploadedFile(req.file);
      res.status(415).json({ code: 'UNSUPPORTED_FILE_TYPE' });
      return;
    }

    const media = await payload.create({
      collection: 'media' as any,
      data: {
        alt: req.file.originalname,
      },
      filePath: req.file.path,
      overrideAccess: true,
    });

    attachmentIds.push(media.id);
  }

  const ticketId = `NVK-${Math.floor(10000 + Math.random() * 90000)}-${String(body.city || 'WEB').slice(0, 3).toUpperCase()}`;

  const application = await payload.create({
    collection: 'applications' as any,
    data: {
      ticketId,
      status: 'confirmed',
      name: body.name,
      email: body.email,
      grade: body.grade,
      age: body.age,
      city: body.city,
      contact: body.contact,
      interest: body.interest,
      tournamentId: body.tournamentId,
      hasTeam: body.hasTeam,
      teamSize: body.teamSize,
      portfolioLink: body.portfolioLink,
      coverLetter: body.coverLetter,
      attachments: attachmentIds,
      source: body.source || 'api',
    },
    overrideAccess: true,
  });

  res.status(201).json({
    id: application.id,
    ticketId,
    status: 'confirmed',
  });
}));

app.post('/api/community-leads', asyncRoute(async (req, res) => {
  const payload = await getPayloadClient();
  const body = req.body || {};

  if (!body.name || !body.age || !body.location || !body.contact) {
    res.status(400).json({ code: 'COMMUNITY_LEAD_REQUIRED_FIELDS' });
    return;
  }

  const lead = await payload.create({
    collection: 'community-leads' as any,
    data: {
      name: body.name,
      age: body.age,
      location: body.location,
      contact: body.contact,
      interest: body.interest,
      source: body.source || 'home-inline',
    },
    overrideAccess: true,
  });

  res.status(201).json({ id: lead.id, status: 'received' });
}));

app.post('/api/team-members', asyncRoute(async (req, res) => {
  const payload = await getPayloadClient();
  const body = req.body || {};

  if (!body.name || !body.age || !body.country || !body.shortBio || !body.contact) {
    res.status(400).json({ code: 'TEAM_MEMBER_REQUIRED_FIELDS' });
    return;
  }
  const originalLanguage = typeof body.originalLanguage === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(body.originalLanguage)
    ? body.originalLanguage
    : 'ru';

  const member = await payload.create({
    collection: 'team-members' as any,
    data: {
      name: body.name,
      age: Number(body.age),
      country: body.country,
      city: body.city,
      shortBio: body.shortBio,
      interests: (body.interests || []).map((value: string) => ({ value })),
      skills: (body.skills || []).map((value: string) => ({ value })),
      targetRoles: body.targetRoles || ['other'],
      targetProject: body.targetProject,
      whyLooking: body.whyLooking || body.shortBio,
      contact: body.contact,
      contactType: body.contactType || 'telegram',
      originalLanguage,
      moderationStatus: 'pending',
      isApproved: false,
    },
    overrideAccess: true,
  });

  res.status(201).json({ id: member.id, status: 'moderation' });
}));

const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);

  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ code: 'FILE_TOO_LARGE' });
    return;
  }

  if (error instanceof multer.MulterError && error.code === 'LIMIT_UNEXPECTED_FILE') {
    res.status(400).json({ code: 'UNEXPECTED_FILE' });
    return;
  }

  if (error.message === 'UNSUPPORTED_FILE_TYPE') {
    res.status(415).json({ code: 'UNSUPPORTED_FILE_TYPE' });
    return;
  }

  res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' ? undefined : error.message,
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Navykus API listening on http://localhost:${port}`);
});
