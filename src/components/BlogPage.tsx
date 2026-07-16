import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Clock,
  Globe,
  Mail,
  Search,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import {
  cardItemFadeUp,
  cardStaggerContainer,
  fadeInScale,
  fadeUp,
  fadeUpLarge,
  heroFadeUpLarge,
} from '../motion-animations';
import BrandImage from './BrandImage';
import StudyBackground from './StudyBackground';
import { blogApi, type BlogPostDoc } from '../api';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n/languages';

const BLOG_CATEGORIES = ['news', 'championships', 'activities', 'opportunities', 'stories', 'interviews', 'tips', 'education', 'projects'];

const CATEGORY_META: Record<string, { label: string; chip: string }> = {
  news: { label: 'ui.blogpage.cat.news', chip: 'bg-[#bc4638]/10 text-[#8d3026]' },
  championships: { label: 'ui.blogpage.cat.championships', chip: 'bg-[#7a5c21]/14 text-[#7a5c21]' },
  activities: { label: 'ui.blogpage.cat.activities', chip: 'bg-[#6b8f71]/12 text-[#355a40]' },
  opportunities: { label: 'ui.blogpage.cat.opportunities', chip: 'bg-[#3d6b8f]/12 text-[#274d68]' },
  stories: { label: 'ui.blogpage.cat.stories', chip: 'bg-[#bd5b82]/12 text-[#8a3859]' },
  interviews: { label: 'ui.blogpage.cat.interviews', chip: 'bg-[#8a6b9d]/12 text-[#644675]' },
  tips: { label: 'ui.blogpage.cat.tips', chip: 'bg-[#c9a96e]/16 text-[#7a5c21]' },
  education: { label: 'ui.blogpage.cat.education', chip: 'bg-[#bc4638]/10 text-[#8d3026]' },
  projects: { label: 'ui.blogpage.cat.projects', chip: 'bg-[#6b8f71]/12 text-[#355a40]' },
};

