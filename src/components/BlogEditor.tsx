import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { blogApi, type BlogPostDoc, type PlatformUser } from '../api';
import { SUPPORTED_LANGUAGES } from '../i18n/languages';

type LoadState = 'idle' | 'loading' | 'success' | 'error';

const BLOG_CATEGORIES = ['news', 'championships', 'activities', 'opportunities', 'stories', 'interviews', 'tips', 'education', 'projects'] as const;

const kebabCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'untitled';

export default function BlogEditor({
  user,
  post,
  onDone,
}: {
  user: PlatformUser;
  post?: BlogPostDoc;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<Record<string, string>>(() => ({
    title: post?.title || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    category: post?.category || '',
    tags: post?.tags?.join(', ') || '',
    originalLanguage: post?.originalLanguage || '',
    coverId: post?.cover || '',
    coverAlt: post?.coverAlt || '',
    seoTitle: post?.seoTitle || '',
    seoDescription: post?.seoDescription || '',
    slug: post?.slug || '',
  }));
  const [state, setState] = useState<LoadState>('idle');
  const [message, setMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!post) {
      setForm((current) => ({
        ...current,
        slug: kebabCase(current.title),
      }));
    }
  }, [form.title, post]);

  const readingTime = useMemo(() => {
    const chars = form.content.length;
    const words = Math.max(1, Math.ceil(chars / 5));
    return Math.max(1, Math.ceil(words / 180));
  }, [form.content]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!form.title.trim()) errors.push(t('ui.blogeditor.validation.titleRequired'));
    if (form.title.length > 200) errors.push(t('ui.blogeditor.validation.titleTooLong'));
    if (!form.excerpt.trim()) errors.push(t('ui.blogeditor.validation.excerptRequired'));
    if (form.excerpt.length > 600) errors.push(t('ui.blogeditor.validation.excerptTooLong'));
    if (!form.content.trim()) errors.push(t('ui.blogeditor.validation.contentRequired'));
    if (!form.category) errors.push(t('ui.blogeditor.validation.categoryRequired'));
    return errors;
  }, [form, t]);

  const save = async (status: 'draft' | 'pending_review') => {
    if (validationErrors.length > 0) {
      setMessage(validationErrors.join('; '));
      return;
    }
    setState('loading');
    setMessage('');
    const payload = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content,
      category: form.category,
      tags: form.tags.split(',').map((item) => item.trim()).filter(Boolean),
      originalLanguage: form.originalLanguage,
      cover: form.coverId || undefined,
      coverAlt: form.coverAlt || undefined,
      seoTitle: form.seoTitle || undefined,
      seoDescription: form.seoDescription || undefined,
      slug: form.slug || kebabCase(form.title),
      status,
    };
    try {
      if (post) {
        await blogApi.update(post.id, payload);
      } else {
        await blogApi.create(payload);
      }
      setState('success');
      setMessage(t('platform.states.saved'));
      onDone();
    } catch (error) {
      setState('error');
      setMessage(t(`platform.errors.${(error as Error).name}`, { defaultValue: t('platform.errors.API_ERROR') }));
    }
  };

  const deletePost = async () => {
    if (!post) return;
    const confirmed = window.confirm(t('ui.blogeditor.validation.deleteConfirm'));
    if (!confirmed) return;
    setState('loading');
    setMessage('');
    try {
      await blogApi.delete(post.id);
      setState('success');
      onDone();
    } catch (error) {
      setState('error');
      setMessage(t(`platform.errors.${(error as Error).name}`, { defaultValue: t('platform.errors.API_ERROR') }));
    }
  };

  const categoryTag = form.category ? t(`ui.blogeditor.categories.${form.category}`) : '';
  const tagList = form.tags.split(',').map((item) => item.trim()).filter(Boolean);
  const previewCoverId = form.coverId || post?.cover || '';
  const resolvedSlug = form.slug || kebabCase(form.title);

  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#bc4638]/10 text-[#bc4638]">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </div>
        <h1 className="font-serif text-2xl text-brand-dark">{post ? t('ui.blogeditor.editTitle') : t('ui.blogeditor.createTitle')}</h1>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/60 bg-white/45 p-4">
        <Input label={t('ui.blogeditor.fields.title')} value={form.title} onChange={(value) => update('title', value)} />
        <Textarea label={t('ui.blogeditor.fields.excerpt')} value={form.excerpt} onChange={(value) => update('excerpt', value)} />
        <Textarea label={t('ui.blogeditor.fields.content')} value={form.content} onChange={(value) => update('content', value)} rows={15} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-brand-dark/70">
            <span>{t('ui.blogeditor.fields.category')}</span>
            <select value={form.category} onChange={(event) => update('category', event.target.value)} className="min-h-11 rounded-xl border border-[#d8d1cc] bg-white/70 px-3 text-sm normal-case tracking-normal text-brand-dark outline-none focus:border-[#bc4638]">
              <option value="">—</option>
              {BLOG_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{t(`ui.blogeditor.categories.${cat}`)}</option>
              ))}
            </select>
          </label>
          <Input label={t('ui.blogeditor.fields.tags')} value={form.tags} onChange={(value) => update('tags', value)} />
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-brand-dark/70">
            <span>{t('ui.blogeditor.fields.originalLanguage')}</span>
            <select value={form.originalLanguage} onChange={(event) => update('originalLanguage', event.target.value)} className="min-h-11 rounded-xl border border-[#d8d1cc] bg-white/70 px-3 text-sm normal-case tracking-normal text-brand-dark outline-none focus:border-[#bc4638]">
              <option value="">—</option>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </label>
          <Input label={t('ui.blogeditor.fields.coverId')} value={form.coverId} onChange={(value) => update('coverId', value)} />
          <Input label={t('ui.blogeditor.fields.coverAlt')} value={form.coverAlt} onChange={(value) => update('coverAlt', value)} />
          <Input label={t('ui.blogeditor.fields.seoTitle')} value={form.seoTitle} onChange={(value) => update('seoTitle', value)} />
          <Textarea label={t('ui.blogeditor.fields.seoDescription')} value={form.seoDescription} onChange={(value) => update('seoDescription', value)} />
          <Input label={t('ui.blogeditor.fields.slug')} value={resolvedSlug} onChange={(value) => update('slug', value)} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="rounded-xl border border-[#d8d1cc] bg-white/70 px-4 py-2 text-xs font-semibold text-brand-slate"
        >
          {showPreview ? t('ui.blogeditor.actions.hidePreview') : t('ui.blogeditor.actions.preview')}
        </button>
        {state === 'loading' && <span className="text-sm text-brand-slate">{t('platform.states.saving')}</span>}
      </div>

      {showPreview && (
        <div className="rounded-2xl border border-white/60 bg-white/45 p-4">
          {previewCoverId && (
            <div className="mb-4 h-40 overflow-hidden rounded-xl bg-gradient-to-br from-[#bc4638]/20 to-[#bd5b82]/20">
              <div className="flex h-full items-center justify-center text-xs text-brand-slate">
                cover: {previewCoverId}
              </div>
            </div>
          )}
          {categoryTag && (
            <div className="text-xs font-semibold uppercase tracking-wider text-[#bc4638]">{categoryTag}</div>
          )}
          <h2 className="mt-1 font-serif text-xl text-brand-dark">{form.title || t('platform.fields.title')}</h2>
          <p className="mt-2 text-sm text-brand-slate">{form.excerpt}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/60 px-2 py-1 text-[11px] text-brand-slate">
              {t('ui.blogeditor.readingTime', { count: readingTime })}
            </span>
            {tagList.map((tag) => (
              <span key={tag} className="rounded-full bg-white/60 px-2 py-1 text-[11px] text-brand-slate">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${state === 'error' || validationErrors.length > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {message}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => save('draft')} disabled={state === 'loading'} className="rounded-xl border border-[#d8d1cc] bg-white/70 px-4 py-3 text-xs font-semibold text-brand-slate disabled:opacity-60">
          {t('ui.blogeditor.actions.saveDraft')}
        </button>
        <button type="button" onClick={() => save('pending_review')} disabled={state === 'loading'} className="rounded-xl bg-brand-dark px-4 py-3 text-xs font-semibold text-white disabled:opacity-60">
          {t('ui.blogeditor.actions.submitReview')}
        </button>
        <button type="button" onClick={onDone} disabled={state === 'loading'} className="rounded-xl border border-[#d8d1cc] bg-white/70 px-4 py-3 text-xs font-semibold text-brand-slate disabled:opacity-60">
          {t('ui.blogeditor.actions.cancel')}
        </button>
        {post && (
          <button type="button" onClick={deletePost} disabled={state === 'loading'} className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 disabled:opacity-60">
            {t('ui.blogeditor.actions.delete')}
          </button>
        )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-brand-dark/70">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-xl border border-[#d8d1cc] bg-white/70 px-3 text-sm normal-case tracking-normal text-brand-dark outline-none focus:border-[#bc4638]" />
    </label>
  );
}

function Textarea({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-brand-dark/70">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} className="rounded-xl border border-[#d8d1cc] bg-white/70 px-3 py-2 text-sm normal-case tracking-normal text-brand-dark outline-none focus:border-[#bc4638]" />
    </label>
  );
}