import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { blogApi, type BlogModerationHistoryEntry, type BlogPostDoc, type PlatformUser } from '../api';

type LoadState = 'idle' | 'loading' | 'success' | 'error';

const navigate = (path: string) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const BLOG_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  pending_review: 'bg-amber-100 text-amber-700',
  needs_revision: 'bg-orange-100 text-orange-700',
  approved: 'bg-sky-100 text-sky-700',
  published: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  archived: 'bg-slate-200 text-slate-500',
};

export default function MyBlogPosts({ user }: { user: PlatformUser }) {
  const { t } = useTranslation();
  const [docs, setDocs] = useState<BlogPostDoc[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [historyMap, setHistoryMap] = useState<Record<string, BlogModerationHistoryEntry[]>>({});
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});

  const load = async () => {
    setState('loading');
    try {
      const result = await blogApi.myPosts();
      setDocs(result.docs);
      setState('success');
    } catch {
      setState('error');
    }
  };

  useEffect(() => { void load(); }, []);

  const deletePost = async (id: string) => {
    const confirmed = window.confirm(t('ui.blogeditor.validation.deleteConfirm'));
    if (!confirmed) return;
    setState('loading');
    try {
      await blogApi.delete(id);
      await load();
    } catch {
      setState('error');
    }
  };

  const viewHistory = async (id: string) => {
    if (expandedHistory[id]) {
      setExpandedHistory((current) => ({ ...current, [id]: false }));
      return;
    }
    try {
      const result = await blogApi.history(id);
      setHistoryMap((current) => ({ ...current, [id]: result.docs }));
      setExpandedHistory((current) => ({ ...current, [id]: true }));
    } catch {
      setState('error');
    }
  };

  const canEdit = (status: string) => ['draft', 'pending_review', 'needs_revision'].includes(status);
  const statusKey = (s: string) => `platform.status.${s}`;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#bc4638]/10 text-[#bc4638]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </div>
          <h1 className="font-serif text-2xl text-brand-dark">{t('platform.dashboard.blog')}</h1>
        </div>
        <button type="button" onClick={() => navigate('/profile/blog/new')} className="rounded-xl bg-brand-dark px-4 py-3 text-xs font-semibold text-white">
          {t('ui.blogeditor.createTitle')}
        </button>
      </div>

      {state === 'loading' && (
        <div className="rounded-2xl border border-white/60 bg-white/45 p-6 text-sm text-brand-slate">{t('platform.states.loading')}</div>
      )}
      {state === 'error' && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{t('platform.states.error')}</div>
      )}
      {state === 'success' && docs.length === 0 && (
        <div className="rounded-2xl border border-white/60 bg-white/45 p-6 text-sm text-brand-slate">
          <p>{t('platform.states.empty')}</p>
          <button type="button" onClick={() => navigate('/profile/blog/new')} className="mt-4 rounded-xl bg-brand-dark px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white">
            {t('ui.blogeditor.createTitle')}
          </button>
        </div>
      )}
      {state === 'success' && docs.length > 0 && (
        <div className="grid gap-3">
          {docs.map((post) => {
            const historyEntries = historyMap[post.id];
            const isHistoryOpen = expandedHistory[post.id] || false;
            const statusBadgeClass = BLOG_STATUS_COLORS[post.status] || 'bg-slate-100 text-slate-600';

            return (
              <article key={post.id} className="rounded-2xl border border-white/60 bg-white/45 p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#bc4638]/15 to-[#bd5b82]/15">
                    {post.cover ? (
                      <div className="text-[10px] text-brand-slate">cover: {post.cover}</div>
                    ) : (
                      <svg className="h-6 w-6 text-brand-slate/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-xl text-brand-dark">{post.title}</h3>
                    <p className="mt-1 text-sm text-brand-slate line-clamp-2">{post.excerpt}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusBadgeClass}`}>
                        {t(statusKey(post.status), post.status)}
                      </span>
                      <span className="text-[11px] text-brand-slate">
                        {post.createdAt ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(post.createdAt)) : ''}
                      </span>
                      <span className="text-[11px] text-brand-slate">{t('ui.blogeditor.readingTime', { count: post.readingTime })}</span>
                      {post.category && (
                        <span className="rounded-full bg-white/60 px-2 py-1 text-[11px] text-brand-slate">
                          {t(`ui.blogeditor.categories.${post.category}`, post.category)}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => window.alert(`${post.title}\n\n${post.excerpt}`)} className="rounded-xl bg-brand-dark px-4 py-2 text-xs font-semibold text-white">
                        {t('platform.actions.open')}
                      </button>
                      {canEdit(post.status) && (
                        <button type="button" onClick={() => navigate(`/profile/blog/${post.id}/edit`)} className="rounded-xl border border-[#d8d1cc] bg-white/70 px-4 py-2 text-xs font-semibold text-brand-slate">
                          {t('ui.blogeditor.editTitle')}
                        </button>
                      )}
                      <button type="button" onClick={() => deletePost(post.id)} className="rounded-xl border border-[#d8d1cc] bg-white/70 px-4 py-2 text-xs font-semibold text-red-500">
                        {t('platform.actions.remove')}
                      </button>
                      <button type="button" onClick={() => viewHistory(post.id)} className="rounded-xl border border-[#d8d1cc] bg-white/70 px-4 py-2 text-xs font-semibold text-brand-slate">
                        {isHistoryOpen ? t('common.collapse') : t('platform.details.history')}
                      </button>
                    </div>
                    {isHistoryOpen && historyEntries && (
                      <div className="mt-4 rounded-xl border border-white/60 bg-white/35 p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-slate mb-2">{t('platform.details.history')}</div>
                        <div className="grid gap-2">
                          {historyEntries.length === 0 && (
                            <div className="text-xs text-brand-slate">{t('platform.states.empty')}</div>
                          )}
                          {historyEntries.map((entry) => (
                            <div key={entry.id} className="flex flex-wrap items-center gap-2 text-xs text-brand-slate">
                              <span className="rounded-full bg-white/60 px-2 py-1 text-[10px]">{t(statusKey(entry.previousStatus), entry.previousStatus)}</span>
                              <span className="text-brand-dark">&rarr;</span>
                              <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${BLOG_STATUS_COLORS[entry.status] || 'bg-slate-100 text-slate-600'}`}>{t(statusKey(entry.status), entry.status)}</span>
                              {entry.comment && <span className="italic text-brand-slate">&ldquo;{entry.comment}&rdquo;</span>}
                              <span className="text-[10px] text-brand-slate/60">{entry.actor}</span>
                              <span className="text-[10px] text-brand-slate/60">{entry.createdAt ? new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(entry.createdAt)) : ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}