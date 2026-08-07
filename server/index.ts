import './env';

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

import { execSync, spawn } from 'node:child_process';

import type { PageKey } from '../src/types';
import { SUPPORTED_LANGUAGES } from '../src/i18n/languages';
import { getAdminContentTypeByCollection } from '../src/content-admin-registry';
import { getPayloadClient } from './payload';
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

const removeUploadedFiles = async (files?: Express.Multer.File[]) => {
  await Promise.all((files || []).map((file) => removeUploadedFile(file)));
};

const listFromBody = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value !== 'string') return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean);
  } catch {
    // Fall back to comma-separated input.
  }
  return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
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

const queryLimit = (value: unknown, fallback = 50) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(200, Math.max(1, parsed));
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

const DEPLOY_SECRET = process.env.DEPLOY_SECRET || '';
const DEPLOY_DIR = process.env.DEPLOY_DIR || '/root/Navykus';
const DEPLOY_USER = process.env.DEPLOY_USER || 'ubuntu';

app.post('/api/deploy', asyncRoute(async (req, res) => {
  const auth = req.headers['authorization'] || '';
  if (!DEPLOY_SECRET || auth !== `Bearer ${DEPLOY_SECRET}`) {
    res.status(401).json({ code: 'DEPLOY_UNAUTHORIZED' });
    return;
  }
  res.status(202).json({ status: 'deploy_started' });
  // The admin panel is a separate Next.js process that may run from a DIFFERENT
  // checkout directory or under a different pm2 app name than the Express API.
  // A plain `pm2 restart navykus-admin` silently misses it (fallback start then
  // fails with EADDRINUSE because the real admin process still holds :3001),
  // which left the admin serving STALE code after deploys. This chain therefore
  // (1) updates every known Navykus checkout, (2) restarts the API, and
  // (3) discovers & restarts ANY pm2 admin process whose cwd is a Navykus dir.
  const deployScript = `
set -e
export NODE_OPTIONS="--max-old-space-size=3072"
echo "=== [1/5] Updating primary checkout ${DEPLOY_DIR} ==="
git fetch origin main
git clean -fd -e .env -e payload.db -e payload.db-* -e payload.db.* -e uploads/
git reset --hard origin/main
npm install --production=false
npm run build
npm run build:admin
yes | npx payload migrate --config src/payload.config.ts || true
echo "=== [2/5] Updating alternate Navykus checkouts ==="
for dir in /home/ubuntu/navykus /root/Navykus; do
  if [ "$dir" != "${DEPLOY_DIR}" ] && [ -d "$dir/.git" ]; then
    echo "--- updating $dir ---"
    (cd "$dir" && git fetch origin main && git clean -fd -e .env -e payload.db -e payload.db-* -e payload.db.* -e uploads/ && git reset --hard origin/main && npm install --production=false && npm run build:admin) || echo "WARN: failed to update $dir"
  fi
done
echo "=== [3/5] Restarting admin process ==="
ADMIN_APPS=$(pm2 jlist 2>/dev/null | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{for(const p of JSON.parse(d)){const nm=(p.name||'').toLowerCase();const cwd=(p.pm2_env&&p.pm2_env.pm_cwd)||'';if(/navykus/i.test(cwd)&&/admin/.test(nm))console.log(p.name)}}catch(e){}})")
if [ -n "$ADMIN_APPS" ]; then
  for app in $ADMIN_APPS; do echo "--- pm2 restart $app ---"; pm2 restart "$app" --update-env || true; done
else
  echo "--- no admin app found by discovery; trying navykus-admin ---"
  pm2 restart navykus-admin --update-env 2>/dev/null || pm2 start npm --name navykus-admin -- run start:admin || true
fi
pm2 save || true
echo "=== [4/5] Restarting API (LAST — kills this deploy chain) ==="
pm2 restart navykus-api --update-env || pm2 start npm --name navykus-api -- run start:api || true
echo "=== [5/5] Deploy finished ==="
`;
  const child = spawn('bash', ['-c', `( ${deployScript} ) 2>&1 | tee /tmp/navykus-deploy.log`], {
    cwd: DEPLOY_DIR,
    stdio: 'inherit',
    timeout: 600000,
  });
  child.on('error', (err) => {
    console.error('Deploy process error:', err.message);
  });
  child.on('exit', (code) => {
    console.log(`Deploy process exited with code ${code}`);
  });
}));

// Read-only diagnostics so the deploy can be verified remotely without SSH.
app.get('/api/deploy/log', asyncRoute(async (_req, res) => {
  const content = await fs.promises.readFile('/tmp/navykus-deploy.log', 'utf-8').catch(() => '');
  res.type('text/plain').send(content.slice(-30000));
}));

app.get('/api/deploy/status', asyncRoute(async (_req, res) => {
  try {
    const raw = execSync('pm2 jlist 2>/dev/null', { encoding: 'utf-8', timeout: 8000 });
    const apps = (JSON.parse(raw) as Array<{
      name?: string;
      pm2_env?: { status?: string; restart_time?: number; pm_cwd?: string; pm_exec_path?: string };
    }>).map((p) => ({
      name: p.name,
      status: p.pm2_env?.status,
      restarts: p.pm2_env?.restart_time ?? 0,
      cwd: p.pm2_env?.pm_cwd,
      script: p.pm2_env?.pm_exec_path,
    }));
    res.json({ apps });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}));

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

app.get('/api/championships', asyncRoute(async (req, res) => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'tournaments' as any,
    depth: 1,
    limit: queryLimit(req.query.limit),
    sort: req.query.sort === 'oldest' ? 'createdAt' : '-createdAt',
    where: publicCollectionWhere('tournaments'),
    overrideAccess: true,
  });
  await applyLocalizations(payload, 'tournaments', result.docs as Array<Record<string, unknown>>, languageFromRequest(req));
  res.json(result);
}));

