import 'dotenv/config';

import {
  ACTIVITIES,
  EXPERTS,
  PILLARS,
  STATS,
  TEAM_MEMBERS,
  TOURNAMENTS,
  TRUST_POINTS,
} from '../src/data';
import { getPayloadClient } from '../server/payload';

const list = (items: string[] = []) => items.map((value) => ({ value }));
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

const upsertByLegacyId = async (
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

  if (existing.docs[0]) {
    await payload.update({
      collection: collection as any,
      id: existing.docs[0].id,
      data,
      overrideAccess: true,
    });
    return;
  }

  await payload.create({
    collection: collection as any,
    data: {
      legacyId,
      ...data,
    },
    overrideAccess: true,
  });
};

const seed = async () => {
  const payload = await getPayloadClient();
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@navykus.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'change-me-please';

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
    await payload.create({
      collection: 'users' as any,
      data: {
        email: adminEmail,
        password: adminPassword,
        name: 'Navykus Admin',
      },
      overrideAccess: true,
    });
  }

  for (const [index, item] of TOURNAMENTS.entries()) {
    await upsertByLegacyId('tournaments', item.id, {
      ...item,
      sortOrder: index,
      isPublished: true,
      skills: list(item.skills),
      mentors: list(item.mentors),
    });
  }

  for (const [index, item] of ACTIVITIES.entries()) {
    await upsertByLegacyId('activities', item.id, {
      ...item,
      sortOrder: index,
      isPublished: true,
      benefits: list(item.benefits),
    });
  }

  for (const [index, item] of EXPERTS.entries()) {
    await upsertByLegacyId('experts', item.id, {
      ...item,
      sortOrder: index,
      isPublished: true,
    });
  }

  for (const [index, item] of TEAM_MEMBERS.entries()) {
    await upsertByLegacyId('team-members', item.id, {
      ...item,
      sortOrder: index,
      interests: list(item.interests),
      skills: list(item.skills),
    });
  }

  for (const [index, item] of TRUST_POINTS.entries()) {
    await upsertByLegacyId('trust-points', item.id, {
      ...item,
      sortOrder: index,
      isPublished: true,
    });
  }

  for (const [index, item] of PILLARS.entries()) {
    await upsertByLegacyId('pillars', `pillar-${index + 1}`, {
      ...item,
      sortOrder: index,
      isPublished: true,
    });
  }

  for (const [index, item] of STATS.entries()) {
    await upsertByLegacyId('stats', `stat-${index + 1}`, {
      ...item,
      sortOrder: index,
      isPublished: true,
    });
  }

  for (const [index, [legacyId, page, questionKey, answerKey]] of FAQ_SEED.entries()) {
    await upsertByLegacyId('faqs', legacyId, {
      page,
      question: tr(questionKey),
      answer: tr(answerKey),
      sortOrder: index,
      isPublished: true,
    });
  }

  console.log('Payload seed complete.');
  process.exit(0);
};

void seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
