import type { Express, Request, Response, NextFunction } from 'express';

import { getPayloadClient } from './payload';
import { enqueueArticleTranslations, retrySingleLocalization } from './blog-translation-queue';
import type { SupportedLanguage } from '../src/i18n/languages';
import { SUPPORTED_LANGUAGES } from '../src/i18n/languages';

const BLOG_STATUSES = new Set<string>(['draft', 'pending_review', 'needs_revision', 'approved', 'published', 'rejected', 'archived']);
const STAFF_ROLES = new Set(['admin', 'moderator']);

type Role = 'user' | 'moderator' | 'admin';
type PlatformUser = { id: string; role: Role };
type AuthenticatedRequest = Request & { platformUser?: PlatformUser };

const payloadId = (value: string | number) => (typeof value === 'number' ? value : /^\d+$/.test(value) ? Number(value) : value);

const asyncRoute = (handler: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => { void handler(req as AuthenticatedRequest, res, next).catch(next); };

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || `post-${Date.now()}`;

const estimateReadingTime = (text: string) =>
  Math.max(1, Math.round((text || '').trim().split(/\s+/).filter(Boolean).length / 180));

const listValues = (items: unknown): string[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => (
    typeof item === 'string' ? item
      : item && typeof item === 'object' && 'value' in (item as object) ? String((item as Record<string, unknown>).value || '') : ''
  )).filter(Boolean);
};

const normalizePost = (doc: Record<string, unknown>) => ({
  id: String(doc.id),
  title: String(doc.title || ''),
  excerpt: String(doc.excerpt || ''),
  content: String(doc.content || ''),
  cover: doc.cover && typeof doc.cover === 'object' && 'url' in (doc.cover as object) ? String((doc.cover as Record<string, unknown>).url) : typeof doc.cover === 'string' ? String(doc.cover) : undefined,
  coverAlt: typeof doc.coverAlt === 'string' ? doc.coverAlt : undefined,
  category: String(doc.category || ''),
  tags: listValues(doc.tags),
  status: String(doc.status || 'draft'),
  author: doc.author && typeof doc.author === 'object' ? { id: String((doc.author as Record<string, unknown>).id || ''), name: String((doc.author as Record<string, unknown>).name || '') } : { id: String(doc.author || ''), name: '' },
  originalLanguage: String(doc.originalLanguage || 'ru'),
  slug: String(doc.slug || ''),
  seoTitle: typeof doc.seoTitle === 'string' ? doc.seoTitle : undefined,
  seoDescription: typeof doc.seoDescription === 'string' ? doc.seoDescription : undefined,
  readingTime: Number(doc.readingTime || 0),
  views: Number(doc.views || 0),
  likes: Number(doc.likes || 0),
  createdAt: String(doc.createdAt || ''),
  updatedAt: String(doc.updatedAt || ''),
  publishedAt: typeof doc.publishedAt === 'string' ? doc.publishedAt : undefined,
  moderationComment: typeof doc.moderationComment === 'string' ? doc.moderationComment : undefined,
});

const normalizeLocalization = (doc: Record<string, unknown>) => ({
  id: String(doc.id),
  post: doc.post && typeof doc.post === 'object' ? String((doc.post as Record<string, unknown>).id || '') : String(doc.post || ''),
  language: String(doc.language || 'ru'),
  title: String(doc.title || ''),
  excerpt: String(doc.excerpt || ''),
  content: String(doc.content || ''),
  slug: String(doc.slug || ''),
  coverAlt: typeof doc.coverAlt === 'string' ? doc.coverAlt : undefined,
  seoTitle: typeof doc.seoTitle === 'string' ? doc.seoTitle : undefined,
  seoDescription: typeof doc.seoDescription === 'string' ? doc.seoDescription : undefined,
  translationStatus: String(doc.translationStatus || 'pending'),
  errorMessage: typeof doc.errorMessage === 'string' ? doc.errorMessage : undefined,
  generatedAt: typeof doc.generatedAt === 'string' ? doc.generatedAt : undefined,
});

