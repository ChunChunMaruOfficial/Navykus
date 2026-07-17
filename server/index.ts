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

if (process.env.NODE_ENV === 'production') {
  const prodRequired = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
  for (const key of prodRequired) {
    if (!process.env[key]) {
      console.error(`Missing required production environment variable: ${key}`);
      process.exit(1);
    }
  }
}

import {
  ACTIVITIES,
  EXPERTS,
  PILLARS,
  STATS,
  TEAM_MEMBERS,
  TOURNAMENTS,
  TRUST_POINTS,
} from '../src/data';
import type { PageKey } from '../src/types';
import { getPayloadClient } from './payload';
import { registerPlatformRoutes } from './platform';
import { registerBlogRoutes } from './blog';
import {
  normalizeActivity,
  normalizeExpert,
  normalizeFaq,
  normalizePillar,
  normalizeStat,
  normalizeTeamMember,
  normalizeTournament,
  normalizeTrustPoint,
} from './normalizers';

const app = express();
app.set('trust proxy', 1);
const port = Number(process.env.API_PORT || process.env.PORT || 4000);
const uploadDir = path.resolve(process.cwd(), 'uploads', 'incoming');

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
  res.header('Access-Control-Allow-Origin', configuredOrigin);
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

const findPublished = async (collection: string, where: Record<string, unknown> = {}) => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: collection as any,
    depth: 1,
    limit: 200,
    sort: 'sortOrder',
    where: {
      isPublished: {
        equals: true,
      },
      ...where,
    },
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
    },
    overrideAccess: true,
  });

  return result.docs;
};

app.get('/api/health', asyncRoute(async (_req, res) => {
  try {
    const payload = await getPayloadClient();
    await payload.find({ collection: 'users', limit: 0 });
    res.json({ ok: true, service: 'navykus-express-payload', db: 'connected' });
  } catch {
    res.status(503).json({ ok: false, service: 'navykus-express-payload', db: 'disconnected' });
  }
}));

app.get('/api/content/home', asyncRoute(async (_req, res) => {
  const [tournaments, activities, experts, teamMembers, trustPoints, pillars, stats] = await Promise.all([
    findPublished('tournaments'),
    findPublished('activities'),
    findPublished('experts'),
    findApprovedTeamMembers(),
    findPublished('trust-points'),
    findPublished('pillars'),
    findPublished('stats'),
  ]);

  res.json({
    tournaments: tournaments.length ? tournaments.map(normalizeTournament) : TOURNAMENTS,
    activities: activities.length ? activities.map(normalizeActivity) : ACTIVITIES,
    experts: experts.length ? experts.map(normalizeExpert) : EXPERTS,
    teamMembers: teamMembers.length ? teamMembers.map(normalizeTeamMember) : TEAM_MEMBERS,
    trustPoints: trustPoints.length ? trustPoints.map(normalizeTrustPoint) : TRUST_POINTS,
    pillars: pillars.length ? pillars.map(normalizePillar) : PILLARS,
    stats: stats.length ? stats.map(normalizeStat) : STATS,
  });
}));

app.get('/api/tournaments', asyncRoute(async (_req, res) => {
  const docs = await findPublished('tournaments');
  res.json(docs.length ? docs.map(normalizeTournament) : TOURNAMENTS);
}));

app.get('/api/activities', asyncRoute(async (_req, res) => {
  const docs = await findPublished('activities');
  res.json(docs.length ? docs.map(normalizeActivity) : ACTIVITIES);
}));

app.get('/api/faqs', asyncRoute(async (req, res) => {
  const page = typeof req.query.page === 'string' ? req.query.page : undefined;
  const where = page ? { page: { equals: page } } : {};
  const docs = await findPublished('faqs', where);
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

app.get('/api/team-members', asyncRoute(async (_req, res) => {
  const docs = await findApprovedTeamMembers();
  res.json(docs.length ? docs.map(normalizeTeamMember) : TEAM_MEMBERS.filter((member) => member.isApproved));
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
