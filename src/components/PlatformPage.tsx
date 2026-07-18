import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Bell,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronLeft,
  LogOut,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import {
   apiAssetUrl,
   blogApi,
   getRememberedPlatformAccount,
   platformApi,
   rememberPlatformAccount,
   type BlogPostDoc,
   type CatalogDoc,
   type FavoriteItem,
   type NotificationItem,
   type Participant,
   type PlatformApplication,
   type PlatformUser,
   type RememberedPlatformAccount,
} from '../api';
import BlogEditor from './BlogEditor';
import BlogModerationPanel from './BlogModerationPanel';
import MyBlogPosts from './MyBlogPosts';
import OpportunitiesPage from './OpportunitiesPage';
import {
  LANGUAGE_FLAGS,
  SUPPORTED_LANGUAGES,
  clearPreferredLanguage,
  detectSupportedLanguageFromBrowser,
  getSavedPreferredLanguage,
  isSupportedLanguage,
  savePreferredLanguage,
  type SupportedLanguage,
} from '../i18n/languages';

type LoadState = 'idle' | 'loading' | 'success' | 'error';
type CatalogType = 'championships' | 'events' | 'opportunities';

const PROFILE_TABS = [
  ['overview', '/profile'],
  ['profile', '/profile/profile'],
  ['applications', '/profile/applications'],
  ['favorites', '/profile/favorites'],
  ['notifications', '/profile/notifications'],
  ['team', '/profile/team'],
  ['blog', '/profile/blog'],
  ['settings', '/profile/settings'],
] as const;

const CATALOGS: CatalogType[] = ['championships', 'events', 'opportunities'];

const navigate = (path: string) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const currentPath = () => window.location.pathname.replace(/\/$/, '') || '/';

const getRoute = () => ({
  path: currentPath(),
  search: window.location.search,
});

const textList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

const statusKey = (status?: string) => `platform.status.${status || 'draft'}`;

const userDisplayName = (user: Pick<PlatformUser, 'email' | 'firstName' | 'lastName' | 'name'>) => (
  [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || user.email
);

const rememberedAccountName = (account: RememberedPlatformAccount) => (
  [account.firstName, account.lastName].filter(Boolean).join(' ') || account.name || account.email
);

const userInitials = (user: Pick<PlatformUser, 'email' | 'firstName' | 'lastName' | 'name'>) => {
  const name = userDisplayName(user);
  const parts = name.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2)).toUpperCase();
};

