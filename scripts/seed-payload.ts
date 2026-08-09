import 'dotenv/config';

import {
  ACTIVITIES,
  EXPERTS,
  PILLARS,
  SCENARIOS,
  STATS,
  TEAM_MEMBERS,
  TOURNAMENTS,
  TRUST_POINTS,
} from '../src/data';
import { OPPORTUNITIES } from '../src/components/OpportunitiesPage';
import { getPayloadClient } from '../server/payload';

const list = (items: string[] = []) => items.map((value) => ({ value }));
const DRAFT_COLLECTIONS = new Set(['team-members', 'tournaments', 'events', 'opportunities', 'experts', 'faqs']);
const PUBLISHED_FLAG_COLLECTIONS = new Set(['tournaments', 'events', 'opportunities', 'experts', 'faqs']);
const pickRu = (value: Record<string, string> | string | undefined) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.ru || value.en || Object.values(value).find(Boolean) || '';
};
const asDate = (value?: string) => value ? (value.includes('T') ? value : `${value}T00:00:00.000Z`) : undefined;
const seedVisibility = (collection: string) => ({
  ...(DRAFT_COLLECTIONS.has(collection) ? { _status: 'published' } : {}),
  ...(PUBLISHED_FLAG_COLLECTIONS.has(collection) ? { isPublished: true } : {}),
});
const ui = (await import('../src/i18n/locales/ru/translation.json', { with: { type: 'json' } })).default.ui as any;

const tr = (path: string) => path.split('.').reduce<any>((acc, key) => acc?.[key], { ui }) || path;

const FAQ_SEED = [
  ['about-faq-1', 'about', 'ui.aboutprojectpage.4b5e0f1908', 'ui.aboutprojectpage.09fd377d38'],
  ['about-faq-2', 'about', 'ui.aboutprojectpage.a4f04e2aad', 'ui.aboutprojectpage.3aeea8f6e3'],
  ['about-faq-3', 'about', 'ui.aboutprojectpage.ace0eadb3d', 'ui.aboutprojectpage.090808a2de'],
  ['about-faq-4', 'about', 'ui.aboutprojectpage.1d5cd942b3', 'ui.aboutprojectpage.3e6cba422a'],
  ['about-faq-5', 'about', 'ui.aboutprojectpage.55cd784afe', 'ui.aboutprojectpage.b38dd282f8'],
  ['about-faq-6', 'about', 'ui.aboutprojectpage.e663d62bb5', 'ui.aboutprojectpage.b966ab17f5'],
  ['championship-faq-1', 'championship', 'ui.championshippage.75eb0d84', 'ui.championshippage.4b587e32b1'],
  ['championship-faq-2', 'championship', 'ui.championshippage.ccc076b0', 'ui.championshippage.abf0a3c0da'],
  ['championship-faq-3', 'championship', 'ui.championshippage.fdb6874f', 'ui.championshippage.c00db4e511'],
  ['championship-faq-4', 'championship', 'ui.championshippage.c264c842', 'ui.championshippage.75488dd388'],
  ['championship-faq-5', 'championship', 'ui.championshippage.47dfb4af', 'ui.championshippage.59016ab8e3'],
  ['find-team-faq-1', 'find-team', 'ui.findteampage.6954042f', 'ui.findteampage.a264de7b48'],
  ['find-team-faq-2', 'find-team', 'ui.findteampage.291b48f0', 'ui.findteampage.c4adff98dd'],
  ['find-team-faq-3', 'find-team', 'ui.findteampage.32c49e31', 'ui.findteampage.bb017e0e8a'],
  ['find-team-faq-4', 'find-team', 'ui.findteampage.5167e97a', 'ui.findteampage.b734b04eb7'],
  ['find-team-faq-5', 'find-team', 'ui.findteampage.27f20eac', 'ui.findteampage.a80b8b09d5'],
] as const;

