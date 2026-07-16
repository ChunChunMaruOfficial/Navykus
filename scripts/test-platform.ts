import assert from 'node:assert/strict';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

import { createClient } from '@libsql/client';

const rootDir = process.cwd();
const languages = ['ru', 'en', 'kk', 'uz', 'ar', 'de', 'es', 'tr'];
const requiredPlatformKeys = [
  'nav.login',
  'nav.profile',
  'nav.participants',
  'nav.championships',
  'nav.events',
  'nav.opportunities',
  'dashboard.profile',
  'dashboard.applications',
  'dashboard.favorites',
  'dashboard.notifications',
  'dashboard.team',
  'auth.loginTitle',
  'auth.registerTitle',
  'auth.forgotTitle',
  'auth.resetTitle',
  'errors.AUTH_REQUIRED',
  'errors.FORBIDDEN',
  'errors.ACCOUNT_BLOCKED',
  'errors.USER_LAST_ADMIN_FORBIDDEN',
  'notifications.application_status_changed',
  'accountStatus.active',
  'accountStatus.blocked',
  'status.submitted',
  'status.approved',
];

type JsonMap = Record<string, unknown>;

const read = (relativePath: string) => fs.readFileSync(path.join(rootDir, relativePath), 'utf8');

const get = (value: unknown, keyPath: string) => keyPath.split('.').reduce<unknown>((acc, key) => {
  if (!acc || typeof acc !== 'object') return undefined;
  return (acc as JsonMap)[key];
}, value);

const runStaticContractTests = () => {
  for (const language of languages) {
    const locale = JSON.parse(read(path.join('src', 'i18n', 'locales', language, 'translation.json')));
    for (const key of requiredPlatformKeys) {
      const value = get(locale.platform, key);
      assert.equal(typeof value, 'string', `${language}: missing platform.${key}`);
      assert.ok(String(value).trim(), `${language}: empty platform.${key}`);
    }
  }

  const app = read('src/App.tsx');
  for (const route of ['/login', '/register', '/forgot-password', '/reset-password', '/profile', '/participants', '/championships', '/events', '/opportunities', '/platform/admin']) {
    assert.ok(app.includes(route), `App route missing ${route}`);
  }

  const payloadConfig = read('src/payload.config.ts');
  for (const collection of ['Events', 'Opportunities', 'Favorites', 'Notifications', 'TeamPosts', 'TeamResponses', 'ApplicationStatusHistory']) {
    assert.ok(payloadConfig.includes(collection), `Payload collection missing ${collection}`);
  }

  const server = read('server/platform.ts');
  for (const endpoint of ['/api/auth/register', '/api/auth/login', '/api/profile/favorites', '/api/profile/notifications', '/api/profile/applications', '/api/admin/summary', '/api/admin/users']) {
    assert.ok(server.includes(endpoint), `Platform endpoint missing ${endpoint}`);
  }

  assert.ok(server.includes('AUTH_REQUIRED'), 'Auth guard code missing');
  assert.ok(server.includes('FORBIDDEN'), 'Role guard code missing');
  assert.ok(server.includes('HttpOnly') || server.includes('httpOnly'), 'HttpOnly session cookie missing');
  assert.ok(read('server/index.ts').includes('UNSUPPORTED_FILE_TYPE'), 'File allowlist error missing');
};

