/**
 * Seed CMS collections (pillars, experts, trustPoints) from translation.json.
 * Run on the server: npx tsx scripts/seed-cms-content.ts
 *
 * If records already exist in a collection, they are skipped (no duplicates).
 * Sets isPublished:true and sortOrder sequentially.
 */
import 'dotenv/config';

import fs from 'node:fs';
import path from 'node:path';
import { getPayloadClient } from '../server/payload';

type SeedDoc = Record<string, unknown>;

const SEED_CONFIGS = [
  {
    slug: 'pillars',
    dataKey: 'pillars',
    map: (item: SeedDoc, idx: number) => ({
      label: item.label as string,
      title: item.title as string,
      description: item.description as string,
      sortOrder: idx + 1,
      isPublished: true,
    }),
  },
  {
    slug: 'experts',
    dataKey: 'experts',
    map: (item: SeedDoc, idx: number) => ({
      name: item.name as string,
      role: item.role as string,
      expertise: item.expertise as string,
      description: item.description as string,
      sortOrder: idx + 1,
      isPublished: true,
    }),
  },
  {
    slug: 'trust-points',
    dataKey: 'trustPoints',
    map: (item: SeedDoc, idx: number) => ({
      title: item.title as string,
      description: item.description as string,
      sortOrder: idx + 1,
      isPublished: true,
    }),
  },
];

const displayName = (slug: string, item: SeedDoc): string => {
  if (slug === 'pillars') return (item.label as string) || (item.title as string) || '';
  if (slug === 'experts') return (item.name as string) || '';
  return (item.title as string) || '';
};

async function main() {
  // Load translation data
  const localePath = path.resolve(process.cwd(), 'public', 'locales', 'en', 'translation.json');
  if (!fs.existsSync(localePath)) {
    console.error(`Translation file not found: ${localePath}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
  const dataSection = raw.data as Record<string, unknown[]>;

  const payload = await getPayloadClient();

  for (const config of SEED_CONFIGS) {
    const items = dataSection[config.dataKey] as SeedDoc[] | undefined;
    if (!items || items.length === 0) {
      console.warn(`⚠ No items found for ${config.slug} in translation.json`);
      continue;
    }

    // Check existing published count
    const existing = await payload.find({
      collection: config.slug as any,
      depth: 0,
      limit: 1,
      where: { isPublished: { equals: true } },
      overrideAccess: true,
    });

    if (existing.totalDocs > 0) {
      console.log(`✓ ${config.slug}: ${existing.totalDocs} published records already exist — skipping`);
      continue;
    }

    // Create records
    for (let i = 0; i < items.length; i++) {
      const doc = config.map(items[i], i);
      const created = await payload.create({
        collection: config.slug as any,
        data: doc,
        overrideAccess: true,
      });
      console.log(`  + ${config.slug}[${i + 1}]: "${displayName(config.slug, items[i])}" (id=${created.id})`);
    }

    console.log(`✓ ${config.slug}: ${items.length} records seeded`);
  }

  console.log('\n✅ Seeding complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
