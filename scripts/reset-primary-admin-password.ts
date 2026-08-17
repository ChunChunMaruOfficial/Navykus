import 'dotenv/config';

import { getPayload } from 'payload';

import config from '../src/payload.config';
import { ADMIN_EMAIL } from '../src/security/admin-auth';

const password = process.env.PRIMARY_ADMIN_PASSWORD;

if (!password || password.length < 12) {
  console.error('PRIMARY_ADMIN_PASSWORD is required and must be at least 12 characters.');
  process.exit(1);
}

const payload = await getPayload({ config });

const existing = await payload.find({
  collection: 'users',
  where: { email: { equals: ADMIN_EMAIL } },
  limit: 1,
  overrideAccess: true,
});

const admin = existing.docs[0]
  ? await payload.update({
      collection: 'users',
      id: existing.docs[0].id,
      data: {
        email: ADMIN_EMAIL,
        password,
        role: 'admin',
        accountStatus: 'active',
        emailVerified: true,
        loginAttempts: 0,
        lockUntil: null,
        sessions: [],
      } as any,
      overrideAccess: true,
    })
  : await payload.create({
      collection: 'users',
      data: {
        email: ADMIN_EMAIL,
        password,
        role: 'admin',
        accountStatus: 'active',
        emailVerified: true,
        loginAttempts: 0,
        lockUntil: null,
      } as any,
      overrideAccess: true,
    });

const others = await payload.find({
  collection: 'users',
  where: { email: { not_equals: ADMIN_EMAIL } },
  limit: 1000,
  overrideAccess: true,
});

for (const user of others.docs) {
  await payload.update({
    collection: 'users',
    id: user.id,
    data: {
      role: 'moderator',
      accountStatus: 'blocked',
      sessions: [],
    } as any,
    overrideAccess: true,
  }).catch((error) => {
    console.warn(`Failed to block user ${user.email}:`, (error as Error).message?.slice(0, 200));
  });
}

console.log(`Primary admin ready: ${admin.email}. Blocked extra users: ${others.docs.length}.`);
process.exit(0);