const EVENT_SEED = [
  {
    legacyId: 'event-public-speaking',
    title: 'Public Speaking Lab',
    slug: 'public-speaking-lab',
    shortDescription: 'Online workshop for preparing a confident project presentation.',
    fullDescription: 'Students practice structure, argumentation, visual support and answers to expert questions.',
    eventType: 'workshop',
    eventDate: '2026-09-12T14:00:00.000Z',
    timeZone: 'Europe/Moscow',
    format: 'online',
    country: 'Global',
    speaker: 'Navykus mentors',
    participantLimit: 80,
    registrationDeadline: '2026-09-10T20:59:00.000Z',
    languages: list(['ru', 'en']),
    materials: list(['slides', 'checklist']),
    registrationUrl: 'https://example.org/register/public-speaking-lab',
  },
  {
    legacyId: 'event-youth-connect',
    title: 'Asian Youth Connect',
    slug: 'asian-youth-connect',
    shortDescription: 'Networking session for students looking for international teammates.',
    fullDescription: 'Participants introduce their interests, projects and roles they want to cover in future teams.',
    eventType: 'networking',
    eventDate: '2026-10-04T12:00:00.000Z',
    timeZone: 'Asia/Almaty',
    format: 'hybrid',
    country: 'Kazakhstan',
    venue: 'Almaty and online',
    participantLimit: 120,
    registrationDeadline: '2026-10-01T20:59:00.000Z',
    languages: list(['ru', 'kk', 'en']),
    materials: list(['participant guide']),
    registrationUrl: 'https://example.org/register/asian-youth-connect',
  },
  {
    legacyId: 'event-code-marathon',
    title: 'Code Marathon: Web Development',
    slug: 'code-marathon-web-dev',
    shortDescription: '24-hour coding marathon for building web projects from scratch.',
    fullDescription: 'Teams compete to build a functional web application within 24 hours. Mentors provide guidance, and the best projects win prizes.',
    eventType: 'hackathon',
    eventDate: '2026-08-20T09:00:00.000Z',
    timeZone: 'Europe/Moscow',
    format: 'online',
    country: 'Global',
    speaker: 'Industry experts',
    participantLimit: 60,
    registrationDeadline: '2026-08-15T20:59:00.000Z',
    languages: list(['ru', 'en']),
    materials: list(['starter kit', 'API docs']),
    registrationUrl: 'https://example.org/register/code-marathon-web-dev',
  },
  {
    legacyId: 'event-leadership-forum',
    title: 'Youth Leadership Forum 2026',
    slug: 'youth-leadership-forum-2026',
    shortDescription: 'Three-day forum with workshops, panels and project pitches.',
    fullDescription: 'Young leaders gather to discuss global challenges, develop projects and connect with mentors and investors.',
    eventType: 'forum',
    eventDate: '2026-11-05T10:00:00.000Z',
    timeZone: 'Asia/Almaty',
    format: 'offline',
    country: 'Kazakhstan',
    venue: 'Almaty Congress Center',
    participantLimit: 200,
    registrationDeadline: '2026-10-20T20:59:00.000Z',
    languages: list(['ru', 'kk', 'en']),
    materials: list(['program', 'notebook']),
    registrationUrl: 'https://example.org/register/youth-leadership-forum-2026',
  },
];

const OPPORTUNITY_SEED = OPPORTUNITIES.map((item) => ({
  legacyId: item.id,
  title: pickRu(item.title),
  slug: item.slug,
  organization: pickRu(item.organizer),
  opportunityType: item.category,
  source: item.source,
  category: item.category,
  direction: item.direction,
  participation: item.participation,
  shortDescription: pickRu(item.summary),
  fullDescription: pickRu(item.description),
  logoUrl: item.imageUrl,
  imageUrl: item.imageUrl,
  country: pickRu(item.country),
  city: pickRu(item.city),
  format: item.format,
  ageMin: item.minAge,
  ageMax: item.maxAge,
  deadline: asDate(item.deadline),
  startDate: asDate(item.startDate),
  finalDeadline: item.finalDeadline,
  registrationOpen: item.registrationOpen,
  seats: item.seats,
  savedCount: item.savedCount,
  editorPick: item.editorPick,
  recommended: item.recommended,
  cost: item.cost,
  funding: item.cost === 'scholarship',
  portfolioValue: item.portfolioValue,
  publishedAt: asDate(item.publishedAt),
  officialUrl: item.externalUrl || 'https://example.org/apply',
  internalApplicationsEnabled: item.source === 'navykus',
  languages: list(item.languages),
  skills: list(item.skills.map(pickRu)),
  keywords: list(item.keywords),
  grades: list(item.grades.map(String)),
  requirements: list(item.requirements.map(pickRu)),
  benefits: list(item.outcomes.map(pickRu)),
  documents: list([]),
}));

