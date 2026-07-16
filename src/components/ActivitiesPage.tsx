import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  Search,
  Sparkles,
  Target,
  Trophy,
  Users,
  Users as UsersIcon,
  Video,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  cardItemFadeUp,
  cardStaggerContainer,
  fadeInScale,
  fadeUp,
} from '../motion-animations';
import BrandImage from './BrandImage';
import { ActivityCategory, ActivityItem, ActivityStatus } from '../types';
import { useLocalizedData } from '../i18n/useLocalizedData';

type CategoryFilter = ActivityCategory | 'all';
type ActivityView = 'events' | 'opportunities';

const OpportunitiesPage = lazy(() => import('./OpportunitiesPage'));

interface ActivitiesPageProps {
  onBackToHome: () => void;
  onNavigateToSection: (sectionId: string) => void;
  onOpenApplyModal: () => void;
}

const CATEGORY_MAP: Record<ActivityCategory, { label: string; icon: React.ReactNode; accent: string; chip: string }> = {
  educational: {
    label: 'ui.activitiespage.fd035e7af9',
    icon: <BookOpen className="h-4 w-4" />,
    accent: 'from-[#bc4638] to-[#d4694f]',
    chip: 'bg-[#bc4638]/10 text-[#8d3026]',
  },
  project: {
    label: 'ui.activitiespage.3bb654d42c',
    icon: <Wrench className="h-4 w-4" />,
    accent: 'from-[#6b8f71] to-[#4a7c5c]',
    chip: 'bg-[#6b8f71]/12 text-[#355a40]',
  },
  social: {
    label: 'ui.activitiespage.cd649ec78d',
    icon: <Heart className="h-4 w-4" />,
    accent: 'from-[#bd5b82] to-[#d47ea8]',
    chip: 'bg-[#bd5b82]/12 text-[#8a3859]',
  },
  'online-meeting': {
    label: 'ui.activitiespage.95e6e26800',
    icon: <Video className="h-4 w-4" />,
    accent: 'from-[#3d6b8f] to-[#5a8fb4]',
    chip: 'bg-[#3d6b8f]/12 text-[#274d68]',
  },
  workshop: {
    label: 'ui.activitiespage.11cc8bf25c',
    icon: <Zap className="h-4 w-4" />,
    accent: 'from-[#c9a96e] to-[#dbbf88]',
    chip: 'bg-[#c9a96e]/16 text-[#7a5c21]',
  },
  team: {
    label: 'ui.activitiespage.26021f2cb2',
    icon: <UsersIcon className="h-4 w-4" />,
    accent: 'from-[#8a6b9d] to-[#a888b8]',
    chip: 'bg-[#8a6b9d]/12 text-[#644675]',
  },
};

const STATUS_MAP: Record<ActivityStatus, { label: string; className: string; dot: string }> = {
  coming: {
    label: 'ui.activitiespage.ddc44f9ff3',
    className: 'bg-[#bc4638]/10 text-[#8d3026] border-[#bc4638]/15',
    dot: 'bg-[#bc4638]',
  },
  ongoing: {
    label: 'ui.activitiespage.2f96e6c2aa',
    className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/15',
    dot: 'bg-emerald-500',
  },
  completed: {
    label: 'ui.activitiespage.2a785b54e5',
    className: 'bg-brand-slate/10 text-brand-slate border-brand-slate/15',
    dot: 'bg-brand-slate',
  },
};

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'ui.activitiespage.6afaf7bd0a',
  educational: 'ui.activitiespage.fd035e7af9',
  project: 'ui.activitiespage.3bb654d42c',
  social: 'ui.activitiespage.cd649ec78d',
  'online-meeting': 'ui.activitiespage.95e6e26800',
  workshop: 'ui.activitiespage.11cc8bf25c',
  team: 'ui.activitiespage.26021f2cb2',
};

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS) as CategoryFilter[];
const VISIBLE_CATEGORY_ORDER = CATEGORY_ORDER.filter((category): category is ActivityCategory => category !== 'all');
const feedStaggerContainer = {
  initial: 'hidden',
  animate: 'visible',
  variants: cardStaggerContainer.variants,
};

