import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadEnv } from 'dotenv';
import { withPayload } from '@payloadcms/next/withPayload';

// This is a standalone Next.js app rooted at admin/, so Next only auto-loads
// admin/.env — never the repo-root .env that holds SMTP_* (and the site URLs).
// Without this the Payload config sees no mail transport in the admin process
// and payload.sendEmail() (moderation decision letters) silently no-ops.
// next.config runs in the Node process for build / start / dev and is NOT
// bundled, so loading dotenv here keeps it out of the webpack graph.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const parsedEnv = loadEnv({ path: path.join(repoRoot, '.env'), override: false }).parsed;
// .env is authoritative for mail config: a stale SMTP_* var inherited from the
// shell / PM2 shadowing the correct value is exactly the 535-auth failure mode
// we want to avoid (mirrors server/env.ts for the Express process).
if (parsedEnv) {
  for (const [key, value] of Object.entries(parsedEnv)) {
    if (key.startsWith('SMTP_') && value !== undefined) process.env[key] = value;
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      {
        source: '/_next/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      {
        source: '/payload-api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      {
        source: '/payload-graphql/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      {
        source: '/payload-graphql-playground/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig);
