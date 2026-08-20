import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { nodemailerAdapter } from '@payloadcms/email-nodemailer';
import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { buildConfig } from 'payload';

import { Activities } from './payload/collections/Activities';
import { AuditLogs } from './payload/collections/AuditLogs';
import { ContactSettings } from './payload/collections/ContactSettings';
import { ContentLocalizations } from './payload/collections/ContentLocalizations';
import { Events } from './payload/collections/Events';
import { Experts } from './payload/collections/Experts';
import { Faqs } from './payload/collections/Faqs';
import { Media } from './payload/collections/Media';
import { OperatorSettings } from './payload/collections/OperatorSettings';
import { Opportunities } from './payload/collections/Opportunities';
import { PageTexts } from './payload/collections/PageTexts';
import { Pillars } from './payload/collections/Pillars';
import { Scenarios } from './payload/collections/Scenarios';
import { Stats } from './payload/collections/Stats';
import { TeamMembers } from './payload/collections/TeamMembers';
import { Tournaments } from './payload/collections/Tournaments';
import { TrustPoints } from './payload/collections/TrustPoints';
import { Users } from './payload/collections/Users';

import { databaseUrl } from './payload/paths';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const rootDir = path.resolve(dirname, '..');
const adminRouteGroupDir = path.resolve(rootDir, 'admin', 'app', '(payload)');

const normalizeServerURL = (value?: string) => {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/+$/, '');
  }
};
const isProduction = process.env.NODE_ENV === 'production';
const isLocalServerURL = (value?: string) => /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/.*)?$/i.test(value || '');
const productionServerURL = [
  process.env.PAYLOAD_PRODUCTION_SERVER_URL,
  process.env.PUBLIC_SITE_URL,
  process.env.SITE_URL,
  process.env.SERVER_URL,
  'https://navykus.online',
].map(normalizeServerURL).find((value) => value && !isLocalServerURL(value));
const configuredServerURL = normalizeServerURL(process.env.PAYLOAD_PUBLIC_SERVER_URL || process.env.SERVER_URL);
const payloadServerURL = isProduction && (!configuredServerURL || isLocalServerURL(configuredServerURL))
  ? productionServerURL
  : configuredServerURL || `http://localhost:${process.env.API_PORT || 4000}`;
const csrfOrigins = Array.from(new Set([
  payloadServerURL,
  productionServerURL,
  normalizeServerURL(process.env.PUBLIC_SITE_URL),
  normalizeServerURL(process.env.SITE_URL),
  normalizeServerURL(process.env.SERVER_URL),
  'https://navykus.online',
  'https://www.navykus.online',
].filter((value): value is string => Boolean(value) && !isLocalServerURL(value))));
const smtpHost = process.env.SMTP_HOST?.trim();
const smtpUser = process.env.SMTP_USER?.trim();
const smtpPass = process.env.SMTP_PASS;
const smtpEnabled = Boolean(smtpHost && smtpUser && smtpPass);

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET!,
  serverURL: payloadServerURL,
  csrf: csrfOrigins,
  telemetry: false,
  routes: {
    admin: '/admin',
    api: '/payload-api',
    graphQL: '/payload-graphql',
    graphQLPlayground: '/payload-graphql-playground',
  },
  admin: {
    user: 'users',
    components: {
      afterDashboard: ['../../../src/admin/components/VersionBadge#VersionBadge'],
      afterNavLinks: [
        '../../../src/admin/components/VersionBadge#VersionBadge',
        '../../../src/admin/components/PageTextsTreeNavLink#PageTextsTreeNavLink',
      ],
      views: {
        'page-texts-tree': {
          Component: '../../../src/admin/components/PageTextsTree#default',
          path: '/page-texts-tree',
          exact: true,
          meta: {
            title: 'Дерево текстов | Navykus',
            description: 'Иерархический редактор текстов сайта',
          },
        },
      },
    },
    importMap: {
      baseDir: adminRouteGroupDir,
      importMapFile: path.resolve(adminRouteGroupDir, 'admin', 'importMap.js'),
    },
  },
  email: smtpEnabled
    ? nodemailerAdapter({
        defaultFromAddress: process.env.SMTP_FROM || 'noreply@navykus.online',
        defaultFromName: process.env.SMTP_FROM_NAME || 'Navykus',
        skipVerify: process.env.SMTP_SKIP_VERIFY !== 'false',
        transportOptions: {
          host: smtpHost,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        },
      })
    : undefined,
  db: sqliteAdapter({
    busyTimeout: 10000,
    client: {
      url: databaseUrl,
    },
    push: false,
    wal: {
      journalSizeLimit: 67108864,
      synchronous: 'NORMAL',
    },
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
    TrustPoints,
    Pillars,
    Scenarios,
    Stats,
    ContactSettings,
    OperatorSettings,
    AuditLogs,
    PageTexts,
    ContentLocalizations,
  ],
});
