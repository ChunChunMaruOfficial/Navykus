import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { nodemailerAdapter } from '@payloadcms/email-nodemailer';
import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { buildConfig } from 'payload';

import { Activities } from './payload/collections/Activities';
import { ApplicationStatusHistory } from './payload/collections/ApplicationStatusHistory';
import { Applications } from './payload/collections/Applications';
import { BlogModerationHistory } from './payload/collections/BlogModerationHistory';
import { BlogPostLocalizations } from './payload/collections/BlogPostLocalizations';
import { BlogPosts } from './payload/collections/BlogPosts';
import { CommunityLeads } from './payload/collections/CommunityLeads';
import { ContactSettings } from './payload/collections/ContactSettings';
import { Events } from './payload/collections/Events';
import { Experts } from './payload/collections/Experts';
import { Faqs } from './payload/collections/Faqs';
import { Favorites } from './payload/collections/Favorites';
import { Media } from './payload/collections/Media';
import { Notifications } from './payload/collections/Notifications';
import { Opportunities } from './payload/collections/Opportunities';
import { Pillars } from './payload/collections/Pillars';
import { Stats } from './payload/collections/Stats';
import { TeamPosts } from './payload/collections/TeamPosts';
import { TeamResponses } from './payload/collections/TeamResponses';
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
  email: process.env.SMTP_HOST && process.env.SMTP_USER
    ? nodemailerAdapter({
        defaultFromAddress: process.env.SMTP_FROM || 'noreply@navykus.org',
        defaultFromName: process.env.SMTP_FROM_NAME || 'Navykus',
        transport: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
          },
        },
      })
    : undefined,
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || 'file:./payload.db',
    },
    push: false,
    transactionOptions: {},
  }),
  collections: [
    Users,
    Media,
    Tournaments,
    Activities,
    Experts,
    Faqs,
    Events,
    Opportunities,
    TeamMembers,
    TeamPosts,
    TeamResponses,
    TrustPoints,
    Pillars,
    Stats,
    Applications,
    ApplicationStatusHistory,
    Favorites,
    Notifications,
    CommunityLeads,
    ContactSettings,
    BlogPosts,
    BlogPostLocalizations,
    BlogModerationHistory,
  ],
});