const TRUST_POINT_SEED = [
  ...TRUST_POINTS,
  {
    id: 'tr-6',
    title: tr('ui.app.trustGrowthTitle'),
    description: tr('ui.app.trustGrowthDescription'),
  },
].filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index);

const STAT_SEED = STATS.length > 0
  ? STATS
  : [
      {
        value: '15+',
        label: tr('ui.app.ffecc101e5'),
      },
    ];

const ensureByLegacyId = async (
  collection: string,
  legacyId: string,
  data: Record<string, unknown>,
) => {
  const payload = await getPayloadClient();
  const existing = await payload.find({
    collection: collection as any,
    where: {
      legacyId: {
        equals: legacyId,
      },
    },
    limit: 1,
    overrideAccess: true,
  });

  const existingDoc = existing.docs[0] as Record<string, unknown> | undefined;
  if (existingDoc) {
    const visibilityPatch = seedVisibility(collection);
    const needsVisibilityPatch = Object.entries(visibilityPatch).some(([key, value]) => existingDoc[key] !== value);
    if (needsVisibilityPatch) {
      await payload.update({
        collection: collection as any,
        id: existingDoc.id as any,
        data: visibilityPatch,
        overrideAccess: true,
      });
    }
    return;
  }

  await payload.create({
    collection: collection as any,
    data: {
      legacyId,
      ...data,
      ...seedVisibility(collection),
    },
    overrideAccess: true,
  });
};

