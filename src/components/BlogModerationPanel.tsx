import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Globe,
  Newspaper,
} from 'lucide-react';

import { blogApi, type BlogLocalizationSummary, type BlogPostDoc, type PlatformUser } from '../api';

type LoadState = 'idle' | 'loading' | 'success' | 'error';

const statusKey = (status?: string) => `platform.status.${status || 'draft'}`;

const ENTRY_TABS = [
  ['all', undefined],
  ['pending_review', 'pending_review'],
  ['approved', 'approved'],
  ['published', 'published'],
  ['rejected', 'rejected'],
  ['drafts', 'draft'],
] as const;

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#bc4638]/10 text-[#bc4638]">{icon}</div>
      <h1 className="font-serif text-2xl text-brand-dark">{title}</h1>
    </div>
  );
}

function Result({ text, ok = false }: { text: string; ok?: boolean }) {
  return <div className={`rounded-xl px-4 py-3 text-sm ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{text}</div>;
}

function StateBlock({ state, empty, children }: { state: LoadState; empty?: boolean; children: React.ReactNode }) {
  const { t } = useTranslation();
  if (state === 'loading') return <div className="rounded-2xl border border-white/60 bg-white/45 p-6 text-sm text-brand-slate">{t('platform.states.loading')}</div>;
  if (state === 'error') return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{t('platform.states.error')}</div>;
  if (empty) return <div className="rounded-2xl border border-white/60 bg-white/45 p-6 text-sm text-brand-slate">{t('platform.states.empty')}</div>;
  return <>{children}</>;
}

type PostWithLoc = BlogPostDoc & { localizations?: BlogLocalizationSummary[] };

export default function BlogModerationPanel({ user }: { user?: PlatformUser | null }) {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<PostWithLoc[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [tab, setTab] = useState<string>('all');
  const [message, setMessage] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  if (!user || user.role === 'user') return <Result text={t('platform.errors.FORBIDDEN')} />;

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    blogApi.adminList().then((result) => {
      if (cancelled) return;
      setPosts(result.docs);
      setState('success');
    }).catch(() => {
      if (!cancelled) setState('error');
    });
    return () => { cancelled = true; };
  }, []);

  const updateStatus = async (postId: string, status: string, moderationComment?: string) => {
    setMessage('');
    try {
      const result = await blogApi.update(postId, { status, moderationComment });
      setPosts((current) => current.map((post) => (post.id === postId ? { ...post, status: result.post.status, moderationComment: result.post.moderationComment } : post)));
      setEditingComment(null);
      setCommentText('');
      setMessage(t('platform.states.saved'));
    } catch (error) {
      setMessage(t(`platform.errors.${(error as Error).name}`, { defaultValue: t('platform.errors.API_ERROR') }));
    }
  };

  const tabStatus = ENTRY_TABS.find(([key]) => key === tab)?.[1];
  const filtered = (tabStatus !== undefined ? posts.filter((post) => post.status === tabStatus) : posts).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const localizationSummary = (localizations?: BlogLocalizationSummary[]) => {
    if (!localizations || localizations.length === 0) return '';
    return localizations.map((item) => `${item.language} ${item.translationStatus === 'published' ? '✓' : item.translationStatus}`).join(' ');
  };

  const isModOnly = user.role === 'moderator';
  const langBadge = (lang: string) => (
    <span className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase text-brand-slate">{lang}</span>
  );

  return (
    <div className="grid gap-5">
      <SectionTitle icon={<Newspaper className="h-5 w-5" />} title={t('ui.blogmoderation.title', { defaultValue: 'Blog Moderation' })} />
      {message && <Result ok={message === t('platform.states.saved')} text={message} />}

      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-white/60 bg-white/45 p-1.5">
        {ENTRY_TABS.map(([key, status]) => {
          const count = status !== undefined ? posts.filter((post) => post.status === status).length : posts.length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`relative flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-center text-xs font-semibold uppercase tracking-wider transition-colors ${tab === key ? 'bg-brand-dark text-white' : 'text-brand-slate hover:bg-white/60'}`}
            >
              <span>{t(`ui.blogmoderation.tabs.${key}`, { defaultValue: key.replace(/_/g, ' ') })}</span>
              <span className="rounded-full bg-white/20 px-1.5 py-px text-[10px] leading-snug">{count}</span>
            </button>
          );
        })}
      </div>

      <StateBlock state={state} empty={filtered.length === 0}>
        <div className="grid gap-3">
          {filtered.map((post) => (
            <article key={post.id} className="rounded-2xl border border-white/60 bg-white/45 p-4">
              <div className="font-serif text-xl text-brand-dark">{post.title}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-brand-slate">
                <span>{post.author.name}</span>
                <span className="text-xs">·</span>
                <span>{post.createdAt ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(post.createdAt)) : ''}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {langBadge(post.originalLanguage)}
                <span className="rounded-full bg-[#bc4638]/10 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-[#8d3026]">
                  {t(`ui.blogpage.cat.${post.category}`, { defaultValue: post.category })}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wider ${post.status === 'published' ? 'bg-emerald-100 text-emerald-800' : post.status === 'approved' ? 'bg-sky-100 text-sky-800' : post.status === 'rejected' ? 'bg-red-100 text-red-700' : post.status === 'pending_review' ? 'bg-amber-100 text-amber-800' : 'bg-white/60 text-brand-slate'}`}>
                  {t(statusKey(post.status))}
                </span>
              </div>
              {post.localizations && post.localizations.length > 0 && (
                <div className="mt-2 text-xs text-brand-slate">
                  <Globe className="inline h-3 w-3 align-[-1px]" /> {localizationSummary(post.localizations)}
                </div>
              )}
              {post.moderationComment && (
                <div className="mt-2 rounded-xl bg-amber-50/80 px-3 py-2 text-xs text-amber-800">
                  {t('ui.blogmoderation.prevComment', { defaultValue: 'Comment' })}: {post.moderationComment}
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {post.status !== 'approved' && <button type="button" onClick={() => updateStatus(post.id, 'approved')} className="rounded-xl border border-[#d8d1cc] px-3 py-2 text-xs font-semibold text-brand-slate hover:bg-white/80">{t(statusKey('approved'))}</button>}
                {post.status !== 'published' && !isModOnly && <button type="button" onClick={() => updateStatus(post.id, 'published')} className="rounded-xl border border-[#d8d1cc] px-3 py-2 text-xs font-semibold text-brand-slate hover:bg-white/80">{t(statusKey('published'))}</button>}
                {post.status !== 'rejected' && (
                  <>
                    {editingComment === `reject-${post.id}` ? (
                      <span className="inline-flex items-center gap-1.5">
                        <textarea
                          value={commentText}
                          onChange={(event) => setCommentText(event.target.value)}
                          rows={2}
                          placeholder={t('ui.blogmoderation.commentPlaceholder', { defaultValue: 'Comment (optional)' })}
                          className="min-w-[160px] rounded-xl border border-[#d8d1cc] bg-white/70 px-3 py-2 text-xs text-brand-dark outline-none focus:border-[#bc4638]"
                        />
                        <button type="button" onClick={() => updateStatus(post.id, 'rejected', commentText || undefined)} className="rounded-xl bg-red-700 px-3 py-2 text-xs font-semibold text-white">{t(statusKey('rejected'))}</button>
                        <button type="button" onClick={() => { setEditingComment(null); setCommentText(''); }} className="rounded-xl border border-[#d8d1cc] px-2 py-2 text-xs font-semibold text-brand-slate">{t('common.cancel')}</button>
                      </span>
                    ) : (
                      <button type="button" onClick={() => { setEditingComment(`reject-${post.id}`); setCommentText(post.moderationComment || ''); }} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100">{t(statusKey('rejected'))}</button>
                    )}
                  </>
                )}
                {post.status !== 'needs_revision' && (
                  <>
                    {editingComment === `revise-${post.id}` ? (
                      <span className="inline-flex items-center gap-1.5">
                        <textarea
                          value={commentText}
                          onChange={(event) => setCommentText(event.target.value)}
                          rows={2}
                          placeholder={t('ui.blogmoderation.commentPlaceholder', { defaultValue: 'Comment (optional)' })}
                          className="min-w-[160px] rounded-xl border border-[#d8d1cc] bg-white/70 px-3 py-2 text-xs text-brand-dark outline-none focus:border-[#bc4638]"
                        />
                        <button type="button" onClick={() => updateStatus(post.id, 'needs_revision', commentText || undefined)} className="rounded-xl bg-amber-700 px-3 py-2 text-xs font-semibold text-white">{t('ui.blogmoderation.revision', { defaultValue: 'Return for revision' })}</button>
                        <button type="button" onClick={() => { setEditingComment(null); setCommentText(''); }} className="rounded-xl border border-[#d8d1cc] px-2 py-2 text-xs font-semibold text-brand-slate">{t('common.cancel')}</button>
                      </span>
                    ) : (
                      <button type="button" onClick={() => { setEditingComment(`revise-${post.id}`); setCommentText(post.moderationComment || ''); }} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100">{t('ui.blogmoderation.revision', { defaultValue: 'Return for revision' })}</button>
                    )}
                  </>
                )}
                {post.status === 'published' && (
                  <button type="button" onClick={() => updateStatus(post.id, 'draft')} className="rounded-xl border border-[#d8d1cc] px-3 py-2 text-xs font-semibold text-brand-slate hover:bg-white/80">{t('ui.blogmoderation.unpublish', { defaultValue: 'Unpublish' })}</button>
                )}
                <button type="button" onClick={() => alert(post.title)} className="ml-auto rounded-xl bg-brand-dark px-4 py-2 text-xs font-semibold text-white">
                  <FileText className="mr-1 inline h-3 w-3" />
                  {t('ui.blogmoderation.viewArticle', { defaultValue: 'View article' })}
                </button>
              </div>
            </article>
          ))}
        </div>
      </StateBlock>
    </div>
  );
}