const getInitialActivityView = (): ActivityView => {
  if (typeof window === 'undefined') return 'events';
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  return path === '/opportunities' || path === '/profile/opportunities' || path.startsWith('/opportunities/')
    ? 'opportunities'
    : 'events';
};

const getCurrentPath = () => {
  if (typeof window === 'undefined') return '/activities';
  return window.location.pathname.replace(/\/$/, '') || '/';
};

const OPPORTUNITIES_UTILITY_PATHS = new Set([
  '/opportunities/recommendations',
  '/opportunities/favorites',
  '/opportunities/compare',
  '/opportunities/submit',
]);

export default function ActivitiesPage({
  onBackToHome,
  onNavigateToSection,
  onOpenApplyModal,
}: ActivitiesPageProps) {
  const { t } = useTranslation();
  const { activities } = useLocalizedData();
  const [activeView, setActiveView] = useState<ActivityView>(getInitialActivityView);
  const [routePath, setRoutePath] = useState(getCurrentPath);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [activitySearch, setActivitySearch] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  useEffect(() => {
    const syncViewWithPath = () => {
      setActiveView(getInitialActivityView());
      setRoutePath(getCurrentPath());
    };
    window.addEventListener('popstate', syncViewWithPath);
    return () => window.removeEventListener('popstate', syncViewWithPath);
  }, []);

  useEffect(() => {
    if (activeView === 'events') {
      document.title = t('meta.activities.title');
    }
  }, [activeView, t]);

  const navigateToView = (view: ActivityView) => {
    setActiveView(view);
    const nextPath = view === 'events' ? '/activities' : '/opportunities';
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    if (currentPath !== nextPath) {
      window.history.pushState({}, '', nextPath);
      setRoutePath(nextPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToOpportunityRecommendations = () => {
    setActiveView('opportunities');
    const nextPath = '/opportunities/recommendations';
    window.history.pushState({}, '', nextPath);
    setRoutePath(nextPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isOpportunityDetailPath =
    routePath.startsWith('/opportunities/') && !OPPORTUNITIES_UTILITY_PATHS.has(routePath);
  const showActivitiesHeader = !isOpportunityDetailPath;

  const filteredActivities = useMemo(() => {
    const query = activitySearch.trim().toLowerCase();
    return activities.filter((activity) => {
      if (selectedCategory !== 'all' && activity.category !== selectedCategory) return false;
      if (!query) return true;
      return [
        activity.title,
        activity.shortDescription,
        activity.fullDescription,
        activity.format,
        activity.date,
        activity.who,
        activity.prerequisites,
        t(CATEGORY_LABELS[activity.category]),
      ].join(' ').toLowerCase().includes(query);
    });
  }, [activities, activitySearch, selectedCategory, t]);

  const categoryCounts = useMemo(() => {
    return activities.reduce(
      (counts, activity) => ({
        ...counts,
        [activity.category]: (counts[activity.category] ?? 0) + 1,
      }),
      {} as Record<ActivityCategory, number>,
    );
  }, [activities]);

  return (
    <div className="relative w-full overflow-hidden pb-16 pt-24 text-brand-dark">
      {showActivitiesHeader && (
        <div className="absolute inset-x-0 top-20 h-px bg-gradient-to-r from-transparent via-brand-dark/10 to-transparent" />
      )}

      <div className="relative z-10 mx-auto max-w-7xl px-[6%] md:px-[10%]">
        {showActivitiesHeader && (
          <>
            <div className="mb-8 flex justify-start sm:mb-10">
              <button
                onClick={onBackToHome}
                className="group inline-flex items-center gap-2 px-4 py-2 border border-[#d8d1cc]/60 hover:border-brand-dark text-xs font-mono tracking-wider uppercase text-brand-slate hover:text-brand-dark transition-all rounded-xl cursor-pointer bg-white/20 backdrop-blur-sm"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-180 transition-transform group-hover:-translate-x-0.5" />
                <span>{t('ui.aboutprojectpage.a9dc864a2e')}</span>
              </button>
            </div>

            <section className="flex justify-center pb-8 md:pb-10">
              <div className="inline-flex w-full rounded-2xl border border-white/60 bg-white/35 p-1.5 surface-elevated-soft backdrop-blur-xl sm:w-auto">
                {([
                  ['events', t('ui.activitiespage.9bd00b51c2'), activities.length],
                  ['opportunities', t('ui.activitiespage.d4bd169801'), null],
                ] as const).map(([view, label, count]) => {
                  const isActive = activeView === view;
                  return (
                    <button
                      key={view}
                      type="button"
                      onClick={() => navigateToView(view)}
                      className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-[11px] font-bold uppercase tracking-wide transition-all sm:flex-none ${
                        isActive ? 'bg-brand-dark text-white shadow-md' : 'text-brand-slate hover:bg-white/60 hover:text-brand-dark'
                      }`}
                    >
                      <span>{label}</span>
                      {count !== null && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${isActive ? 'bg-white/15 text-white' : 'bg-brand-dark/6 text-brand-slate'}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {activeView === 'events' ? (
          <>
        <section className="pb-8 md:pb-10">
          <motion.div {...fadeUp} className="grid gap-6">
            <div className="space-y-4">
              <h1 className="max-w-4xl text-3xl font-serif font-semibold leading-tight tracking-tight text-brand-dark sm:text-4xl lg:text-5xl">
                {t('ui.activitiespage.0b2e4667a1')}
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-brand-slate sm:text-base">
                {t('ui.activitiespage.9bc3c6004a')}
              </p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="relative block">
                <span className="sr-only">{t('ui.activitiespage.807368f2dd')}</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-slate/60" />
                <input
                  value={activitySearch}
                  onChange={(event) => setActivitySearch(event.target.value)}
                  placeholder={t('ui.activitiespage.807368f2dd')}
                  className="min-h-12 w-full rounded-2xl border border-white/65 bg-white/60 py-3 pl-11 pr-4 text-sm text-brand-dark shadow-[0_10px_35px_rgba(91,100,114,0.08)] outline-none backdrop-blur-xl transition-colors placeholder:text-brand-slate/45 focus:border-[#8f99a8]"
                />
              </label>
              <button
                type="button"
                onClick={navigateToOpportunityRecommendations}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-brand-dark px-5 py-3 text-xs font-semibold text-white"
              >
                <Sparkles className="h-4 w-4" />
                {t('ui.activitiespage.0ad86f239d')}
              </button>
            </div>
          </motion.div>
        </section>

        <section className="mb-8">
          <motion.div {...fadeUp} className="flex gap-2 overflow-x-auto pb-3 scrollbar-soft" aria-label={t('ui.app.814b71a2da')}>
            {VISIBLE_CATEGORY_ORDER.map((category) => {
              const isActive = selectedCategory === category;
              const categoryInfo = CATEGORY_MAP[category];
              const count = categoryCounts[category] ?? 0;

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  aria-selected={isActive}
                  className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-2xl border px-4 py-2 text-[11px] font-semibold uppercase tracking-wide transition-all ${
                    isActive
                      ? 'border-brand-dark bg-brand-dark text-white shadow-md'
                      : 'border-white/60 bg-white/45 text-brand-slate hover:bg-white hover:text-brand-dark'
                  }`}
                >
                  {categoryInfo.icon}
                  <span>{t(CATEGORY_LABELS[category])}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${isActive ? 'bg-white/16 text-white' : 'bg-brand-dark/6 text-brand-slate'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </motion.div>
        </section>

        <section id="activities-feed" className="py-6 md:py-10">
          {filteredActivities.length > 0 ? (
            <motion.div {...feedStaggerContainer} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {filteredActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onOpenDetails={() => setSelectedActivity(activity)}
                />
              ))}
            </motion.div>
          ) : (
            <EmptyState
              message={selectedCategory !== 'all' ? t('ui.activitiespage.08c342896d') : t('ui.activitiespage.e3f0e11656')}
              primaryAction={{
                label: t('ui.aboutprojectpage.0a09c52fdd'),
                onClick: () => onNavigateToSection('nearest-championship'),
              }}
              secondaryAction={{ label: t('ui.app.d13f387e64'), onClick: () => onNavigateToSection('scenarios') }}
            />
          )}
        </section>

        <section className="py-14 md:py-20">
          <motion.div {...fadeUp} className="mb-8 text-center">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-3xl font-serif font-semibold tracking-tight text-brand-dark sm:text-4xl">
                {t('ui.activitiespage.62d6062e')}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-brand-slate">
                {t('ui.activitiespage.5f082a56')}
              </p>
            </div>
          </motion.div>

          <motion.div {...cardStaggerContainer} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                icon: <Target className="h-5 w-5" />,
                tone: 'text-[#bc4638] bg-[#bc4638]/10',
                title: t('ui.activitiespage.af25d20b95'),
                desc: t('ui.activitiespage.4eb7854fc8'),
                cta: t('ui.activitiespage.cbce0b8085'),
                action: () => setSelectedCategory('workshop'),
              },
              {
                icon: <Users className="h-5 w-5" />,
                tone: 'text-[#bd5b82] bg-[#bd5b82]/10',
                title: t('ui.activitiespage.d5c86819d5'),
                desc: t('ui.activitiespage.0ef507d3b1'),
                cta: t('ui.app.d13f387e64'),
                action: () => onNavigateToSection('scenarios'),
              },
              {
                icon: <Trophy className="h-5 w-5" />,
                tone: 'text-[#7a5c21] bg-[#c9a96e]/16',
                title: t('ui.activitiespage.5c6f9ac901'),
                desc: t('ui.activitiespage.27354a5dbf'),
                cta: t('ui.activitiespage.4c788137bc'),
                action: () => onNavigateToSection('nearest-championship'),
              },
            ].map((card) => (
              <motion.div
                key={card.title}
                variants={cardItemFadeUp.variants}
                className="flex min-h-[270px] flex-col justify-between rounded-[1.35rem] border border-white/60 bg-white/42 p-5 surface-elevated-soft backdrop-blur-sm transition-colors hover:bg-white/62"
              >
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${card.tone}`}>
                      {card.icon}
                    </div>
                    <h3 className="text-sm font-serif font-semibold leading-tight text-brand-dark">{card.title}</h3>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-brand-slate">{card.desc}</p>
                </div>
                <button
                  onClick={card.action}
                  className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#d8d1cc] bg-white/58 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-brand-slate transition-all hover:border-[#bc4638]/45 hover:bg-white hover:text-[#8d3026]"
                >
                  <span>{card.cta}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="py-10 md:py-16">
          <motion.div
            {...fadeInScale}
            className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-brand-dark px-6 py-9 text-center shadow-[0_30px_90px_rgba(17,17,17,0.16)] sm:px-10 sm:py-12"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
            <h2 className="mx-auto max-w-4xl text-3xl font-serif font-semibold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
              {t('ui.activitiespage.97446fff')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/70">{t('ui.activitiespage.4dbca5f4b0')}</p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={onOpenApplyModal}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-white px-7 py-3 text-[11px] font-bold uppercase tracking-widest text-brand-dark shadow-lg shadow-black/15 transition-all hover:bg-[#f7f3ef] sm:w-auto"
              >
                {t('ui.app.24cd8dc78d')}
              </button>
              <button
                onClick={() => onNavigateToSection('scenarios')}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/20 bg-white/8 px-7 py-3 text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/14 sm:w-auto"
              >
                {t('ui.app.d13f387e64')}
              </button>
              <button
                onClick={() => onNavigateToSection('footer-system')}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/20 bg-white/8 px-7 py-3 text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/14 sm:w-auto"
              >
                {t('ui.activitiespage.1f75230b6e')}
              </button>
            </div>
          </motion.div>
        </section>
          </>
        ) : (
          <Suspense fallback={<div className="rounded-[1.5rem] border border-white/60 bg-white/42 p-8 text-sm text-brand-slate surface-elevated-soft backdrop-blur-xl">{t('common.loading')}</div>}>
            <OpportunitiesPage onBackToHome={onBackToHome} embedded />
          </Suspense>
        )}
      </div>

      <AnimatePresence>
        {selectedActivity && (
          <ActivityDetailsModal
            activity={selectedActivity}
            onClose={() => setSelectedActivity(null)}
            onOpenApplyModal={() => {
              setSelectedActivity(null);
              onOpenApplyModal();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: ActivityStatus }) {
  const { t } = useTranslation();
  const statusInfo = STATUS_MAP[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusInfo.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
      {t(statusInfo.label)}
    </span>
  );
}

type ActivityCardProps = {
  activity: ActivityItem;
  onOpenDetails: () => void;
};

function ActivityCard({
  activity,
  onOpenDetails,
}: ActivityCardProps) {
  const { t } = useTranslation();
  const categoryInfo = CATEGORY_MAP[activity.category];

  return (
    <motion.article
      variants={cardItemFadeUp.variants}
      role="button"
      tabIndex={0}
      onClick={onOpenDetails}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDetails();
        }
      }}
      aria-label={`${t('ui.activitiespage.4710ead504')}: ${activity.title}`}
      className="group relative flex min-h-[390px] cursor-pointer flex-col overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/48 surface-elevated-soft backdrop-blur-sm transition-colors hover:border-[#d8d1cc] hover:bg-white/62"
    >
      <div className="overflow-hidden bg-white/35">
        {activity.imageUrl ? (
          <BrandImage
            src={activity.imageUrl}
            alt={activity.title}
            aspectRatio="16 / 9"
            objectPosition="50% 42%"
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="rounded-none border-0 shadow-none"
          />
        ) : (
          <div className={`aspect-video w-full bg-gradient-to-br ${categoryInfo.accent} opacity-75`} />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={activity.status} />
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${categoryInfo.chip}`}>
            {categoryInfo.icon}
            {t(categoryInfo.label)}
          </span>
        </div>

        <h3 className="text-xl font-serif font-semibold leading-tight text-brand-dark sm:text-2xl">
          {activity.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-brand-slate">
          {activity.shortDescription}
        </p>

        <div className="mt-5 grid grid-cols-1 gap-2 text-[11px] font-medium text-brand-slate sm:grid-cols-2">
          <span className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-white/60 bg-white/48 px-3 py-2">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-[#bc4638]" />
            <span>{activity.date}</span>
          </span>
          <span className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-white/60 bg-white/48 px-3 py-2">
            <Clock className="h-3.5 w-3.5 shrink-0 text-[#3d6b8f]" />
            <span>{activity.format}</span>
          </span>
        </div>

        <div className="mt-auto flex justify-end pt-5">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8d1cc]/70 bg-white/55 text-[#8d3026] transition-all group-hover:border-[#bc4638]/35 group-hover:bg-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </motion.article>
  );
}

function ActivityDetailsModal({
  activity,
  onClose,
  onOpenApplyModal,
}: {
  activity: ActivityItem;
  onClose: () => void;
  onOpenApplyModal: () => void;
}) {
  const { t } = useTranslation();
  const categoryInfo = CATEGORY_MAP[activity.category];
  const isCompleted = activity.status === 'completed';

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-dark/25 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 22 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 22 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-details-title"
        className="relative z-10 max-h-[88vh] w-[94vw] max-w-5xl overflow-y-auto scrollbar-soft rounded-[1.75rem] border border-white/60 bg-[#fffaf7]/90 shadow-[0_35px_110px_rgba(17,17,17,0.2)] backdrop-blur-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/70 text-brand-dark shadow-sm transition-colors hover:bg-white"
          aria-label={t('ui.applicationmodal.877618185f')}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid gap-5 p-5 pr-16 sm:p-8 sm:pr-20 md:grid-cols-[240px_minmax(0,1fr)] md:items-start">
          <div className="overflow-hidden rounded-[1.25rem] border border-white/60 bg-white/36">
            {activity.imageUrl ? (
              <BrandImage
                src={activity.imageUrl}
                alt={activity.title}
                aspectRatio="4 / 3"
                objectPosition="50% 42%"
                loading="eager"
                sizes="(min-width: 768px) 240px, 100vw"
                className="rounded-none border-0 shadow-none"
              />
            ) : (
              <div className={`aspect-[4/3] w-full bg-gradient-to-br ${categoryInfo.accent} opacity-75`} />
            )}
          </div>

          <div className="space-y-4 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={activity.status} />
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${categoryInfo.chip}`}>
                {categoryInfo.icon}
                {t(categoryInfo.label)}
              </span>
            </div>
            <h2 id="activity-details-title" className="text-2xl font-serif font-semibold leading-tight text-brand-dark sm:text-4xl">
              {activity.title}
            </h2>
            {!isCompleted && (
              <button
                onClick={onOpenApplyModal}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#bc4638] to-[#bd5b82] px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-white shadow-lg shadow-[#bc4638]/12 transition-all hover:opacity-95"
              >
                <span>{t('ui.aboutprojectpage.2805697540')}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6 px-5 pb-5 sm:px-8 sm:pb-8">
          <div className="grid grid-cols-1 gap-2 text-[11px] font-medium text-brand-slate sm:grid-cols-2">
            <span className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-3 py-2">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-[#bc4638]" />
              <span>{activity.date}</span>
            </span>
            <span className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-3 py-2">
              <Clock className="h-3.5 w-3.5 shrink-0 text-[#3d6b8f]" />
              <span>{activity.format}</span>
            </span>
          </div>

          <p className="text-sm leading-relaxed text-brand-slate sm:text-base">{activity.fullDescription}</p>

          <DetailBlock title={t('ui.app.411ef17e3a')}>
            <p>{activity.who}</p>
          </DetailBlock>

          <DetailBlock title={t('ui.activitiespage.1a8a81bc71')}>
            <ul className="space-y-2">
              {activity.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </DetailBlock>

          <DetailBlock title={t('ui.activitiespage.160919e620')}>
            <p>{activity.prerequisites}</p>
          </DetailBlock>

          {!isCompleted && (
            <button
              onClick={onOpenApplyModal}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#bc4638] to-[#bd5b82] px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-white shadow-lg shadow-[#bc4638]/12 transition-all hover:opacity-95"
            >
              <span>{t('ui.aboutprojectpage.2805697540')}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-brand-dark/70">{title}</h4>
      <div className="text-xs leading-relaxed text-brand-slate">{children}</div>
    </div>
  );
}

function EmptyState({
  message,
  primaryAction,
  secondaryAction,
}: {
  message: string;
  primaryAction: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.5rem] border border-white/60 bg-white/48 px-5 py-14 surface-elevated-soft backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-md items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-dark/5 text-brand-slate">
          <Search className="h-6 w-6" />
        </div>
        <p className="text-sm leading-relaxed text-brand-slate">{message}</p>
      </div>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          onClick={primaryAction.onClick}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#bc4638] px-6 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white transition-all hover:bg-[#a83c31] sm:w-auto"
        >
          {primaryAction.label}
        </button>
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#d8d1cc] bg-white/58 px-6 py-2.5 text-[11px] font-bold uppercase tracking-wide text-brand-slate transition-all hover:bg-white hover:text-brand-dark sm:w-auto"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </motion.div>
  );
}