const getUser = async (req: Request): Promise<PlatformUser | undefined> => {
  let token: string | undefined;
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) token = auth.slice('Bearer '.length);
  else {
    const cookies = (req.headers.cookie || '').split(';').map((c) => c.trim());
    const session = cookies.find((c) => c.startsWith('navykus_session='));
    if (session) token = decodeURIComponent(session.slice('navykus_session='.length));
  }
  if (!token) return undefined;
  const payload = await getPayloadClient();
  const result = await payload.auth({
    headers: new Headers({ Authorization: `Bearer ${token}`, DisableAutologin: 'true' }),
  }).catch(() => undefined);
  if (!result?.user) return undefined;
  const u = result.user as unknown as Record<string, unknown>;
  const role: Role = u.role === 'admin' || u.role === 'moderator' ? (u.role as Role) : 'user';
  if (u.accountStatus === 'blocked') return undefined;
  return { id: String(u.id), role };
};

const requireUser = async (req: AuthenticatedRequest, res: Response): Promise<PlatformUser | undefined> => {
  const user = await getUser(req);
  if (!user) { res.status(401).json({ code: 'AUTH_REQUIRED' }); return undefined; }
  req.platformUser = user;
  return user;
};

const requireStaff = async (req: AuthenticatedRequest, res: Response): Promise<PlatformUser | undefined> => {
  const user = await requireUser(req, res);
  if (!user) return undefined;
  if (!STAFF_ROLES.has(user.role)) { res.status(403).json({ code: 'FORBIDDEN' }); return undefined; }
  return user;
};

const createModerationHistory = async (postId: string, authorId: string, actorId: string, previous: string, next: string, comment?: string) => {
  const payload = await getPayloadClient();
  await payload.create({
    collection: 'blog-moderation-history' as any,
    data: { post: payloadId(postId), author: payloadId(authorId), actor: payloadId(actorId), previousStatus: previous, status: next, comment },
    overrideAccess: true,
  });
};

const createNotification = async (userId: string, type: string, relatedId: string, href?: string) => {
  const payload = await getPayloadClient();
  await payload.create({
    collection: 'notifications' as any,
    data: { user: payloadId(userId), type, relatedType: 'blog-post', relatedId, href, data: {} },
    overrideAccess: true,
  });
};

const notifyStaff = async (type: string, relatedId: string, href?: string) => {
  const payload = await getPayloadClient();
  const staff = await payload.find({
    collection: 'users' as any,
    where: { or: [{ role: { equals: 'admin' } }, { role: { equals: 'moderator' } }] },
    limit: 50,
    overrideAccess: true,
  });
  for (const user of staff.docs) {
    await createNotification(String((user as any).id), type, relatedId, href);
  }
};

const attachLocalizations = async (posts: ReturnType<typeof normalizePost>[], language: SupportedLanguage) => {
  if (!posts.length || !posts[0] || language === posts[0].originalLanguage) return;
  const ids = posts.map((p) => payloadId(p.id));
  const payload = await getPayloadClient();
  const locs = await payload.find({
    collection: 'blog-post-localizations' as any,
    where: { and: [{ post: { in: ids } }, { language: { equals: language } }, { translationStatus: { equals: 'ready' } }] },
    limit: 200,
    overrideAccess: true,
  });
  const locMap = new Map(locs.docs.map((l: any) => [String(l.post), normalizeLocalization(l as unknown as Record<string, unknown>)]));
  for (const post of posts) {
    const loc = locMap.get(post.id);
    if (loc) {
      Object.assign(post, { title: loc.title, excerpt: loc.excerpt, content: loc.content, slug: loc.slug, seoTitle: loc.seoTitle, seoDescription: loc.seoDescription, coverAlt: loc.coverAlt ?? post.coverAlt });
    } else {
      (post as any).translationPending = true;
    }
  }
};

