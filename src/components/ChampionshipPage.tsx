import React, { useEffect, useState } from 'react';
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
import { useCmsTournaments } from '../hooks/useCmsTournaments';
import type { FaqItem as CmsFaqItem } from '../types';
import BrandImage from './BrandImage';

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

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface ChampionshipPageProps {
  onBackToHome: () => void;
  onNavigateToSection: (sectionId: string) => void;
  onOpenApplyModal: () => void;
  onOpenAuthModal?: () => void;
}

const SUITABILITY_TABS = [
  { id: 'all', label: 'ui.championshippage.228a84235a' },
  { id: 'teamless', label: 'ui.championshippage.a950b9ee19' },
  { id: 'creative', label: 'ui.championshippage.ca26c61c13' },
  { id: 'ambitious', label: 'ui.championshippage.97e139a69f' },
] as const;

type SuitabilityTab = typeof SUITABILITY_TABS[number]['id'];

const keyInfoCardClass =
  "bg-[#fff4ed]/82 glass-card surface-elevated-soft border border-[#bc4638]/14 p-4 sm:p-5 rounded-2xl text-left flex flex-col justify-between space-y-3";
const keyInfoLabelClass = "text-xs sm:text-[13px] lg:text-sm font-mono uppercase tracking-wider";
const keyInfoValueClass = "text-base sm:text-lg lg:text-xl font-serif font-bold leading-tight";
const keyInfoSubtextClass = "text-sm sm:text-base text-brand-slate font-normal md:font-light leading-snug";

