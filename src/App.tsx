import React, { lazy, Suspense, useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUpRight,
  Clock,
  ChevronDown,
  CheckCircle2,
  Globe,
  Menu,
  X,
} from 'lucide-react';
import GlassCrystal from './components/GlassCrystal';
import ApplicationModal from './components/ApplicationModal';
import AuthModal from './components/AuthModal';
import BrandImage from './components/BrandImage';
import PageSkeleton from './components/PageSkeletons';
import StudyBackground from './components/StudyBackground';
import Logo from './components/Logo';
import GridBackground from './components/GridBackground';
import AmbientLighting from './components/AmbientLighting';
import NotFoundPage from './components/NotFoundPage';
import AppFooter from './components/AppFooter';
import ScrollToTop from './components/ScrollToTop';
import useScrollBehavior from './hooks/useScrollBehavior';
import usePageMeta from './hooks/usePageMeta';
import { apiUrl, fetchContactSettings, platformApi, type ContactSettings, type PlatformUser } from './api';
import {
  LANGUAGE_FLAGS,
  SUPPORTED_LANGUAGES,
  clearPreferredLanguage,
  detectSupportedLanguageFromBrowser,
  getSavedPreferredLanguage,
  isSupportedLanguage,
  savePreferredLanguage,
  type SupportedLanguage,
} from './i18n/languages';
import { useLocalizedData } from './i18n/useLocalizedData';
import { useCmsTournaments } from './hooks/useCmsTournaments';
import { useCmsPillars } from './hooks/useCmsPillars';
import { useCmsExperts } from './hooks/useCmsExperts';
import { useCmsTrustPoints } from './hooks/useCmsTrustPoints';
import { useCmsStats } from './hooks/useCmsStats';
import {
  fadeUp,
  fadeUpLarge,
  fadeInScale,
  heroFadeUpLarge,
} from './motion-animations';

const AboutProjectPage = lazy(() => import('./components/AboutProjectPage'));
const ChampionshipPage = lazy(() => import('./components/ChampionshipPage'));
const ActivitiesPage = lazy(() => import('./components/ActivitiesPage'));
const FindTeamPage = lazy(() => import('./components/FindTeamPage'));
const BlogPage = lazy(() => import('./components/BlogPage'));
import PlatformPage from './components/PlatformPage';

const PAGE_PATHS = ['about', 'championship', 'activities', 'find-team', 'blog'] as const;
type Page = 'home' | 'not-found' | typeof PAGE_PATHS[number];
const PLATFORM_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/profile',
  '/participants',
  '/championships',
  '/platform/admin',
] as const;

const ACTIVITIES_EVENTS_PATH = '/activities/events';
const ACTIVITIES_OPPORTUNITIES_PATH = '/activities/opportunities';

const cardEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
type InlineFormErrors = {
  name: boolean;
  age: boolean;
  location: boolean;
  contact: boolean;
};

const createInlineFormErrors = (): InlineFormErrors => ({
  name: false,
  age: false,
  location: false,
  contact: false,
});

const cardStaggerContainer = {
  initial: 'hidden',
  whileInView: 'visible',
  viewport: {
    once: true,
    amount: 0.18,
    margin: '0px 0px -80px 0px',
  },
  variants: {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  },
};

const cardItemFadeUp = {
  variants: {
    hidden: {
      opacity: 0,
      y: 24,
      scale: 0.985,
      filter: 'blur(6px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.55,
        ease: cardEase,
      },
    },
  },
};

const isPagePath = (value: string): value is typeof PAGE_PATHS[number] => {
  return (PAGE_PATHS as readonly string[]).includes(value);
};

const getPageFromPath = (): Page => {
  if (typeof window === 'undefined') return 'home';
  if (getIsPlatformRoute()) return 'home';
  const path = window.location.pathname.replace(/\/$/, '');
  if (!path) return 'home';
  // Extract first path segment to support sub-routes like /activities/events
  const page = path.slice(1).split('/')[0];
  return isPagePath(page) ? page : 'not-found';
};

const getIsPlatformRoute = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  return PLATFORM_PATHS.some((platformPath) => path === platformPath || path.startsWith(`${platformPath}/`));
};

function PageFallback({ page }: { page: Page }) {
  return <PageSkeleton page={page} />;
}