const formatDate = (iso: string, language: string) => {
  try {
    return new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const PER_PAGE = 9;

interface BlogPageProps {
  onBackToHome: () => void;
  onCreateBlog?: () => void;
}

export default function BlogPage({ onBackToHome, onCreateBlog }: BlogPageProps) {
  const { t, i18n } = useTranslation();
  const browserLang = (i18n.resolvedLanguage || i18n.language || 'ru').split('-')[0];
  const language = useMemo(() => (SUPPORTED_LANGUAGES as readonly string[]).includes(browserLang) ? browserLang as SupportedLanguage : 'ru', [browserLang]);

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Data state
  const [posts, setPosts] = useState<BlogPostDoc[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchList = useCallback(async () => {
    setLoadState('loading');
    setErrorMsg('');
    try {
      const params: Record<string, string> = { lang: language, page: String(page), limit: String(PER_PAGE) };
      if (selectedCategory) params.category = selectedCategory;
      if (submittedSearch.trim()) params.q = submittedSearch.trim();
      const result = await blogApi.list(params);
      setPosts(result.docs);
      setTotalDocs(result.totalDocs);
      setTotalPages(result.totalPages);
      setLoadState('success');
    } catch (error) {
      setErrorMsg(t('platform.errors.API_ERROR', { defaultValue: (error as Error).message }));
      setLoadState('error');
    }
  }, [language, page, selectedCategory, submittedSearch, t]);

  useEffect(() => {
    document.title = t('meta.blog.title');
  }, [t]);

  useEffect(() => { setPage(1); }, [selectedCategory, submittedSearch]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const featuredPosts = useMemo(() => posts.slice(0, 3), [posts]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of BLOG_CATEGORIES) counts[c] = 0;
    for (const p of posts) counts[p.category] = (counts[p.category] || 0) + 1;
    return counts;
  }, [posts]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#fff8f5] via-[#fffaf7] to-[#fdf6f4] text-[#111111]">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] mix-blend-multiply" style={{ backgroundImage: 'radial-gradient(circle, #111 0.6px, transparent 0.8px)', backgroundSize: '18px 18px' }} />
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.25]" style={{ backgroundImage: 'linear-gradient(#d8d1cc 1px, transparent 1px), linear-gradient(90deg, #d8d1cc 1px, transparent 1px)', backgroundSize: '120px 120px' }} />
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute right-[-8%] top-[-12%] h-[700px] w-[700px] rounded-full opacity-20 blur-[140px]" style={{ background: 'radial-gradient(circle at 30% 20%, #f38b76, #bc4638 60%, #80261b)' }} />
        <div className="absolute left-[-12%] top-[15%] h-[500px] w-[500px] rounded-full opacity-15 blur-[130px]" style={{ background: 'radial-gradient(circle at 60% 40%, #e28fb1, #bd5b82 65%, transparent)' }} />
        <div className="absolute bottom-[-5%] right-[15%] h-[450px] w-[450px] rounded-full opacity-10 blur-[110px]" style={{ background: 'radial-gradient(circle at 40% 50%, #f38b76, #d57e8c 50%, #e28fb1)' }} />
      </div>
      <StudyBackground />

      {/* HERO */}
      <section className="relative z-10 mx-auto max-w-7xl px-[6%] pb-12 pt-24 md:px-[10%] md:pb-16 md:pt-28">
                <div className="flex justify-start mb-8 sm:mb-12">
          <button
            onClick={onBackToHome}
            className="group inline-flex items-center gap-2 px-4 py-2 border border-[#d8d1cc]/60 hover:border-brand-dark text-xs font-mono tracking-wider uppercase text-brand-slate hover:text-brand-dark transition-all rounded-xl cursor-pointer bg-white/20 backdrop-blur-sm"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180 transition-transform group-hover:-translate-x-0.5" />
            <span>{t('ui.aboutprojectpage.a9dc864a2e')}</span>
          </button>
        </div>
        <motion.div {...heroFadeUpLarge} className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
          <div className="space-y-6 text-left">
            <h1 className="text-3xl font-serif font-light leading-[1.05] tracking-tight text-brand-dark sm:text-4xl md:text-5xl lg:text-[52px]">{t('ui.blogpage.hero.title')}</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-brand-slate sm:text-base md:text-lg">{t('ui.blogpage.hero.description')}</p>
                        <button onClick={onCreateBlog} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#bc4638] to-[#bd5b82] px-7 py-3.5 text-xs font-medium text-white shadow-xl shadow-[#bc4638]/25 transition-all hover:scale-[1.02] sm:text-sm cursor-pointer">
              <span>{t('ui.blogpage.hero.createCta')}</span><ArrowUpRight className="h-4 w-4" /></button>
          </div>
          <BrandImage src="/images/championship/championship-presentation.jpg" alt={t('ui.blogpage.hero.coverAlt')} aspectRatio="4 / 3" objectPosition="50% 42%" priority sizes="(min-width: 768px) 40vw, 100vw" overlay />
        </motion.div>
      </section>

      {/* SEARCH + CATEGORIES */}
      <section className="relative z-10 mx-auto max-w-7xl px-[6%] py-8 md:px-[10%] md:py-10">
        <motion.div {...fadeUp} className="space-y-6">
          <div className="flex gap-3">
            <label className="relative block flex-1">
              <span className="sr-only">{t('ui.blogpage.search.placeholder')}</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSubmittedSearch(search.trim());
                    setPage(1);
                  }
                }}
                placeholder={t('ui.blogpage.search.placeholder')}
                className="min-h-12 w-full rounded-2xl border border-white/65 bg-white/60 py-3 pl-4 pr-10 text-sm text-brand-dark shadow-[0_10px_35px_rgba(91,100,114,0.08)] outline-none backdrop-blur-xl transition-colors placeholder:text-brand-slate/45 focus:border-[#8f99a8]"
              />
              {(search || submittedSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSubmittedSearch('');
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-brand-slate/60 transition-colors hover:bg-white/60 hover:text-brand-dark cursor-pointer"
                  aria-label={t('common.close')}
                ><X className="h-4 w-4" /></button>
              )}
            </label>
            <button
              type="button"
              onClick={() => {
                setSubmittedSearch(search.trim());
                setPage(1);
              }}
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#bc4638] to-[#bd5b82] px-5 text-xs font-semibold text-white shadow-lg shadow-[#bc4638]/15 transition-all hover:scale-[1.02] cursor-pointer"
              aria-label={t('ui.blogpage.search.submit')}
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">{t('ui.blogpage.search.submit')}</span>
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-soft snap-x snap-mandatory scroll-smooth" role="tablist" aria-label={t('ui.blogpage.categories.aria')} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button role="tab" aria-selected={selectedCategory === ''} onClick={() => setSelectedCategory('')} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border px-4 py-2 text-[11px] font-semibold uppercase tracking-wide transition-all cursor-pointer ${selectedCategory === '' ? 'border-brand-dark bg-brand-dark text-white shadow-md' : 'border-white/60 bg-white/45 text-brand-slate hover:bg-white hover:text-brand-dark'}`}>
              <span>{t('ui.blogpage.cat.all')}</span><span className={`rounded-full px-2 py-0.5 text-[10px] ${selectedCategory === '' ? 'bg-white/16 text-white' : 'bg-brand-dark/6 text-brand-slate'}`}>{totalDocs}</span></button>
            {BLOG_CATEGORIES.map((c) => (<button key={c} role="tab" aria-selected={selectedCategory === c} onClick={() => setSelectedCategory(c)} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border px-4 py-2 text-[11px] font-semibold uppercase tracking-wide transition-all cursor-pointer ${selectedCategory === c ? 'border-brand-dark bg-brand-dark text-white shadow-md' : 'border-white/60 bg-white/45 text-brand-slate hover:bg-white hover:text-brand-dark'}`}>
              <span>{t(CATEGORY_META[c]?.label || c)}</span><span className={`rounded-full px-2 py-0.5 text-[10px] ${selectedCategory === c ? 'bg-white/16 text-white' : 'bg-brand-dark/6 text-brand-slate'}`}>{categoryCounts[c] || 0}</span></button>))}
          </div>
        </motion.div>
      </section>

      {/* FEATURED */}
      {selectedCategory === '' && !submittedSearch && loadState === 'success' && featuredPosts.length > 0 && (
      <section className="relative z-10 mx-auto max-w-7xl px-[6%] py-10 md:px-[10%] md:py-14">
        <motion.div {...fadeUp} className="mb-8 flex items-center gap-3"><TrendingUp className="h-6 w-6 text-[#bc4638]" /><h2 className="text-2xl font-serif font-semibold tracking-tight text-brand-dark sm:text-3xl">{t('ui.blogpage.featured.title')}</h2></motion.div>
        <motion.div {...cardStaggerContainer} className="grid grid-cols-1 gap-5 md:grid-cols-3">{featuredPosts.map((post) => <FeaturedCard key={post.id} post={post} t={t} language={language} />)}</motion.div></section>)}

      {/* GRID */}
      <section id="latest-posts" className="relative z-10 mx-auto max-w-7xl px-[6%] py-10 md:px-[10%] md:py-14">
        <motion.div {...fadeUp} className="mb-8"><h2 className="text-2xl font-serif font-semibold tracking-tight text-brand-dark sm:text-3xl">{t('ui.blogpage.latest.title')}</h2><p className="mt-2 text-sm text-brand-slate">{t('ui.blogpage.results', { count: totalDocs })}</p></motion.div>
        {loadState === 'loading' && <div className="rounded-2xl border border-white/60 bg-white/45 p-10 text-center backdrop-blur-xl"><div className="mx-auto mb-4 h-8 w-8 animate-pulse rounded-full bg-brand-dark/10" /><p className="text-sm text-brand-slate">{t('common.loading')}</p></div>}
        {loadState === 'error' && <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{errorMsg}</div>}
        {loadState === 'success' && posts.length > 0 && (
        <motion.div {...cardStaggerContainer} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <BlogCard key={post.id} post={post} t={t} language={language} />)}</motion.div>)}
        {loadState === 'success' && posts.length === 0 && (
        <motion.div {...fadeInScale} className="rounded-2xl border border-white/60 bg-white/45 p-10 text-center backdrop-blur-xl">
          <Search className="mx-auto mb-4 h-8 w-8 text-brand-slate/40" />
          <h3 className="text-lg font-serif text-brand-dark">{t('ui.blogpage.empty.title')}</h3><p className="mt-2 text-sm text-brand-slate">{t('ui.blogpage.empty.description')}</p>
          <button onClick={() => { setSearch(''); setSubmittedSearch(''); setSelectedCategory(''); }} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-dark px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-brand-dark/90 cursor-pointer"><span>{t('ui.blogpage.empty.reset')}</span></button></motion.div>)}

        {/* Pagination */}
        {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[#d8d1cc] bg-white/50 px-4 py-2 text-xs font-semibold text-brand-slate backdrop-blur-sm transition-all hover:border-brand-dark disabled:opacity-40 disabled:cursor-not-allowed">
            <ArrowRight className="h-3.5 w-3.5 rotate-180" /><span>{t('ui.blogpage.pagination.prev')}</span></button>
          <span className="text-xs font-semibold text-brand-slate px-3">{page} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[#d8d1cc] bg-white/50 px-4 py-2 text-xs font-semibold text-brand-slate backdrop-blur-sm transition-all hover:border-brand-dark disabled:opacity-40 disabled:cursor-not-allowed">
            <span>{t('ui.blogpage.pagination.next')}</span><ArrowRight className="h-3.5 w-3.5" /></button></div>)}
      </section>

      {/* NEWSLETTER */}
      <section className="relative z-10 mx-auto max-w-7xl px-[6%] py-14 md:px-[10%] md:py-20">
        <motion.div {...fadeInScale} className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-brand-dark px-6 py-10 text-center shadow-[0_30px_90px_rgba(17,17,17,0.16)] sm:px-10 sm:py-14">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          <div className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white"><Mail className="h-5 w-5" /></div>
          <h2 className="mx-auto max-w-4xl text-3xl font-serif font-semibold leading-tight tracking-tight text-white sm:text-4xl">{t('ui.blogpage.newsletter.title')}</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/70">{t('ui.blogpage.newsletter.description')}</p>
          <form className="mx-auto mt-7 flex max-w-md flex-col items-stretch gap-3 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
            <label className="sr-only" htmlFor="newsletter-email">{t('ui.blogpage.newsletter.placeholder')}</label>
            <input id="newsletter-email" type="email" required placeholder={t('ui.blogpage.newsletter.placeholder')} className="min-h-12 flex-1 rounded-2xl border border-white/20 bg-white/8 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition-colors focus:border-white/50" />
            <button type="submit" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-brand-dark shadow-lg shadow-black/15 transition-all hover:bg-[#f7f3ef] sm:w-auto">{t('ui.blogpage.newsletter.cta')}</button></form></motion.div></section></div>);
}

function FeaturedCard({ post, t, language }: { post: BlogPostDoc; t: TFunction; language: string }) {
  const meta = CATEGORY_META[post.category];
  const capName = (p: BlogPostDoc) => (typeof p.author === 'object' ? (p.author as {name:string}).name : String(p.author || ''));
  const src = post.cover || '/images/home/community-classroom.jpg';
  return (
    <motion.article variants={cardItemFadeUp.variants} className="group relative flex min-h-[420px] flex-col overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/42 surface-elevated-soft backdrop-blur-sm transition-colors hover:bg-white/62">
      <div className="overflow-hidden"><BrandImage src={src} alt={post.title} aspectRatio="16 / 10" objectPosition="50% 42%" sizes="33vw" className="rounded-none border-0 shadow-none" /></div>
      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${meta?.chip || 'bg-brand-slate/10'}`}>{meta ? t(meta.label) : post.category}</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-brand-slate"><Calendar className="h-3 w-3" />{formatDate(post.publishedAt || post.createdAt, language)}</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-brand-slate"><Clock className="h-3 w-3" />{t('ui.blogpage.readingTime', { count: post.readingTime || 0 })}</span>
        </div>
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-dark/6 px-2 py-0.5 text-[10px] font-mono uppercase text-brand-slate"><Globe className="h-3 w-3" />{post.originalLanguage?.toUpperCase() || 'RU'}</span>
          {post.translationPending && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/70 px-2 py-0.5 text-[10px] font-mono uppercase text-amber-700"><AlertTriangle className="h-3 w-3" />{t('ui.blogpage.translationPending')}</span>}
        </div>
        <h3 className="text-lg font-serif font-semibold leading-tight text-brand-dark sm:text-xl">{post.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-brand-slate">{post.excerpt}</p>
        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="text-[11px] font-medium text-brand-slate">{capName(post)}</span>
          <a href={`/blog/${post.slug}`} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8d1cc]/70 bg-white/55 text-[#8d3026] transition-all group-hover:border-[#bc4638]/35 group-hover:bg-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-label={post.title}><ArrowUpRight className="h-4 w-4" /></a></div></div></motion.article>);
}

function BlogCard({ post, t, language }: { post: BlogPostDoc; t: TFunction; language: string }) {
  const meta = CATEGORY_META[post.category];
  const capName = (p: BlogPostDoc) => (typeof p.author === 'object' ? (p.author as {name:string}).name : String(p.author || ''));
  const src = post.cover || '/images/home/community-classroom.jpg';
  return (
    <motion.article variants={cardItemFadeUp.variants} tabIndex={0} className="group relative flex min-h-[370px] cursor-pointer flex-col overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/48 surface-elevated-soft backdrop-blur-sm transition-colors hover:border-[#d8d1cc] hover:bg-white/62">
      <div className="overflow-hidden bg-white/35"><BrandImage src={src} alt={post.title} aspectRatio="16 / 9" objectPosition="50% 42%" sizes="(max-width:639px) 100vw,45vw" className="rounded-none border-0 shadow-none" /></div>
      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${meta?.chip || 'bg-brand-slate/10'}`}>{meta ? t(meta.label) : post.category}</span>
          {post.translationPending && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/70 px-2 py-0.5 text-[10px] font-mono uppercase text-amber-700"><AlertTriangle className="h-3 w-3" />{t('ui.blogpage.translationPending')}</span>}
        </div>
        <h3 className="text-base font-serif font-semibold leading-tight text-brand-dark sm:text-lg">{post.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-brand-slate">{post.excerpt}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-medium text-brand-slate">
          <span className="inline-flex items-center gap-1.5"><User className="h-3 w-3 text-[#bd5b82]" />{capName(post)}</span>
          <span className="inline-flex items-center gap-1.5"><Calendar className="h-3 w-3 text-[#bc4638]" />{formatDate(post.publishedAt || post.createdAt, language)}</span>
          <span className="inline-flex items-center gap-1.5"><Clock className="h-3 w-3 text-[#3d6b8f]" />{t('ui.blogpage.readingTime', { count: post.readingTime || 0 })}</span></div>
        <div className="mt-auto flex justify-end pt-5">
          <a href={`/blog/${post.slug}`} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8d1cc]/70 bg-white/55 text-[#8d3026] transition-all group-hover:border-[#bc4638]/35 group-hover:bg-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-label={`${t('common.details')}: ${post.title}`}><ArrowUpRight className="h-4 w-4" /></a></div></div></motion.article>);
}