export default function ChampionshipPage({ 
  onBackToHome, 
  onNavigateToSection, 
  onOpenApplyModal,
  onOpenAuthModal,
}: ChampionshipPageProps) {
  const { t } = useTranslation();
  const cmsTournaments = useCmsTournaments();

  // Sync CMS tournament data into editable state
  useEffect(() => {
    if (cmsTournaments && cmsTournaments.length > 0) {
      const tourney = cmsTournaments[0];
      setCmsData((prev) => ({
        ...prev,
        title: tourney.title || prev.title,
        description: tourney.description || prev.description,
        date: tourney.date || prev.date,
        registrationDeadline: tourney.registrationDeadline || prev.registrationDeadline,
        format: tourney.format || prev.format,
        maxParticipants: tourney.maxParticipants || prev.maxParticipants,
      }));
    }
  }, [cmsTournaments]);

  // CMS/Editable state with prefilled default championship data
  const [cmsData, setCmsData] = useState<ChampionshipData>({
    id: 'cup-1',
    title: 'Navykus Global Case Cup: Sustainable Cities',
    type: t('ui.championshippage.4d64641fc0'),
    date: t('ui.championshippage.bbc292ccc9'),
    registrationDeadline: t('ui.championshippage.96d45bb877'),
    description: t('ui.championshippage.567335aef2'),
    pitch: t('ui.championshippage.dd865f6e85'),
    targetAudience: t('ui.championshippage.8de641ff48'),
    ageLimit: t('ui.championshippage.9c2bddb76a'),
    format: t('ui.championshippage.14fe253652'),
    teamsAllowed: t('ui.championshippage.ed233d55cc'),
    lang: t('ui.championshippage.e91c59966c'),
    maxParticipants: 120,
    expectedResult: t('ui.championshippage.034bb56718'),
    evaluationCriteria: [
      t('ui.championshippage.47b3f641ee'),
      t('ui.championshippage.49a254c0ad'),
      t('ui.championshippage.c3ab1eab18'),
      t('ui.championshippage.bdbee4fdad')
    ],
    themes: [
      t('ui.championshippage.6e972b4b72'),
      t('ui.championshippage.61fb774e62'),
      t('ui.championshippage.058159276f'),
      t('ui.championshippage.f1d7d23827')
    ],
    registrationStatus: 'open'
  });

  // CMS toggle and state
  const [isCmsPanelOpen, setIsCmsPanelOpen] = useState(false);
  const [tempTitle, setTempTitle] = useState(cmsData.title);
  const [tempPitch, setTempPitch] = useState(cmsData.pitch);
  const [tempDate, setTempDate] = useState(cmsData.date);
  const [tempDeadline, setTempDeadline] = useState(cmsData.registrationDeadline);
  const [tempAge, setTempAge] = useState(cmsData.ageLimit);
  const [tempFormat, setTempFormat] = useState(cmsData.format);
  const [tempTeams, setTempTeams] = useState(cmsData.teamsAllowed);
  const [tempStatus, setTempStatus] = useState<ChampionshipData['registrationStatus']>(cmsData.registrationStatus);

  // New theme input state
  const [newTheme, setNewTheme] = useState('');

  // Interactive UI states (scenarios, tabs, accordions)
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedSuitabilityTab, setSelectedSuitabilityTab] = useState<SuitabilityTab>('all');

  // Application Form submission state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    city: '',
    contact: '',
    hasTeam: 'no', // 'no' (no team, wants matching), 'yes' (has team), 'solo' (wants to participate alone)
    teamSize: '1',
    interests: 'urbanism',
    portfolioLink: '',
    coverLetter: ''
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formErrorMsg, setFormErrorMsg] = useState('');
  const [generatedTicket, setGeneratedTicket] = useState<{
    ticketId: string;
    seatNum: number;
    regTime: string;
  } | null>(null);

  // Apply changes from temp CMS state
  const handleApplyCmsChanges = () => {
    setCmsData(prev => ({
      ...prev,
      title: tempTitle,
      pitch: tempPitch,
      date: tempDate,
      registrationDeadline: tempDeadline,
      ageLimit: tempAge,
      format: tempFormat,
      teamsAllowed: tempTeams,
      registrationStatus: tempStatus
    }));
    // Show user a quick toast/confirmation or just close
    setIsCmsPanelOpen(false);
  };

  // Add new theme via CMS
  const handleAddTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTheme.trim()) return;
    setCmsData(prev => ({
      ...prev,
      themes: [...prev.themes, newTheme.trim()]
    }));
    setNewTheme('');
  };

  // Delete theme via CMS
  const handleDeleteTheme = (index: number) => {
    setCmsData(prev => ({
      ...prev,
      themes: prev.themes.filter((_, idx) => idx !== index)
    }));
  };

  // Form submit simulator
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormErrorMsg(t('ui.app.02ce21d910'));
      setFormStatus('error');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormErrorMsg(t('ui.championshippage.7dab316a67'));
      setFormStatus('error');
      return;
    }
    const ageNum = Number(formData.age);
    if (!formData.age.trim() || isNaN(ageNum) || ageNum < 10 || ageNum > 24) {
      setFormErrorMsg(t('ui.championshippage.7b04173c40'));
      setFormStatus('error');
      return;
    }
    if (!formData.contact.trim()) {
      setFormErrorMsg(t('ui.championshippage.a79744eacf'));
      setFormStatus('error');
      return;
    }

    setFormErrorMsg('');
    sessionStorage.setItem('navykus.pendingChampionshipProfile', JSON.stringify({
      name: formData.name.trim(),
      email: formData.email.trim(),
      age: formData.age.trim(),
      city: formData.city.trim(),
      contact: formData.contact.trim(),
      hasTeam: formData.hasTeam,
      teamSize: formData.teamSize,
      interests: formData.interests,
      portfolioLink: formData.portfolioLink,
      coverLetter: formData.coverLetter,
    }));

    if (onOpenAuthModal) {
      onOpenAuthModal();
    } else {
      setFormStatus('submitting');
      setTimeout(() => {
        const ticketId = 'NV-CUP-' + Math.floor(100000 + Math.random() * 900000);
        const seatNum = Math.floor(12 + Math.random() * 98);
        const regTime = new Date().toLocaleString('ru-RU', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        setGeneratedTicket({ ticketId, seatNum, regTime });
        setFormStatus('success');
      }, 1500);
    }
  };

  // Reset form
  const handleResetForm = () => {
    setFormData({
      name: '',
      email: '',
      age: '',
      city: '',
      contact: '',
      hasTeam: 'no',
      teamSize: '1',
      interests: 'urbanism',
      portfolioLink: '',
      coverLetter: ''
    });
    setFormStatus('idle');
    setGeneratedTicket(null);
  };

  const handleNavigateFromChampionship = (sectionId: string) => {
    onBackToHome();
    setTimeout(() => {
      onNavigateToSection(sectionId);
    }, 150);
  };

  const fallbackFaqItems: FAQItem[] = [
    {
      id: 'championship-faq-1',
      question: t('ui.championshippage.75eb0d84'),
      answer: t('ui.championshippage.4b587e32b1')
    },
    {
      id: 'championship-faq-2',
      question: t('ui.championshippage.ccc076b0'),
      answer: t('ui.championshippage.abf0a3c0da')
    },
    {
      id: 'championship-faq-3',
      question: t('ui.championshippage.fdb6874f'),
      answer: t('ui.championshippage.c00db4e511')
    },
    {
      id: 'championship-faq-4',
      question: t('ui.championshippage.c264c842'),
      answer: t('ui.championshippage.75488dd388')
    },
    {
      id: 'championship-faq-5',
      question: t('ui.championshippage.47dfb4af'),
      answer: t('ui.championshippage.59016ab8e3')
    }
  ];
  const faqItems = useCmsFaqs(
    'championship',
    fallbackFaqItems.map<CmsFaqItem>((faq) => ({
      ...faq,
      page: 'championship',
    })),
  );

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
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{t('ui.championshippage.6bdc7661d3')}{cmsData.registrationDeadline}
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

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
              className={keyInfoCardClass}
            >
              <span className={`${keyInfoLabelClass} text-[#bd5b82]`}>{t('ui.championshippage.f94a9af829')}</span>
              <div className="space-y-1">
                <p className={`${keyInfoValueClass} text-brand-dark`}>{t('ui.championshippage.8bd2b856e1')}</p>
                <p className={keyInfoSubtextClass}>Zoom, Figma, Miro</p>
              </div>
            </motion.div>

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

                {selectedSuitabilityTab === 'ambitious' && (
                  <>
                    <div className="space-y-4">
                      <h4 className="font-serif font-semibold text-lg text-brand-dark">{t('ui.championshippage.1d5616ef28')}</h4>
                      <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">{t('ui.championshippage.fae9e0f0cb')}</p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2.5 text-xs text-brand-slate font-light">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{t('ui.championshippage.30c0440342')}</span>
                        </li>
                        <li className="flex items-center gap-2.5 text-xs text-brand-slate font-light">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{t('ui.championshippage.e399db7c21')}</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-gradient-to-br from-brand-dark/5 to-[#bd5b82]/5 rounded-xl p-5 border border-white/60 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] sm:text-[10px] font-mono uppercase tracking-wider text-brand-dark font-bold">{t('ui.championshippage.64c107dcac')}</span>
                        <p className="text-xs text-brand-slate mt-1.5 font-light leading-relaxed">{t('ui.championshippage.26ed71e452')}</p>
                      </div>
                      <a href="#apply-form-section" className="text-xs font-mono font-bold text-brand-dark hover:underline inline-flex items-center gap-1 mt-4">{t('ui.championshippage.b4c596db9d')}<ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* 9. EMBEDDED FORM & UX STATES */}
        <section id="apply-form-section" className="relative z-10 w-[88vw] md:w-[80vw] max-w-4xl mx-auto scroll-mt-24">
          <div className="bg-white/[0.10] glass-xl surface-elevated border border-white/[0.15] rounded-3xl p-6 sm:p-10 space-y-8">
            
             <div className="text-center space-y-2 pb-5">
               <h2 className="text-2xl sm:text-3xl font-serif text-brand-dark">{t('ui.championshippage.795d6a19a2')}</h2>
               <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed max-w-md mx-auto">{t('ui.championshippage.5788077ace')}</p>
            </div>

            {/* SUCCESS OR INPUT STATE */}
            <AnimatePresence mode="wait">
              {formStatus === 'success' && generatedTicket ? (
                <motion.div
                  key="form-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 py-6"
                >
                  <div className="w-16 h-16 bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Check className="w-8 h-8 stroke-[2.5]" />
                  </div>

                  <div className="text-center space-y-1.5">
                    <h3 className="text-xl sm:text-2xl font-serif text-brand-dark">{t('ui.championshippage.a93a7a5c05')}</h3>
                    <p className="text-xs sm:text-sm text-brand-slate font-light max-w-md mx-auto leading-relaxed">{t('ui.championshippage.06c9f79607')}</p>
                  </div>

                  {/* Virtual Ticket UX Prototype display */}
                  <div className="bg-white border border-[#d8d1cc] rounded-2xl overflow-hidden shadow-md max-w-md mx-auto relative">
                    
                    {/* Ticket Header */}
                    <div className="bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white p-4 text-left flex justify-between items-center">
                      <div>
                        <span className="text-[11px] sm:text-[10px] font-mono uppercase tracking-widest text-white/80">{t('ui.championshippage.41799b91ae')}</span>
                        <h4 className="text-xs sm:text-sm font-serif font-semibold mt-0.5 truncate max-w-[200px]">Navykus Global Case Cup</h4>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-white/10 rounded uppercase font-bold text-white border border-white/20">{t('ui.championshippage.7c2aa283')}</span>
                    </div>

                    {/* Ticket Content */}
                    <div className="p-5 text-left grid grid-cols-2 gap-4 text-xs bg-brand-pink-dust/10">
                      <div>
                        <span className="text-[8px] font-mono uppercase text-brand-slate block">{t('ui.championshippage.e5c77ea763')}</span>
                        <span className="font-serif font-bold text-brand-dark">{formData.name}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-mono uppercase text-brand-slate block">{t('ui.championshippage.279e46ae7c')}</span>
                        <span className="font-mono text-[11px] font-bold text-[#bc4638]">{generatedTicket.ticketId}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-mono uppercase text-brand-slate block">{t('ui.championshippage.9b7d543115')}</span>
                        <span className="font-serif font-medium text-brand-dark">{t('ui.championshippage.a5ddb876dd')}{formData.hasTeam === 'no' ? t('ui.championshippage.709d488ed6') : t('ui.championshippage.b6ebd71540')})</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-mono uppercase text-brand-slate block">{t('ui.championshippage.496a7539fc')}</span>
                        <span className="font-serif font-medium text-brand-dark">{formData.age}{t('ui.championshippage.b47dce337d')}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-mono uppercase text-brand-slate block">{t('ui.applicationmodal.61bd187017')}</span>
                        <span className="font-mono text-[10px] text-brand-slate">{generatedTicket.regTime}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-mono uppercase text-brand-slate block">{t('ui.championshippage.46803131c4')}</span>
                        <span className="font-serif font-bold text-brand-dark">№ {generatedTicket.seatNum}</span>
                      </div>
                    </div>

                    {/* Ticket footer helpful links */}
                    <div className="p-3 bg-white text-center text-[10px] text-brand-slate font-mono">
                      <span>{t('ui.championshippage.0e95df1685')}</span>
                      <a href="https://t.me/navykus_com" target="_blank" rel="noreferrer" className="text-[#bc4638] font-bold underline">@navykus_com</a>
                    </div>
                  </div>

                  {/* Teamless helper logic trigger if user says they don't have a team */}
                  {formData.hasTeam === 'no' && (
                    <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl text-left max-w-md mx-auto space-y-2.5">
                      <div className="flex gap-2 items-center text-amber-800">
                        <Users className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-mono uppercase tracking-wider font-bold">{t('ui.championshippage.c3ab55c9b3')}</span>
                      </div>
                      <p className="text-xs text-brand-slate font-light leading-relaxed">{t('ui.championshippage.949a42b4b3')}</p>
                      <button
                        onClick={() => handleNavigateFromChampionship('scenarios')}
                        className="text-xs font-mono font-bold text-[#bc4638] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >{t('ui.championshippage.5ab1637802')}<ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleResetForm}
                      className="inline-flex items-center gap-1.5 px-5 py-2 border border-[#d8d1cc] hover:border-brand-dark rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer transition-all bg-white"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{t('ui.championshippage.b7429d2f06')}</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {cmsData.registrationStatus === 'closed' && (
                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 text-center text-rose-800 space-y-2">
                      <Lock className="w-8 h-8 text-rose-500 mx-auto" />
                      <h4 className="font-serif font-semibold text-base">{t('ui.championshippage.d2be300a17')}</h4>
                      <p className="text-xs text-rose-700/80 max-w-sm mx-auto leading-relaxed">{t('ui.championshippage.098019329a')}</p>
                    </div>
                  )}

                  {cmsData.registrationStatus !== 'closed' && (
                    <>
                      {/* Form inputs fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1 text-left">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-slate">{t('ui.championshippage.78a613a53e')}<span className="text-[#bc4638]">*</span></label>
                          <input 
                            type="text" 
                            required
                            placeholder={t('ui.championshippage.c77e86cc10')}
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-white border border-[#d8d1cc] focus:border-[#8f99a8] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-dark transition-all"
                          />
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-slate">{t('ui.championshippage.e3a43c135f')}<span className="text-[#bc4638]">*</span></label>
                          <input 
                            type="email" 
                            required
                            placeholder="mail@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full bg-white border border-[#d8d1cc] focus:border-[#8f99a8] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-dark transition-all"
                          />
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-slate">{t('ui.championshippage.b520139c06')}<span className="text-[#bc4638]">*</span></label>
                          <input 
                            type="text" 
                            required
                            placeholder={t('ui.championshippage.7a94346b9f')}
                            value={formData.age}
                            onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                            className="w-full bg-white border border-[#d8d1cc] focus:border-[#8f99a8] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-dark transition-all"
                          />
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-slate">{t('ui.championshippage.450778ada1')}</label>
                          <input 
                            type="text" 
                            placeholder={t('ui.championshippage.6dfb2adc1d')}
                            value={formData.city}
                            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full bg-white border border-[#d8d1cc] focus:border-[#8f99a8] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-dark transition-all"
                          />
                        </div>
                      </div>

                      {/* Contact and team radio logic */}
                      <div className="space-y-4 pt-2">
                        <div className="space-y-1 text-left">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-slate">{t('ui.championshippage.e3a7a765c6')}<span className="text-[#bc4638]">*</span></label>
                          <input 
                            type="text" 
                            required
                            placeholder={t('ui.championshippage.d178b30c2a')}
                            value={formData.contact}
                            onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                            className="w-full bg-white border border-[#d8d1cc] focus:border-[#8f99a8] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-dark transition-all"
                          />
                        </div>

                        {/* Interactive Scenario Selection in the form */}
                        <div className="space-y-2 text-left">
                          <label className="block text-xs font-mono uppercase tracking-wider text-brand-slate">{t('ui.championshippage.d0dd2427')}</label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                              { id: 'no', label: t('ui.championshippage.9c2f9e9c80'), sub: t('ui.championshippage.273e4c328e') },
                              { id: 'yes', label: t('ui.championshippage.4e57303db7'), sub: t('ui.championshippage.51fb6ef174') },
                              { id: 'solo', label: t('ui.championshippage.76ad5775dc'), sub: t('ui.championshippage.d53bbd733d') }
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, hasTeam: opt.id }))}
                                className={`p-4 text-left rounded-xl border transition-all cursor-pointer ${
                                  formData.hasTeam === opt.id 
                                    ? 'bg-[#bc4638]/5 border-[#bc4638]/50 ring-1 ring-[#bc4638]/30' 
                                    : 'bg-white/50 border-[#d8d1cc]/60 hover:bg-white'
                                }`}
                              >
                                <span className="block text-sm sm:text-base font-serif font-bold text-brand-dark leading-tight">{opt.label}</span>
                                <span className="block text-xs sm:text-sm text-brand-slate font-normal md:font-light mt-1 leading-snug">{opt.sub}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {formData.hasTeam === 'yes' && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-1.5 text-left border-l-2 border-[#bc4638]/40 pl-3.5"
                          >
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-slate">{t('ui.championshippage.06f875a6')}</label>
                            <select 
                              value={formData.teamSize}
                              onChange={(e) => setFormData(prev => ({ ...prev, teamSize: e.target.value }))}
                              className="bg-white border border-[#d8d1cc] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#8f99a8]"
                            >
                              <option value="2">{t('ui.championshippage.6d9e8346c4')}</option>
                              <option value="3">{t('ui.championshippage.a6cf1eb47b')}</option>
                              <option value="4">{t('ui.championshippage.09ace79e1e')}</option>
                              <option value="5">{t('ui.championshippage.42bc95b75f')}</option>
                            </select>
                          </motion.div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1 text-left">
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-slate">{t('ui.championshippage.d8157e79ff')}</label>
                            <select 
                              value={formData.interests}
                              onChange={(e) => setFormData(prev => ({ ...prev, interests: e.target.value }))}
                              className="w-full bg-white border border-[#d8d1cc] rounded-xl px-3 py-2.5 text-xs text-brand-dark focus:outline-none"
                            >
                              <option value="urbanism">{t('ui.championshippage.30c7cb1a24')}</option>
                              <option value="smart-city-it">{t('ui.championshippage.a5822ac213')}</option>
                              <option value="design-creative">{t('ui.championshippage.d31fab3305')}</option>
                              <option value="business-management">{t('ui.championshippage.8ec0f58d42')}</option>
                            </select>
                          </div>

                          <div className="space-y-1 text-left">
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-slate">{t('ui.championshippage.40aa3bf48b')}</label>
                            <input 
                              type="text" 
                              placeholder="Behance, GitHub, Google Drive..."
                              value={formData.portfolioLink}
                              onChange={(e) => setFormData(prev => ({ ...prev, portfolioLink: e.target.value }))}
                              className="w-full bg-white border border-[#d8d1cc] focus:border-[#8f99a8] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-dark transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-slate">{t('ui.championshippage.0149330653')}</label>
                          <textarea 
                            rows={3}
                            placeholder={t('ui.championshippage.bacaeee8')}
                            value={formData.coverLetter}
                            onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
                            className="w-full bg-white border border-[#d8d1cc] focus:border-[#8f99a8] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-dark transition-all"
                          />
                        </div>

                      </div>

                      {/* Submit status displays */}
                      {formStatus === 'error' && formErrorMsg && (
                        <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs text-left rounded-xl font-medium">
                          {formErrorMsg}
                        </div>
                      )}

                      <div className="pt-4 flex flex-col items-center justify-center space-y-3">
                        <button
                          type="submit"
                          disabled={formStatus === 'submitting'}
                          className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white hover:opacity-95 disabled:opacity-50 text-xs font-mono tracking-widest uppercase font-bold rounded-xl transition-all shadow-lg shadow-[#bc4638]/15 cursor-pointer flex items-center justify-center gap-2"
                        >
                          {formStatus === 'submitting' ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>{t('ui.championshippage.c14d9af631')}</span>
                            </>
                          ) : (
                            <>
                              <span>{t('platform.auth.registerAction')}</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                        <p className="text-[10px] text-brand-slate font-light">{t('ui.championshippage.b21fd1fe62')}</p>
                      </div>
                    </>
                  )}
                </form>
              )}
            </AnimatePresence>

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
