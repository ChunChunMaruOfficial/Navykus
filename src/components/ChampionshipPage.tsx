import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  fadeUp,
  fadeUpLarge,
  fadeInScale,
} from '../motion-animations';
import { 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Info, 
  Settings, 
  Edit, 
  RefreshCw, 
  FileText, 
  Check, 
  Plus, 
  Trash2, 
  Sparkles, 
  TrendingUp, 
  Compass,
  ArrowUpRight,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { useCmsFaqs } from '../hooks/useCmsFaqs';
import { useCmsPageTexts } from '../hooks/useCmsPageTexts';
import { useCmsTournamentsState } from '../hooks/useCmsTournaments';
import type { TeamApplicationContext } from '../types';
import BrandImage from './BrandImage';
import TeamMemberApplicationForm from './TeamMemberApplicationForm';

interface ChampionshipData {
  id: string;
  title: string;
  type: string;
  date: string;
  registrationDeadline: string;
  description: string;
  pitch: string;
  targetAudience: string;
  ageLimit: string;
  format: string;
  teamsAllowed: string;
  lang: string;
  maxParticipants: number;
  expectedResult: string;
  evaluationCriteria: string[];
  themes: string[];
  registrationStatus: 'open' | 'suspended' | 'closed';
}

interface ChampionshipPageProps {
  onBackToHome: () => void;
  onNavigateToSection: (sectionId: string) => void;
  onOpenApplyModal: (context?: TeamApplicationContext) => void;
}

const SUITABILITY_TABS = [
  { id: 'all', label: 'ui.championshippage.228a84235a' },
  { id: 'teamless', label: 'ui.championshippage.a950b9ee19' },
  { id: 'creative', label: 'ui.championshippage.ca26c61c13' },
] as const;

type SuitabilityTab = typeof SUITABILITY_TABS[number]['id'];

const keyInfoCardClass =
  "bg-[#fff4ed]/82 glass-card surface-elevated-soft border border-[#bc4638]/14 p-4 sm:p-5 rounded-2xl text-left flex flex-col justify-between space-y-3";
const keyInfoLabelClass = "text-xs sm:text-[13px] lg:text-sm font-mono uppercase tracking-wider";
const keyInfoValueClass = "text-base sm:text-lg lg:text-xl font-serif font-bold leading-tight";
const keyInfoSubtextClass = "text-sm sm:text-base text-brand-slate font-normal md:font-light leading-snug";

const splitCmsList = (value?: string) =>
  (value || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const splitDisplayText = (value?: string) => {
  const lines = splitCmsList(value);
  return {
    title: lines[0] || '',
    description: lines.slice(1).join(' · '),
  };
};

export default function ChampionshipPage({ 
  onBackToHome, 
  onNavigateToSection, 
  onOpenApplyModal,
}: ChampionshipPageProps) {
  const { t } = useTranslation();
  useCmsPageTexts(['championship']);
  const {
    data: cmsTournaments,
    isLoading: isCmsLoading,
    hasLoadError: hasCmsLoadError,
  } = useCmsTournamentsState();
  const cmsData = useMemo<ChampionshipData | null>(() => {
    const tourney = cmsTournaments[0];
    if (!tourney) return null;
    const themes = splitCmsList(tourney.themesText);
    const evaluationCriteria = splitCmsList(tourney.evaluationCriteriaText);

    return {
      id: tourney.id,
      title: tourney.title,
      type: tourney.type,
      date: tourney.date,
      registrationDeadline: tourney.registrationDeadline,
      description: tourney.description,
      pitch: tourney.pitch || tourney.description,
      targetAudience: tourney.targetAudience || tourney.suitableFor,
      ageLimit: tourney.ageLimit,
      format: tourney.format,
      teamsAllowed: tourney.teamsAllowed,
      lang: tourney.language,
      maxParticipants: tourney.maxParticipants,
      expectedResult: tourney.expectedResult,
      evaluationCriteria: evaluationCriteria.length ? evaluationCriteria : tourney.mentors,
      themes: themes.length ? themes : tourney.skills,
      registrationStatus: tourney.registrationStatus,
    };
  }, [cmsTournaments]);

  // Interactive UI states (scenarios, tabs, accordions)
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedSuitabilityTab, setSelectedSuitabilityTab] = useState<SuitabilityTab>('all');

  const handleNavigateFromChampionship = (sectionId: string) => {
    onBackToHome();
    setTimeout(() => {
      onNavigateToSection(sectionId);
    }, 150);
  };

  const faqItems = useCmsFaqs('championship');

  if (!cmsData) {
    return (
      <div className="relative w-full text-brand-dark pb-16 pt-24">
        <div className="mx-auto max-w-7xl px-[6%] md:px-[10%]">
          <div className="rounded-3xl border border-white/[0.15] bg-white/[0.12] p-8 text-center text-sm text-brand-slate glass-xl surface-elevated">
            {isCmsLoading ? t('common.loading') : hasCmsLoadError ? t('common.error') : t('common.empty')}
          </div>
        </div>
      </div>
    );
  }

  const formatDisplay = splitDisplayText(cmsData.format);

  return (
    <div className="relative w-full text-brand-dark pb-16 pt-24">
      <div className="space-y-16">
        
        {/* Back navigation */}
        {/* Back navigation removed */}

        {/* 1. HERO BLOCK OF CHAMPIONSHIP */}
        <section className="relative z-10 mx-auto mb-8 grid max-w-7xl gap-8 px-[6%] md:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)] md:items-center md:px-[10%]">
          <div className="space-y-6 text-left">
            <div className="flex">
              {cmsData.registrationStatus === 'open' && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-[10px] font-mono uppercase tracking-widest font-semibold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{t('ui.championshippage.6bdc7661d3')} {cmsData.registrationDeadline}
                </span>
              )}
              {cmsData.registrationStatus === 'suspended' && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full text-[10px] font-mono uppercase tracking-widest font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>{t('ui.championshippage.04d60f7ace')}</span>
              )}
              {cmsData.registrationStatus === 'closed' && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-full text-[10px] font-mono uppercase tracking-widest font-semibold">
                  <Lock className="w-3 h-3" />{t('ui.championshippage.a9e0cfbc2d')}</span>
              )}
            </div>

            <motion.h1 
              key={cmsData.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-light tracking-tight text-brand-dark leading-tight"
            >
              {cmsData.title}
            </motion.h1>

            <motion.p 
              key={cmsData.pitch}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-brand-slate text-sm sm:text-base md:text-lg leading-relaxed font-light max-w-3xl text-balance"
            >
              {cmsData.pitch}
            </motion.p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            {cmsData.registrationStatus !== 'closed' ? (
              <a
                href="#apply-form-section"
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white rounded-xl text-xs font-mono tracking-widest uppercase font-semibold shadow-lg shadow-[#bc4638]/15 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
              >
                <span>{t('ui.app.24cd8dc78d')}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <button
                disabled
                className="w-full sm:w-auto px-8 py-3.5 bg-gray-300 text-gray-500 rounded-xl text-xs font-mono tracking-widest uppercase cursor-not-allowed flex items-center justify-center gap-2"
              >{t('ui.championshippage.26e1a772ee')}</button>
            )}

            <button
              onClick={() => handleNavigateFromChampionship('scenarios')}
              className="w-full sm:w-auto px-8 py-3.5 bg-white border border-[#d8d1cc] text-[#5b6472] hover:border-[#bc4638]/60 hover:text-brand-dark rounded-xl text-xs font-mono tracking-widest uppercase transition-all text-center cursor-pointer"
            >{t('ui.app.d13f387e64')}</button>
          </div>
          </div>
          <BrandImage
            src="/images/championship/championship-presentation.jpg"
            alt={t('ui.enhancements.championshipHeroAlt')}
            aspectRatio="4 / 3"
            objectPosition="50% 36%"
            sizes="(min-width: 768px) 42vw, 100vw"
            overlay
          />
        </section>

        {/* 2. COMPACT KEY INFO CARDS BLOCK */}
        <section className="relative z-10 max-w-7xl mx-auto px-[6%] md:px-[10%]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
              className={keyInfoCardClass}
            >
              <span className={`${keyInfoLabelClass} text-[#bc4638]`}>{t('ui.championshippage.8d4a5a0ee6')}</span>
              <div className="space-y-1">
                <p className={`${keyInfoValueClass} text-brand-dark`}>{cmsData.date}</p>
                <p className={keyInfoSubtextClass}>{t('ui.app.aa324b069f')}</p>
              </div>
            </motion.div>

            {formatDisplay.title && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
                className={keyInfoCardClass}
              >
                <span className={`${keyInfoLabelClass} text-[#bd5b82]`}>{t('ui.championshippage.f94a9af829')}</span>
                <div className="space-y-1">
                  <p className={`${keyInfoValueClass} text-brand-dark`}>{formatDisplay.title}</p>
                  {formatDisplay.description && <p className={keyInfoSubtextClass}>{formatDisplay.description}</p>}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.16 }}
              className={keyInfoCardClass}
            >
              <span className={`${keyInfoLabelClass} text-[#bc4638]`}>{t('ui.championshippage.e70496e65c')}</span>
              <div className="space-y-1">
                <p className={`${keyInfoValueClass} text-brand-dark`}>{t('ui.championshippage.ff03252b22')}{cmsData.ageLimit}</p>
                <p className={keyInfoSubtextClass}>{t('ui.championshippage.05679f1a9a')}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.24 }}
              className={keyInfoCardClass}
            >
              <span className={`${keyInfoLabelClass} text-[#bd5b82]`}>{t('ui.championshippage.d48444dfb4')}</span>
              <div className="space-y-1">
                <p className={`${keyInfoValueClass} text-brand-dark`}>{cmsData.lang}</p>
                <p className={keyInfoSubtextClass}>{t('ui.championshippage.1185c79f59')}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.32 }}
              className={keyInfoCardClass}
            >
              <span className={`${keyInfoLabelClass} text-[#bc4638]`}>{t('ui.championshippage.4ec991f17a')}</span>
              <div className="space-y-1">
                <p className={`${keyInfoValueClass} text-[#bc4638]`}>{cmsData.registrationDeadline}</p>
                <p className={keyInfoSubtextClass}>{t('ui.championshippage.593bb47761')}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.40 }}
              className={keyInfoCardClass}
            >
              <span className={`${keyInfoLabelClass} text-[#bd5b82]`}>{t('ui.championshippage.a7fbd7c9e4')}</span>
              <div className="space-y-1">
                <p className={`${keyInfoValueClass} text-brand-dark`}>{t('ui.championshippage.0df738a56f')}</p>
                <p className="text-sm sm:text-base text-[#bd5b82] font-semibold leading-snug">{t('ui.championshippage.04aa324d68')}</p>
              </div>
            </motion.div>

          </div>
        </section>

        {/* 3. ABOUT THE CHAMPIONSHIP */}
        <motion.section
          {...fadeUpLarge}
          className="relative z-10 py-10 md:py-14 bg-white/[0.10] glass-xl surface-elevated border border-white/[0.15] rounded-3xl card-blush"
        >
          <div className="max-w-7xl mx-auto px-[6%] md:px-[10%] grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-6">
              <BrandImage
                src="/images/championship/technology-case.jpg"
                alt={t('ui.enhancements.championshipCaseAlt')}
                aspectRatio="16 / 10"
                objectPosition="50% 45%"
                sizes="(min-width: 1024px) 35vw, 100vw"
              />
              <h2 className="text-3xl font-serif text-brand-dark leading-tight">{t('ui.championshippage.f30417ddf0')}</h2>
              <p className="text-xs sm:text-sm text-brand-slate font-normal md:font-light leading-relaxed">
                {cmsData.description}
              </p>
            </div>

            <div className="lg:col-span-7 space-y-6">
            
            {/* Themes list from CMS */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-brand-dark font-semibold mb-1 block">{t('ui.championshippage.5c807e4149')}</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cmsData.themes.map((theme, idx) => (
                  <div key={idx} className="bg-white/[0.12] glass-card surface-elevated-soft border border-white/[0.15] p-3.5 rounded-xl text-left flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#bc4638]/5 border border-[#bc4638]/10 font-mono text-[9px] font-bold text-[#bc4638] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-brand-dark font-medium leading-normal">{theme}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Evaluation Criteria */}
            <div className="space-y-3 pt-2">
              <span className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-brand-dark font-semibold mb-1 block">{t('ui.championshippage.9ab00a25e1')}</span>
              <div className="space-y-2.5">
                {cmsData.evaluationCriteria.map((crit, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-sm sm:text-base text-brand-slate font-normal md:font-light">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{crit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expected Result (MVP) */}
            <div className="p-4 bg-white/[0.12] glass-panel surface-elevated-soft rounded-2xl border border-white/[0.12]">
                <span className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-brand-slate block mb-1.5">{t('ui.championshippage.d50e039adb')}</span>
                <p className="text-base sm:text-lg text-brand-dark font-medium leading-relaxed font-serif">
                  {cmsData.expectedResult}
                </p>
              </div>

          </div>
          </div>
        </motion.section>

        {/* 4. SUITABILITY SEGMENTATION */}
        <section className="relative z-10 py-16 md:py-24 max-w-7xl mx-auto px-[6%] md:px-[10%]">
          <div className="text-center space-y-3 mx-auto mb-8 md:mb-10">
            <h2 className="text-2xl sm:text-3xl font-serif text-brand-dark tracking-tight">{t('ui.championshippage.930fc92538')}</h2>
          </div>

          {/* Interactive tabs for different archetypes */}
           <div className="flex flex-wrap justify-center gap-2 pb-4 mx-auto">
            {SUITABILITY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedSuitabilityTab(tab.id)}
                className={`px-4 py-2 text-xs font-mono rounded-xl transition-all border cursor-pointer ${
                  selectedSuitabilityTab === tab.id 
                    ? 'bg-brand-dark text-white border-brand-dark font-bold shadow-sm' 
                    : 'bg-white/40 text-brand-slate hover:text-brand-dark border-white/60 hover:bg-white/60'
                }`}
              >
                {t(tab.label)}
              </button>
            ))}
          </div>

          {/* Tab content renders based on selected suitability archetype */}
          <div className="mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedSuitabilityTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white/[0.10] glass-xl surface-elevated border border-white/[0.15] rounded-2xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-left"
              >
                {selectedSuitabilityTab === 'all' && (
                  <>
                    <div className="space-y-4">
                      <h4 className="font-serif font-semibold text-lg text-brand-dark">{t('ui.championshippage.18b2b68608')}</h4>
                      <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">{t('ui.championshippage.9913df95c5')}</p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2.5 text-xs text-brand-slate font-light">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{t('ui.championshippage.de56ba7e8b')}</span>
                        </li>
                        <li className="flex items-center gap-2.5 text-xs text-brand-slate font-light">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{t('ui.championshippage.5e809fc67f')}</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-gradient-to-br from-[#bc4638]/5 to-[#bd5b82]/5 rounded-xl p-5 flex flex-col justify-between border border-white/40">
                      <div>
                        <span className="text-[11px] sm:text-[10px] font-mono uppercase tracking-wider text-[#bc4638] font-bold">{t('ui.championshippage.8f11566b38')}</span>
                        <p className="text-xs text-brand-slate mt-1.5 font-light leading-relaxed">{t('ui.championshippage.7f6fbf84a6')}</p>
                      </div>
                      <a href="#apply-form-section" className="text-xs font-mono font-bold text-[#bc4638] hover:underline inline-flex items-center gap-1 mt-4">{t('ui.app.24cd8dc78d')}<ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </>
                )}

                {selectedSuitabilityTab === 'teamless' && (
                  <>
                    <div className="space-y-4">
                      <h4 className="font-serif font-semibold text-lg text-brand-dark">{t('ui.championshippage.3015b9f8')}</h4>
                      <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">{t('ui.championshippage.3cb46975e1')}</p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2.5 text-xs text-brand-slate font-light">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{t('ui.championshippage.d3da2f0b9c')}</span>
                        </li>
                        <li className="flex items-center gap-2.5 text-xs text-brand-slate font-light">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{t('ui.championshippage.9dee187e5f')}</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-gradient-to-br from-[#bc4638]/5 to-[#bd5b82]/5 rounded-xl p-5 flex flex-col justify-between border border-white/40">
                      <div>
                        <span className="text-[11px] sm:text-[10px] font-mono uppercase tracking-wider text-[#bc4638] font-bold">{t('ui.championshippage.9f228ac331')}</span>
                        <p className="text-xs text-brand-slate mt-1.5 font-light leading-relaxed">{t('ui.championshippage.a3e6b0b4fd')}</p>
                      </div>
                      <button
                        onClick={() => handleNavigateFromChampionship('scenarios')}
                        className="text-xs font-mono font-bold text-[#bc4638] hover:underline inline-flex items-center gap-1 mt-4 cursor-pointer text-left"
                      >{t('ui.championshippage.6e3ec9704e')}<ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}

                {selectedSuitabilityTab === 'creative' && (
                  <>
                    <div className="space-y-4">
                      <h4 className="font-serif font-semibold text-lg text-brand-dark">{t('ui.championshippage.cec289e2df')}</h4>
                      <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">{t('ui.championshippage.fe12153d63')}</p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2.5 text-xs text-brand-slate font-light">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{t('ui.championshippage.5c275f89de')}</span>
                        </li>
                        <li className="flex items-center gap-2.5 text-xs text-brand-slate font-light">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{t('ui.championshippage.188450882a')}</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-[#d8d1cc]/40 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] sm:text-[10px] font-mono uppercase tracking-wider text-[#bd5b82] font-bold font-semibold">{t('ui.championshippage.63db68249b')}</span>
                        <p className="text-xs text-brand-slate mt-1.5 font-light leading-relaxed">{t('ui.championshippage.c174c67149')}</p>
                      </div>
                      <a href="#apply-form-section" className="text-xs font-mono font-bold text-[#bd5b82] hover:underline inline-flex items-center gap-1 mt-4">{t('ui.activitiespage.84d92abc92')}<ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* 9. APPLICATION FORM */}
        <section id="apply-form-section" className="relative z-10 w-[88vw] md:w-[80vw] max-w-4xl mx-auto scroll-mt-24">
          <div className="bg-white/[0.10] glass-xl surface-elevated border border-white/[0.15] rounded-3xl p-6 sm:p-10 space-y-8">
            <div className="text-center space-y-2 pb-5">
              <h2 className="text-2xl sm:text-3xl font-serif text-brand-dark">{t('ui.championshippage.795d6a19a2')}</h2>
              <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed max-w-md mx-auto">{t('ui.championshippage.5788077ace')}</p>
            </div>

            {cmsData.registrationStatus === 'closed' ? (
              <div className="space-y-2 rounded-2xl border border-rose-100 bg-rose-50 p-5 text-center text-rose-800">
                <Lock className="mx-auto h-8 w-8 text-rose-500" />
                <h4 className="font-serif text-base font-semibold">{t('ui.championshippage.d2be300a17')}</h4>
                <p className="mx-auto max-w-sm text-xs leading-relaxed text-rose-700/80">{t('ui.championshippage.098019329a')}</p>
              </div>
            ) : (
              <TeamMemberApplicationForm
                compact
                context={{
                  sourceType: 'championship',
                  sourceId: cmsData.id,
                  sourceTitle: cmsData.title,
                  tournamentId: cmsData.id,
                }}
              />
            )}
          </div>
        </section>
        {/* 10. FAQ ACCORDION BLOCK */}
        <motion.section
          {...fadeUp}
          className="relative z-10 py-16 md:py-24 w-[88vw] md:w-[80vw] max-w-4xl mx-auto space-y-6 section-accent-warm"
        >
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-brand-dark tracking-tight">{t('ui.findteampage.f119ad282e')}</h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((faq, idx) => (
              <div 
                key={faq.id} 
                className="bg-white/[0.08] glass-card surface-elevated-soft border border-white/[0.12] rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-serif font-semibold text-brand-dark text-lg sm:text-xl md:text-2xl cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-brand-slate/60 transition-transform duration-300 flex-shrink-0 ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence initial={false}>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
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
        </motion.section>



      </div>
    </div>
  );
}