function UserAvatar({
  user,
  className = 'h-11 w-11 rounded-2xl',
}: {
  user: Pick<PlatformUser, 'email' | 'firstName' | 'lastName' | 'name' | 'avatarUrl' | 'avatarAlt' | 'avatarPositionX' | 'avatarPositionY' | 'avatarScale'>;
  className?: string;
}) {
  const src = apiAssetUrl(user.avatarUrl);
  const positionX = user.avatarPositionX ?? 50;
  const positionY = user.avatarPositionY ?? 50;
  const scale = user.avatarScale ?? 1;

  return (
    <div className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-brand-dark text-sm font-semibold text-white ${className}`}>
      {src ? (
        <img
          src={src}
          alt={user.avatarAlt || userDisplayName(user)}
          className="h-full w-full object-cover"
          style={{
            objectPosition: `${positionX}% ${positionY}%`,
            transform: `scale(${scale})`,
          }}
        />
      ) : (
        <span>{userInitials(user)}</span>
      )}
    </div>
  );
}

function Shell({
  user,
  unread,
  children,
  onLogout,
  onLogin,
}: {
  user?: PlatformUser | null;
  unread: number;
  children: React.ReactNode;
  onLogout: () => void;
  onLogin?: () => void;
}) {
  const { t } = useTranslation();
  const isProfileRoute = currentPath().startsWith('/profile');
  const isOpportunitiesRoute = currentPath() === '/activities/opportunities' || currentPath().startsWith('/activities/opportunities/');

  return (
    <main className="relative z-10 min-h-screen px-4 pb-12 pt-28 sm:px-6 sm:pt-32 lg:px-10">
      <div className={`mx-auto flex flex-col gap-6 ${isProfileRoute ? 'max-w-6xl' : 'max-w-7xl'}`}>
        {!isProfileRoute && !isOpportunitiesRoute && (
          <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/50 px-4 py-3 shadow-[0_20px_80px_rgba(27,24,22,0.08)] backdrop-blur-xl">
            <button type="button" onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-slate">
              <ChevronLeft className="h-4 w-4" />
              {t('platform.nav.home')}
            </button>
            <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-brand-slate">
              {CATALOGS.map((catalog) => (
                <button key={catalog} type="button" onClick={() => navigate(`/${catalog}`)} className="rounded-xl px-3 py-2 hover:bg-white/60">
                  {t(`platform.nav.${catalog}`)}
                </button>
              ))}
              <button type="button" onClick={() => navigate('/participants')} className="rounded-xl px-3 py-2 hover:bg-white/60">
                {t('platform.nav.participants')}
              </button>
              {user ? (
                <>
                  <button type="button" onClick={() => navigate('/profile/notifications')} className="relative rounded-xl px-3 py-2 hover:bg-white/60">
                    <Bell className="h-4 w-4" />
                    {unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-[#bc4638] px-1.5 text-[10px] text-white">{unread}</span>}
                  </button>
                  <button type="button" onClick={() => navigate('/profile')} className="rounded-xl bg-brand-dark px-3 py-2 text-white">
                    {t('platform.nav.profile')}
                  </button>
                  {user.role !== 'user' && (
                    <button type="button" onClick={() => navigate('/platform/admin')} className="rounded-xl px-3 py-2 hover:bg-white/60">
                      {t('platform.nav.admin')}
                    </button>
                  )}
                  <button type="button" onClick={onLogout} className="rounded-xl px-3 py-2 hover:bg-white/60" aria-label={t('platform.actions.logout')}>
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button type="button" onClick={onLogin} className="rounded-xl bg-brand-dark px-3 py-2 text-white">
                  {t('platform.nav.login')}
                </button>
              )}
            </nav>
          </header>
        )}
        {children}
      </div>
    </main>
  );
}

function StateBlock({ state, empty, children }: { state: LoadState; empty?: boolean; children: React.ReactNode }) {
  const { t } = useTranslation();
  if (state === 'loading') return <div className="rounded-2xl border border-white/60 bg-white/45 p-6 text-sm text-brand-slate">{t('platform.states.loading')}</div>;
  if (state === 'error') return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{t('platform.states.error')}</div>;
  if (empty) return <div className="rounded-2xl border border-white/60 bg-white/45 p-6 text-sm text-brand-slate">{t('platform.states.empty')}</div>;
  return <>{children}</>;
}

function AuthView({ mode, onAuth }: { mode: 'login' | 'register' | 'forgot' | 'reset'; onAuth: (user: PlatformUser) => void }) {
  const { t } = useTranslation();
  const [form, setForm] = useState<Record<string, string | boolean>>({ privacyAccepted: true, termsAccepted: true });
  const [rememberedAccount, setRememberedAccount] = useState<RememberedPlatformAccount | undefined>(() => getRememberedPlatformAccount());
  const [state, setState] = useState<LoadState>('idle');
  const [message, setMessage] = useState('');

  const update = (key: string, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  const useRememberedAccount = () => {
    if (!rememberedAccount) return;
    setMessage('');
    setForm((current) => ({
      ...current,
      email: rememberedAccount.email,
      password: '',
      passwordConfirmation: '',
    }));
    window.setTimeout(() => document.querySelector<HTMLInputElement>('input[type="password"]')?.focus(), 0);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setState('loading');
    setMessage('');
    try {
      if (mode === 'login') {
        const result = await platformApi.login({ email: String(form.email || ''), password: String(form.password || '') });
        rememberPlatformAccount(result.user);
        setRememberedAccount(getRememberedPlatformAccount());
        onAuth(result.user);
        navigate('/profile');
      } else if (mode === 'register') {
        const result = await platformApi.register(form);
        rememberPlatformAccount(result.user);
        setRememberedAccount(getRememberedPlatformAccount());
        onAuth(result.user);
        navigate('/profile');
      } else if (mode === 'forgot') {
        const result = await platformApi.forgotPassword(String(form.email || ''));
        setMessage(result.resetToken ? `${t('platform.auth.devResetToken')} ${result.resetToken}` : t('platform.auth.forgotSuccess'));
      } else {
        await platformApi.resetPassword({
          token: String(form.token || ''),
          password: String(form.password || ''),
          passwordConfirmation: String(form.passwordConfirmation || ''),
        });
        setMessage(t('platform.auth.resetSuccess'));
        navigate('/');
      }
      setState('success');
    } catch (error) {
      setMessage(t(`platform.errors.${(error as Error).name}`, { defaultValue: t('platform.errors.API_ERROR') }));
      setState('error');
    }
  };

  return (
    <section className="mx-auto grid w-full max-w-4xl gap-6 rounded-3xl border border-white/60 bg-white/45 p-6 shadow-[0_24px_90px_rgba(27,24,22,0.10)] backdrop-blur-xl">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#bc4638]">{t('platform.auth.eyebrow')}</p>
        <h1 className="mt-2 font-serif text-3xl text-brand-dark">{t(`platform.auth.${mode}Title`)}</h1>
      </div>
      <form onSubmit={submit} className="grid gap-4">
        {mode === 'login' && rememberedAccount && (
          <button
            type="button"
            onClick={useRememberedAccount}
            className="flex items-center gap-3 rounded-2xl border border-[#d8d1cc] bg-white/55 p-3 text-left transition-colors hover:bg-white/75"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark text-white">
              <UserRound className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-wider text-brand-dark">{t('platform.auth.quickLoginTitle')}</span>
              <span className="block truncate text-sm text-brand-slate">
                {t('platform.auth.quickLoginHint', { name: rememberedAccountName(rememberedAccount) })}
              </span>
            </span>
            <span className="rounded-xl bg-brand-dark px-3 py-2 text-xs font-semibold text-white">{t('platform.auth.quickLoginAction')}</span>
          </button>
        )}
        {mode === 'register' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t('platform.fields.firstName')} value={String(form.firstName || '')} onChange={(value) => update('firstName', value)} />
            <Input label={t('platform.fields.lastName')} value={String(form.lastName || '')} onChange={(value) => update('lastName', value)} />
            <Input label={t('platform.fields.country')} value={String(form.country || '')} onChange={(value) => update('country', value)} />
            <Input label={t('platform.fields.city')} value={String(form.city || '')} onChange={(value) => update('city', value)} />
            <Input type="date" label={t('platform.fields.dateOfBirth')} value={String(form.dateOfBirth || '')} onChange={(value) => update('dateOfBirth', value)} />
            <Input label={t('platform.fields.schoolGrade')} value={String(form.schoolGrade || '')} onChange={(value) => update('schoolGrade', value)} />
          </div>
        )}
        {mode !== 'reset' && <Input type="email" label={t('platform.fields.email')} value={String(form.email || '')} onChange={(value) => update('email', value)} />}
        {mode !== 'forgot' && (
          <>
            {mode === 'reset' && <Input label={t('platform.fields.resetToken')} value={String(form.token || '')} onChange={(value) => update('token', value)} />}
            <Input type="password" label={t('platform.fields.password')} value={String(form.password || '')} onChange={(value) => update('password', value)} />
            {(mode === 'register' || mode === 'reset') && (
              <Input type="password" label={t('platform.fields.passwordConfirmation')} value={String(form.passwordConfirmation || '')} onChange={(value) => update('passwordConfirmation', value)} />
            )}
          </>
        )}
        {mode === 'register' && (
          <div className="grid gap-2 text-xs text-brand-slate">
            <Checkbox label={t('platform.auth.privacyAccepted')} checked={Boolean(form.privacyAccepted)} onChange={(value) => update('privacyAccepted', value)} />
            <Checkbox label={t('platform.auth.termsAccepted')} checked={Boolean(form.termsAccepted)} onChange={(value) => update('termsAccepted', value)} />
          </div>
        )}
        <button disabled={state === 'loading'} className="min-h-12 rounded-xl bg-brand-dark px-5 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-60">
          {state === 'loading' ? t('platform.states.saving') : t(`platform.auth.${mode}Action`)}
        </button>
        {message && <div className={`rounded-xl px-4 py-3 text-sm ${state === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{message}</div>}
      </form>
      <div className="flex flex-wrap gap-3 text-xs font-semibold text-brand-slate">
        <button type="button" onClick={() => navigate('/forgot-password')}>{t('platform.auth.forgotTitle')}</button>
      </div>
    </section>
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

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-brand-dark/70">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="rounded-xl border border-[#d8d1cc] bg-white/70 px-3 py-2 text-sm normal-case tracking-normal text-brand-dark outline-none focus:border-[#bc4638]" />
    </label>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#bc4638]" />
      <span>{label}</span>
    </label>
  );
}

function Dashboard({ user, onUser }: { user: PlatformUser; onUser: (user: PlatformUser | null) => void }) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [route, setRoute] = useState(getRoute);
  useEffect(() => {
    const sync = () => setRoute(getRoute());
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const active = route.path.split('/')[2] || 'overview';
  const panelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.32, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };
const panel = (() => {
    if (route.path === '/profile') return <DashboardHome user={user} />;
    if (route.path === '/profile/profile') return <ProfileEditor user={user} onUser={onUser} />;
    if (route.path === '/profile/applications') return <ApplicationsPanel user={user} />;
    if (route.path === '/profile/favorites') return <FavoritesPanel />;
    if (route.path === '/profile/notifications') return <NotificationsPanel />;
    if (route.path === '/profile/team') return <TeamPanel />;
    if (route.path === '/profile/blog') return <MyBlogPosts user={user} />;
    if (route.path === '/profile/blog/new') return <BlogEditor user={user} onDone={() => navigate('/profile/blog')} />;
    const blogEditMatch = route.path.match(/^\/profile\/blog\/(.+)\/edit$/);
    if (blogEditMatch) {
      return <BlogEditorWithLoader user={user} postId={blogEditMatch[1]} onDone={() => navigate('/profile/blog')} />;
    }
    if (route.path === '/profile/settings') return <ProfileEditor user={user} onUser={onUser} settingsOnly />;
    return <DashboardHome user={user} />;
  })();

  return (
    <section className="grid gap-6 lg:grid-cols-[250px_1fr]">
      <aside className="rounded-3xl border border-white/60 bg-white/45 p-4 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <UserAvatar user={user} />
          <div>
            <div className="text-sm font-semibold text-brand-dark">{userDisplayName(user)}</div>
            <div className="text-xs text-brand-slate">{t(`platform.roles.${user.role}`)}</div>
          </div>
        </div>
        <nav className="grid gap-1">
          {PROFILE_TABS.map(([key, path]) => (
            <button key={key} type="button" onClick={() => navigate(path)} className={`relative overflow-hidden rounded-xl px-3 py-2 text-left text-sm transition-colors ${active === key ? 'text-white' : 'text-brand-slate hover:bg-white/60'}`}>
              {active === key && (
                <motion.span
                  layoutId="profile-active-tab"
                  className="absolute inset-0 rounded-xl bg-brand-dark"
                  transition={panelTransition}
                />
              )}
              <span className="relative z-10">{t(`platform.dashboard.${key}`)}</span>
            </button>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 overflow-hidden rounded-3xl border border-white/60 bg-white/45 p-5 backdrop-blur-xl">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={route.path}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.985, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -12, scale: 0.992, filter: 'blur(4px)' }}
            transition={panelTransition}
          >
            {panel}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function BlogEditorWithLoader({ user, postId, onDone }: { user: PlatformUser; postId: string; onDone: () => void }) {
  const [post, setPost] = useState<BlogPostDoc | undefined>(undefined);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    setState('loading');
    blogApi.list({ id: postId }).then((result) => {
      setPost(result.docs.find((doc) => doc.id === postId));
      setState('success');
    }).catch(() => setState('error'));
  }, [postId]);

  if (state === 'loading') return <StateBlock state="loading"><div /></StateBlock>;
  if (state === 'error' || !post) return <StateBlock state="error"><div /></StateBlock>;
  return <BlogEditor user={user} post={post} onDone={onDone} />;
}

function DashboardHome({ user }: { user: PlatformUser }) {
  const { t } = useTranslation();
  const [state, setState] = useState<LoadState>('loading');
  const [applications, setApplications] = useState<PlatformApplication[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [teamPosts, setTeamPosts] = useState<CatalogDoc[]>([]);
  const [teamResponses, setTeamResponses] = useState<CatalogDoc[]>([]);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    Promise.all([
      platformApi.applications(),
      platformApi.favorites(),
      platformApi.notifications(),
      platformApi.teamDashboard(),
    ]).then(([apps, favs, notes, team]) => {
      if (cancelled) return;
      setApplications(apps.docs);
      setFavorites(favs.docs);
      setNotifications(notes.docs);
      setTeamPosts(team.posts);
      setTeamResponses(team.responses);
      setState('success');
    }).catch(() => {
      if (!cancelled) setState('error');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const profileFields = [
    user.firstName,
    user.lastName,
    user.country,
    user.city,
    user.school,
    user.schoolGrade,
    user.biography,
    user.portfolio,
    user.avatarUrl,
    user.interests.length ? 'interests' : '',
    user.skills.length ? 'skills' : '',
    user.languages.length ? 'languages' : '',
  ];
  const completedFields = profileFields.filter(Boolean).length;
  const completion = Math.round((completedFields / profileFields.length) * 100);
  const unread = notifications.filter((item) => !item.readAt).length;
  const activeApplications = applications.filter((item) => !['cancelled', 'rejected'].includes(item.status)).length;

  const statCards = [
    { key: 'applications', value: applications.length, href: '/profile/applications' },
    { key: 'favorites', value: favorites.length, href: '/profile/favorites' },
    { key: 'notifications', value: unread, href: '/profile/notifications' },
    { key: 'team', value: teamPosts.length + teamResponses.length, href: '/profile/team' },
  ] as const;

  const latestItems = [
    ...applications.slice(0, 2).map((item) => ({
      id: `app-${item.id}`,
      title: item.itemTitle || item.ticketId,
      meta: t(statusKey(item.status)),
      href: '/profile/applications',
    })),
    ...favorites.slice(0, 2).map((item) => ({
      id: `fav-${item.id}`,
      title: item.itemTitle,
      meta: t(`platform.itemTypes.${item.itemType}`),
      href: item.href || '/profile/favorites',
    })),
    ...notifications.slice(0, 2).map((item) => ({
      id: `note-${item.id}`,
      title: t(`platform.notifications.${item.type}`),
      meta: item.createdAt ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(item.createdAt)) : '',
      href: item.href || '/profile/notifications',
    })),
  ].slice(0, 5);

  return (
    <div className="grid gap-5">
      <div className="rounded-3xl border border-white/60 bg-gradient-to-br from-white/55 via-white/35 to-[#bc4638]/5 p-5 shadow-[0_22px_70px_rgba(91,100,114,0.10)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#bc4638]">{t('platform.dashboardHome.eyebrow')}</p>
            <h1 className="mt-2 font-serif text-3xl text-brand-dark">{t('platform.dashboardHome.title', { name: user.firstName || user.email.split('@')[0] })}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-slate">{t('platform.dashboardHome.description')}</p>
          </div>
          <div className="min-w-[180px] rounded-2xl border border-white/60 bg-white/45 p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-brand-slate">
              <span>{t('platform.dashboardHome.profileCompletion')}</span>
              <span className="text-brand-dark">{completion}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
              <div className="h-full rounded-full bg-gradient-to-r from-[#bc4638] to-[#bd5b82]" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </div>
      </div>

      <StateBlock state={state}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((item) => (
            <button key={item.key} type="button" onClick={() => navigate(item.href)} className="rounded-2xl border border-white/60 bg-white/45 p-4 text-left transition-colors hover:bg-white/65">
              <div className="text-3xl font-semibold text-brand-dark">{item.value}</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-brand-slate">{t(`platform.dashboardHome.stats.${item.key}`)}</div>
            </button>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/60 bg-white/45 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionTitle icon={<CheckCircle2 className="h-5 w-5" />} title={t('platform.dashboardHome.activity')} />
              <span className="rounded-full bg-white/60 px-3 py-1 text-xs text-brand-slate">{t('platform.dashboardHome.activeApplications', { count: activeApplications })}</span>
            </div>
            {latestItems.length ? (
              <div className="mt-4 grid gap-3">
                {latestItems.map((item) => (
                  <button key={item.id} type="button" onClick={() => navigate(item.href)} className="rounded-2xl border border-white/60 bg-white/45 p-4 text-left transition-colors hover:bg-white/70">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#bc4638]">{item.meta}</div>
                    <div className="mt-1 font-serif text-xl text-brand-dark">{item.title}</div>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyAction text={t('platform.dashboardHome.emptyActivity')} action={t('platform.dashboardHome.explore')} href="/championships" />
            )}
          </div>

          <div className="grid gap-3">
            <QuickAction title={t('platform.dashboardHome.actions.completeProfile')} text={t('platform.dashboardHome.actions.completeProfileText')} href="/profile/profile" />
            <QuickAction title={t('platform.dashboardHome.actions.findOpportunity')} text={t('platform.dashboardHome.actions.findOpportunityText')} href="/activities/opportunities" />
            <QuickAction title={t('platform.dashboardHome.actions.findTeam')} text={t('platform.dashboardHome.actions.findTeamText')} href="/participants" />
          </div>
        </div>
      </StateBlock>
    </div>
  );
}

function EmptyAction({ text, action, href }: { text: string; action: string; href: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-white/60 bg-white/35 p-5 text-sm text-brand-slate">
      <p>{text}</p>
      <button type="button" onClick={() => navigate(href)} className="mt-4 rounded-xl bg-brand-dark px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white">
        {action}
      </button>
    </div>
  );
}

function QuickAction({ title, text, href }: { title: string; text: string; href: string }) {
  return (
    <button type="button" onClick={() => navigate(href)} className="rounded-3xl border border-white/60 bg-white/45 p-5 text-left transition-colors hover:bg-white/65">
      <div className="font-serif text-xl text-brand-dark">{title}</div>
      <p className="mt-2 text-sm leading-relaxed text-brand-slate">{text}</p>
    </button>
  );
}

function AvatarEditor({
  user,
  onUploaded,
}: {
  user: PlatformUser;
  onUploaded: (user: PlatformUser) => void;
}) {
  const { t } = useTranslation();
  const [state, setState] = useState<LoadState>('idle');
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState<{ file: File; url: string } | null>(null);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const frameSize = 320;
  const outputSize = 512;
  const isRotated = rotation % 180 !== 0;
  const rotatedWidth = isRotated ? imageSize.height : imageSize.width;
  const rotatedHeight = isRotated ? imageSize.width : imageSize.height;
  const baseScale = Math.max(frameSize / rotatedWidth, frameSize / rotatedHeight);
  const renderedWidth = rotatedWidth * baseScale * scale;
  const renderedHeight = rotatedHeight * baseScale * scale;
  const maxOffsetX = Math.max(0, (renderedWidth - frameSize) / 2);
  const maxOffsetY = Math.max(0, (renderedHeight - frameSize) / 2);
  const clampOffset = (value: { x: number; y: number }) => ({
    x: Math.min(maxOffsetX, Math.max(-maxOffsetX, value.x)),
    y: Math.min(maxOffsetY, Math.max(-maxOffsetY, value.y)),
  });

  useEffect(() => {
    return () => {
      if (draft) URL.revokeObjectURL(draft.url);
    };
  }, [draft]);

  useEffect(() => {
    setOffset((current) => clampOffset(current));
  }, [maxOffsetX, maxOffsetY]);

  const closeCropper = () => {
    if (draft) URL.revokeObjectURL(draft.url);
    setDraft(null);
    setOffset({ x: 0, y: 0 });
    setScale(1);
    setRotation(0);
  };

  const openCropper = (file?: File) => {
    if (!file) return;
    if (draft) URL.revokeObjectURL(draft.url);
    setDraft({ file, url: URL.createObjectURL(file) });
    setImageSize({ width: 1, height: 1 });
    setOffset({ x: 0, y: 0 });
    setScale(1);
    setRotation(0);
    setMessage('');
  };

  const upload = async (file: File) => {
    if (!file) return;
    setState('loading');
    setMessage('');
    try {
      const result = await platformApi.uploadAvatar(file);
      onUploaded(result.user);
      setState('success');
      setMessage(t('platform.avatar.uploaded'));
      closeCropper();
    } catch (error) {
      setState('error');
      setMessage(t(`platform.errors.${(error as Error).name}`, { defaultValue: t('platform.avatar.uploadError') }));
    }
  };

  const saveCrop = async () => {
    const image = imageRef.current;
    if (!image || !draft) return;
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const context = canvas.getContext('2d');
    if (!context) return;

    const ratio = outputSize / frameSize;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, outputSize, outputSize);
    context.translate(outputSize / 2 + offset.x * ratio, outputSize / 2 + offset.y * ratio);
    context.rotate((rotation * Math.PI) / 180);
    context.scale(baseScale * scale * ratio, baseScale * scale * ratio);
    context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
    if (!blob) return;
    const croppedFile = new File([blob], draft.file.name.replace(/\.[^.]+$/, '') + '-avatar.png', { type: 'image/png' });
    await upload(croppedFile);
  };

  const zoom = (delta: number) => {
    setScale((current) => Math.min(3, Math.max(1, Number((current + delta).toFixed(2)))));
  };

  return (
    <div className="grid content-start gap-3">
      <div className="grid gap-3">
        <UserAvatar user={user} className="h-40 w-40 rounded-3xl text-3xl" />
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-dark px-4 text-xs font-semibold uppercase tracking-wider text-white">
          <Upload className="h-4 w-4" />
          <span>{state === 'loading' ? t('platform.avatar.uploading') : t('platform.avatar.upload')}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={state === 'loading'}
            onChange={(event) => {
              openCropper(event.target.files?.[0]);
              event.currentTarget.value = '';
            }}
          />
        </label>
      </div>
      {message && <Result ok={state === 'success'} text={message} />}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {draft && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-dark/30 backdrop-blur-md"
              onClick={state === 'loading' ? undefined : closeCropper}
            />
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 grid w-full max-w-2xl gap-5 rounded-3xl border border-white/65 bg-white/75 p-5 shadow-[0_35px_120px_rgba(27,24,22,0.18)] backdrop-blur-2xl sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-label={t('platform.avatar.cropTitle')}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl text-brand-dark">{t('platform.avatar.cropTitle')}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-brand-slate">{t('platform.avatar.cropText')}</p>
                </div>
                <button type="button" onClick={closeCropper} disabled={state === 'loading'} className="rounded-full p-2 text-brand-dark hover:bg-white/70 disabled:opacity-60" aria-label={t('common.close')}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div
                className="relative mx-auto aspect-square w-full max-w-[320px] touch-none overflow-hidden rounded-full bg-brand-dark shadow-[inset_0_0_0_999px_rgba(17,17,17,0.08),0_18px_70px_rgba(17,17,17,0.18)]"
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: offset.x, originY: offset.y };
                }}
                onPointerMove={(event) => {
                  const drag = dragRef.current;
                  if (!drag || drag.pointerId !== event.pointerId) return;
                  setOffset(clampOffset({ x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY }));
                }}
                onPointerUp={() => {
                  dragRef.current = null;
                }}
                onPointerCancel={() => {
                  dragRef.current = null;
                }}
                onWheel={(event) => {
                  event.preventDefault();
                  zoom(event.deltaY > 0 ? -0.08 : 0.08);
                }}
              >
                <img
                  ref={imageRef}
                  src={draft.url}
                  alt=""
                  draggable={false}
                  onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
                  className="absolute left-1/2 top-1/2 max-w-none select-none"
                  style={{
                    width: `${imageSize.width * baseScale * scale}px`,
                    height: `${imageSize.height * baseScale * scale}px`,
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) rotate(${rotation}deg)`,
                  }}
                />
                <div className="pointer-events-none absolute inset-0 rounded-full ring-4 ring-white/90 ring-offset-2 ring-offset-white/60" />
                <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/20" />
                <div className="pointer-events-none absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/20" />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button type="button" onClick={() => zoom(-0.12)} disabled={scale <= 1 || state === 'loading'} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#d8d1cc] bg-white/70 text-brand-dark disabled:opacity-50" aria-label={t('platform.avatar.zoomOut')}>
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => zoom(0.12)} disabled={scale >= 3 || state === 'loading'} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#d8d1cc] bg-white/70 text-brand-dark disabled:opacity-50" aria-label={t('platform.avatar.zoomIn')}>
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setRotation((current) => (current + 90) % 360)} disabled={state === 'loading'} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#d8d1cc] bg-white/70 text-brand-dark disabled:opacity-50" aria-label={t('platform.avatar.rotate')}>
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => { setOffset({ x: 0, y: 0 }); setScale(1); setRotation(0); }} disabled={state === 'loading'} className="min-h-11 rounded-xl border border-[#d8d1cc] bg-white/70 px-4 text-xs font-semibold uppercase tracking-wider text-brand-slate disabled:opacity-50">
                  {t('platform.avatar.reset')}
                </button>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={closeCropper} disabled={state === 'loading'} className="min-h-12 flex-1 rounded-xl border border-[#d8d1cc] bg-white/70 px-5 text-xs font-semibold uppercase tracking-wider text-brand-slate disabled:opacity-60">
                  {t('common.cancel')}
                </button>
                <button type="button" onClick={() => void saveCrop()} disabled={state === 'loading'} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-dark px-5 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-60">
                  <Check className="h-4 w-4" />
                  {state === 'loading' ? t('platform.avatar.uploading') : t('platform.avatar.saveCrop')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </div>
  );
}

type ProfileFormState = PlatformUser & {
  interestsText: string;
  skillsText: string;
  languagesText: string;
};

const createProfileFormState = (user: PlatformUser): ProfileFormState => ({
  ...user,
  interestsText: user.interests.join(', '),
  skillsText: user.skills.join(', '),
  languagesText: user.languages.join(', '),
  preferredLanguageMode: user.preferredLanguageMode || 'auto',
});

const createProfileSettingsPayload = (form: ProfileFormState) => {
  const identity = {
    firstName: form.firstName || '',
    lastName: form.lastName || '',
    name: [form.firstName, form.lastName].filter(Boolean).join(' ') || form.name || '',
    email: form.email,
  };
  const details = {
    country: form.country || '',
    city: form.city || '',
    dateOfBirth: form.dateOfBirth || '',
    ageGroup: form.ageGroup || '',
    school: form.school || '',
    schoolGrade: form.schoolGrade || '',
    biography: form.biography || '',
    portfolio: form.portfolio || '',
  };
  const lists = {
    interests: textList(form.interestsText),
    skills: textList(form.skillsText),
    languages: textList(form.languagesText),
  };
  const avatar = {
    avatarUrl: form.avatarUrl,
    avatarAlt: form.avatarAlt,
    avatarPositionX: form.avatarPositionX,
    avatarPositionY: form.avatarPositionY,
    avatarScale: form.avatarScale,
  };
  const visibility = {
    publicProfile: Boolean(form.publicProfile),
    teamSearchAvailable: Boolean(form.teamSearchAvailable),
    privacy: {
      showCity: Boolean(form.privacy?.showCity),
      showSchool: Boolean(form.privacy?.showSchool),
      showAge: Boolean(form.privacy?.showAge),
      showEmail: Boolean(form.privacy?.showEmail),
      showSocialLinks: Boolean(form.privacy?.showSocialLinks),
    },
  };
  const preferences = {
    preferredLanguage: form.preferredLanguage,
    preferredLanguageMode: form.preferredLanguageMode || 'auto',
  };

  return {
    profileSettings: {
      identity,
      details,
      lists,
      avatar,
      visibility,
      preferences,
      socialLinks: form.socialLinks,
    },
    ...identity,
    ...details,
    ...lists,
    ...avatar,
    ...visibility,
    ...preferences,
    socialLinks: form.socialLinks,
  };
};

function ProfileEditor({ user, onUser, settingsOnly = false }: { user: PlatformUser; onUser: (user: PlatformUser | null) => void; settingsOnly?: boolean }) {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState<ProfileFormState>(() => createProfileFormState(user));
  const [state, setState] = useState<LoadState>('idle');
  const [accountState, setAccountState] = useState<LoadState>('idle');
  const [accountMessage, setAccountMessage] = useState('');
  const skipAutoSaveRef = useRef(true);
  const saveRequestRef = useRef(0);

  const saveProfileSettings = async (nextForm: ProfileFormState) => {
    const requestId = saveRequestRef.current + 1;
    saveRequestRef.current = requestId;
    setState('loading');
    try {
      const result = await platformApi.updateProfile(createProfileSettingsPayload(nextForm));
      if (saveRequestRef.current === requestId) {
        onUser(result.user);
        setState('success');
      }
    } catch {
      if (saveRequestRef.current === requestId) setState('error');
    }
  };

  const update = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const syncUser = (updated: PlatformUser) => {
    onUser(updated);
    skipAutoSaveRef.current = true;
    setForm(createProfileFormState(updated));
  };

  useEffect(() => {
    if (skipAutoSaveRef.current) {
      skipAutoSaveRef.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveProfileSettings(form);
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [form]);

  const syncLogout = () => {
    onUser(null);
    window.dispatchEvent(new CustomEvent('platform-auth-change', { detail: { user: null } }));
    navigate('/');
  };
  const logout = async () => {
    setAccountState('loading');
    setAccountMessage('');
    await platformApi.logout().catch(() => undefined);
    setAccountState('idle');
    syncLogout();
  };
  const deleteAccount = async () => {
    const confirmed = window.confirm(t('platform.settings.deleteConfirm'));
    if (!confirmed) return;
    setAccountState('loading');
    setAccountMessage('');
    try {
      await platformApi.deleteProfile();
      setAccountState('idle');
      syncLogout();
    } catch (error) {
      setAccountState('error');
      setAccountMessage(t(`platform.errors.${(error as Error).name}`, { defaultValue: t('platform.settings.deleteError') }));
    }
  };
  const resolvedLanguage = (i18n.resolvedLanguage || i18n.language || 'ru').split('-')[0];
  const currentLanguage = isSupportedLanguage(resolvedLanguage) ? resolvedLanguage : 'ru';
  const isAutoLanguage = !getSavedPreferredLanguage();
  const autoLanguage = detectSupportedLanguageFromBrowser();
  const changeToAutoLanguage = () => {
    const language = detectSupportedLanguageFromBrowser();
    clearPreferredLanguage();
    void i18n.changeLanguage(language);
    setForm((current) => ({
      ...current,
      preferredLanguage: language,
      preferredLanguageMode: 'auto',
    }));
  };
  const changeLanguage = (language: SupportedLanguage) => {
    savePreferredLanguage(language);
    void i18n.changeLanguage(language);
    setForm((current) => ({
      ...current,
      preferredLanguage: language,
      preferredLanguageMode: 'manual',
    }));
  };

  return (
    <form onSubmit={(event) => event.preventDefault()} className="grid gap-5">
      <SectionTitle icon={<UserRound className="h-5 w-5" />} title={settingsOnly ? t('platform.dashboard.settings') : t('platform.dashboard.profile')} />
      {!settingsOnly && (
        <>
          <div className="grid gap-4 rounded-2xl border border-white/60 bg-white/45 p-4 md:grid-cols-[180px_minmax(0,1fr)]">
            <AvatarEditor user={form} onUploaded={syncUser} />
            <div className="grid content-start gap-4 sm:grid-cols-2">
              <Input label={t('platform.fields.firstName')} value={form.firstName || ''} onChange={(value) => update('firstName', value)} />
              <Input label={t('platform.fields.lastName')} value={form.lastName || ''} onChange={(value) => update('lastName', value)} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label={t('platform.fields.country')} value={form.country || ''} onChange={(value) => update('country', value)} />
            <Input label={t('platform.fields.city')} value={form.city || ''} onChange={(value) => update('city', value)} />
            <Input label={t('platform.fields.school')} value={form.school || ''} onChange={(value) => update('school', value)} />
            <Input label={t('platform.fields.schoolGrade')} value={form.schoolGrade || ''} onChange={(value) => update('schoolGrade', value)} />
            <Input label={t('platform.fields.ageGroup')} value={form.ageGroup || ''} onChange={(value) => update('ageGroup', value)} />
            <Input label={t('platform.fields.portfolio')} value={form.portfolio || ''} onChange={(value) => update('portfolio', value)} />
            <Input label={t('platform.fields.interests')} value={form.interestsText} onChange={(value) => update('interestsText', value)} />
            <Input label={t('platform.fields.skills')} value={form.skillsText} onChange={(value) => update('skillsText', value)} />
            <Input label={t('platform.fields.languages')} value={form.languagesText} onChange={(value) => update('languagesText', value)} />
            <Textarea label={t('platform.fields.biography')} value={form.biography || ''} onChange={(value) => update('biography', value)} />
          </div>
        </>
      )}
      <div className="grid gap-3 rounded-2xl border border-white/60 bg-white/45 p-4 text-sm text-brand-slate">
        <Checkbox label={t('platform.privacy.publicProfile')} checked={Boolean(form.publicProfile)} onChange={(value) => update('publicProfile', value)} />
        <Checkbox label={t('platform.privacy.teamSearchAvailable')} checked={Boolean(form.teamSearchAvailable)} onChange={(value) => update('teamSearchAvailable', value)} />
        {(['showCity', 'showSchool', 'showAge', 'showEmail', 'showSocialLinks'] as const).map((key) => (
          <Checkbox key={key} label={t(`platform.privacy.${key}`)} checked={Boolean(form.privacy?.[key])} onChange={(value) => update('privacy', { ...form.privacy, [key]: value })} />
        ))}
      </div>
      {state === 'loading' && <Result ok text={t('platform.states.saving')} />}
      {state === 'success' && <Result ok text={t('platform.states.saved')} />}
      {state === 'error' && <Result text={t('platform.states.error')} />}
      {settingsOnly && (
        <>
          <section className="grid gap-4 rounded-2xl border border-white/60 bg-white/45 p-4">
            <div>
              <h2 className="text-sm font-semibold text-brand-dark">{t('platform.settings.languageTitle')}</h2>
              <p className="mt-1 text-sm leading-relaxed text-brand-slate">{t('platform.settings.languageText')}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <button
                type="button"
                onClick={changeToAutoLanguage}
                className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border px-3 text-left text-sm transition-colors ${
                  isAutoLanguage
                    ? 'border-brand-dark bg-brand-dark text-white'
                    : 'border-[#d8d1cc] bg-white/70 text-brand-slate hover:bg-white'
                }`}
                aria-pressed={isAutoLanguage}
              >
                <span className="flex items-center gap-2">
                  <span>{LANGUAGE_FLAGS[autoLanguage]}</span>
                  <span>{t('languages.auto')}</span>
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider">{autoLanguage}</span>
              </button>
              {SUPPORTED_LANGUAGES.map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => changeLanguage(language)}
                  className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border px-3 text-left text-sm transition-colors ${
                    currentLanguage === language
                      ? 'border-brand-dark bg-brand-dark text-white'
                      : 'border-[#d8d1cc] bg-white/70 text-brand-slate hover:bg-white'
                  }`}
                  aria-pressed={currentLanguage === language}
                >
                  <span className="flex items-center gap-2">
                    <span>{LANGUAGE_FLAGS[language]}</span>
                    <span>{t(`languages.${language}`)}</span>
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider">{language}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="grid gap-4 rounded-2xl border border-red-200/70 bg-red-50/70 p-4">
            <div>
              <h2 className="text-sm font-semibold text-red-800">{t('platform.settings.accountTitle')}</h2>
              <p className="mt-1 text-sm leading-relaxed text-red-700/80">
                {t('platform.settings.accountText')}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={logout}
                disabled={accountState === 'loading'}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white/80 px-5 text-xs font-semibold uppercase tracking-wider text-red-700 transition-colors hover:bg-white disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {t('platform.actions.logout')}
              </button>
              <button
                type="button"
                onClick={deleteAccount}
                disabled={accountState === 'loading'}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-red-800 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {accountState === 'loading' ? t('platform.states.saving') : t('platform.settings.deleteAccount')}
              </button>
            </div>
            {accountMessage && <Result text={accountMessage} />}
          </section>
        </>
      )}
    </form>
  );
}

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

function ApplicationsPanel({ user }: { user: PlatformUser }) {
  const { t } = useTranslation();
  const [docs, setDocs] = useState<PlatformApplication[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [form, setForm] = useState({ itemType: 'championship', itemId: '', itemTitle: '', motivation: '' });

  const load = async () => {
    setState('loading');
    try {
      const result = await platformApi.applications();
      setDocs(result.docs);
      setState('success');
    } catch {
      setState('error');
    }
  };

  useEffect(() => { void load(); }, []);

  const submit = async (status: 'draft' | 'submitted') => {
    setState('loading');
    try {
      await platformApi.createApplication({ ...form, status, name: [user.firstName, user.lastName].filter(Boolean).join(' '), email: user.email });
      setForm({ itemType: 'championship', itemId: '', itemTitle: '', motivation: '' });
      await load();
    } catch {
      setState('error');
    }
  };

  return (
    <div className="grid gap-5">
      <SectionTitle icon={<CheckCircle2 className="h-5 w-5" />} title={t('platform.dashboard.applications')} />
      <div className="grid gap-3 rounded-2xl border border-white/60 bg-white/45 p-4">
        <select value={form.itemType} onChange={(event) => setForm({ ...form, itemType: event.target.value })} className="min-h-11 rounded-xl border border-[#d8d1cc] bg-white/70 px-3 text-sm">
          {['championship', 'event', 'opportunity'].map((type) => <option key={type} value={type}>{t(`platform.itemTypes.${type}`)}</option>)}
        </select>
        <Input label={t('platform.fields.itemId')} value={form.itemId} onChange={(value) => setForm({ ...form, itemId: value })} />
        <Input label={t('platform.fields.itemTitle')} value={form.itemTitle} onChange={(value) => setForm({ ...form, itemTitle: value })} />
        <Textarea label={t('platform.fields.motivation')} value={form.motivation} onChange={(value) => setForm({ ...form, motivation: value })} />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => submit('draft')} className="rounded-xl border border-[#d8d1cc] px-4 py-3 text-xs font-semibold text-brand-slate">{t('platform.actions.saveDraft')}</button>
          <button type="button" onClick={() => submit('submitted')} className="rounded-xl bg-brand-dark px-4 py-3 text-xs font-semibold text-white">{t('platform.actions.submit')}</button>
        </div>
      </div>
      <StateBlock state={state} empty={docs.length === 0}>
        <CardList items={docs.map((doc) => ({
          id: String(doc.id),
          title: doc.itemTitle || doc.ticketId,
          meta: t(statusKey(doc.status)),
          description: doc.adminComment || doc.ticketId,
        }))} />
      </StateBlock>
    </div>
  );
}

function FavoritesPanel() {
  const { t } = useTranslation();
  const [type, setType] = useState('all');
  const [docs, setDocs] = useState<FavoriteItem[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  const load = () => {
    setState('loading');
    platformApi.favorites(type).then((result) => {
      setDocs(result.docs);
      setState('success');
    }).catch(() => setState('error'));
  };

  useEffect(() => {
    load();
  }, [type]);

  const remove = async (id: string | number) => {
    setState('loading');
    try {
      await platformApi.removeFavorite(id);
      await platformApi.favorites(type).then((result) => setDocs(result.docs));
      setState('success');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="grid gap-5">
      <SectionTitle icon={<Bookmark className="h-5 w-5" />} title={t('platform.dashboard.favorites')} />
      <select value={type} onChange={(event) => setType(event.target.value)} className="min-h-11 max-w-xs rounded-xl border border-[#d8d1cc] bg-white/70 px-3 text-sm">
        {['all', 'championship', 'event', 'opportunity', 'participant', 'team-post'].map((item) => <option key={item} value={item}>{t(`platform.itemTypes.${item}`)}</option>)}
      </select>
      <StateBlock state={state} empty={docs.length === 0}>
        <div className="grid gap-3 md:grid-cols-2">
          {docs.map((doc) => (
            <article key={String(doc.id)} className="rounded-2xl border border-white/60 bg-white/45 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#bc4638]">{t(`platform.itemTypes.${doc.itemType}`)}</div>
              <h3 className="mt-1 font-serif text-xl text-brand-dark">{doc.itemTitle}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => navigate(doc.href || '/')} className="rounded-xl bg-brand-dark px-4 py-2 text-xs font-semibold text-white">{t('platform.actions.open')}</button>
                <button type="button" onClick={() => remove(doc.id)} className="rounded-xl border border-[#d8d1cc] px-4 py-2 text-xs font-semibold text-brand-slate">{t('platform.actions.remove')}</button>
              </div>
            </article>
          ))}
        </div>
      </StateBlock>
    </div>
  );
}

function NotificationsPanel() {
  const { t } = useTranslation();
  const [docs, setDocs] = useState<NotificationItem[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  const load = async () => {
    setState('loading');
    try {
      const result = await platformApi.notifications();
      setDocs(result.docs);
      setState('success');
    } catch {
      setState('error');
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle icon={<Bell className="h-5 w-5" />} title={t('platform.dashboard.notifications')} />
        <button type="button" onClick={() => platformApi.markAllNotificationsRead().then(load)} className="rounded-xl bg-brand-dark px-4 py-3 text-xs font-semibold text-white">{t('platform.actions.markAllRead')}</button>
      </div>
      <StateBlock state={state} empty={docs.length === 0}>
        <div className="grid gap-3">
          {docs.map((doc) => (
            <button key={String(doc.id)} type="button" onClick={() => platformApi.markNotificationRead(doc.id).then(load)} className={`rounded-2xl border p-4 text-left ${doc.readAt ? 'border-white/60 bg-white/35' : 'border-[#bc4638]/25 bg-[#bc4638]/10'}`}>
              <div className="text-sm font-semibold text-brand-dark">{t(`platform.notifications.${doc.type}`)}</div>
              <div className="text-xs text-brand-slate">{doc.createdAt ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(doc.createdAt)) : ''}</div>
            </button>
          ))}
        </div>
      </StateBlock>
    </div>
  );
}

function TeamPanel() {
  const { t } = useTranslation();
  const [state, setState] = useState<LoadState>('loading');
  const [posts, setPosts] = useState<CatalogDoc[]>([]);
  const [responses, setResponses] = useState<CatalogDoc[]>([]);
  const [form, setForm] = useState({ title: '', description: '', requiredSkills: '', interests: '', status: 'published' });

  const load = async () => {
    setState('loading');
    try {
      const result = await platformApi.teamDashboard();
      setPosts(result.posts);
      setResponses(result.responses);
      setState('success');
    } catch {
      setState('error');
    }
  };

  useEffect(() => { void load(); }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setState('loading');
    try {
      await platformApi.createTeamPost({
        ...form,
        requiredSkills: textList(form.requiredSkills),
        interests: textList(form.interests),
      });
      setForm({ title: '', description: '', requiredSkills: '', interests: '', status: 'published' });
      await load();
    } catch {
      setState('error');
    }
  };

  return (
    <div className="grid gap-5">
      <SectionTitle icon={<UsersRound className="h-5 w-5" />} title={t('platform.dashboard.team')} />
      <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-white/60 bg-white/45 p-4">
        <Input label={t('platform.fields.title')} value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
        <Textarea label={t('platform.fields.description')} value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
        <Input label={t('platform.fields.requiredSkills')} value={form.requiredSkills} onChange={(value) => setForm({ ...form, requiredSkills: value })} />
        <Input label={t('platform.fields.interests')} value={form.interests} onChange={(value) => setForm({ ...form, interests: value })} />
        <button className="min-h-12 rounded-xl bg-brand-dark px-5 text-xs font-semibold uppercase tracking-wider text-white">{t('platform.actions.publish')}</button>
      </form>
      <StateBlock state={state} empty={posts.length === 0 && responses.length === 0}>
        <CardList items={[
          ...posts.map((post) => ({ id: String(post.id), title: post.title, meta: t('platform.team.myPost'), description: post.description || post.shortDescription })),
          ...responses.map((response) => ({ id: String(response.id), title: t('platform.team.response'), meta: response.status, description: response.message })),
        ]} />
      </StateBlock>
    </div>
  );
}

function CardList({ items }: { items: Array<{ id: string; title?: string; meta?: string; description?: string; href?: string }> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-white/60 bg-white/45 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#bc4638]">{item.meta}</div>
          <h3 className="mt-1 font-serif text-xl text-brand-dark">{item.title}</h3>
          {item.description && <p className="mt-2 text-sm text-brand-slate">{item.description}</p>}
          {item.href && <button type="button" onClick={() => navigate(item.href || '/')} className="mt-3 text-xs font-semibold text-[#bc4638]">{item.href}</button>}
        </article>
      ))}
    </div>
  );
}

function ParticipantsView({ user }: { user?: PlatformUser | null }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(new URLSearchParams(window.location.search).get('q') || '');
  const [docs, setDocs] = useState<Participant[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = query ? `?q=${encodeURIComponent(query)}` : '';
      window.history.replaceState({}, '', `/participants${params}`);
      setState('loading');
      platformApi.participants(params).then((result) => {
        setDocs(result.docs);
        setState('success');
      }).catch(() => setState('error'));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <section className="grid gap-5">
      <SectionTitle icon={<UsersRound className="h-5 w-5" />} title={t('platform.nav.participants')} />
      <SearchBox value={query} onChange={setQuery} />
      <StateBlock state={state} empty={docs.length === 0}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {docs.map((participant) => (
            <article key={participant.id} className="rounded-2xl border border-white/60 bg-white/45 p-4">
              <h3 className="font-serif text-xl text-brand-dark">{participant.name}</h3>
              <p className="text-sm text-brand-slate">{[participant.country, participant.city].filter(Boolean).join(', ')}</p>
              <TagRow items={[...participant.skills, ...participant.interests].slice(0, 6)} />
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => navigate(`/participants/${participant.id}`)} className="rounded-xl bg-brand-dark px-4 py-2 text-xs font-semibold text-white">{t('platform.actions.open')}</button>
                <FavoriteButton user={user} itemType="participant" itemId={participant.id} itemTitle={participant.name} href={`/participants/${participant.id}`} />
              </div>
            </article>
          ))}
        </div>
      </StateBlock>
    </section>
  );
}

function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation();
  return (
    <label className="relative block max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-slate" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={t('platform.placeholders.search')} className="min-h-12 w-full rounded-2xl border border-white/60 bg-white/55 pl-10 pr-4 text-sm outline-none focus:border-[#bc4638]" />
    </label>
  );
}

function TagRow({ items }: { items: string[] }) {
  return <div className="mt-3 flex flex-wrap gap-1.5">{items.map((item) => <span key={item} className="rounded-full bg-white/60 px-2 py-1 text-[11px] text-brand-slate">{item}</span>)}</div>;
}

function FavoriteButton({ user, itemType, itemId, itemTitle, href }: { user?: PlatformUser | null; itemType: string; itemId: string | number; itemTitle: string; href: string }) {
  const { t } = useTranslation();
  const [state, setState] = useState<LoadState>('idle');

  const add = async () => {
    if (!user) {
      navigate('/');
      return;
    }
    setState('loading');
    try {
      await platformApi.addFavorite({ itemType, itemId: String(itemId), itemTitle, href });
      setState('success');
    } catch {
      setState('error');
    }
  };

  return (
    <button type="button" onClick={add} disabled={state === 'loading'} className="rounded-xl border border-[#d8d1cc] px-4 py-2 text-xs font-semibold text-brand-slate disabled:opacity-60">
      {state === 'success' ? t('platform.states.saved') : t('platform.actions.favorite')}
    </button>
  );
}

function CatalogView({ type, user }: { type: CatalogType; user?: PlatformUser | null }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(new URLSearchParams(window.location.search).get('q') || '');
  const [docs, setDocs] = useState<CatalogDoc[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = query ? `?q=${encodeURIComponent(query)}` : '';
      window.history.replaceState({}, '', `/${type}${params}`);
      setState('loading');
      platformApi.catalog(type, params).then((result) => {
        setDocs(result.docs);
        setState('success');
      }).catch(() => setState('error'));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, type]);

  return (
    <section className="grid gap-5">
      <SectionTitle icon={<ShieldCheck className="h-5 w-5" />} title={t(`platform.nav.${type}`)} />
      <SearchBox value={query} onChange={setQuery} />
      <StateBlock state={state} empty={docs.length === 0}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {docs.map((doc) => {
            const itemTitle = doc.title || doc.organization || String(doc.id);
            const itemType = type === 'championships' ? 'championship' : type.slice(0, -1);
            return (
              <article key={String(doc.id)} className="rounded-2xl border border-white/60 bg-white/45 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#bc4638]">{doc.format || doc.eventType || doc.opportunityType || doc.type}</div>
                <h3 className="mt-1 font-serif text-xl text-brand-dark">{itemTitle}</h3>
                <p className="mt-2 text-sm text-brand-slate">{doc.shortDescription || doc.description || doc.fullDescription}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <FavoriteButton user={user} itemType={itemType} itemId={doc.id} itemTitle={itemTitle} href={`/${type}/${doc.slug || doc.id}`} />
                  {user && (
                    <button type="button" onClick={() => platformApi.createApplication({ itemType, itemId: String(doc.id), itemTitle, status: 'submitted', motivation: itemTitle })} className="rounded-xl bg-brand-dark px-4 py-2 text-xs font-semibold text-white">{t('platform.actions.apply')}</button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </StateBlock>
    </section>
  );
}

function AdminView({ user }: { user?: PlatformUser | null }) {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [applications, setApplications] = useState<PlatformApplication[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [state, setState] = useState<LoadState>('loading');
  const [usersState, setUsersState] = useState<LoadState>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setState('loading');
    Promise.all([platformApi.adminSummary(), platformApi.adminApplications()]).then(([summaryResult, appsResult]) => {
      setSummary(summaryResult);
      setApplications(appsResult.docs);
      setState('success');
    }).catch(() => setState('error'));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = userQuery ? `?q=${encodeURIComponent(userQuery)}` : '';
      setUsersState('loading');
      platformApi.adminUsers(params).then((result) => {
        setUsers(result.docs);
        setUsersState('success');
      }).catch(() => setUsersState('error'));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [userQuery]);

  if (!user || user.role === 'user') return <Result text={t('platform.errors.FORBIDDEN')} />;

  const updateApplicationStatus = async (applicationId: string | number, status: string) => {
    setMessage('');
    try {
      const result = await platformApi.adminUpdateApplication(applicationId, { status });
      setApplications((current) => current.map((app) => (app.id === applicationId ? result.application : app)));
      setMessage(t('platform.states.saved'));
    } catch (error) {
      setMessage(t(`platform.errors.${(error as Error).name}`, { defaultValue: t('platform.errors.API_ERROR') }));
    }
  };

  const updateUser = async (userId: string, payload: Record<string, unknown>) => {
    setMessage('');
    try {
      const result = await platformApi.adminUpdateUser(userId, payload);
      setUsers((current) => current.map((item) => (item.id === userId ? result.user : item)));
      setMessage(t('platform.states.saved'));
    } catch (error) {
      setMessage(t(`platform.errors.${(error as Error).name}`, { defaultValue: t('platform.errors.API_ERROR') }));
    }
  };

  return (
    <section className="grid gap-5">
      <SectionTitle icon={<ShieldCheck className="h-5 w-5" />} title={t('platform.nav.admin')} />
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-white/60 bg-white/45 p-1.5">
        {(['overview', 'blog'] as const).map((key) => {
          const path = key === 'overview' ? '/platform/admin' : '/platform/admin/blog';
          const isActive = key === 'overview' ? currentPath() === '/platform/admin' : currentPath() === '/platform/admin/blog';
          return (
            <button
              key={key}
              type="button"
              onClick={() => navigate(path)}
              className={`relative flex min-h-11 flex-1 items-center justify-center rounded-xl px-3 text-xs font-semibold uppercase tracking-wider transition-colors ${isActive ? 'bg-brand-dark text-white' : 'text-brand-slate hover:bg-white/60'}`}
            >
              {t(`ui.blogmoderation.adminTabs.${key}`, { defaultValue: key === 'overview' ? 'Overview' : 'Blog' })}
            </button>
          );
        })}
      </div>
      {message && <Result ok={message === t('platform.states.saved')} text={message} />}
      <StateBlock state={state}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(summary).map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-white/60 bg-white/45 p-4">
              <div className="text-2xl font-semibold text-brand-dark">{value}</div>
              <div className="text-xs uppercase tracking-wider text-brand-slate">{t(`platform.admin.${key}`)}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-slate">{t('platform.admin.applications')}</h2>
          {applications.map((app) => (
            <article key={String(app.id)} className="rounded-2xl border border-white/60 bg-white/45 p-4">
              <div className="font-serif text-xl text-brand-dark">{app.itemTitle || app.ticketId}</div>
              <div className="text-sm text-brand-slate">{t(statusKey(app.status))}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {['under_review', 'clarification_required', 'approved', 'rejected'].map((status) => (
                  <button key={status} type="button" onClick={() => updateApplicationStatus(app.id, status)} className="rounded-xl border border-[#d8d1cc] px-3 py-2 text-xs font-semibold text-brand-slate">{t(statusKey(status))}</button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </StateBlock>
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-slate">{t('platform.admin.users')}</h2>
          <SearchBox value={userQuery} onChange={setUserQuery} />
        </div>
        {user.role !== 'admin' && <Result text={t('platform.admin.adminOnly')} />}
        <StateBlock state={usersState} empty={users.length === 0}>
          <div className="grid gap-3 md:grid-cols-2">
            {users.map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/60 bg-white/45 p-4">
                <div className="font-serif text-xl text-brand-dark">{[item.firstName, item.lastName].filter(Boolean).join(' ') || item.email}</div>
                <div className="break-all text-sm text-brand-slate">{item.email}</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-brand-dark/70">
                    <span>{t('platform.admin.role')}</span>
                    <select value={item.role} disabled={user.role !== 'admin'} onChange={(event) => updateUser(item.id, { role: event.target.value })} className="min-h-11 rounded-xl border border-[#d8d1cc] bg-white/70 px-3 text-sm normal-case tracking-normal text-brand-dark disabled:opacity-60">
                      {(['user', 'moderator', 'admin'] as const).map((role) => <option key={role} value={role}>{t(`platform.roles.${role}`)}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-brand-dark/70">
                    <span>{t('platform.admin.accountStatus')}</span>
                    <select value={item.accountStatus} disabled={user.role !== 'admin'} onChange={(event) => updateUser(item.id, { accountStatus: event.target.value })} className="min-h-11 rounded-xl border border-[#d8d1cc] bg-white/70 px-3 text-sm normal-case tracking-normal text-brand-dark disabled:opacity-60">
                      {(['active', 'pending', 'blocked'] as const).map((status) => <option key={status} value={status}>{t(`platform.accountStatus.${status}`)}</option>)}
                    </select>
                  </label>
                </div>
              </article>
            ))}
          </div>
        </StateBlock>
      </div>
    </section>
  );
}

export default function PlatformPage({ onLogin }: { onLogin?: () => void }) {
  const [route, setRoute] = useState(getRoute);
  const [user, setUser] = useState<PlatformUser | null | undefined>(undefined);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const sync = () => setRoute(getRoute());
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  useEffect(() => {
    platformApi.me().then((result) => setUser(result.user)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    platformApi.notifications().then((result) => setUnread(result.unread)).catch(() => setUnread(0));
  }, [user, route.path]);

  const logout = async () => {
    await platformApi.logout().catch(() => undefined);
    setUser(null);
    window.dispatchEvent(new CustomEvent('platform-auth-change', { detail: { user: null } }));
    navigate('/');
  };

  // Redirect unauthenticated users away from login/register/profile
  const needsRedirect = useMemo(() => {
    if (user === undefined) return null; // still loading auth
    // /login and /register should NEVER be standalone — auth is only via modal
    if (route.path === '/login' || route.path === '/register') return '/';
    // /profile requires authentication
    if (route.path.startsWith('/profile') && !user) return '/';
    return null;
  }, [route.path, user]);

  useEffect(() => {
    if (needsRedirect) {
      navigate(needsRedirect);
    }
  }, [needsRedirect]);

  const content = useMemo(() => {
    // Public routes that don't need auth — render immediately
    if (route.path === '/activities/opportunities' || route.path.startsWith('/activities/opportunities/')) return <OpportunitiesPage onBackToHome={() => navigate('/')} />;
    if (route.path === '/forgot-password') return <AuthView mode="forgot" onAuth={setUser} />;
    if (route.path === '/reset-password') return <AuthView mode="reset" onAuth={setUser} />;
    if (user === undefined) return <StateBlock state="loading"><div /></StateBlock>;
    if (route.path === '/login' || route.path === '/register') return null;
    if (route.path.startsWith('/profile')) return user ? <Dashboard user={user} onUser={setUser} /> : null;
    if (route.path.startsWith('/participants')) return <ParticipantsView user={user} />;
    if (route.path === '/platform/admin') return <AdminView user={user} />;
    if (route.path === '/platform/admin/blog') return <BlogModerationPanel user={user} />;
    const catalog = CATALOGS.find((item) => route.path === `/${item}` || route.path.startsWith(`/${item}/`));
    if (catalog) return <CatalogView type={catalog} user={user} />;
    return <CatalogView type="championships" user={user} />;
  }, [route.path, user]);

  return (
    <Shell user={user} unread={unread} onLogout={logout} onLogin={onLogin}>
      {content}
    </Shell>
  );
}
