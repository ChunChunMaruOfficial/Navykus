import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Target, 
  ChevronDown, 
  CheckCircle2, 
  ArrowRight, 
  GraduationCap, 
  Globe, 
  Award, 
  Briefcase, 
  Shield, 
  Activity, 
  Compass, 
  Calendar, 
  BookOpen, 
  MessageSquare,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import {
  fadeUp,
  fadeInScale,
  heroFadeUp,
  cardStaggerContainer,
  cardItemFadeUp,
} from '../motion-animations';
import { useCmsFaqs } from '../hooks/useCmsFaqs';
import type { FaqItem } from '../types';
import BrandImage from './BrandImage';

interface Segment {
  id: string;
  title: string;
  subtitle: string;
  benefits: string[];
  ctaText: string;
  targetRole: string;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
}


interface FallbackFAQItem {
  id: string;
  question: string;
  answer: string;
}

const AUDIENCE_SEGMENTS: Segment[] = [
  {
    id: "seg-1",
    title: 'ui.aboutprojectpage.c1470c6ed2',
    subtitle: 'ui.aboutprojectpage.75cee92c36',
    benefits: [
      'ui.aboutprojectpage.4af3da7a03',
      'ui.aboutprojectpage.825d7c88f4',
      'ui.aboutprojectpage.93290f394a',
      'ui.aboutprojectpage.863ce4f6d3'
    ],
    ctaText: 'ui.aboutprojectpage.0d298390c0',
    targetRole: "championships"
  },
  {
    id: "seg-3",
    title: 'ui.aboutprojectpage.6727fa0866',
    subtitle: 'ui.aboutprojectpage.78fe050899',
    benefits: [
      'ui.aboutprojectpage.41a41cd402',
      'ui.aboutprojectpage.b723cb5ddd',
      'ui.aboutprojectpage.3f8c8b54eb',
      'ui.aboutprojectpage.78fbe57f44'
    ],
    ctaText: 'ui.findteampage.3765795ef8',
    targetRole: "contact"
  },
  {
    id: "seg-4",
    title: 'ui.aboutprojectpage.89b0041826',
    subtitle: 'ui.aboutprojectpage.78677fd8cd',
    benefits: [
      'ui.aboutprojectpage.9e915ff86f',
      'ui.aboutprojectpage.cba47258ca',
      'ui.aboutprojectpage.9c2513d649',
      'ui.aboutprojectpage.d5dce53393'
    ],
    ctaText: 'ui.aboutprojectpage.fff3f12699',
    targetRole: "contact"
  },
  {
    id: "seg-5",
    title: 'ui.aboutprojectpage.a3c3810f47',
    subtitle: 'ui.aboutprojectpage.5767a5f856',
    benefits: [
      'ui.aboutprojectpage.fb3a394753',
      'ui.aboutprojectpage.7f6a7b6bbe',
      'ui.aboutprojectpage.cc18b5c571',
      'ui.aboutprojectpage.a270d6798d'
    ],
    ctaText: 'ui.aboutprojectpage.d210fb0d5a',
    targetRole: "contact"
  }
];

const ACTIVITIES_ITEMS: ActivityItem[] = [
  {
    id: "act-1",
    title: 'ui.aboutprojectpage.b95ecb3c05',
    description: 'ui.aboutprojectpage.9d86488fb6'
  },
  {
    id: "act-2",
    title: 'ui.aboutprojectpage.c03dfac430',
    description: 'ui.aboutprojectpage.9915e585a3'
  },
  {
    id: "act-3",
    title: 'ui.aboutprojectpage.f353fc8fab',
    description: 'ui.aboutprojectpage.66695efbd6'
  },
  {
    id: "act-4",
    title: 'ui.aboutprojectpage.8c5ce0253e',
    description: 'ui.aboutprojectpage.c22bfce55b'
  },
  {
    id: "act-5",
    title: 'ui.aboutprojectpage.3e7c3a9f22',
    description: 'ui.aboutprojectpage.48d877aa9c'
  },
  {
    id: "act-6",
    title: 'ui.aboutprojectpage.3ba567b6ee',
    description: 'ui.aboutprojectpage.20a478bc7a'
  }
];