export default function App() {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const {
    tournaments,
  } = useLocalizedData();
  const cmsTournaments = useCmsTournaments();
  const pillars = useCmsPillars();
  const experts = useCmsExperts();
  const trustPoints = useCmsTrustPoints();
  const stats = useCmsStats();
  const [featuredTournament, setFeaturedTournament] = useState<Record<string, unknown> | null>(null);
  // Use CMS tournaments if available, fall back to translation data
  const effectiveTournaments = cmsTournaments || tournaments;
  const featuredTournamentPublicId = featuredTournament
    ? String(featuredTournament.legacyId ?? featuredTournament.id ?? '')
    : undefined;
  const featuredExperts = useMemo(() => {
    const tournamentIds = [
      featuredTournamentPublicId,
      featuredTournament?.id != null ? String(featuredTournament.id) : undefined,
      cmsTournaments?.[0]?.id,
      effectiveTournaments?.[0]?.id,
    ].filter((id): id is string => Boolean(id));
    if (tournamentIds.length === 0) return experts || [];
    const tournamentIdSet = new Set(tournamentIds);
    const scopedExperts = experts?.filter(e => e.tournamentId && tournamentIdSet.has(String(e.tournamentId))) || [];
    if (scopedExperts.length > 0) return scopedExperts;
    const unscopedExperts = experts?.filter(e => !e.tournamentId) || [];
    return unscopedExperts.length > 0 ? unscopedExperts : (experts || []);
  }, [experts, featuredTournament, featuredTournamentPublicId, cmsTournaments, effectiveTournaments]);
  const [currentPage, setCurrentPage] = useState<Page>(getPageFromPath);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedTourney, setSelectedTourney] = useState<string | undefined>(undefined);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPlatformRoute, setIsPlatformRoute] = useState(getIsPlatformRoute);
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [authUser, setAuthUser] = useState<PlatformUser | null | undefined>(undefined);
  const [contactSettings, setContactSettings] = useState<ContactSettings | null>(null);
  const displayedTrustPoints = trustPoints?.length === 5
    ? [
      ...trustPoints,
      {
        id: 'tr-6',
        title: t('ui.app.trustGrowthTitle'),
        description: t('ui.app.trustGrowthDescription'),
      },
    ]
    : trustPoints || [];

  useEffect(() => {
    const handlePopState = () => {
      const page = getPageFromPath();
      setCurrentPage(page);
      setIsPlatformRoute(getIsPlatformRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    platformApi.me()
      .then((result) => {
        if (!cancelled) setAuthUser(result.user);
      })
      .catch(() => {
        if (!cancelled) setAuthUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleAuthChange = (event: Event) => {
      setAuthUser((event as CustomEvent<{ user: PlatformUser | null }>).detail?.user ?? null);
    };
    window.addEventListener('platform-auth-change', handleAuthChange);
    return () => window.removeEventListener('platform-auth-change', handleAuthChange);
  }, []);

  useEffect(() => {
    fetchContactSettings().then(setContactSettings);
  }, []);

  useEffect(() => {
    fetch(apiUrl('/api/championships/featured'))
      .then((res) => {
        if (!res.ok) throw new Error('No featured championship');
        return res.json();
      })
      .then((data: { doc: Record<string, unknown> }) => {
        setFeaturedTournament(data.doc);
      })
      .catch(() => {
        // No featured championship set in CMS, use i18n fallback
        setFeaturedTournament(null);
      });
  }, []);

    usePageMeta(currentPage, t, i18n);

  const updatePath = (page: Page) => {
    const nextPath = page === 'home' ? '/' : `/${page}`;
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    if (currentPath !== nextPath) {
      window.history.pushState({}, '', nextPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

    const { showScrollTop, showHeader, scrollToTop } = useScrollBehavior();

  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formInterest, setFormInterest] = useState('projects');
  const [formSubmitStatus, setFormSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formErrors, setFormErrors] = useState<InlineFormErrors>(createInlineFormErrors);
  const [pendingInlineProfile, setPendingInlineProfile] = useState<{ firstName?: string; age?: string; city?: string; contact?: string; interest?: string } | null>(null);

  useEffect(() => {
    const handleOutsideClick = () => {
      setIsLangDropdownOpen(false);
    };

    if (isLangDropdownOpen) {
      window.addEventListener('click', handleOutsideClick);
    }

    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, [isLangDropdownOpen]);

  const openApplyModal = (tournamentId?: string) => {
    setSelectedTourney(tournamentId);
    setIsModalOpen(true);
  };

  const openAuthModal = () => {
    setIsMobileMenuOpen(false);
    setIsAuthModalOpen(true);
  };

  const navigateToProfile = () => {
    setIsMobileMenuOpen(false);
    setIsAuthModalOpen(false);
    window.history.pushState({}, '', '/profile');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateNavIndicator = useCallback(() => {
    if (currentPage === 'home' || currentPage === 'not-found') {
      setIndicatorStyle({ left: 0, width: 0, opacity: 0 });
      return;
    }
    const activeRef = navRefs.current[currentPage];
    if (activeRef) {
      const { offsetLeft, offsetWidth } = activeRef;
      setIndicatorStyle({ left: offsetLeft, width: offsetWidth, opacity: 1 });
    }
  }, [currentPage]);

  useEffect(() => {
    updateNavIndicator();
    window.addEventListener('resize', updateNavIndicator);
    return () => window.removeEventListener('resize', updateNavIndicator);
  }, [updateNavIndicator]);

  const navigateToPage = (page: Page) => {
    setCurrentPage(page);
    const nextPath = page === 'home' ? '/' : page === 'activities' ? ACTIVITIES_EVENTS_PATH : `/${page}`;
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    if (currentPath !== nextPath) {
      window.history.pushState({}, '', nextPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    if (currentPage !== 'home') {
      setCurrentPage('home');
      updatePath('home');
      setIsMobileMenuOpen(false);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    } else {
      setIsMobileMenuOpen(false);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = createInlineFormErrors();

    if (!formName.trim()) {
      errors.name = true;
    }

    if (!formAge.trim() || isNaN(Number(formAge)) || Number(formAge) < 10 || Number(formAge) > 22) {
      errors.age = true;
    }

    if (!formLocation.trim()) {
      errors.location = true;
    }

    if (!formContact.trim()) {
      errors.contact = true;
    }

    if (Object.values(errors).some(Boolean)) {
      setFormErrors(errors);
      setFormSubmitStatus('error');
      return;
    }

    setFormErrors(createInlineFormErrors());
    setPendingInlineProfile({
      firstName: formName.trim(),
      age: formAge.trim(),
      city: formLocation.trim(),
      contact: formContact.trim(),
      interest: inlineInterestLabels[formInterest] || formInterest,
    });
    setIsAuthModalOpen(true);
  };

  const applyPendingInlineProfile = async (user: PlatformUser | null) => {
    if (!user) return;
    const pendingChampionship = sessionStorage.getItem('navykus.pendingChampionshipProfile');
    if (pendingChampionship) {
      try {
        const data = JSON.parse(pendingChampionship);
        await platformApi.updateProfile({
          firstName: data.name,
          ageGroup: data.age,
          city: data.city,
          biography: data.coverLetter ? `Cover letter: ${data.coverLetter}\nContact: ${data.contact}` : `Contact: ${data.contact}`,
          portfolio: data.portfolioLink,
        });
        sessionStorage.removeItem('navykus.pendingChampionshipProfile');
      } catch {
        // ignore profile update errors
      }
      return;
    }
    const pendingFindTeam = sessionStorage.getItem('navykus.pendingFindTeamProfile');
    if (pendingFindTeam) {
      try {
        const data = JSON.parse(pendingFindTeam);
        // Update user profile
        await platformApi.updateProfile({
          firstName: data.name,
          email: data.email,
          ageGroup: data.age,
          country: data.country,
          city: data.city,
          skills: data.skills,
          interests: data.interests,
          biography: data.whyLooking || data.shortBio || '',
          socialLinks: [{ label: data.contactType, url: data.contact }],
        });
        // Also create a TeamMembers entry in CMS so the participant appears on Find Team page
        try {
          await platformApi.createTeamMember({
            name: data.name,
            age: parseInt(data.age, 10) || 0,
            country: data.country,
            city: data.city || '',
            shortBio: data.shortBio || data.whyLooking || '',
            interests: data.interests || [],
            skills: data.skills || [],
            targetRoles: data.targetRoles || [],
            whyLooking: data.whyLooking || '',
            contact: data.contact,
            contactType: data.contactType || 'telegram',
            isApproved: true,
          });
        } catch {
          // ignore team member creation errors (user profile update already succeeded)
        }
        sessionStorage.removeItem('navykus.pendingFindTeamProfile');
      } catch {
        // ignore profile update errors
      }
      return;
    }
    if (!pendingInlineProfile) return;
    try {
      await platformApi.updateProfile({
        firstName: pendingInlineProfile.firstName,
        ageGroup: pendingInlineProfile.age,
        city: pendingInlineProfile.city,
        biography: pendingInlineProfile.interest ? `Interest: ${pendingInlineProfile.interest}\nContact: ${pendingInlineProfile.contact}` : pendingInlineProfile.contact,
      });
    } catch {
      // ignore profile update errors
    }
    setPendingInlineProfile(null);
    setFormName('');
    setFormAge('');
    setFormLocation('');
    setFormContact('');
  };

  const nearestTournament = featuredTournament
    ? {
        id: featuredTournamentPublicId || 'cms-featured',
        title: String(featuredTournament.title || effectiveTournaments?.[0]?.title || 'Navykus Global Case Cup: Sustainable Cities'),
        type: String(featuredTournament.type || 'Кейс-чемпионат'),
        date: String(featuredTournament.date || '18–25 Сентября 2026'),
        registrationDeadline: String(featuredTournament.registrationDeadline || '15 Сентября 2026'),
        description: String(featuredTournament.description || 'Разработка инновационных решений для урбанистических проблем будущего.'),
        skills: Array.isArray(featuredTournament.skills) ? featuredTournament.skills.map((s: unknown) => typeof s === 'string' ? s : String((s as { value?: string }).value || '')) : effectiveTournaments?.[0]?.skills || [],
        mentors: Array.isArray(featuredTournament.mentors) ? featuredTournament.mentors.map((m: unknown) => typeof m === 'string' ? m : String((m as { value?: string }).value || '')) : effectiveTournaments?.[0]?.mentors || [],
        maxParticipants: Number(featuredTournament.maxParticipants) || effectiveTournaments?.[0]?.maxParticipants || 120,
        suitableFor: String(featuredTournament.suitableFor || effectiveTournaments?.[0]?.suitableFor || ''),
        format: String(featuredTournament.format || ''),
      }
    : effectiveTournaments?.[0] ?? {
    id: 'fallback',
    title: 'Navykus Global Case Cup: Sustainable Cities',
    type: 'Кейс-чемпионат',
    date: '18–25 Сентября 2026',
    registrationDeadline: '15 Сентября 2026',
    description: 'Разработка инновационных решений для урбанистических проблем будущего. Международное жюри, реальные кейсы от урбанистов, архитекторов и экологов со всего мира.',
    skills: ['Системное мышление', 'Экологическое проектирование', 'Teamwork', 'Презентация'],
    mentors: ['д-р Марк Шпильман (MIT)', 'Елена Самарина (УрбанХаб)', 'Артур де Гроот (Роттердамский университет)'],
    maxParticipants: 120,
    suitableFor: 'Школьники 8–11 классов, увлеченные экологией, урбанистикой и социальными инновациями.',
    format: 'Онлайн (групповой этап, защита проектов по видеосвязи)',
  };
  const inlineInterestLabels: Record<string, string> = {
    projects: t('ui.app.d52e1ae8a0'),
    cases: t('ui.app.852dca4487'),
    debates: t('ui.app.b0f4d8ce6d'),
    research: t('ui.app.ac41209943'),
  };
  const resolvedLanguage = (i18n.resolvedLanguage || i18n.language || 'ru').split('-')[0];
  const currentLanguage = isSupportedLanguage(resolvedLanguage) ? resolvedLanguage : 'ru';
  const isAutoLanguage = !getSavedPreferredLanguage();
  const autoLanguage = detectSupportedLanguageFromBrowser();
  const languages = SUPPORTED_LANGUAGES.map((code) => ({
    code,
    label: t(`languages.${code}`),
    flag: LANGUAGE_FLAGS[code],
  }));
  const heroBrand = t('ui.app.b1a2ec16fe');
  const heroLead = t('ui.app.b847f4a47a');
  const heroLeadRest = heroLead.startsWith(heroBrand) ? heroLead.slice(heroBrand.length).trimStart() : heroLead;
  const inlineInputClass = (hasError: boolean) =>
    `w-full bg-white hover:bg-white/90 focus:bg-white border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-brand-dark outline-none transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] placeholder:text-brand-slate/40 ${
      hasError
        ? 'border-red-500/80 bg-red-50/40 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
        : 'border-[#c1b8b0] focus:border-[#8f99a8]'
    }`;
  const clearInlineFieldError = (field: keyof InlineFormErrors) => {
    setFormErrors((current) => ({ ...current, [field]: false }));
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#fff8f5] via-[#fffaf7] to-[#fdf6f4] text-[#111111] font-sans overflow-x-hidden selection:bg-brand-pink-dust/30 selection:text-brand-dark">

      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply z-0" style={{ backgroundImage: "radial-gradient(circle, #111 0.6px, transparent 0.8px)", backgroundSize: "18px 18px" }}></div>

      <GridBackground />

      <AmbientLighting />

      {currentPage !== 'find-team' && <StudyBackground />}

      <motion.header
        id="navbar-system"
        initial={false}
        animate={{
          y: showHeader ? 0 : -80,
          opacity: showHeader ? 1 : 0,
        }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] lg:w-[90%] max-w-6xl z-40"
      >
        <div className="relative w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 rounded-full border border-white/60 backdrop-blur-2xl bg-white/35 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_12px_40px_rgba(189,91,130,0.06)]">

          <button
            onClick={() => {
              navigateToPage('home');
            }}
            className="flex items-center gap-2 group cursor-pointer"
          >
                        <Logo
              className="w-5 h-6 sm:w-6 sm:h-7 drop-shadow-[0_4px_12px_rgba(188,70,56,0.15)] transition-transform duration-500 ease-out group-hover:scale-110"
            />
            <span className="font-semibold tracking-tight text-sm sm:text-base text-[#111111]">{t('ui.app.b1a2ec16fe')}</span>
          </button>

          <nav className="relative hidden md:flex items-center gap-4 lg:gap-8 text-[11px] lg:text-[12px] font-medium text-[#5b6472] uppercase tracking-wider">
            <button
              ref={(el) => { navRefs.current['about'] = el; }}
              onClick={() => navigateToPage('about')}
              className={`transition-colors cursor-pointer py-1 ${currentPage === 'about' ? 'text-[#bc4638]' : 'hover:text-[#bc4638]'}`}
            >{t('ui.app.d1a90b77df')}</button>
            <button
              ref={(el) => { navRefs.current['championship'] = el; }}
              onClick={() => navigateToPage('championship')}
              className={`transition-colors cursor-pointer py-1 ${currentPage === 'championship' ? 'text-[#bc4638]' : 'hover:text-[#bc4638]'}`}
            >{t('ui.app.2f57076dbe')}</button>
            <button
              ref={(el) => { navRefs.current['find-team'] = el; }}
              onClick={() => navigateToPage('find-team')}
              className={`transition-colors cursor-pointer py-1 ${currentPage === 'find-team' ? 'text-[#bc4638]' : 'hover:text-[#bc4638]'}`}
            >{t('ui.app.d13f387e64')}</button>
            <button
              ref={(el) => { navRefs.current['activities'] = el; }}
              onClick={() => navigateToPage('activities')}
              className={`transition-colors cursor-pointer py-1 ${currentPage === 'activities' ? 'text-[#bc4638]' : 'hover:text-[#bc4638]'}`}
            >{t('ui.app.814b71a2da')}</button>
            <button
              ref={(el) => { navRefs.current['blog'] = el; }}
              onClick={() => navigateToPage('blog')}
              className={`transition-colors cursor-pointer py-1 ${currentPage === 'blog' ? 'text-[#bc4638]' : 'hover:text-[#bc4638]'}`}
            >{t('ui.blogpage.nav.label')}</button>
            <motion.div
              layoutId="nav-indicator"
              className="absolute bottom-0 h-0.5 bg-[#bc4638] rounded-full pointer-events-none"
              initial={false}
              animate={{ left: indicatorStyle.left, width: indicatorStyle.width, opacity: indicatorStyle.opacity }}
              transition={{ type: 'spring', stiffness: 380, damping: 35 }}
            />
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLangDropdownOpen(!isLangDropdownOpen);
                }}
                className="flex items-center gap-1 bg-white/20 hover:bg-white/35 border border-white/40 px-2 sm:px-3 py-1.5 rounded-full text-[12px] font-mono shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)] transition-all cursor-pointer text-brand-dark"
              >
                <span>{LANGUAGE_FLAGS[currentLanguage]}</span>
                <span className="font-semibold tracking-wider text-[11px] sm:text-[12px]">{currentLanguage.toUpperCase()}</span>
                <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-slate/60 transition-transform duration-300 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isLangDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-40 rounded-2xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_15px_40px_rgba(189,91,130,0.1)] p-1.5 z-50 overflow-hidden"
                  >
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          clearPreferredLanguage();
                          void i18n.changeLanguage(detectSupportedLanguageFromBrowser());
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${isAutoLanguage
                            ? 'bg-brand-dark text-white font-medium'
                            : 'text-brand-slate hover:bg-white/40 hover:text-brand-dark'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{LANGUAGE_FLAGS[autoLanguage]}</span>
                          <span>{t('languages.auto')}</span>
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-wider">{autoLanguage}</span>
                      </button>
                      {languages.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => {
                            savePreferredLanguage(l.code);
                            void i18n.changeLanguage(l.code);
                            setIsLangDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${currentLanguage === l.code
                              ? 'bg-brand-dark text-white font-medium'
                              : 'text-brand-slate hover:bg-white/40 hover:text-brand-dark'
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{l.flag}</span>
                            <span>{l.label}</span>
                          </div>
                          {currentLanguage === l.code && (
                            <span className="w-1.5 h-1.5 bg-brand-terracotta rounded-full"></span>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((value) => !value)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/20 text-brand-dark shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)] transition-all hover:bg-white/35"
              aria-label={isMobileMenuOpen ? t('ui.app.24547dfea3') : t('ui.app.625200f23b')}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <button
              onClick={authUser ? navigateToProfile : openAuthModal}
              className="hidden sm:block bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-[12px] font-medium shadow-lg shadow-[#bc4638]/20 hover:scale-[1.02] transition-transform cursor-pointer whitespace-nowrap"
            >
              <span>{authUser ? t('platform.nav.profile') : t('ui.authmodal.headerButton')}</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden mt-3 rounded-3xl border border-white/60 bg-white/75 p-3 backdrop-blur-2xl shadow-[0_18px_50px_rgba(189,91,130,0.12)]"
            >
              <div className="grid gap-1 text-left text-xs font-mono uppercase tracking-wider text-brand-slate">
                <button onClick={() => navigateToPage('about')} className={`rounded-2xl px-4 py-3 text-left transition-colors ${currentPage === 'about' ? 'bg-brand-dark text-white' : 'hover:bg-white/60 hover:text-brand-dark'}`}>{t('ui.app.d1a90b77df')}</button>
                <button onClick={() => navigateToPage('championship')} className={`rounded-2xl px-4 py-3 text-left transition-colors ${currentPage === 'championship' ? 'bg-brand-dark text-white' : 'hover:bg-white/60 hover:text-brand-dark'}`}>{t('ui.app.2f57076dbe')}</button>
                <button onClick={() => navigateToPage('find-team')} className={`rounded-2xl px-4 py-3 text-left transition-colors ${currentPage === 'find-team' ? 'bg-brand-dark text-white' : 'hover:bg-white/60 hover:text-brand-dark'}`}>{t('ui.app.d13f387e64')}</button>
                <button onClick={() => navigateToPage('activities')} className={`rounded-2xl px-4 py-3 text-left transition-colors ${currentPage === 'activities' ? 'bg-brand-dark text-white' : 'hover:bg-white/60 hover:text-brand-dark'}`}>{t('ui.app.814b71a2da')}</button>
                <button onClick={() => navigateToPage('blog')} className={`rounded-2xl px-4 py-3 text-left transition-colors ${currentPage === 'blog' ? 'bg-brand-dark text-white' : 'hover:bg-white/60 hover:text-brand-dark'}`}>{t('ui.blogpage.nav.label')}</button>
                <button onClick={authUser ? navigateToProfile : openAuthModal} className="mt-1 rounded-2xl bg-gradient-to-r from-[#bc4638] to-[#bd5b82] px-4 py-3 text-left font-semibold text-white shadow-lg shadow-[#bc4638]/15">{authUser ? t('platform.nav.profile') : t('ui.authmodal.headerButton')}</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <Suspense fallback={<PageFallback page={currentPage} />}>
      {isPlatformRoute ? (
        <PlatformPage onLogin={openAuthModal} />
      ) : currentPage === 'not-found' ? (
        <NotFoundPage onBackToHome={() => navigateToPage('home')} />
      ) : currentPage === 'home' ? (
        <>
          <section
            id="hero-intro"
            className="relative z-10 pt-36 pb-16 md:pt-48 md:pb-24 max-w-7xl mx-auto px-[6%] md:px-[10%] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
          >
            <motion.div {...heroFadeUpLarge} className="lg:col-span-7 space-y-8 text-left z-10">
              <div className="flex flex-col gap-4">
                <h1 className="text-3xl sm:text-4xl md:text-[44px] lg:text-[52px] xl:text-[58px] leading-[1.1] text-[#111111] font-serif font-light italic tracking-tight text-balance">
                  <span className="hero-brand-word not-italic font-semibold">{heroBrand}</span>
                  {heroLeadRest ? ` ${heroLeadRest}` : ''}
                  <br />
                  <span className="not-italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#bc4638] to-[#bd5b82]">{t('ui.app.4e6bae67fb')}</span><br />{t('ui.app.36b5f70ec0')}</h1>
                <p className="text-[#5b6472] text-sm sm:text-base md:text-lg leading-relaxed font-normal md:font-light text-balance">{t('ui.app.ca9bce21fd')}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <button
                  onClick={() => openApplyModal()}
                  className="px-8 py-4 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white rounded-2xl text-[14px] font-medium shadow-xl shadow-[#bc4638]/25 hover:shadow-[#bc4638]/35 hover:scale-[1.01] transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
                >
                  <span>{t('ui.app.24cd8dc78d')}</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>

                <button
                  onClick={() => {
                    setCurrentPage('find-team'); updatePath('find-team');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-8 py-4 bg-white/40 backdrop-blur-md border border-[#d8d1cc] hover:border-[#bc4638]/60 rounded-2xl text-[14px] font-medium text-[#5b6472] hover:text-[#bc4638] transition-all text-center cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.01)]"
                >{t('ui.app.d13f387e64')}</button>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-x-8 gap-y-4 text-xs text-brand-slate/90">
                {(stats?.length > 0 ? stats : [{ value: '15+', label: t('ui.app.ffecc101e5') }]).map((stat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#bc4638]" />
                    <span><strong>{stat.value}</strong>{stat.label}</span>
                  </div>
                ))}
              </div>

            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="hidden lg:flex lg:col-span-5 justify-center lg:justify-end relative"
            >
              <div className="relative w-full max-w-[420px] lg:max-w-none lg:-mr-8">
                <GlassCrystal />
              </div>
            </motion.div>
          </section>

          <section id="what-is-navykus" className="relative z-10 py-16 md:py-24 max-w-7xl mx-auto px-[6%] md:px-[10%] space-y-12 section-accent-warm">
            <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto space-y-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-brand-dark tracking-tight">
                {t('ui.app.aacca2db')}</h2>
              <p className="text-sm sm:text-base md:text-lg text-brand-slate font-normal md:font-light leading-relaxed max-w-2xl mx-auto text-balance">{t('ui.app.2542ef5a41')}</p>
            </motion.div>

            <motion.div {...cardStaggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pillars?.map((pillar, index) => {
                const PillarIcon = [Globe, CheckCircle2, Clock][index % 3];
                return (
                <motion.div
                  key={index}
                  variants={cardItemFadeUp.variants}
                  tabIndex={0}
                  className="group relative overflow-hidden bg-white/[0.12] glass-xl surface-elevated-soft border border-white/[0.15] p-6 sm:p-7 rounded-2xl hover:bg-white/[0.2] hover:border-[#bc4638]/25 focus-visible:ring-2 focus-visible:ring-[#bc4638]/25 transition-[background-color,border-color,box-shadow,transform] duration-300 flex flex-col justify-between hover:-translate-y-1"
                >
                  <PillarIcon
                    className="pointer-events-none absolute right-5 top-3 h-14 w-14 select-none text-[#bc4638]/[0.11] transition-transform duration-300 group-hover:scale-105"
                    aria-hidden="true"
                    strokeWidth={1.5}
                  />
                  <div className="space-y-4 pr-10">
                    <div className="font-mono text-[11px] sm:text-[10px] text-[#bd5b82] font-semibold tracking-wider">
                      {pillar.label}
                    </div>
                    <h3 className="text-lg font-serif font-medium text-brand-dark">
                      {pillar.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-brand-slate font-normal md:font-light leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </motion.div>
              );
              })}
            </motion.div>
          </section>

          <section id="nearest-championship" className="relative z-10 py-16 md:py-20 max-w-7xl mx-auto px-[6%] md:px-[10%] section-accent-rose">
            <motion.div
              {...fadeUpLarge}
              className="overflow-hidden bg-white/[0.12] glass-xl surface-elevated border border-white/[0.15] rounded-3xl"
            >
              <BrandImage
                src="/images/championship/championship-presentation.jpg"
                alt={t('ui.enhancements.championshipCardAlt')}
                aspectRatio="32 / 7"
                objectPosition="50% 38%"
                sizes="(min-width: 1280px) 1100px, 100vw"
                className="rounded-none border-0 shadow-none"
                overlay
              />
              <div className="space-y-6 p-6 text-left sm:p-8 lg:p-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] sm:text-[10px] font-mono tracking-wider text-[#bc4638] bg-[#bc4638]/10 px-2.5 py-1 rounded-md uppercase font-semibold">{t('ui.app.8ca84fc116')}</span>
                  <span className="text-[10px] font-mono text-brand-slate flex items-center gap-1.5 bg-white/40 px-2.5 py-1 rounded-md border border-white/60">
                    <Clock className="w-3.5 h-3.5 text-[#bd5b82]" />{t('ui.app.aa324b069f')}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-brand-dark tracking-tight leading-tight">
                  {nearestTournament.title}
                </h3>

                <p className="text-xs sm:text-sm md:text-base text-brand-slate font-normal md:font-light leading-relaxed">
                  {nearestTournament.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <div className="text-[11px] sm:text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">{t('ui.app.411ef17e3a')}</div>
                    <div className="text-xs text-brand-slate font-normal md:font-light">{nearestTournament.suitableFor}</div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[11px] sm:text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">{t('ui.app.7f93cb9828')}</div>
                    <div className="text-xs text-brand-slate font-normal md:font-light">
                      <strong>{t('ui.app.b7ba3e2581')}</strong> {nearestTournament.date}<br />
                      <strong>{t('ui.app.2c0ba7b4a0')}</strong> {nearestTournament.registrationDeadline}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[11px] sm:text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">{t('ui.app.40c83f7ed9')}</div>
                    <div className="text-xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#bc4638] to-[#bd5b82]">
                      {nearestTournament.maxParticipants}{t('ui.app.1995337599')}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/60 bg-white/35 p-4 surface-elevated-soft backdrop-blur-md">
                  <div className="mb-3">
                    <h4 className="text-xl font-serif font-semibold leading-tight text-brand-dark sm:text-2xl">
                      {t('ui.app.2060fe9f62')}
                    </h4>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {featuredExperts?.slice(0, 3).map((expert) => (
                      <div key={expert.id} className="rounded-xl border border-white/55 bg-white/45 p-3">
                        <div className="font-serif text-lg font-semibold leading-tight text-brand-dark">{expert.name}</div>
                        <div className="mt-1.5 text-xs leading-relaxed text-brand-slate">{expert.role}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-3">
                  {nearestTournament.skills.map((skill, sIdx) => (
                    <span key={`${skill}-${sIdx}`} className="text-xs font-mono font-medium tracking-wide bg-[#bc4638]/8 text-[#bc4638] border border-[#bc4638]/25 px-3 py-1 rounded-full shadow-[0_2px_4px_rgba(188,70,56,0.04)]">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
                  <button onClick={() => openApplyModal(nearestTournament.id)} className="px-6 py-3 bg-[#bc4638] text-white hover:bg-[#bc4638]/90 text-xs sm:text-sm font-mono tracking-wider rounded-xl transition-all shadow-md shadow-[#bc4638]/15 cursor-pointer text-center font-medium">{t('ui.app.762a52a7bb')}</button>
                  <button onClick={() => { setCurrentPage('championship'); updatePath('championship'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-6 py-3 bg-white/40 border border-[#d8d1cc] text-[#5b6472] hover:border-brand-dark/40 text-xs sm:text-sm font-mono tracking-wider rounded-xl transition-all cursor-pointer text-center">{t('ui.app.2f57076dbe')}</button>
                  <button onClick={() => { setCurrentPage('find-team'); updatePath('find-team'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-6 py-3 bg-white/40 border border-[#d8d1cc] text-[#5b6472] hover:border-brand-dark/40 text-xs sm:text-sm font-mono tracking-wider rounded-xl transition-all cursor-pointer text-center">{t('ui.app.d13f387e64')}</button>
                </div>
              </div>

            </motion.div>
          </section>

          <section id="embedded-application-form" className="relative z-10 py-16 md:py-24 max-w-7xl mx-auto px-[6%] md:px-[10%]">
            <motion.div
              {...fadeUpLarge}
              className="bg-white/[0.12] glass-xl surface-elevated border border-white/[0.15] rounded-3xl p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              <div className="lg:col-span-5 space-y-4 text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-brand-dark tracking-tight leading-tight">{t('ui.app.031b5a9779')}</h2>

                <p className="text-xs sm:text-sm text-brand-slate font-normal md:font-light leading-relaxed">{t('ui.app.8062a560c4')}</p>

                <div className="space-y-2 pt-4">
                  <div className="flex items-center gap-2 text-xs text-brand-slate">
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                    <span>{t('ui.app.a63c2f5651')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-brand-slate">
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                    <span>{t('ui.app.fb613f5591')}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 bg-white/[0.15] glass-panel surface-elevated-soft border border-white/[0.15] rounded-2xl p-6 sm:p-8">
                <AnimatePresence mode="wait">
                  {formSubmitStatus === 'success' ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-8"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center shrink-0 shadow-md">
                          <CheckCircle2 className="w-6 h-6 animate-bounce" />
                        </div>
                        <div className="space-y-3 text-left">
                          <h3 className="text-base font-serif text-brand-dark">{t('ui.app.0d65b9d27c')}</h3>
                          <p className="text-xs sm:text-sm text-brand-slate max-w-md font-light leading-relaxed">{t('ui.app.eca55dace1')}</p>
                          <button onClick={() => setFormSubmitStatus('idle')} className="px-6 py-2 bg-brand-dark text-white text-xs font-mono tracking-wider rounded-xl hover:bg-brand-dark/95 transition-all">{t('ui.app.b35da1ef1c')}</button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleInlineSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="text-left">
                          <label className="block text-[10px] font-mono tracking-wider text-brand-dark/70 mb-1 uppercase font-semibold">{t('ui.app.8b4a2775bb')}</label>
                          <input type="text" value={formName} onChange={(e) => { setFormName(e.target.value); clearInlineFieldError('name'); }} placeholder={t('ui.app.c1830703d0')} aria-invalid={formErrors.name} className={inlineInputClass(formErrors.name)} />
                        </div>
                        <div className="text-left">
                          <label className="block text-[10px] font-mono tracking-wider text-brand-dark/70 mb-1 uppercase font-semibold">{t('ui.app.b7cc349dbb')}</label>
                          <input type="text" value={formAge} onChange={(e) => { setFormAge(e.target.value); clearInlineFieldError('age'); }} placeholder="16" aria-invalid={formErrors.age} className={inlineInputClass(formErrors.age)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="text-left">
                          <label className="block text-[10px] font-mono tracking-wider text-brand-dark/70 mb-1 uppercase font-semibold">{t('ui.app.7acec174f3')}</label>
                          <input type="text" value={formLocation} onChange={(e) => { setFormLocation(e.target.value); clearInlineFieldError('location'); }} placeholder={t('ui.app.1734a8f063')} aria-invalid={formErrors.location} className={inlineInputClass(formErrors.location)} />
                        </div>
                        <div className="text-left">
                          <label className="block text-[10px] font-mono tracking-wider text-brand-dark/70 mb-1 uppercase font-semibold">{t('ui.app.0751cc5d9c')}</label>
                          <input type="text" value={formContact} onChange={(e) => { setFormContact(e.target.value); clearInlineFieldError('contact'); }} placeholder={t('ui.app.7d521595ce')} aria-invalid={formErrors.contact} className={inlineInputClass(formErrors.contact)} />
                        </div>
                      </div>

                      <div className="text-left">
                        <label className="block text-[10px] font-mono tracking-wider text-brand-dark/70 mb-1 uppercase font-semibold">{t('ui.app.d3e56289ef')}</label>
                        <select value={formInterest} onChange={(e) => setFormInterest(e.target.value)} className="w-full bg-white hover:bg-white/90 focus:bg-white border border-[#c1b8b0] focus:border-[#8f99a8] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-brand-dark outline-none transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                          <option value="projects" className="bg-brand-bg-2 text-brand-dark">{t('ui.app.d52e1ae8a0')}</option>
                          <option value="cases" className="bg-brand-bg-2 text-brand-dark">{t('ui.app.852dca4487')}</option>
                          <option value="debates" className="bg-brand-bg-2 text-brand-dark">{t('ui.app.b0f4d8ce6d')}</option>
                          <option value="research" className="bg-brand-bg-2 text-brand-dark">{t('ui.app.ac41209943')}</option>
                        </select>
                      </div>

                      <div className="pt-2">
                        <button type="submit" disabled={false} className="w-full bg-brand-dark hover:bg-[#bc4638] text-white text-xs font-mono tracking-widest py-3.5 rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 font-medium">
                          <span>{t('platform.auth.registerAction')}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </section>

          <section id="trust-block" className="relative z-10 py-16 md:py-24 max-w-7xl mx-auto px-[6%] md:px-[10%] space-y-12 section-accent-warm">
            <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-brand-dark tracking-tight">
                {t('ui.app.19816f01')}</h2>
              <p className="text-sm sm:text-base text-brand-slate font-normal md:font-light leading-relaxed">{t('ui.app.c8e427d5b3')}</p>
            </motion.div>

            <motion.div {...cardStaggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayedTrustPoints.map((item, index) => (
                <motion.div
                  key={item.id}
                  variants={cardItemFadeUp.variants}
                  className={`relative overflow-hidden bg-white/[0.12] glass-card surface-elevated-soft border border-white/[0.15] p-6 rounded-2xl flex flex-col justify-between ${
                    index === 0 || index === 3 || index === 4 ? 'md:col-span-2' : 'md:col-span-1'
                  }`}
                >
                  <div className="pointer-events-none absolute right-5 top-3 select-none font-serif text-5xl leading-none text-[#bc4638]/[0.11]">
                    {index + 1}
                  </div>
                  <div className="space-y-3 text-left">
                    <h3 className="text-xl sm:text-2xl font-serif font-semibold text-brand-dark">{item.title}</h3>
                    <p className="text-sm sm:text-base text-brand-slate font-normal md:font-light leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </section>

          <section id="final-cta" className="relative z-10 py-16 md:py-24 max-w-5xl mx-auto px-[6%] md:px-[10%] section-accent-rose">
            <motion.div
              {...fadeInScale}
              className="bg-gradient-to-br from-[#bc4638]/8 via-white/[0.12] to-[#bd5b82]/8 glass-xl surface-elevated border border-white/[0.15] rounded-3xl p-8 sm:p-12 text-center space-y-6"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-brand-dark tracking-tight leading-tight max-w-2xl mx-auto">
                {t('ui.app.e07687c4')}</h2>
              <p className="text-sm sm:text-base text-brand-slate font-normal md:font-light leading-relaxed max-w-md mx-auto">{t('ui.app.ec08c69dd3')}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button onClick={() => openApplyModal()} className="px-8 py-3.5 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white hover:opacity-95 text-xs font-mono tracking-widest rounded-xl transition-all shadow-lg shadow-[#bc4638]/15 cursor-pointer font-semibold uppercase">{t('ui.app.762a52a7bb')}</button>
                <button onClick={() => { setCurrentPage('find-team'); updatePath('find-team'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-8 py-3.5 bg-white/50 border border-[#d8d1cc] text-[#5b6472] hover:border-[#bc4638]/60 text-xs font-mono tracking-widest rounded-xl transition-all cursor-pointer uppercase">{t('ui.app.d4b60991e4')}</button>
              </div>
            </motion.div>
          </section>
        </>
      ) : currentPage === 'about' ? (
        <div className="w-full">
          <AboutProjectPage
            onBackToHome={() => {
              setCurrentPage('home'); updatePath('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToSection={scrollToSection}
            onOpenApplyModal={() => openApplyModal()}
          />
        </div>
      ) : currentPage === 'championship' ? (
        <div className="w-full">
          <ChampionshipPage
            onBackToHome={() => {
              setCurrentPage('home'); updatePath('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToSection={scrollToSection}
            onOpenApplyModal={() => openApplyModal()}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        </div>
      ) : currentPage === 'find-team' ? (
        <div className="w-full">
          <FindTeamPage
            onNavigateToSection={scrollToSection}
            onOpenApplyModal={() => openApplyModal()}
            authUser={authUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        </div>
      ) : currentPage === 'blog' ? (
        <div className="w-full">
          <BlogPage
            onCreateBlog={() => {
              if (authUser) {
                setIsMobileMenuOpen(false);
                setIsAuthModalOpen(false);
                window.history.pushState({}, '', '/profile/blog/new');
                window.dispatchEvent(new PopStateEvent('popstate'));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                openAuthModal();
              }
            }}
          />
        </div>
      ) : (
        <div className="w-full">
          <ActivitiesPage
            onNavigateToSection={scrollToSection}
            onOpenApplyModal={() => openApplyModal()}
          />
        </div>
      )}
      </Suspense>

      <AppFooter contactSettings={contactSettings} onNavigate={(page) => { setCurrentPage(page as Page); updatePath(page as Page); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />

      <ScrollToTop show={showScrollTop} onClick={scrollToTop} />

      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedTournamentId={selectedTourney}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthChange={(user) => { setAuthUser(user); void applyPendingInlineProfile(user); }}
      />
    </div>
  );
}
