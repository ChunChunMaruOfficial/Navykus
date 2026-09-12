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
import CmsImage from './components/CmsImage';
import PageSkeleton from './components/PageSkeletons';
import StudyBackground from './components/StudyBackground';
import Logo from './components/Logo';
import GridBackground from './components/GridBackground';
import AmbientLighting from './components/AmbientLighting';
import NotFoundPage from './components/NotFoundPage';
import LegalPage from './components/LegalPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import AppFooter from './components/AppFooter';
import ScrollToTop from './components/ScrollToTop';
import { I18nGate } from './components/I18nGate';
import CookieConsent from './components/CookieConsent';
import useScrollBehavior from './hooks/useScrollBehavior';
import usePageMeta from './hooks/usePageMeta';
import { fetchContactSettings, type ContactSettings } from './api';
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
import { useActiveChampionship } from './hooks/useCmsTournaments';
import { championshipDirections } from './championship-directions';
import JuryCards from './components/JuryCards';
import { useCmsPageTexts } from './hooks/useCmsPageTexts';
import { ALL_EDITABLE_PAGE_TEXT_PAGES } from './page-texts';
import {
  fadeUp,
  fadeUpLarge,
  fadeInScale,
  heroFadeUpLarge,
} from './motion-animations';
import type { TeamApplicationContext } from './types';

const AboutProjectPage = lazy(() => import('./components/AboutProjectPage'));
const ChampionshipPage = lazy(() => import('./components/ChampionshipPage'));
const ActivitiesPage = lazy(() => import('./components/ActivitiesPage'));
const FindTeamPage = lazy(() => import('./components/FindTeamPage'));

const PAGE_PATHS = ['about', 'championship', 'activities', 'find-team'] as const;
type Page = 'home' | 'not-found' | 'legal' | 'privacy' | typeof PAGE_PATHS[number];
const REMOVED_PLATFORM_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/profile', '/participants', '/championships', '/platform/admin'] as const;

const ACTIVITIES_EVENTS_PATH = '/activities/events';
const ACTIVITIES_OPPORTUNITIES_PATH = '/activities/opportunities';

const cardEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

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
  const normalizedPath = window.location.pathname.replace(/\/$/, '') || '/';
  if (REMOVED_PLATFORM_PATHS.some((platformPath) => normalizedPath === platformPath || normalizedPath.startsWith(`${platformPath}/`))) return 'home';
  const path = window.location.pathname.replace(/\/$/, '');
  if (!path) return 'home';
  // Extract first path segment to support sub-routes like /activities/events
  const page = path.slice(1).split('/')[0];
  if (isPagePath(page)) return page;
  if (page === 'legal') return 'legal';
  if (page === 'privacy') return 'privacy';
  return 'not-found';
};

const isRemovedPlatformPath = () => {
  if (typeof window === 'undefined') return false;
  const normalizedPath = window.location.pathname.replace(/\/$/, '') || '/';
  return REMOVED_PLATFORM_PATHS.some((platformPath) => normalizedPath === platformPath || normalizedPath.startsWith(`${platformPath}/`));
};

const legalSubpageFromPath = (): 'privacy' | 'terms' | null => {
  if (typeof window === 'undefined') return null;
  const segments = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
  if (segments[0] === 'legal' && (segments[1] === 'privacy' || segments[1] === 'terms')) {
    return segments[1];
  }
  return null;
};

function PageFallback({ page }: { page: Page }) {
  if (page === 'legal' || page === 'privacy') return <PageSkeleton page="about" />;
  return <PageSkeleton page={page} />;
}

