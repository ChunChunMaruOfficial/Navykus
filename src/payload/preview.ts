const siteOrigin = () =>
  (process.env.PUBLIC_SITE_URL || process.env.SITE_URL || process.env.SERVER_URL || 'https://navykus.online').replace(/\/+$/, '');

const value = (doc: Record<string, unknown>, key: string) => String(doc[key] || '').trim();

export const publicPreview = (collection: string) => (doc: Record<string, unknown>) => {
  const origin = siteOrigin();
  const id = value(doc, 'id');
  const slug = value(doc, 'slug') || id;
  const previewId = encodeURIComponent(id || slug);

  if (collection === 'blog-posts') return `${origin}/blog/${encodeURIComponent(slug)}?previewId=${previewId}`;
  if (collection === 'opportunities') return `${origin}/activities/opportunities/${encodeURIComponent(slug)}?previewId=${previewId}`;
  if (collection === 'events') return `${origin}/activities/events?previewId=${previewId}`;
  if (collection === 'tournaments') return `${origin}/championship?previewId=${previewId}`;
  if (collection === 'activities') return `${origin}/activities/events?previewId=${previewId}`;
  if (collection === 'team-members') return `${origin}/find-team?previewId=${previewId}`;
  if (collection === 'experts') return `${origin}/championship?previewId=${previewId}`;
  if (collection === 'pillars' || collection === 'stats' || collection === 'trust-points') return `${origin}/?previewId=${previewId}`;
  if (collection === 'scenarios') return `${origin}/activities/events?previewId=${previewId}`;
  if (collection === 'faqs') {
    const page = value(doc, 'page') || 'about';
    return `${origin}/${page === 'home' ? '' : page}?previewId=${previewId}`;
  }

  return `${origin}/?previewId=${previewId}`;
};
