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

  console.log('Payload seed complete.');
  process.exit(0);
};

void seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