export default function App() {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const { championship: nearestTournament } = useActiveChampionship();
  const { texts: homePageTexts } = useCmsPageTexts(ALL_EDITABLE_PAGE_TEXT_PAGES);
  // Jury of the active championship (filled in right inside the championship in the CMS).
  const featuredJury = nearestTournament?.jury ?? [];
  // Texts that used to live in the removed CMS collections (pillars / stats / trust points)
  // are now regular page texts, editable in «Дерево текстов» → «Главная».
  const optionalText = (key: string) => (i18n.exists(key) ? t(key).trim() : '');
  const pillars = [1, 2, 3]
    .map((n) => ({
      label: optionalText(`ui.app.pillar${n}Label`),
      title: optionalText(`ui.app.pillar${n}Title`),
      description: optionalText(`ui.app.pillar${n}Text`),
    }))
    .filter((pillar) => pillar.title || pillar.description);
  const stats = [{ value: optionalText('ui.app.statValue'), label: optionalText('ui.app.statLabel') }]
    .filter((stat) => stat.value || stat.label);
  const [currentPage, setCurrentPage] = useState<Page>(getPageFromPath);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applicationContext, setApplicationContext] = useState<TeamApplicationContext | undefined>(undefined);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [legalPage, setLegalPage] = useState<'privacy' | 'terms' | null>(legalSubpageFromPath);
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const navContainerRef = useRef<HTMLElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [contactSettings, setContactSettings] = useState<ContactSettings | null>(null);
  const displayedTrustPoints = [1, 2, 3, 4, 5, 6]
    .map((n) => ({
      id: `trust-${n}`,
      title: optionalText(`ui.app.trust${n}Title`),
      description: optionalText(`ui.app.trust${n}Text`),
    }))
    .filter((item) => item.title || item.description);
  const trustBlockTitle = homePageTexts['ui.app.19816f01']?.trim() || '';
  const trustBlockDescription = homePageTexts['ui.app.c8e427d5b3']?.trim() || '';
  const shouldShowTrustBlock = Boolean(trustBlockTitle || trustBlockDescription || displayedTrustPoints.length);

  useEffect(() => {
    const handlePopState = () => {
      if (isRemovedPlatformPath()) {
        window.history.replaceState({}, '', '/');
      }
      const page = getPageFromPath();
      setCurrentPage(page);
      setLegalPage(page === 'legal' ? legalSubpageFromPath() : null);
    };
    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const previewId = new URLSearchParams(window.location.search).get('previewId');
    if (!previewId) return;
    const timer = window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>(`[data-preview-id="${CSS.escape(previewId)}"]`);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('ring-2', 'ring-[#bc4638]', 'ring-offset-2', 'ring-offset-white');
    }, 500);
    return () => window.clearTimeout(timer);
  }, [currentPage]);

  useEffect(() => {
    fetchContactSettings().then(setContactSettings);
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

  // Esc closes the header language list and the mobile menu (popups use useModalBehavior).
  useEffect(() => {
    if (!isLangDropdownOpen && !isMobileMenuOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || isModalOpen) return;
      setIsLangDropdownOpen(false);
      setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLangDropdownOpen, isMobileMenuOpen, isModalOpen]);

  const openApplyModal = (context?: TeamApplicationContext | string) => {
    setApplicationContext(typeof context === 'string' ? { tournamentId: context, sourceId: context, sourceType: 'championship' } : context);
    setIsModalOpen(true);
  };

  const updateNavIndicator = useCallback(() => {
    if (currentPage === 'home' || currentPage === 'not-found') {
      setIndicatorStyle({ left: 0, width: 0, opacity: 0 });
      return;
    }
    const activeRef = navRefs.current[currentPage];
    const container = navContainerRef.current;
    if (!activeRef || !container) return;
    // Measure the active button relative to the nav container itself, so the
    // indicator stays aligned even if the nav shifts inside the header.
    const buttonRect = activeRef.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    setIndicatorStyle({
      left: buttonRect.left - containerRect.left,
      width: buttonRect.width,
      opacity: 1,
    });
  }, [currentPage]);

  useEffect(() => {
    const container = navContainerRef.current;
    let frameId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    const measure = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => updateNavIndicator());
    };

    measure();
    window.addEventListener('resize', measure);

    // Re-measure whenever the nav layout changes — not just on resize.
    // On reload, translations load and web fonts swap asynchronously after the
    // first render, so measuring once on mount leaves the indicator stuck at
    // the position of the pre-translation (wide) labels.
    if (container && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(container);
    }
    if (container && typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(measure);
      mutationObserver.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => undefined);
    }

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', measure);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
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
    // «Найти команду» buttons (championship page, participation scenarios) point here;
    // the home page has no such section any more — open the team search page instead.
    if (id === 'scenarios' || id === 'find-team') {
      navigateToPage('find-team');
      return;
    }
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

  const nearestTournamentFormat = nearestTournament?.format.split(/\r?\n/)[0]?.trim() || '';
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
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#fff8f5] via-[#fffaf7] to-[#fdf6f4] text-[#111111] font-sans overflow-x-hidden selection:bg-brand-pink-dust/30 selection:text-brand-dark">

      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply z-0" style={{ backgroundImage: "radial-gradient(circle, #111 0.6px, transparent 0.8px)", backgroundSize: "18px 18px" }}></div>

      <GridBackground />

      <AmbientLighting />

      {currentPage !== 'find-team' && <StudyBackground />}

      <I18nGate>
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

          <nav ref={navContainerRef} className="relative hidden md:flex items-center gap-4 lg:gap-8 text-[11px] lg:text-[12px] font-medium text-[#5b6472] uppercase tracking-wider">
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
              onClick={() => {
                setIsMobileMenuOpen(false);
                openApplyModal({ sourceType: 'home', sourceTitle: t('ui.app.762a52a7bb') });
              }}
              className="hidden sm:block bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-[12px] font-medium shadow-lg shadow-[#bc4638]/20 hover:scale-[1.02] transition-transform cursor-pointer whitespace-nowrap"
            >
              <span>{t('ui.app.762a52a7bb')}</span>
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
                <button onClick={() => { setIsMobileMenuOpen(false); openApplyModal({ sourceType: 'home', sourceTitle: t('ui.app.762a52a7bb') }); }} className="mt-1 rounded-2xl bg-gradient-to-r from-[#bc4638] to-[#bd5b82] px-4 py-3 text-left font-semibold text-white shadow-lg shadow-[#bc4638]/15">{t('ui.app.762a52a7bb')}</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <Suspense fallback={<PageFallback page={currentPage} />}>
      {currentPage === 'not-found' ? (
        <NotFoundPage onBackToHome={() => navigateToPage('home')} />
      ) : currentPage === 'home' ? (
        <>
          <section
            id="hero-intro"
            className="relative z-10 pt-28 pb-16 md:pt-36 md:pb-24 max-w-7xl mx-auto px-[6%] md:px-[10%] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
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
                  onClick={() => openApplyModal({ sourceType: 'home', sourceTitle: t('ui.app.24cd8dc78d') })}
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

              {stats.length > 0 && (
                <div className="pt-2 flex flex-wrap items-center gap-x-8 gap-y-4 text-xs text-brand-slate/90">
                  {stats.map((stat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#bc4638]" />
                      <span><strong>{stat.value}</strong> {stat.label}</span>
                    </div>
                  ))}
                </div>
              )}

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
              {pillars.map((pillar, index) => {
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

          {nearestTournament && (
          <section id="nearest-championship" className="relative z-10 py-16 md:py-20 max-w-7xl mx-auto px-[6%] md:px-[10%] section-accent-rose">
            <motion.div
              {...fadeUpLarge}
              className="overflow-hidden bg-white/[0.12] glass-xl surface-elevated border border-white/[0.15] rounded-3xl"
            >
              <CmsImage
                slot="home.nearest-championship.cover"
                overrideSrc={nearestTournament.coverImage}
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
                  {nearestTournamentFormat && (
                    <span className="text-[10px] font-mono text-brand-slate flex items-center gap-1.5 bg-white/40 px-2.5 py-1 rounded-md border border-white/60">
                      <Clock className="w-3.5 h-3.5 text-[#bd5b82]" />{nearestTournamentFormat}</span>
                  )}
                </div>

                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-brand-dark tracking-tight leading-tight">
                  {nearestTournament.title}
                </h3>

                <p className="text-xs sm:text-sm md:text-base text-brand-slate font-normal md:font-light leading-relaxed">
                  {nearestTournament.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {nearestTournament.suitableFor && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] sm:text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">{t('ui.app.411ef17e3a')}</div>
                      <div className="text-xs text-brand-slate font-normal md:font-light">{nearestTournament.suitableFor}</div>
                    </div>
                  )}
                  {(nearestTournament.date || nearestTournament.registrationDeadline) && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] sm:text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">{t('ui.app.7f93cb9828')}</div>
                      <div className="text-xs text-brand-slate font-normal md:font-light">
                        {nearestTournament.date && (<><strong>{t('ui.app.b7ba3e2581')}</strong> {nearestTournament.date}<br /></>)}
                        {nearestTournament.registrationDeadline && (<><strong>{t('ui.app.2c0ba7b4a0')}</strong> {nearestTournament.registrationDeadline}</>)}
                      </div>
                    </div>
                  )}
                  {nearestTournament.maxParticipants > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] sm:text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">{t('ui.app.40c83f7ed9')}</div>
                      <div className="text-xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#bc4638] to-[#bd5b82]">
                        {nearestTournament.maxParticipants} {t('ui.app.1995337599')}</div>
                    </div>
                  )}
                </div>

                {featuredJury.length > 0 && (
                <div className="rounded-2xl border border-white/60 bg-white/35 p-4 surface-elevated-soft backdrop-blur-md">
                  <div className="mb-3">
                    <h4 className="text-xl font-serif font-semibold leading-tight text-brand-dark sm:text-2xl">
                      {t('ui.app.2060fe9f62')}
                    </h4>
                  </div>
                  <JuryCards members={featuredJury.slice(0, 3)} />
                </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
                  <button onClick={() => openApplyModal({ sourceType: 'championship', sourceId: nearestTournament.id, tournamentId: nearestTournament.id, sourceTitle: nearestTournament.title, directions: championshipDirections(nearestTournament.themesText) })} className="px-6 py-3 bg-[#bc4638] text-white hover:bg-[#bc4638]/90 text-xs sm:text-sm font-mono tracking-wider rounded-xl transition-all shadow-md shadow-[#bc4638]/15 cursor-pointer text-center font-medium">{t('ui.app.762a52a7bb')}</button>
                  <button onClick={() => { setCurrentPage('championship'); updatePath('championship'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-6 py-3 bg-white/40 border border-[#d8d1cc] text-[#5b6472] hover:border-brand-dark/40 text-xs sm:text-sm font-mono tracking-wider rounded-xl transition-all cursor-pointer text-center">{t('ui.app.2f57076dbe')}</button>
                  <button onClick={() => { setCurrentPage('find-team'); updatePath('find-team'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-6 py-3 bg-white/40 border border-[#d8d1cc] text-[#5b6472] hover:border-brand-dark/40 text-xs sm:text-sm font-mono tracking-wider rounded-xl transition-all cursor-pointer text-center">{t('ui.app.d13f387e64')}</button>
                </div>
              </div>

            </motion.div>
          </section>
          )}

          {shouldShowTrustBlock && (
            <section id="trust-block" className="relative z-10 py-16 md:py-24 max-w-7xl mx-auto px-[6%] md:px-[10%] space-y-12 section-accent-warm">
              {(trustBlockTitle || trustBlockDescription) && (
                <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto space-y-3">
                  {trustBlockTitle && (
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-brand-dark tracking-tight">
                      {trustBlockTitle}
                    </h2>
                  )}
                  {trustBlockDescription && (
                    <p className="text-sm sm:text-base text-brand-slate font-normal md:font-light leading-relaxed">{trustBlockDescription}</p>
                  )}
                </motion.div>
              )}

              {displayedTrustPoints.length > 0 && (
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
                        {item.title && <h3 className="text-xl sm:text-2xl font-serif font-semibold text-brand-dark">{item.title}</h3>}
                        {item.description && <p className="text-sm sm:text-base text-brand-slate font-normal md:font-light leading-relaxed">{item.description}</p>}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </section>
          )}

          <section id="final-cta" className="relative z-10 py-16 md:py-24 max-w-5xl mx-auto px-[6%] md:px-[10%] section-accent-rose">
            <motion.div
              {...fadeInScale}
              className="bg-gradient-to-br from-[#bc4638]/8 via-white/[0.12] to-[#bd5b82]/8 glass-xl surface-elevated border border-white/[0.15] rounded-3xl p-8 sm:p-12 text-center space-y-6"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-brand-dark tracking-tight leading-tight max-w-2xl mx-auto">
                {t('ui.app.e07687c4')}</h2>
              <p className="text-sm sm:text-base text-brand-slate font-normal md:font-light leading-relaxed max-w-md mx-auto">{t('ui.app.ec08c69dd3')}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button onClick={() => openApplyModal({ sourceType: 'home', sourceTitle: t('ui.app.762a52a7bb') })} className="px-8 py-3.5 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white hover:opacity-95 text-xs font-mono tracking-widest rounded-xl transition-all shadow-lg shadow-[#bc4638]/15 cursor-pointer font-semibold uppercase">{t('ui.app.762a52a7bb')}</button>
                <button onClick={() => { setCurrentPage('find-team'); updatePath('find-team'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-8 py-3.5 bg-white/50 border border-[#d8d1cc] text-[#5b6472] hover:border-[#bc4638]/60 text-xs font-mono tracking-widest rounded-xl transition-all cursor-pointer uppercase">{t('ui.app.d4b60991e4')}</button>
              </div>
            </motion.div>
          </section>
        </>
      ) : currentPage === 'privacy' ? (
        <PrivacyPolicyPage onBackToHome={() => navigateToPage('home')} />
      ) : currentPage === 'about' ? (
        <div className="w-full">
          <AboutProjectPage
            onBackToHome={() => {
              setCurrentPage('home'); updatePath('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToSection={scrollToSection}
            onOpenApplyModal={() => openApplyModal({ sourceType: 'about', sourceTitle: t('ui.aboutprojectpage.e260b399ab') })}
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
            onOpenApplyModal={(context) => openApplyModal(context)}
          />
        </div>
      ) : currentPage === 'find-team' ? (
        <div className="w-full">
          <FindTeamPage
            onNavigateToSection={scrollToSection}
            onOpenApplyModal={(context) => openApplyModal(context)}
          />
        </div>
      ) : legalPage ? (
        <LegalPage page={legalPage} onBackToHome={() => { setLegalPage(null); navigateToPage('home'); }} />
      ) : (
        <div className="w-full">
          <ActivitiesPage
            onNavigateToSection={scrollToSection}
            onOpenApplyModal={(context) => openApplyModal(context)}
          />
        </div>
      )}
      </Suspense>

      <AppFooter contactSettings={contactSettings} onNavigate={(page) => { setCurrentPage(page as Page); updatePath(page as Page); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />

      <ScrollToTop show={showScrollTop} onClick={scrollToTop} />

      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        context={applicationContext}
      />
      <CookieConsent />
      </I18nGate>
    </div>
  );
}