app.get('/api/championships/featured', asyncRoute(async (req, res) => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'tournaments' as any,
    depth: 1,
    limit: 1,
    where: publicCollectionWhere('tournaments', { isFeatured: { equals: true } }),
    overrideAccess: true,
  });
  if (result.docs.length === 0) {
    res.status(404).json({ code: 'NO_FEATURED_CHAMPIONSHIP' });
    return;
  }
  await applyLocalizations(payload, 'tournaments', result.docs as Array<Record<string, unknown>>, languageFromRequest(req));
  res.json({ doc: result.docs[0] });
}));

app.get('/api/events', asyncRoute(async (req, res) => {
  const payload = await getPayloadClient();
  const where = publicCollectionWhere('events', req.query.format ? { format: { equals: req.query.format } } : {});
  const result = await payload.find({
    collection: 'events' as any,
    depth: 1,
    limit: queryLimit(req.query.limit),
    sort: req.query.sort === 'oldest' ? 'eventDate' : '-eventDate',
    where,
    overrideAccess: true,
  });
  await applyLocalizations(payload, 'events', result.docs as Array<Record<string, unknown>>, languageFromRequest(req));
  res.json(result);
}));

app.get('/api/opportunities', asyncRoute(async (req, res) => {
  const payload = await getPayloadClient();
  const where = publicCollectionWhere('opportunities', req.query.format ? { format: { equals: req.query.format } } : {});
  const result = await payload.find({
    collection: 'opportunities' as any,
    depth: 1,
    limit: queryLimit(req.query.limit),
    sort: req.query.sort === 'deadline' ? 'deadline' : '-createdAt',
    where,
    overrideAccess: true,
  });
  await applyLocalizations(payload, 'opportunities', result.docs as Array<Record<string, unknown>>, languageFromRequest(req));
  res.json(result);
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

app.post('/api/team-members', upload.array('portfolioFiles', 5), asyncRoute(async (req, res) => {
  const payload = await getPayloadClient();
  const body = req.body || {};
  const files = Array.isArray(req.files) ? req.files : [];

  if (!body.name || !body.email || !body.age || !body.country || !body.shortBio || !body.contact || !body.whyLooking) {
    await removeUploadedFiles(files);
    res.status(400).json({ code: 'TEAM_MEMBER_REQUIRED_FIELDS' });
    return;
  }
  for (const file of files) {
    if (!(await isExpectedFileContent(file))) {
      await removeUploadedFiles(files);
      res.status(415).json({ code: 'UNSUPPORTED_FILE_TYPE' });
      return;
    }
  }

  const age = Number(body.age);
  if (!Number.isFinite(age) || age < 10 || age > 24) {
    await removeUploadedFiles(files);
    res.status(400).json({ code: 'TEAM_MEMBER_INVALID_AGE' });
    return;
  }

  const portfolioFileIds: Array<string | number> = [];
  try {
    for (const file of files) {
      const media = await payload.create({
        collection: 'media' as any,
        data: {
          alt: file.originalname,
        },
        filePath: file.path,
        overrideAccess: true,
      });
      portfolioFileIds.push(media.id);
    }
  } catch (error) {
    await removeUploadedFiles(files);
    throw error;
  }

  const originalLanguage = typeof body.originalLanguage === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(body.originalLanguage)
    ? body.originalLanguage
    : 'ru';

  try {
    const member = await payload.create({
      collection: 'team-members' as any,
      data: {
        name: String(body.name).trim(),
        email: String(body.email).trim(),
        age,
        country: String(body.country).trim(),
        city: typeof body.city === 'string' ? body.city.trim() : undefined,
        shortBio: String(body.shortBio).trim(),
        interests: listFromBody(body.interests).map((value) => ({ value })),
        skills: listFromBody(body.skills).map((value) => ({ value })),
        targetRoles: listFromBody(body.targetRoles).length ? listFromBody(body.targetRoles) : ['other'],
        targetProject: typeof body.targetProject === 'string' ? body.targetProject.trim() : undefined,
        whyLooking: String(body.whyLooking).trim(),
        contact: String(body.contact).trim(),
        contactType: ['telegram', 'email', 'discord'].includes(body.contactType) ? body.contactType : 'telegram',
        portfolioLink: typeof body.portfolioLink === 'string' ? body.portfolioLink.trim() : undefined,
        portfolioFiles: portfolioFileIds,
        sourceType: typeof body.sourceType === 'string' ? body.sourceType : 'api',
        sourceContext: typeof body.sourceContext === 'string' ? body.sourceContext.trim() : undefined,
        sourceId: typeof body.sourceId === 'string' ? body.sourceId.trim() : undefined,
        tournamentId: typeof body.tournamentId === 'string' ? body.tournamentId.trim() : undefined,
        originalLanguage,
        moderationStatus: 'pending',
        isApproved: false,
      },
      overrideAccess: true,
    });

    await removeUploadedFiles(files);
    res.status(201).json({ id: member.id, ticketId: `NVK-${member.id}`, status: 'moderation' });
  } catch (error) {
    await removeUploadedFiles(files);
    throw error;
  }
}));

app.use(
  ['/api/auth', '/api/profile', '/api/participants', '/api/admin', '/api/team-posts', '/api/applications', '/api/community-leads'],
  (_req, res) => {
    res.status(410).json({ code: 'PUBLIC_PLATFORM_REMOVED' });
  },
);

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
