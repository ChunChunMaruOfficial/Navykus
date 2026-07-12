import 'dotenv/config';

import fs from 'node:fs';
import path from 'node:path';

import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';

import {
  ACTIVITIES,
  EXPERTS,
  PILLARS,
  STATS,
  TEAM_MEMBERS,
  TOURNAMENTS,
  TRUST_POINTS,
} from '../src/data';
import { getPayloadClient } from './payload';
import {
  normalizeActivity,
  normalizeExpert,
  normalizePillar,
  normalizeStat,
  normalizeTeamMember,
  normalizeTournament,
  normalizeTrustPoint,
} from './normalizers';

const app = express();
const port = Number(process.env.API_PORT || process.env.PORT || 4000);
const uploadDir = path.resolve(process.cwd(), 'uploads', 'incoming');

fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const asyncRoute = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) => (req: Request, res: Response, next: NextFunction) => {
  void handler(req, res, next).catch(next);
};

app.use((req, res, next) => {
  const configuredOrigin = process.env.CORS_ORIGIN;
  res.header('Access-Control-Allow-Origin', configuredOrigin || req.headers.origin || '*');
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json({ limit: '1mb' }));

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
  await getPayloadClient();
  res.json({ ok: true, service: 'navykus-express-payload' });
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

app.get('/api/team-members', asyncRoute(async (_req, res) => {
  const docs = await findApprovedTeamMembers();
  res.json(docs.length ? docs.map(normalizeTeamMember) : TEAM_MEMBERS.filter((member) => member.isApproved));
}));

app.post('/api/applications', upload.single('projectFile'), asyncRoute(async (req, res) => {
  const payload = await getPayloadClient();
  const body = req.body || {};

  if (!body.name || !body.email) {
    res.status(400).json({ error: 'name and email are required' });
    return;
  }

  const attachmentIds: string[] = [];

  if (req.file) {
    const media = await payload.create({
      collection: 'media' as any,
      data: {
        alt: req.file.originalname,
      },
      filePath: req.file.path,
      overrideAccess: true,
    });

    attachmentIds.push(String(media.id));
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
    res.status(400).json({ error: 'name, age, location and contact are required' });
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
    res.status(400).json({ error: 'name, age, country, shortBio and contact are required' });
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
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? undefined : error.message,
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Navykus API listening on http://localhost:${port}`);
});