const getFreePort = () => new Promise<number>((resolve, reject) => {
  const server = net.createServer();
  server.on('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    server.close(() => {
      if (address && typeof address === 'object') resolve(address.port);
      else reject(new Error('Could not allocate test port'));
    });
  });
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const startApi = async (port: number) => {
  const tsxBin = path.join(rootDir, 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
  const child = spawn(tsxBin, ['server/index.ts'], {
    cwd: rootDir,
    env: {
      ...process.env,
      API_PORT: String(port),
      PORT: String(port),
      PAYLOAD_PUBLIC_SERVER_URL: `http://127.0.0.1:${port}`,
    },
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let logs = '';
  child.stdout?.on('data', (chunk) => { logs += String(chunk); });
  child.stderr?.on('data', (chunk) => { logs += String(chunk); });

  const baseUrl = `http://127.0.0.1:${port}`;
  const startedAt = Date.now();
  while (Date.now() - startedAt < 45_000) {
    if (child.exitCode !== null) throw new Error(`API exited early:\n${logs}`);
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return { baseUrl, child, logs: () => logs };
    } catch {
      // API not ready yet.
    }
    await delay(500);
  }

  throw new Error(`API did not become healthy:\n${logs}`);
};

const stopApi = (child: ChildProcess) => {
  if (!child.pid || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  child.kill('SIGTERM');
};

class ApiClient {
  private cookies = new Map<string, string>();

  constructor(private readonly baseUrl: string) {}

  async request(pathname: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    if (this.cookies.size) {
      headers.set('Cookie', [...this.cookies].map(([key, value]) => `${key}=${value}`).join('; '));
    }
    if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${this.baseUrl}${pathname}`, {
      ...init,
      headers,
    });

    const setCookies = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ??
      (response.headers.get('set-cookie') ? [response.headers.get('set-cookie') as string] : []);
    for (const cookie of setCookies) {
      const [pair] = cookie.split(';');
      const [key, value] = pair.split('=');
      if (key) this.cookies.set(key, value || '');
    }

    const text = await response.text();
    let body: JsonMap = {};
    if (text) {
      try {
        body = JSON.parse(text) as JsonMap;
      } catch {
        body = { raw: text };
      }
    }
    return { body, response, status: response.status };
  }

  json(pathname: string, payload: JsonMap, method = 'POST') {
    return this.request(pathname, { method, body: JSON.stringify(payload) });
  }
}

const expectStatus = async (request: Promise<{ body: JsonMap; status: number }>, status: number, code?: string) => {
  const result = await request;
  assert.equal(result.status, status, `Expected ${status}, got ${result.status}: ${JSON.stringify(result.body)}`);
  if (code) assert.equal(result.body.code, code);
  return result.body;
};

const db = createClient({ url: 'file:payload.db' });

const countWhere = async (table: string, where: string) => {
  const result = await db.execute(`SELECT count(*) as count FROM \`${table}\` WHERE ${where}`);
  return Number(result.rows[0].count);
};

const queryOne = async <T extends JsonMap>(query: string) => {
  const result = await db.execute(query);
  return result.rows[0] as unknown as T | undefined;
};

const registerUser = async (client: ApiClient, stamp: string, label: string) => {
  const email = `codex-${label}-${stamp}@example.com`;
  const password = `Pass-${stamp}!`;
  const body = await expectStatus(client.json('/api/auth/register', {
    email,
    password,
    passwordConfirmation: password,
    firstName: `Codex${label}`,
    lastName: 'Tester',
    country: 'Testland',
    city: 'Hidden City',
    school: 'Hidden School',
    schoolGrade: '10',
    ageGroup: '15-17',
    privacyAccepted: true,
    termsAccepted: true,
  }), 201);
  assert.equal((body.user as JsonMap).email, email);
  return { email, id: String((body.user as JsonMap).id), password };
};

const formApplication = (file: Blob, filename: string) => {
  const form = new FormData();
  form.set('name', 'Upload Tester');
  form.set('email', `upload-${Date.now()}@example.com`);
  form.set('city', 'Test');
  form.set('projectFile', file, filename);
  return form;
};

const formAvatar = (file: Blob, filename: string) => {
  const form = new FormData();
  form.set('avatar', file, filename);
  return form;
};

const formApplicationFiles = (files: Array<{ file: Blob; filename: string }>) => {
  const form = new FormData();
  form.set('name', 'Upload Tester');
  form.set('email', `upload-${Date.now()}@example.com`);
  form.set('city', 'Test');
  for (const { file, filename } of files) {
    form.append('projectFile', file, filename);
  }
  return form;
};

const tinyImageBlob = async (format: 'jpeg' | 'png' | 'webp', type: string) => {
  const { default: sharp } = await import('sharp');
  const buffer = await sharp({
    create: {
      width: 1,
      height: 1,
      channels: 3,
      background: '#ffffff',
    },
  }).toFormat(format).toBuffer();
  return new Blob([new Uint8Array(buffer)], { type });
};

const runRealApiTests = async () => {
  const port = await getFreePort();
  const { baseUrl, child, logs } = await startApi(port);
  const stamp = String(Date.now());

  try {
    const anonymous = new ApiClient(baseUrl);
    await expectStatus(anonymous.request('/api/profile'), 401, 'AUTH_REQUIRED');
    await expectStatus(anonymous.request('/api/participants/not-a-real-user'), 404, 'PARTICIPANT_NOT_FOUND');

    const userAClient = new ApiClient(baseUrl);
    const userA = await registerUser(userAClient, stamp, 'a');
    assert.ok(await queryOne(`SELECT id FROM users WHERE email = '${userA.email}'`), 'Registered user A missing from DB');

    await expectStatus(userAClient.request('/api/auth/logout', { method: 'POST' }), 200);
    await expectStatus(userAClient.request('/api/auth/me'), 401, 'AUTH_REQUIRED');
    await expectStatus(userAClient.json('/api/auth/login', { email: userA.email, password: 'wrong-password' }), 401, 'AUTH_LOGIN_FAILED');
    await expectStatus(userAClient.json('/api/auth/login', { email: userA.email, password: userA.password }), 200);
    await expectStatus(userAClient.request('/api/auth/me'), 200);
    const avatarUpload = await expectStatus(userAClient.request('/api/profile/avatar', {
      method: 'POST',
      body: formAvatar(await tinyImageBlob('png', 'image/png'), `avatar-${stamp}.png`),
    }), 201);
    const avatarUser = avatarUpload.user as JsonMap;
    assert.equal(typeof avatarUser.avatarUrl, 'string', 'Avatar URL missing after upload');
    assert.equal(avatarUser.avatarPositionX, 50);
    assert.equal(avatarUser.avatarPositionY, 50);
    assert.equal(avatarUser.avatarScale, 1);
    const avatarProbe = await userAClient.request(String(avatarUser.avatarUrl));
    assert.equal(avatarProbe.status, 200, 'Avatar media URL is not served');
    await expectStatus(userAClient.request('/api/profile/avatar', {
      method: 'POST',
      body: formAvatar(new Blob(['MZ'], { type: 'image/png' }), `spoofed-avatar-${stamp}.png`),
    }), 415, 'AVATAR_INVALID');

    const userBClient = new ApiClient(baseUrl);
    const userB = await registerUser(userBClient, stamp, 'b');

    await expectStatus(userAClient.request('/api/admin/summary'), 403, 'FORBIDDEN');

    const adminClient = new ApiClient(baseUrl);
    const adminPassword = process.env.ADMIN_PASSWORD || 'change-me-please';
    const adminLogin = await expectStatus(adminClient.json('/api/auth/login', { email: process.env.ADMIN_EMAIL || 'admin@navykus.local', password: adminPassword }), 200);
    const adminId = String((adminLogin.user as JsonMap).id);
    await expectStatus(adminClient.request('/api/admin/summary'), 200);

    await expectStatus(adminClient.json(`/api/admin/users/${userA.id}`, { role: 'moderator' }, 'PATCH'), 200);
    await expectStatus(userAClient.request('/api/admin/summary'), 200);
    await expectStatus(userAClient.json(`/api/admin/users/${userB.id}`, { role: 'admin' }, 'PATCH'), 403, 'FORBIDDEN');
    await expectStatus(userBClient.request('/api/admin/users'), 403, 'FORBIDDEN');

    await expectStatus(userAClient.json('/api/profile', {
      firstName: 'Private',
      lastName: 'Participant',
      country: 'Testland',
      city: 'Secret City',
      school: 'Secret School',
      ageGroup: '15-17',
      biography: 'Looking for a team.',
      interests: ['science', 'design'],
      skills: ['research', 'writing'],
      languages: ['en', 'ru'],
      socialLinks: [{ label: 'Portfolio', url: 'https://example.com/me' }],
      avatarPositionX: 30,
      avatarPositionY: 70,
      avatarScale: 1.45,
      publicProfile: true,
      teamSearchAvailable: true,
      privacy: {
        showAge: false,
        showCity: false,
        showEmail: false,
        showSchool: false,
        showSocialLinks: false,
      },
      role: 'admin',
      accountStatus: 'blocked',
    }, 'PUT'), 200);
    const userARecord = await queryOne<{ role: string; account_status: string; avatar_position_x: number; avatar_position_y: number; avatar_scale: number }>(`SELECT role, account_status, avatar_position_x, avatar_position_y, avatar_scale FROM users WHERE id = ${userA.id}`);
    assert.equal(userARecord?.role, 'moderator', 'Profile mass assignment changed role');
    assert.equal(userARecord?.account_status, 'active', 'Profile mass assignment changed account status');
    assert.equal(Number(userARecord?.avatar_position_x), 30, 'Avatar horizontal position was not saved');
    assert.equal(Number(userARecord?.avatar_position_y), 70, 'Avatar vertical position was not saved');
    assert.equal(Number(userARecord?.avatar_scale), 1.45, 'Avatar scale was not saved');

    const participantList = await expectStatus(anonymous.request('/api/participants?q=Private'), 200);
    const participant = ((participantList.docs as JsonMap[]) || []).find((item) => String(item.id) === userA.id);
    assert.ok(participant, 'Public participant not visible');
    assert.equal(participant.city, undefined);
    assert.equal(participant.email, undefined);
    assert.equal(participant.school, undefined);
    assert.equal(participant.ageGroup, undefined);
    assert.deepEqual(participant.socialLinks, []);
    await expectStatus(userAClient.json('/api/profile', { publicProfile: false, privacy: {} }, 'PUT'), 200);
    const hiddenParticipants = await expectStatus(anonymous.request('/api/participants?q=Private'), 200);
    assert.ok(!((hiddenParticipants.docs as JsonMap[]) || []).some((item) => String(item.id) === userA.id), 'Disabled public profile still visible');
    await expectStatus(userAClient.json('/api/profile', { publicProfile: true, teamSearchAvailable: true, privacy: { showCity: false, showEmail: false, showSchool: false, showAge: false, showSocialLinks: false } }, 'PUT'), 200);

    const championships = await expectStatus(anonymous.request('/api/championships?limit=1'), 200);
    assert.ok(Number(championships.totalDocs) >= 3, 'Championship catalog missing seeded DB data');
    const events = await expectStatus(anonymous.request('/api/events?format=online&q=Public'), 200);
    assert.ok(Number(events.totalDocs) >= 1, 'Events catalog search/filter missing seeded DB data');
    const opportunities = await expectStatus(anonymous.request('/api/opportunities?q=Data&sort=deadline'), 200);
    assert.ok(Number(opportunities.totalDocs) >= 1, 'Opportunities catalog missing seeded DB data');
    await db.execute(`INSERT INTO events (legacy_id, sort_order, is_published, title, slug, short_description, event_type, event_date, format, updated_at, created_at) VALUES ('hidden-${stamp}', 99, 0, 'Hidden ${stamp}', 'hidden-${stamp}', 'Hidden', 'test', '2026-12-31T00:00:00.000Z', 'online', datetime('now'), datetime('now'))`);
    const hiddenEvents = await expectStatus(anonymous.request(`/api/events?q=Hidden%20${stamp}`), 200);
    assert.equal(Number(hiddenEvents.totalDocs), 0, 'Unpublished event leaked into public catalog');

    const favoriteChamp = await expectStatus(userAClient.json('/api/profile/favorites', { itemType: 'championship', itemId: 't-1', itemTitle: 'Case Cup', href: '/championship' }), 201);
    await expectStatus(userAClient.json('/api/profile/favorites', { itemType: 'championship', itemId: 't-1', itemTitle: 'Case Cup', href: '/championship' }), 200);
    assert.equal(await countWhere('favorites', `user_id = ${userA.id} AND item_type = 'championship' AND item_id = 't-1'`), 1);
    await expectStatus(userAClient.json('/api/profile/favorites', { itemType: 'event', itemId: 'event-public-speaking', itemTitle: 'Public Speaking Lab', href: '/events/public-speaking-lab' }), 201);
    await expectStatus(userAClient.json('/api/profile/favorites', { itemType: 'opportunity', itemId: 'opp-data-olympiad', itemTitle: 'Data Literacy Olympiad', href: '/opportunities/data-literacy-olympiad' }), 201);
    await expectStatus(userAClient.json('/api/profile/favorites', { itemType: 'participant', itemId: userA.id, itemTitle: 'Private Participant', href: `/participants/${userA.id}` }), 201);
    await expectStatus(userBClient.request(`/api/profile/favorites/${(favoriteChamp.favorite as JsonMap).id}`, { method: 'DELETE' }), 403, 'FORBIDDEN');

    const application = await expectStatus(userAClient.json('/api/profile/applications', {
      itemType: 'championship',
      itemId: `champ-${stamp}`,
      itemTitle: `Champ ${stamp}`,
      motivation: 'Draft motivation',
      status: 'draft',
    }), 201);
    const applicationId = String((application.application as JsonMap).id);
    await expectStatus(userAClient.json('/api/profile/applications', {
      itemType: 'championship',
      itemId: `champ-${stamp}`,
      itemTitle: `Champ ${stamp}`,
      status: 'submitted',
    }), 409, 'APPLICATION_DUPLICATE');
    await expectStatus(userAClient.json(`/api/profile/applications/${applicationId}`, { status: 'approved', customAnswers: { x: 1 } }, 'PATCH'), 200);
    const afterUserPatch = await queryOne<{ status: string }>(`SELECT status FROM applications WHERE id = ${applicationId}`);
    assert.equal(afterUserPatch?.status, 'draft', 'User changed application status directly');

    await expectStatus(adminClient.json(`/api/admin/applications/${applicationId}/status`, { status: 'under_review', adminComment: 'Public note', internalNotes: 'Private note' }, 'PATCH'), 200);
    await expectStatus(adminClient.json(`/api/admin/applications/${applicationId}/status`, { status: 'clarification_required', adminComment: 'Need more detail', internalNotes: 'Internal only' }, 'PATCH'), 200);
    await expectStatus(adminClient.json(`/api/admin/applications/${applicationId}/status`, { status: 'approved', adminComment: 'Approved' }, 'PATCH'), 200);
    const history = await db.execute(`SELECT previous_status, status, actor_id, comment FROM application_status_history WHERE application_id = ${applicationId} ORDER BY id`);
    assert.ok(history.rows.some((row) => row.previous_status === 'draft' && row.status === 'under_review' && String(row.actor_id) === adminId));
    assert.ok(history.rows.some((row) => row.status === 'approved'));
    const userApps = await expectStatus(userAClient.request('/api/profile/applications'), 200);
    const visibleApp = ((userApps.docs as JsonMap[]) || []).find((item) => String(item.id) === applicationId);
    assert.ok(visibleApp);
    assert.equal(visibleApp.internalNotes, undefined, 'Internal notes exposed to applicant');
    const notifications = await expectStatus(userAClient.request('/api/profile/notifications'), 200);
    assert.ok(Number(notifications.unread) > 0, 'Unread notification count missing');
    const notification = (notifications.docs as JsonMap[])[0];
    await expectStatus(userBClient.request(`/api/profile/notifications/${notification.id}/read`, { method: 'PATCH' }), 403, 'FORBIDDEN');
    await expectStatus(userAClient.request(`/api/profile/notifications/${notification.id}/read`, { method: 'PATCH' }), 200);
    await expectStatus(userAClient.request('/api/profile/notifications/read-all', { method: 'POST' }), 200);

    const teamPost = await expectStatus(userAClient.json('/api/profile/team-posts', {
      title: `Team ${stamp}`,
      description: 'Looking for teammates',
      requiredSkills: ['research'],
      interests: ['science'],
      status: 'published',
    }), 201);
    const teamPostId = String((teamPost.post as JsonMap).id);
    const publicPosts = await expectStatus(anonymous.request('/api/team-posts'), 200);
    assert.ok(((publicPosts.docs as JsonMap[]) || []).some((item) => String(item.id) === teamPostId), 'Published team post not public');
    await expectStatus(userAClient.json('/api/profile/favorites', { itemType: 'team-post', itemId: teamPostId, itemTitle: `Team ${stamp}`, href: `/team-posts/${teamPostId}` }), 201);
    const response = await expectStatus(userBClient.json(`/api/team-posts/${teamPostId}/responses`, { message: 'I can help.' }), 201);
    await expectStatus(userBClient.json(`/api/team-posts/${teamPostId}/responses`, { message: 'Duplicate' }), 409, 'TEAM_RESPONSE_DUPLICATE');
    const teamDashboard = await expectStatus(userAClient.request('/api/profile/team'), 200);
    assert.ok(((teamDashboard.responses as JsonMap[]) || []).some((item) => String(item.id) === String((response.response as JsonMap).id)), 'Author dashboard missing team response');
    await expectStatus(userAClient.json(`/api/team-responses/${(response.response as JsonMap).id}`, { status: 'accepted' }, 'PATCH'), 200);

    const allowedFiles = [
      { file: await tinyImageBlob('jpeg', 'image/jpeg'), filename: `valid-${stamp}.jpg`, mimeType: 'image/jpeg' },
      { file: await tinyImageBlob('png', 'image/png'), filename: `valid-${stamp}.png`, mimeType: 'image/png' },
      { file: await tinyImageBlob('webp', 'image/webp'), filename: `valid-${stamp}.webp`, mimeType: 'image/webp' },
      { file: new Blob(['%PDF-1.4\n%test'], { type: 'application/pdf' }), filename: `valid-${stamp}.pdf`, mimeType: 'application/pdf' },
      { file: new Blob([Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00])], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), filename: `valid-${stamp}.docx`, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    ];
    for (const { file, filename, mimeType } of allowedFiles) {
      await expectStatus(anonymous.request('/api/applications', { method: 'POST', body: formApplication(file, filename) }), 201);
      const media = await queryOne<{ filename: string; mime_type: string | null }>(`SELECT filename, mime_type FROM media WHERE alt = '${filename}' ORDER BY id DESC LIMIT 1`);
      assert.ok(media, `Missing media row for ${filename}`);
      const staticProbe = await anonymous.request(`/uploads/media/${encodeURIComponent(String(media?.filename))}`);
      assert.notEqual(staticProbe.response.headers.get('content-type'), mimeType, 'Uploaded file is directly served as executable/static media');
    }
    const exe = new Blob(['MZ'], { type: 'application/x-msdownload' });
    await expectStatus(anonymous.request('/api/applications', { method: 'POST', body: formApplication(exe, `bad-${stamp}.exe`) }), 415, 'UNSUPPORTED_FILE_TYPE');
    const mismatch = new Blob(['MZ'], { type: 'application/x-msdownload' });
    await expectStatus(anonymous.request('/api/applications', { method: 'POST', body: formApplication(mismatch, `bad-${stamp}.pdf`) }), 415, 'UNSUPPORTED_FILE_TYPE');
    const spoofedPdf = new Blob(['MZ'], { type: 'application/pdf' });
    await expectStatus(anonymous.request('/api/applications', { method: 'POST', body: formApplication(spoofedPdf, `spoofed-${stamp}.pdf`) }), 415, 'UNSUPPORTED_FILE_TYPE');
    const large = new Blob([new Uint8Array(11 * 1024 * 1024)], { type: 'application/pdf' });
    await expectStatus(anonymous.request('/api/applications', { method: 'POST', body: formApplication(large, `large-${stamp}.pdf`) }), 413, 'FILE_TOO_LARGE');
    await expectStatus(anonymous.request('/api/applications', {
      method: 'POST',
      body: formApplicationFiles([
        { file: new Blob(['one'], { type: 'application/pdf' }), filename: `one-${stamp}.pdf` },
        { file: new Blob(['two'], { type: 'application/pdf' }), filename: `two-${stamp}.pdf` },
      ]),
    }), 400, 'UNEXPECTED_FILE');

    await expectStatus(userBClient.json(`/api/admin/applications/${applicationId}/status`, { status: 'approved' }, 'PATCH'), 403, 'FORBIDDEN');
    await expectStatus(userBClient.request('/api/admin/users'), 403, 'FORBIDDEN');
    await expectStatus(userBClient.json('/api/profile', { role: 'admin', accountStatus: 'blocked', privacy: {} }, 'PUT'), 200);
    const userBRecord = await queryOne<{ role: string; account_status: string }>(`SELECT role, account_status FROM users WHERE id = ${userB.id}`);
    assert.equal(userBRecord?.role, 'user');
    assert.equal(userBRecord?.account_status, 'active');
    await expectStatus(userBClient.request('/api/events', { method: 'POST', body: JSON.stringify({ title: 'Nope' }), headers: { 'Content-Type': 'application/json' } }), 404);

    await expectStatus(userAClient.request(`/api/profile/favorites/${(favoriteChamp.favorite as JsonMap).id}`, { method: 'DELETE' }), 200);

    console.log(JSON.stringify({
      apiBaseUrl: baseUrl,
      applicationId,
      teamPostId,
      testedUsers: [userA.email, userB.email],
      checks: [
        'registration',
        'login/session',
        'avatar upload/alignment',
        'RBAC',
        'profile privacy',
        'catalog visibility',
        'favorites uniqueness/ownership',
        'application lifecycle/history/notifications',
        'team response uniqueness',
        'file allowlist/static-serving protection',
        'mass-assignment protection',
      ],
    }, null, 2));
  } catch (error) {
    throw new Error(`${(error as Error).message}\nAPI logs:\n${logs()}`);
  } finally {
    stopApi(child);
  }
};

runStaticContractTests();
await runRealApiTests();

console.log('Platform contract and real API tests passed.');
