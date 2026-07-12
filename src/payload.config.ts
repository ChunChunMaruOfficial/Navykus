import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { buildConfig } from 'payload';

import { Activities } from './payload/collections/Activities';
import { Applications } from './payload/collections/Applications';
import { CommunityLeads } from './payload/collections/CommunityLeads';
import { Experts } from './payload/collections/Experts';
import { Media } from './payload/collections/Media';
import { Pillars } from './payload/collections/Pillars';
import { Stats } from './payload/collections/Stats';
import { TeamMembers } from './payload/collections/TeamMembers';
import { Tournaments } from './payload/collections/Tournaments';
import { TrustPoints } from './payload/collections/TrustPoints';
import { Users } from './payload/collections/Users';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const rootDir = path.resolve(dirname, '..');
const adminRouteGroupDir = path.resolve(rootDir, 'admin', 'app', '(payload)');

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'dev-payload-secret-change-me',
  serverURL:
    process.env.PAYLOAD_PUBLIC_SERVER_URL ||
    process.env.SERVER_URL ||
    `http://localhost:${process.env.API_PORT || 4000}`,
  telemetry: false,
  admin: {
    user: 'users',
    importMap: {
      baseDir: adminRouteGroupDir,
      importMapFile: path.resolve(adminRouteGroupDir, 'admin', 'importMap.js'),
    },
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || 'file:./payload.db',
    },
    transactionOptions: {},
  }),
  collections: [
    Users,
    Media,
    Tournaments,
    Activities,
    Experts,
    TeamMembers,
    TrustPoints,
    Pillars,
    Stats,
    Applications,
    CommunityLeads,
  ],
});