export const registerBlogRoutes = (app: Express) => {
  /* 1. Public list */
  app.get('/api/blog/posts', asyncRoute(async (req, res) => {
    const payload = await getPayloadClient();
    const language = typeof req.query.lang === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(req.query.lang) ? (req.query.lang as SupportedLanguage) : 'ru';
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 12)));
    const page = Math.max(1, Number(req.query.page || 1));
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const where: Record<string, unknown> = { status: { equals: 'published' }, isPublished: { equals: true } };
    if (category) where.category = { equals: category };
    if (q) where.or = ['title', 'excerpt', 'content'].map((f) => ({ [f]: { like: q } }));

    const result = await payload.find({
      collection: 'blog-posts' as any,
      where,
      limit,
      page,
      sort: '-publishedAt',
      depth: 2,
      overrideAccess: true,
    });
    const posts = result.docs.map((d) => normalizePost(d as unknown as Record<string, unknown>));
    await attachLocalizations(posts, language);
    res.json({ docs: posts, totalDocs: result.totalDocs, totalPages: result.totalPages, page, language });
  }));

  /* 2. Public single post */
  app.get('/api/blog/posts/:slug', asyncRoute(async (req, res) => {
    const payload = await getPayloadClient();
    const slug = String(req.params.slug);
    const language = typeof req.query.lang === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(req.query.lang) ? (req.query.lang as SupportedLanguage) : 'ru';

    const result = await payload.find({
      collection: 'blog-posts' as any,
      where: { slug: { equals: slug }, status: { equals: 'published' }, isPublished: { equals: true } },
      limit: 1,
      depth: 2,
      overrideAccess: true,
    });
    const doc = result.docs[0] as unknown as Record<string, unknown> | undefined;
    if (!doc) { res.status(404).json({ code: 'POST_NOT_FOUND' }); return; }
    const post = normalizePost(doc);

    void payload.update({ collection: 'blog-posts' as any, id: payloadId(post.id), data: { views: Number(doc.views || 0) + 1 }, overrideAccess: true }).catch(() => undefined);
    await attachLocalizations([post], language);
    res.json({ post });
  }));

  /* 3. Author create */
  app.post('/api/blog/posts', asyncRoute(async (req, res) => {
    const user = await requireUser(req as AuthenticatedRequest, res);
    if (!user) return;
    const payload = await getPayloadClient();
    const body = req.body || {};

    const title = String(body.title || '').trim();
    const excerpt = String(body.excerpt || '').trim();
    const content = String(body.content || '').trim();
    if (!title || !excerpt || !content) { res.status(400).json({ code: 'BLOG_REQUIRED_FIELDS' }); return; }
    if (title.length > 200) { res.status(400).json({ code: 'BLOG_TITLE_TOO_LONG' }); return; }
    if (excerpt.length > 600) { res.status(400).json({ code: 'BLOG_EXCERPT_TOO_LONG' }); return; }
    const category = String(body.category || '');
    const validCategories = ['news', 'championships', 'activities', 'opportunities', 'stories', 'interviews', 'tips', 'education', 'projects'];
    if (!validCategories.includes(category)) { res.status(400).json({ code: 'BLOG_INVALID_CATEGORY' }); return; }

    const originalLanguage = (typeof body.originalLanguage === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(body.originalLanguage) ? body.originalLanguage : 'ru') as SupportedLanguage;
    const status = typeof body.status === 'string' && BLOG_STATUSES.has(body.status) && !['approved', 'published', 'rejected', 'archived'].includes(body.status) ? body.status : 'draft';
    const tags = Array.isArray(body.tags) ? body.tags.map(String).filter(Boolean).map((v) => ({ value: v })) : [];
    const readingTime = Number(body.readingTime) > 0 ? Number(body.readingTime) : estimateReadingTime(content);

    const post = await payload.create({
      collection: 'blog-posts' as any,
      data: {
        title, excerpt, content,
        cover: body.cover ? payloadId(String(body.cover)) : undefined,
        coverAlt: typeof body.coverAlt === 'string' ? body.coverAlt : undefined,
        category, tags, status,
        author: payloadId(user.id),
        originalLanguage,
        slug: slugify(String(body.slug || title)),
        seoTitle: typeof body.seoTitle === 'string' ? body.seoTitle : undefined,
        seoDescription: typeof body.seoDescription === 'string' ? body.seoDescription : undefined,
        readingTime, views: 0, likes: 0,
        isApproved: false, isPublished: false,
        moderationComment: undefined,
      } as any,
      overrideAccess: true,
    });

    if (status === 'pending_review') {
      await createNotification(user.id, 'blog_post_submitted', String(post.id), `/profile/blog/${post.id}`);
      await notifyStaff('blog_post_pending_review', String(post.id), '/platform/admin/blog');
    }
    res.status(201).json({ post: normalizePost(post as unknown as Record<string, unknown>) });
  }));

  /* 4. Author/staff update */
  app.patch('/api/blog/posts/:id', asyncRoute(async (req, res) => {
    const user = await requireUser(req as AuthenticatedRequest, res);
    if (!user) return;
    const payload = await getPayloadClient();
    const id = payloadId(String(req.params.id));
    const existing = await payload.findByID({ collection: 'blog-posts' as any, id, depth: 0, overrideAccess: false }).catch(() => undefined) as unknown as Record<string, unknown>;
    if (!existing) { res.status(404).json({ code: 'POST_NOT_FOUND' }); return; }
    const authorId = existing.author && typeof existing.author === 'object' ? String((existing.author as Record<string, unknown>).id) : String(existing.author || '');
    const isOwner = authorId === user.id;
    const isStaff = STAFF_ROLES.has(user.role);
    const currentStatus = String(existing.status || 'draft');
    if (!isOwner && !isStaff) { res.status(403).json({ code: 'FORBIDDEN' }); return; }

    const body = req.body || {};
    const data: Record<string, unknown> = { id };
    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim().slice(0, 200);
    if (typeof body.excerpt === 'string') data.excerpt = body.excerpt.slice(0, 600);
    if (typeof body.content === 'string') data.content = body.content;
    if (body.readingTime !== undefined) data.readingTime = Number(body.readingTime) || 1;
    if (typeof body.coverAlt === 'string') data.coverAlt = body.coverAlt;
    if (typeof body.category === 'string') data.category = body.category;
    if (Array.isArray(body.tags)) data.tags = body.tags.map(String).filter(Boolean).map((v) => ({ value: v }));
    if (body.cover !== undefined) data.cover = body.cover ? payloadId(String(body.cover)) : undefined;
    if (typeof body.seoTitle === 'string') data.seoTitle = body.seoTitle;
    if (typeof body.seoDescription === 'string') data.seoDescription = body.seoDescription;
    if (typeof body.slug === 'string' && body.slug.trim()) data.slug = slugify(body.slug);

    // Status transitions
    const nextStatus = typeof body.status === 'string' && BLOG_STATUSES.has(body.status) ? body.status : currentStatus;
    const toStaffOnly = ['approved', 'published', 'rejected', 'archived'].includes(nextStatus);
    if (toStaffOnly && !isStaff) { res.status(400).json({ code: 'BLOG_INVALID_STATUS' }); return; }
    if (nextStatus !== currentStatus) {
      data.status = nextStatus;
      data.isApproved = nextStatus === 'approved' || nextStatus === 'published';
      data.isPublished = nextStatus === 'published';
      data.publishedAt = nextStatus === 'published' ? String(body.publishedAt || new Date().toISOString()) : undefined;
      const modComment = typeof body.moderationComment === 'string' ? body.moderationComment : undefined;
      if (modComment) data.moderationComment = modComment;
      await createModerationHistory(String(id), authorId, user.id, currentStatus, nextStatus, modComment);
      await createNotification(authorId, `blog_post_${nextStatus}`, String(id), `/profile/blog/${id}`);
      if (nextStatus === 'pending_review') await notifyStaff('blog_post_pending_review', String(id), '/platform/admin/blog');
    }

    const updated = await payload.update({ collection: 'blog-posts' as any, id, data: data as any, depth: 1, overrideAccess: true });

    if (nextStatus === 'approved' || nextStatus === 'published') {
      const post = updated as unknown as Record<string, unknown>;
      enqueueArticleTranslations(String(id), {
        title: String(post.title || ''),
        excerpt: String(post.excerpt || ''),
        content: String(post.content || ''),
        slug: String(post.slug || ''),
        originalLanguage: String(post.originalLanguage || 'ru') as SupportedLanguage,
        seoTitle: typeof post.seoTitle === 'string' ? post.seoTitle : undefined,
        seoDescription: typeof post.seoDescription === 'string' ? post.seoDescription : undefined,
        coverAlt: typeof post.coverAlt === 'string' ? post.coverAlt : undefined,
      });
    }

    res.json({ post: normalizePost(updated as unknown as Record<string, unknown>) });
  }));

  /* 5. Delete */
  app.delete('/api/blog/posts/:id', asyncRoute(async (req, res) => {
    const user = await requireUser(req as AuthenticatedRequest, res);
    if (!user) return;
    const payload = await getPayloadClient();
    const id = payloadId(String(req.params.id));
    const existing = await payload.findByID({ collection: 'blog-posts' as any, id, depth: 0, overrideAccess: false }).catch(() => undefined) as unknown as Record<string, unknown>;
    if (!existing) { res.status(404).json({ code: 'POST_NOT_FOUND' }); return; }
    const authorId = existing.author && typeof existing.author === 'object' ? String((existing.author as Record<string, unknown>).id) : String(existing.author || '');
    if (authorId !== user.id && !STAFF_ROLES.has(user.role)) { res.status(403).json({ code: 'FORBIDDEN' }); return; }
    await payload.delete({ collection: 'blog-posts' as any, id, overrideAccess: true });
    res.json({ ok: true });
  }));

  /* 6. My posts */
  app.get('/api/profile/blog', asyncRoute(async (req, res) => {
    const user = await requireUser(req as AuthenticatedRequest, res);
    if (!user) return;
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'blog-posts' as any, where: { author: { equals: payloadId(user.id) } },
      sort: '-createdAt', limit: 100, depth: 1, overrideAccess: false,
    });
    res.json({ docs: result.docs.map((d) => normalizePost(d as unknown as Record<string, unknown>)) });
  }));

  /* 7. Moderation history */
  app.get('/api/blog/posts/:id/history', asyncRoute(async (req, res) => {
    const user = await requireUser(req as AuthenticatedRequest, res);
    if (!user) return;
    const payload = await getPayloadClient();
    const id = payloadId(String(req.params.id));
    const post = await payload.findByID({ collection: 'blog-posts' as any, id, depth: 0, overrideAccess: false }).catch(() => undefined) as unknown as Record<string, unknown>;
    if (!post) { res.status(404).json({ code: 'POST_NOT_FOUND' }); return; }
    const authorId = post.author && typeof post.author === 'object' ? String((post.author as Record<string, unknown>).id) : String(post.author || '');
    if (authorId !== user.id && !STAFF_ROLES.has(user.role)) { res.status(403).json({ code: 'FORBIDDEN' }); return; }
    const history = await payload.find({
      collection: 'blog-moderation-history' as any, where: { post: { equals: id } },
      sort: '-createdAt', limit: 100, depth: 1, overrideAccess: true,
    });
    res.json({ docs: history.docs.map((h: any) => ({
      id: String(h.id), previousStatus: String(h.previousStatus || ''),
      status: String(h.status || ''),
      comment: h.comment || undefined,
      actor: h.actor && typeof h.actor === 'object' ? String(h.actor.name || '') : '',
      createdAt: String(h.createdAt || ''),
    })) });
  }));

  /* 8. Staff moderation list + localization retry */
  app.get('/api/admin/blog', asyncRoute(async (req, res) => {
    const staff = await requireStaff(req as AuthenticatedRequest, res);
    if (!staff) return;
    const payload = await getPayloadClient();
    const status = typeof req.query.status === 'string' && BLOG_STATUSES.has(req.query.status) ? req.query.status : undefined;
    const where: Record<string, unknown> = {};
    if (status) where.status = { equals: status };
    const result = await payload.find({
      collection: 'blog-posts' as any, where, sort: '-updatedAt', limit: 100, depth: 2, overrideAccess: true,
    });
    const docs = result.docs as any[];
    const ids = docs.map((d) => payloadId(String(d.id)));
    const locs = ids.length ? await payload.find({
      collection: 'blog-post-localizations' as any, where: { post: { in: ids } }, limit: 200, depth: 0, overrideAccess: true,
    }) : { docs: [] };
    const locMap: Record<string, Array<{ language: string; translationStatus: string }>> = {};
    for (const l of locs.docs as any[]) {
      const pId = String(l.post || '');
      (locMap[pId] ??= []).push({ language: String(l.language || ''), translationStatus: String(l.translationStatus || '') });
    }
    res.json({ docs: docs.map((d) => ({ ...normalizePost(d as unknown as Record<string, unknown>), localizations: locMap[String(d.id)] || [] })) });
  }));
};