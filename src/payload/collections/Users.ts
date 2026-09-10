import type { CollectionConfig } from 'payload';

import { adminOnly, isAdmin, isModerator, ownUserOrAdmin } from '../access';
import { ADMIN_EMAIL, normalizeEmail } from '../../security/admin-auth';
import { MAIL_FROM_ADDRESS, sendMail } from '../mailer';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: Number(process.env.PAYLOAD_TOKEN_EXPIRATION_SECONDS || 60 * 60 * 4),
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
  },
  admin: {
    useAsTitle: 'email',
    group: 'System',
    description: 'Staff accounts for Payload CMS access only.',
    defaultColumns: ['email', 'firstName', 'lastName', 'role', 'accountStatus'],
    listSearchableFields: ['email', 'firstName', 'lastName'],
  },
  access: {
    admin: ({ req: { user } }) => isAdmin(user) || isModerator(user),
    read: ownUserOrAdmin,
    create: adminOnly,
    update: ownUserOrAdmin,
    delete: adminOnly,
  },
  endpoints: [
    {
      // POST /payload-api/users/test-email { to? } — sends a test letter from the project mailbox
      // and returns the real SMTP outcome, so mail problems can be diagnosed from the admin panel.
      path: '/test-email',
      method: 'post',
      handler: async (req) => {
        if (!(isAdmin(req.user) || isModerator(req.user))) {
          return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 });
        }
        const body = (typeof req.json === 'function' ? await req.json().catch(() => ({})) : {}) as Record<string, unknown>;
        const to = normalizeEmail(typeof body.to === 'string' && body.to.trim() ? body.to : (req.user as { email?: string } | null)?.email);
        if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
          return Response.json({ ok: false, error: 'Укажите корректный адрес получателя.' }, { status: 400 });
        }
        const result = await sendMail(req.payload, {
          to,
          subject: 'Navykus: проверка отправки писем',
          text: `Это тестовое письмо из админ-панели Navykus. Если вы его получили, отправка писем от ${MAIL_FROM_ADDRESS} работает.`,
          html: `<p>Это тестовое письмо из админ-панели Navykus.</p><p>Если вы его получили, отправка писем от <b>${MAIL_FROM_ADDRESS}</b> работает.</p>`,
        });
        return Response.json({ ...result, to, from: MAIL_FROM_ADDRESS }, { status: result.ok ? 200 : 502 });
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        const email = normalizeEmail(data?.email);

        if (email === ADMIN_EMAIL) {
          return {
            ...data,
            email: ADMIN_EMAIL,
            role: 'admin',
            accountStatus: 'active',
          };
        }

        return data;
      },
    ],
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
    },
    {
      name: 'lastName',
      type: 'text',
    },
    {
      name: 'accountStatus',
      type: 'select',
      defaultValue: 'active',
      required: true,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Blocked', value: 'blocked' },
        { label: 'Pending', value: 'pending' },
      ],
      access: {
        create: ({ req: { user } }) => isAdmin(user),
        update: ({ req: { user } }) => isAdmin(user),
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'moderator',
      required: true,
      options: [
        { label: 'Moderator', value: 'moderator' },
        { label: 'Admin', value: 'admin' },
      ],
      access: {
        create: ({ req: { user } }) => isAdmin(user),
        update: ({ req: { user } }) => isAdmin(user),
      },
      admin: {
        position: 'sidebar',
      },
    },
  ],
};