const ensureOpportunitySeed = async (
  legacyId: string,
  slug: string,
  data: Record<string, unknown>,
) => {
  const payload = await getPayloadClient();
  const existing = await payload.find({
    collection: 'opportunities' as any,
    where: {
      or: [
        { legacyId: { equals: legacyId } },
        { slug: { equals: slug } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  });

  const existingDoc = existing.docs[0] as Record<string, unknown> | undefined;
  if (existingDoc) {
    const missingCardFields = !existingDoc.source || !existingDoc.category || !existingDoc.imageUrl;
    const oldSeedIdentity = existingDoc.legacyId !== legacyId;
    if (missingCardFields || oldSeedIdentity) {
      await payload.update({
        collection: 'opportunities' as any,
        id: existingDoc.id as any,
        data: {
          legacyId,
          ...data,
          ...seedVisibility('opportunities'),
        },
        overrideAccess: true,
      });
    } else if (existingDoc._status !== 'published' || existingDoc.isPublished !== true) {
      await payload.update({
        collection: 'opportunities' as any,
        id: existingDoc.id as any,
        data: seedVisibility('opportunities'),
        overrideAccess: true,
      });
    }
    return;
  }

  await payload.create({
    collection: 'opportunities' as any,
    data: {
      legacyId,
      ...data,
      ...seedVisibility('opportunities'),
    },
    overrideAccess: true,
  });
};

const seed = async () => {
  const payload = await getPayloadClient();

  // Wait a bit for schema push to complete
  await new Promise(r => setTimeout(r, 1000));

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@navykus.local';
  const adminPassword = process.env.ADMIN_PASSWORD;

  const existingAdmin = await payload.find({
    collection: 'users' as any,
    where: {
      email: {
        equals: adminEmail,
      },
    },
    limit: 1,
    overrideAccess: true,
  });

  if (!existingAdmin.docs[0]) {
    if (!adminPassword && process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_PASSWORD is required to create the seed administrator in production.');
    }

    await payload.create({
      collection: 'users' as any,
      data: {
        email: adminEmail,
        password: adminPassword || 'change-me-please',
        name: 'Navykus Admin',
        role: 'admin',
      },
      overrideAccess: true,
    });
  } else if (existingAdmin.docs[0].role !== 'admin') {
    await payload.update({
      collection: 'users' as any,
      id: existingAdmin.docs[0].id,
      data: {
        role: 'admin',
      },
      overrideAccess: true,
    });
  }

  for (const [index, item] of TOURNAMENTS.entries()) {
    await ensureByLegacyId('tournaments', item.id, {
      ...item,
      sortOrder: index,
      isPublished: true,
      isFeatured: index === 0, // Mark the first tournament as featured
      originalLanguage: 'ru',
      pitch: tr('ui.championshippage.dd865f6e85'),
      targetAudience: tr('ui.championshippage.8de641ff48'),
      ageLimit: tr('ui.championshippage.9c2bddb76a'),
      teamsAllowed: tr('ui.championshippage.ed233d55cc'),
      language: tr('ui.championshippage.e91c59966c'),
      expectedResult: tr('ui.championshippage.034bb56718'),
      registrationStatus: 'open',
      themesText: [
        tr('ui.championshippage.6e972b4b72'),
        tr('ui.championshippage.61fb774e62'),
        tr('ui.championshippage.058159276f'),
        tr('ui.championshippage.f1d7d23827'),
      ].join('\n'),
      evaluationCriteriaText: [
        tr('ui.championshippage.47b3f641ee'),
        tr('ui.championshippage.49a254c0ad'),
        tr('ui.championshippage.c3ab1eab18'),
        tr('ui.championshippage.bdbee4fdad'),
      ].join('\n'),
      skills: list(item.skills),
      mentors: list(item.mentors),
    });
  }

  // Get the featured tournament ID (first tournament) to link experts
  const featuredTournament = await payload.find({
    collection: 'tournaments' as any,
    where: { isFeatured: { equals: true } },
    limit: 1,
    overrideAccess: true,
  });
  const featuredTournamentId = featuredTournament.docs[0]?.id;

  for (const [index, item] of ACTIVITIES.entries()) {
    await ensureByLegacyId('activities', item.id, {
      ...item,
      sortOrder: index,
      isPublished: true,
      benefits: list(item.benefits),
    });
  }

  for (const [index, item] of EXPERTS.entries()) {
    await ensureByLegacyId('experts', item.id, {
      ...item,
      sortOrder: index,
      isPublished: true,
      tournamentId: featuredTournamentId, // Link experts to featured tournament
    });
  }

  for (const [index, item] of TEAM_MEMBERS.entries()) {
    await ensureByLegacyId('team-members', item.id, {
      ...item,
      sortOrder: index,
      originalLanguage: 'ru',
      moderationStatus: 'approved',
      reviewedAt: new Date().toISOString(),
      interests: list(item.interests),
      skills: list(item.skills),
    });
  }

  for (const [index, item] of TRUST_POINT_SEED.entries()) {
    await ensureByLegacyId('trust-points', item.id, {
      ...item,
      sortOrder: index,
      isPublished: true,
    });
  }

  for (const [index, item] of PILLARS.entries()) {
    await ensureByLegacyId('pillars', `pillar-${index + 1}`, {
      ...item,
      sortOrder: index,
      isPublished: true,
    });
  }

  for (const [index, item] of SCENARIOS.entries()) {
    await ensureByLegacyId('scenarios', item.id, {
      ...item,
      sortOrder: index,
      isPublished: true,
    });
  }

  for (const [index, item] of STAT_SEED.entries()) {
    await ensureByLegacyId('stats', `stat-${index + 1}`, {
      ...item,
      sortOrder: index,
      isPublished: true,
    });
  }

  for (const [index, [legacyId, page, questionKey, answerKey]] of FAQ_SEED.entries()) {
    await ensureByLegacyId('faqs', legacyId, {
      page,
      question: tr(questionKey),
      answer: tr(answerKey),
      sortOrder: index,
      isPublished: true,
    });
  }

  for (const [index, item] of EVENT_SEED.entries()) {
    await ensureByLegacyId('events', item.legacyId, {
      ...item,
      sortOrder: index,
      isPublished: true,
      originalLanguage: 'ru',
    });
  }

  for (const [index, item] of OPPORTUNITY_SEED.entries()) {
    await ensureOpportunitySeed(item.legacyId, item.slug, {
      ...item,
      sortOrder: index,
      isPublished: true,
      originalLanguage: 'ru',
    });
  }

  console.log('Payload seed complete.');
  process.exit(0);
};

void seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