const FAQ_ITEMS: FallbackFAQItem[] = [
  {
    id: "faq-1",
    question: 'ui.aboutprojectpage.4b5e0f1908',
    answer: 'ui.aboutprojectpage.09fd377d38'
  },
  {
    id: "faq-2",
    question: 'ui.aboutprojectpage.a4f04e2aad',
    answer: 'ui.aboutprojectpage.3aeea8f6e3'
  },
  {
    id: "faq-3",
    question: 'ui.aboutprojectpage.ace0eadb3d',
    answer: 'ui.aboutprojectpage.090808a2de'
  },
  {
    id: "faq-4",
    question: 'ui.aboutprojectpage.1d5cd942b3',
    answer: 'ui.aboutprojectpage.3e6cba422a'
  },
  {
    id: "faq-5",
    question: 'ui.aboutprojectpage.55cd784afe',
    answer: 'ui.aboutprojectpage.b38dd282f8'
  },
  {
    id: "faq-6",
    question: 'ui.aboutprojectpage.e663d62bb5',
    answer: 'ui.aboutprojectpage.b966ab17f5'
  }
];

interface AboutProjectPageProps {
  onBackToHome: () => void;
  onNavigateToSection: (sectionId: string) => void;
  onOpenApplyModal: () => void;
}

export default function AboutProjectPage({ 
  onBackToHome, 
  onNavigateToSection, 
  onOpenApplyModal 
}: AboutProjectPageProps) {
  const { t } = useTranslation();
  
  const [selectedSegmentIdx, setSelectedSegmentIdx] = useState(0);
  const [activeFaqIdx, setActiveFaqIdx] = useState<number | null>(null);
  const faqItems = useCmsFaqs(
    'about',
    FAQ_ITEMS.map<FaqItem>((faq) => ({
      id: faq.id,
      page: 'about',
      question: t(faq.question),
      answer: t(faq.answer),
    })),
  );

  const handleNavigateFromAbout = (sectionId: string) => {
    onBackToHome();
    setTimeout(() => {
      onNavigateToSection(sectionId);
    }, 150);
  };
  
  return (
    <div className="relative w-full text-brand-dark pb-16 pt-24">
      <div className="max-w-7xl mx-auto px-[6%] md:px-[10%]">
        
        {/* Back navigation removed */}

        {/* 1. HERO BLOCK */}
        <section className="relative z-10 grid gap-8 pb-12 md:grid-cols-[minmax(0,1fr)_minmax(320px,0.86fr)] md:items-center md:pb-16">
          <motion.div {...heroFadeUp} className="space-y-6 text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-light italic tracking-tight text-brand-dark leading-tight">
              {t('ui.aboutprojectpage.e260b399ab')}
            </h1>
            <p className="max-w-2xl text-brand-slate text-sm sm:text-base md:text-lg leading-relaxed font-normal md:font-light">
              {t('ui.aboutprojectpage.ac15bd8cf7')}
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={onOpenApplyModal}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white rounded-xl text-xs font-mono tracking-widest uppercase font-semibold shadow-lg shadow-[#bc4638]/15 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('ui.aboutprojectpage.2805697540')}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleNavigateFromAbout('nearest-championship')}
                className="w-full sm:w-auto px-8 py-3.5 bg-white border border-[#d8d1cc] text-[#5b6472] hover:border-[#bc4638]/60 rounded-xl text-xs font-mono tracking-widest uppercase transition-all text-center cursor-pointer hover:text-brand-dark"
              >{t('ui.aboutprojectpage.0a09c52fdd')}</button>
            </div>
          </motion.div>
          <motion.div {...heroFadeUp} transition={{ duration: 0.6, delay: 0.1 }} className="relative">
            <BrandImage
              src="/images/about/about-community.jpg"
              alt={t('ui.enhancements.aboutHeroAlt')}
              aspectRatio="4 / 3"
              objectPosition="50% 36%"
              sizes="(min-width: 768px) 42vw, 100vw"
              overlay
            />
          </motion.div>
        </section>

        {/* 2. MISSION BLOCK */}
        <motion.section 
          {...fadeUp}
          className="relative z-10 py-16 md:py-24 bg-white/[0.10] glass-xl surface-elevated border border-white/[0.15] rounded-3xl px-6 sm:px-12 text-center overflow-hidden"
        >
          {/* Faint watermark logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none select-none z-0 -translate-y-12">
            <svg 
              viewBox="0 0 400 480" 
              className="w-72 h-80 sm:w-80 sm:h-96"
            >
              <defs>
                <linearGradient id="mission-logo-left-grad" x1="15%" y1="0%" x2="85%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                  <stop offset="25%" stopColor="#f38b76" stopOpacity="0.75" />
                  <stop offset="65%" stopColor="#bc4638" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#80261b" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="mission-logo-right-grad" x1="15%" y1="0%" x2="85%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                  <stop offset="25%" stopColor="#e28fb1" stopOpacity="0.75" />
                  <stop offset="65%" stopColor="#bd5b82" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#803251" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="mission-logo-h-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#bc4638" stopOpacity="0.85" />
                  <stop offset="20%" stopColor="#f38b76" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#d57e8c" stopOpacity="0.8" />
                  <stop offset="80%" stopColor="#e28fb1" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#bd5b82" stopOpacity="0.85" />
                </linearGradient>
              </defs>
              <circle cx="102.5" cy="75" r="42.5" fill="url(#mission-logo-left-grad)" />
              <circle cx="297.5" cy="75" r="42.5" fill="url(#mission-logo-right-grad)" />
              <path 
                d="M 60,180 A 42.5,42.5 0 0,1 145,180 L 145,220 C 145,236.5 158.5,250 175,250 L 225,250 C 241.5,250 255,236.5 255,220 L 255,180 A 42.5,42.5 0 0,1 340,180 L 340,400 A 42.5,42.5 0 0,1 255,400 L 255,360 C 255,343.5 241.5,330 225,330 L 175,330 C 158.5,330 145,343.5 145,360 L 145,400 A 42.5,42.5 0 0,1 60,400 Z" 
                fill="url(#mission-logo-h-grad)" 
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          <div className="relative z-10 mx-auto max-w-6xl space-y-8 text-left">
            <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
              <div className="relative -mx-6 -mt-16 h-52 overflow-hidden rounded-t-3xl bg-gradient-to-br from-[#bc4638]/15 to-[#bd5b82]/15 sm:-mx-12 md:hidden">
                <img
                  src="/images/about/mentor-discussion.jpg"
                  alt={t('ui.enhancements.aboutMissionAlt')}
                  className="h-full w-full object-cover [mask-image:linear-gradient(to_bottom,#000_0%,#000_68%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_68%,transparent_100%)]"
                  loading="lazy"
                />
              </div>
              <div className="hidden md:block">
                <BrandImage
                  src="/images/about/mentor-discussion.jpg"
                  alt={t('ui.enhancements.aboutMissionAlt')}
                  aspectRatio="4 / 3"
                  objectPosition="50% 40%"
                  sizes="(min-width: 768px) 38vw, 100vw"
                />
              </div>
              <div className="space-y-6">
                <h2 className="text-3xl sm:text-4xl font-serif text-brand-dark tracking-tight">{t('ui.aboutprojectpage.10575c4831')}</h2>
              
                <p className="text-base sm:text-lg text-brand-dark font-medium leading-relaxed italic">{t('ui.aboutprojectpage.3841022721')}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <p className="text-xs sm:text-sm text-brand-slate font-normal md:font-light leading-relaxed">{t('ui.aboutprojectpage.05c82da787')}</p>
                <p className="text-xs sm:text-sm text-brand-slate font-normal md:font-light leading-relaxed">{t('ui.aboutprojectpage.c2b671bade')}</p>
              </div>

              <p className="text-xs sm:text-sm font-mono tracking-wide text-[#bc4638] font-semibold">{t('ui.aboutprojectpage.4d60e65bd8')}</p>
            </div>
          </div>
        </motion.section>

        {/* 3. AUDIENCE SEGMENTS BLOCK */}
        <section className="relative z-10 py-16 md:py-24">
          <motion.div 
            {...fadeUp}
            className="text-center space-y-4 mb-10 max-w-3xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl font-serif text-brand-dark tracking-tight">{t('ui.aboutprojectpage.91c8669da7')}</h2>
            <p className="text-xs sm:text-sm text-brand-slate font-normal md:font-light max-w-2xl mx-auto">{t('ui.aboutprojectpage.31f9f3d409')}</p>
          </motion.div>

          {/* Audience Interactive Selector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Segments list switcher buttons */}
            <div className="lg:col-span-5 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-2 pb-3 lg:pb-0 scrollbar-soft snap-x" role="tablist" aria-orientation="vertical">
              {AUDIENCE_SEGMENTS.map((seg, idx) => (
                <button
                  key={seg.id}
                  id={`audience-tab-${seg.id}`}
                  role="tab"
                  aria-selected={selectedSegmentIdx === idx}
                  aria-controls={`audience-panel-${seg.id}`}
                  tabIndex={selectedSegmentIdx === idx ? 0 : -1}
                  onClick={() => setSelectedSegmentIdx(idx)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                      event.preventDefault();
                      setSelectedSegmentIdx((idx + 1) % AUDIENCE_SEGMENTS.length);
                    }
                    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                      event.preventDefault();
                      setSelectedSegmentIdx((idx - 1 + AUDIENCE_SEGMENTS.length) % AUDIENCE_SEGMENTS.length);
                    }
                  }}
                  className={`flex-shrink-0 snap-start w-64 lg:w-full text-left px-5 py-4 rounded-2xl transition-all border ${
                    selectedSegmentIdx === idx 
                      ? 'bg-brand-dark text-white border-brand-dark shadow-md' 
                      : 'bg-white/40 text-brand-slate hover:text-brand-dark border-white/60 hover:bg-white/60'
                  } cursor-pointer`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-mono font-semibold uppercase tracking-wider">
                        {t(seg.title)}
                      </h4>
                      <p className={`text-[10px] mt-0.5 truncate max-w-[200px] ${selectedSegmentIdx === idx ? 'text-white/80' : 'text-brand-slate/70'}`}>
                        {t(seg.subtitle)}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedSegmentIdx === idx ? 'translate-x-1' : 'opacity-40'}`} />
                  </div>
                </button>
              ))}
            </div>

            {/* Active Segment Detail Card */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedSegmentIdx}
                  id={`audience-panel-${AUDIENCE_SEGMENTS[selectedSegmentIdx].id}`}
                  role="tabpanel"
                  aria-labelledby={`audience-tab-${AUDIENCE_SEGMENTS[selectedSegmentIdx].id}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white/[0.15] glass-panel surface-elevated border border-white/[0.15] rounded-3xl p-6 sm:p-8 text-left space-y-6"
                >
                  <div className="space-y-1.5 pb-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#bc4638] font-bold">{t('ui.aboutprojectpage.7a0e44e136')}</span>
                    <h3 className="text-xl sm:text-2xl font-serif text-brand-dark">
                      {t(AUDIENCE_SEGMENTS[selectedSegmentIdx].title)}
                    </h3>
                    <p className="text-xs text-brand-slate font-normal md:font-light">
                      {t(AUDIENCE_SEGMENTS[selectedSegmentIdx].subtitle)}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h5 className="text-[10px] font-mono text-brand-dark uppercase tracking-wider font-semibold">{t('ui.aboutprojectpage.2fed8f727b')}</h5>
                    <ul className="space-y-2.5">
                      {AUDIENCE_SEGMENTS[selectedSegmentIdx].benefits.map((benefit, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-brand-slate font-normal md:font-light">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>{t(benefit)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => {
                        const role = AUDIENCE_SEGMENTS[selectedSegmentIdx].targetRole;
                        if (role === 'championships') {
                          handleNavigateFromAbout('nearest-championship');
                        } else if (role === 'contact') {
                          handleNavigateFromAbout('footer-system');
                        } else {
                          onOpenApplyModal();
                        }
                      }}
                      className="px-6 py-3 bg-brand-dark text-white hover:bg-brand-dark/90 rounded-xl text-xs font-mono tracking-widest uppercase transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>{t(AUDIENCE_SEGMENTS[selectedSegmentIdx].ctaText)}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </section>

        {/* 4. WHAT CAN YOU DO BLOCK */}
        <section className="relative z-10 py-16 md:py-24">
          <motion.div 
            {...fadeUp}
            className="text-center space-y-4 mb-10 max-w-3xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl font-serif text-brand-dark tracking-tight">{t('ui.aboutprojectpage.b23f0c7c43')}</h2>
            <p className="text-xs sm:text-sm text-brand-slate font-normal md:font-light">{t('ui.aboutprojectpage.d5362b6b2b')}</p>
          </motion.div>

          {/* Bento Grid */}
          <motion.div {...cardStaggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ACTIVITIES_ITEMS.map((item, idx) => {
              const icons = [Award, Compass, Users, GraduationCap, Calendar, Activity];
              const iconColors = [
                'text-[#bc4638]/[0.14]',
                'text-[#bd5b82]/[0.14]',
                'text-[#2f6f73]/[0.13]',
                'text-[#c08a3e]/[0.15]',
                'text-[#5b6472]/[0.14]',
                'text-[#8d3026]/[0.13]',
              ];
              const SelectedIcon = icons[idx % icons.length];

              return (
                <motion.div 
                  key={item.id}
                  variants={cardItemFadeUp.variants}
                  className="group relative overflow-hidden bg-white/[0.12] glass-card surface-elevated-soft border border-white/[0.15] hover:border-brand-terracotta/25 rounded-2xl p-6 text-left flex flex-col justify-between space-y-4"
                >
                  <SelectedIcon
                    className={`pointer-events-none absolute right-5 top-4 h-16 w-16 select-none transition-transform duration-500 group-hover:scale-110 ${iconColors[idx % iconColors.length]}`}
                    aria-hidden="true"
                    strokeWidth={1.5}
                  />
                  <div className="space-y-3 pr-12">
                    <h3 className="text-lg sm:text-xl font-serif font-semibold leading-tight text-brand-dark">
                      {t(item.title)}
                    </h3>
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-brand-slate font-normal md:font-light leading-relaxed">
                        {t(item.description)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* 6. FAQ BLOCK */}
        <section className="relative z-10 py-16 md:py-24 w-[88vw] md:w-[80vw] max-w-4xl mx-auto space-y-6 section-accent-warm">
          <motion.div 
            {...fadeUp}
            className="mb-10 text-center space-y-3"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-brand-dark tracking-tight">{t('ui.findteampage.f119ad282e')}</h2>
          </motion.div>

          <div className="space-y-4">
            {faqItems.map((faq, idx) => (
              <div 
                key={faq.id} 
                className="bg-white/[0.10] glass-card surface-elevated-soft border border-white/[0.12] rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaqIdx(activeFaqIdx === idx ? null : idx)}
                  aria-expanded={activeFaqIdx === idx}
                  aria-controls={`about-faq-panel-${faq.id}`}
                  className="w-full flex items-center justify-between p-5 text-left font-serif font-semibold text-brand-dark text-xl sm:text-2xl md:text-3xl cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-brand-slate/60 transition-transform duration-300 flex-shrink-0 ${activeFaqIdx === idx ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence initial={false}>
                  {activeFaqIdx === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      id={`about-faq-panel-${faq.id}`}
                      className="overflow-hidden"
                    >
                      <p className="p-5 pt-0 text-sm sm:text-base text-brand-slate font-normal md:font-light leading-relaxed bg-white/10 text-left">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* 7. FINAL CALL TO ACTION */}
        <section className="relative z-10 py-16 md:py-24 max-w-5xl mx-auto">
          <motion.div
            {...fadeInScale}
            className="bg-gradient-to-br from-[#bc4638]/8 via-white/[0.12] to-[#bd5b82]/8 glass-xl surface-elevated border border-white/[0.15] rounded-3xl p-8 sm:p-12 text-center space-y-6"
          >
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#bc4638] uppercase font-bold">{t('ui.aboutprojectpage.4d545fb6ff')}</span>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-brand-dark tracking-tight leading-tight max-w-2xl mx-auto">
              {t('ui.aboutprojectpage.d1728b4c')}</h2>
            <p className="text-sm sm:text-base text-brand-slate font-normal md:font-light leading-relaxed max-w-md mx-auto">{t('ui.aboutprojectpage.7cea9cf73e')}</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={onOpenApplyModal}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white hover:opacity-95 text-xs font-mono tracking-widest rounded-xl transition-all shadow-lg shadow-[#bc4638]/15 cursor-pointer font-bold uppercase"
              >{t('ui.app.24cd8dc78d')}</button>
              <button
                onClick={() => handleNavigateFromAbout('scenarios')}
                className="w-full sm:w-auto px-8 py-3.5 bg-white/50 border border-[#d8d1cc] text-[#5b6472] hover:border-[#bc4638]/60 text-xs font-mono tracking-widest rounded-xl transition-all cursor-pointer uppercase font-semibold"
              >{t('ui.app.d4b60991e4')}</button>
            </div>
          </motion.div>
        </section>

      </div>
    </div>
  );
}
