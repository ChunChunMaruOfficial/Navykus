import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  fadeUp,
  fadeUpLarge,
  fadeInScale,
} from '../motion-animations';
import { 
  Award, 
  Calendar, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Info, 
  Settings, 
  Edit, 
  UserCheck, 
  RefreshCw, 
  FileText, 
  Check, 
  Plus, 
  Trash2, 
  Sparkles, 
  TrendingUp, 
  Compass,
  ArrowUpRight,
  Globe,
  Lock,
  ChevronDown,
  Clock,
  UserPlus,
  BookOpen
} from 'lucide-react';

interface Mentor {
  name: string;
  role: string;
  expertise: string;
}

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
  mentors: Mentor[];
  registrationStatus: 'open' | 'suspended' | 'closed';
}

interface FAQItem {
  question: string;
  answer: string;
}

interface ChampionshipPageProps {
  onBackToHome: () => void;
  onNavigateToSection: (sectionId: string) => void;
  onOpenApplyModal: () => void;
}

const SUITABILITY_TABS = [
  { id: 'all', label: 'ui.championshippage.228a84235a' },
  { id: 'teamless', label: 'ui.championshippage.a950b9ee19' },
  { id: 'creative', label: 'ui.championshippage.ca26c61c13' },
  { id: 'ambitious', label: 'ui.championshippage.97e139a69f' },
] as const;

type SuitabilityTab = typeof SUITABILITY_TABS[number]['id'];

export default function ChampionshipPage({ 
  onBackToHome, 
  onNavigateToSection, 
  onOpenApplyModal 
}: ChampionshipPageProps) {
  const { t } = useTranslation();

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
    mentors: [
      {
        name: t('ui.championshippage.052fb01664'),
        role: t('ui.championshippage.001a2ebaa3'),
        expertise: t('ui.championshippage.e3a8a73e2b')
      },
      {
        name: t('ui.championshippage.a580e0aa8d'),
        role: t('ui.championshippage.80252ebf4d'),
        expertise: t('ui.championshippage.bdea62169b')
      },
      {
        name: t('ui.championshippage.777f772d6f'),
        role: t('ui.championshippage.bc7f7951f3'),
        expertise: t('ui.championshippage.1c03d08986')
      }
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

  // New mentor input state
  const [newMentorName, setNewMentorName] = useState('');
  const [newMentorRole, setNewMentorRole] = useState('');
  const [newMentorExpertise, setNewMentorExpertise] = useState('');

  // New theme input state
  const [newTheme, setNewTheme] = useState('');

  // Interactive UI states (scenarios, tabs, accordions)
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeTimelineStep, setActiveTimelineStep] = useState<number>(0);
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

  // Add new mentor via CMS
  const handleAddMentor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMentorName.trim() || !newMentorRole.trim()) return;
    
    setCmsData(prev => ({
      ...prev,
      mentors: [
        ...prev.mentors,
        {
          name: newMentorName,
          role: newMentorRole,
          expertise: newMentorExpertise || t('ui.championshippage.545447d8fb')
        }
      ]
    }));
    setNewMentorName('');
    setNewMentorRole('');
    setNewMentorExpertise('');
  };

  // Delete mentor via CMS
  const handleDeleteMentor = (index: number) => {
    setCmsData(prev => ({
      ...prev,
      mentors: prev.mentors.filter((_, idx) => idx !== index)
    }));
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

  // Static items for visual timeline & faq
  const TIMELINE_STEPS = [
    {
      step: 1,
      title: t('ui.championshippage.e49a12f0b8'),
      desc: t('ui.championshippage.4ee6afa1a6'),
      highlight: t('ui.championshippage.6bc16a4703') + cmsData.registrationDeadline
    },
    {
      step: 2,
      title: t('ui.championshippage.2070234c2a'),
      desc: t('ui.championshippage.c2761e4600'),
      highlight: t('ui.championshippage.c6cf36a92f')
    },
    {
      step: 3,
      title: t('ui.championshippage.60c8f8d9bc'),
      desc: t('ui.championshippage.bf30acbb04'),
      highlight: t('ui.championshippage.342ef5b12d') + cmsData.date.split('–')[0]
    },
    {
      step: 4,
      title: t('ui.championshippage.9602b9d37a'),
      desc: t('ui.championshippage.a1f7854119'),
      highlight: t('ui.championshippage.ac0b271366')
    },
    {
      step: 5,
      title: t('ui.championshippage.55ad9d790f'),
      desc: t('ui.championshippage.d81bad3646'),
      highlight: t('ui.championshippage.79f0f1a30d')
    },
    {
      step: 6,
      title: t('ui.championshippage.98be2d9f24'),
      desc: t('ui.championshippage.20dc81369a'),
      highlight: t('ui.championshippage.1c3fdab6c1')
    },
    {
      step: 7,
      title: t('ui.championshippage.d824bb6cc4'),
      desc: t('ui.championshippage.f34151eece'),
      highlight: t('ui.championshippage.49424077d7')
    }
  ];

  const FAQ_ITEMS: FAQItem[] = [
    {
      question: t('ui.championshippage.75eb0d84'),
      answer: t('ui.championshippage.4b587e32b1')
    },
    {
      question: t('ui.championshippage.ccc076b0'),
      answer: t('ui.championshippage.abf0a3c0da')
    },
    {
      question: t('ui.championshippage.0a5a7de0'),
      answer: t('ui.championshippage.842ede64f5')
    },
    {
      question: t('ui.championshippage.fdb6874f'),
      answer: t('ui.championshippage.c00db4e511')
    },
    {
      question: t('ui.championshippage.c264c842'),
      answer: t('ui.championshippage.75488dd388')
    },
    {
      question: t('ui.championshippage.47dfb4af'),
      answer: t('ui.championshippage.59016ab8e3')
    }
  ];

  return (
    <div className="relative w-full text-brand-dark pb-16 pt-24">
      <div className="space-y-16">
        
        {/* Back navigation */}
        <div className="max-w-7xl mx-auto px-[6%] md:px-[10%]">
          <div className="flex justify-start mb-8 sm:mb-12">
            <button
              onClick={onBackToHome}
              className="group inline-flex items-center gap-2 px-4 py-2 border border-[#d8d1cc]/60 hover:border-brand-dark text-xs font-mono tracking-wider uppercase text-brand-slate hover:text-brand-dark transition-all rounded-xl cursor-pointer bg-white/20 backdrop-blur-sm"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180 transition-transform group-hover:-translate-x-0.5" />
              <span>{t('ui.aboutprojectpage.a9dc864a2e')}</span>
            </button>
          </div>
        </div>

        {/* 1. HERO BLOCK OF CHAMPIONSHIP */}
        <section className="relative z-10 text-center space-y-6 mx-auto mb-8 max-w-7xl px-[6%] md:px-[10%]">
          {/* Status badge based on CMS registration state */}
          <div className="flex justify-center">
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
            className="text-brand-slate text-sm sm:text-base md:text-lg leading-relaxed font-light max-w-3xl mx-auto text-balance"
          >
            {cmsData.pitch}
          </motion.p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
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
        </section>

        {/* 2. COMPACT KEY INFO CARDS BLOCK */}
        <section className="relative z-10 max-w-7xl mx-auto px-[6%] md:px-[10%]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
              className="bg-white/[0.12] glass-card border border-white/[0.15] p-4 rounded-2xl text-left flex flex-col justify-between space-y-2"
            >
              <span className="text-[11px] sm:text-[10px] font-mono uppercase tracking-wider text-[#bc4638]">{t('ui.championshippage.8d4a5a0ee6')}</span>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-serif font-bold text-brand-dark">{cmsData.date}</p>
                <p className="text-xs text-brand-slate font-normal md:font-light">{t('ui.app.aa324b069f')}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
              className="bg-white/[0.12] glass-card border border-white/[0.15] p-4 rounded-2xl text-left flex flex-col justify-between space-y-2"
            >
              <span className="text-[11px] sm:text-[10px] font-mono uppercase tracking-wider text-[#bd5b82]">{t('ui.championshippage.f94a9af829')}</span>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-serif font-bold text-brand-dark">{t('ui.championshippage.8bd2b856e1')}</p>
                <p className="text-xs text-brand-slate font-normal md:font-light">Zoom, Figma, Miro</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.16 }}
              className="bg-white/[0.12] glass-card border border-white/[0.15] p-4 rounded-2xl text-left flex flex-col justify-between space-y-2"
            >
              <span className="text-[11px] sm:text-[10px] font-mono uppercase tracking-wider text-[#bc4638]">{t('ui.championshippage.e70496e65c')}</span>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-serif font-bold text-brand-dark">{t('ui.championshippage.ff03252b22')}{cmsData.ageLimit}</p>
                <p className="text-xs text-brand-slate font-normal md:font-light">{t('ui.championshippage.05679f1a9a')}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.24 }}
              className="bg-white/[0.12] glass-card border border-white/[0.15] p-4 rounded-2xl text-left flex flex-col justify-between space-y-2"
            >
              <span className="text-[11px] sm:text-[10px] font-mono uppercase tracking-wider text-[#bd5b82]">{t('ui.championshippage.d48444dfb4')}</span>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-serif font-bold text-brand-dark">{cmsData.lang}</p>
                <p className="text-xs text-brand-slate font-normal md:font-light">{t('ui.championshippage.1185c79f59')}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.32 }}
              className="bg-white/[0.12] glass-card border border-white/[0.15] p-4 rounded-2xl text-left flex flex-col justify-between space-y-2"
            >
              <span className="text-[11px] sm:text-[10px] font-mono uppercase tracking-wider text-[#bc4638]">{t('ui.championshippage.4ec991f17a')}</span>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-serif font-bold text-[#bc4638]">{cmsData.registrationDeadline}</p>
                <p className="text-xs text-brand-slate font-normal md:font-light">{t('ui.championshippage.593bb47761')}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.40 }}
              className="bg-white/[0.12] glass-card border border-white/[0.15] p-4 rounded-2xl text-left flex flex-col justify-between space-y-2"
            >
              <span className="text-[11px] sm:text-[10px] font-mono uppercase tracking-wider text-[#bd5b82]">{t('ui.championshippage.a7fbd7c9e4')}</span>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-serif font-bold text-brand-dark">{t('ui.championshippage.0df738a56f')}</p>
                <p className="text-[10px] text-[#bd5b82] font-semibold">{t('ui.championshippage.04aa324d68')}</p>
              </div>
            </motion.div>

          </div>
        </section>

        {/* 3. ABOUT THE CHAMPIONSHIP */}
        <motion.section
          {...fadeUpLarge}
          className="relative z-10 py-10 md:py-14 bg-white/[0.10] glass-xl border border-white/[0.15] rounded-3xl card-blush"
        >
          <div className="max-w-7xl mx-auto px-[6%] md:px-[10%] grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-6">
              <h2 className="text-3xl font-serif text-brand-dark leading-tight">{t('ui.championshippage.f30417ddf0')}</h2>
              <p className="text-xs sm:text-sm text-brand-slate font-normal md:font-light leading-relaxed">
                {cmsData.description}
              </p>
              <div className="p-4 bg-white/[0.12] glass-panel rounded-2xl border border-white/[0.12]">
                <span className="text-[11px] sm:text-[10px] font-mono uppercase tracking-wider text-brand-slate block mb-1">{t('ui.championshippage.d50e039adb')}</span>
                <p className="text-xs text-brand-dark font-medium leading-relaxed font-serif">
                  {cmsData.expectedResult}
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
            
            {/* Themes list from CMS */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-brand-dark font-semibold">{t('ui.championshippage.5c807e4149')}</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cmsData.themes.map((theme, idx) => (
                  <div key={idx} className="bg-white/[0.12] glass-card border border-white/[0.15] p-3.5 rounded-xl text-left flex items-start gap-3">
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
              <span className="text-[10px] font-mono uppercase tracking-wider text-brand-dark font-semibold">{t('ui.championshippage.9ab00a25e1')}</span>
              <div className="space-y-2">
                {cmsData.evaluationCriteria.map((crit, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-brand-slate font-normal md:font-light">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{crit}</span>
                  </div>
                ))}
              </div>
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
                className="bg-white/[0.10] glass-xl border border-white/[0.15] rounded-2xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-left"
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
                    <div className="bg-brand-dark text-white rounded-xl p-5 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] sm:text-[10px] font-mono uppercase tracking-wider text-brand-terracotta font-bold">{t('ui.championshippage.9f228ac331')}</span>
                        <p className="text-xs text-white/85 mt-1.5 font-light leading-relaxed">{t('ui.championshippage.a3e6b0b4fd')}</p>
                      </div>
                      <button
                        onClick={() => handleNavigateFromChampionship('scenarios')}
                        className="text-xs font-mono font-bold text-brand-terracotta hover:underline inline-flex items-center gap-1 mt-4 cursor-pointer text-left"
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

        {/* 5. INTERACTIVE TIMELINE BLOCK */}
        <section className="relative z-10 py-16 md:py-24 mb-12 md:mb-16 section-accent-warm max-w-7xl mx-auto px-[6%] md:px-[10%]">
          <div className="text-center space-y-3 mx-auto mb-8 md:mb-10">
            <h2 className="text-2xl sm:text-3xl font-serif text-brand-dark tracking-tight">{t('ui.championshippage.b41ff491ad')}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mx-auto">
            
            {/* Steps Left List (Clickable menu) */}
            <div className="lg:col-span-5 space-y-2">
              {TIMELINE_STEPS.map((step, idx) => (
                <button
                  key={step.step}
                  onClick={() => setActiveTimelineStep(idx)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all border flex items-center justify-between cursor-pointer ${
                    activeTimelineStep === idx 
                      ? 'bg-brand-dark text-white border-brand-dark shadow-md' 
                      : 'bg-white/40 text-brand-slate hover:text-brand-dark border-white/50 hover:bg-white/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border ${
                      activeTimelineStep === idx ? 'bg-white text-brand-dark border-white' : 'bg-brand-dark/5 text-brand-dark border-brand-dark/10'
                    }`}>
                      {step.step}
                    </span>
                    <span className="text-xs font-serif font-medium truncate max-w-[200px] sm:max-w-none">{step.title}</span>
                  </div>
                  <ArrowRight className={`w-3.5 h-3.5 transition-transform ${activeTimelineStep === idx ? 'translate-x-1' : 'opacity-30'}`} />
                </button>
              ))}
            </div>

            {/* Step Detail Right Viewer */}
            <div className="lg:col-span-7 h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTimelineStep}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white/[0.12] glass-panel border border-white/[0.15] p-6 sm:p-8 rounded-3xl text-left space-y-6 h-full flex flex-col justify-between"
                >
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#bc4638] font-bold">{t('ui.championshippage.6eaf12bfb5')}{TIMELINE_STEPS[activeTimelineStep].step}{t('ui.championshippage.bc6f640c2c')}</span>
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-bold">
                        {TIMELINE_STEPS[activeTimelineStep].highlight}
                      </span>
                    </div>

                    <h3 className="text-xl font-serif text-brand-dark">
                      {TIMELINE_STEPS[activeTimelineStep].title}
                    </h3>
                    
                    <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
                      {TIMELINE_STEPS[activeTimelineStep].desc}
                    </p>
                  </div>

                  <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-[10px] text-brand-slate font-mono font-semibold">
                      {activeTimelineStep < 6 ? t('ui.championshippage.285e2e51f4') + TIMELINE_STEPS[activeTimelineStep + 1].title : t('ui.championshippage.87719eaf02')}
                    </span>
                    
                    {activeTimelineStep < 6 ? (
                      <button 
                        onClick={() => setActiveTimelineStep(prev => prev + 1)}
                        className="w-full sm:w-auto px-4 py-2 bg-brand-dark text-white hover:bg-brand-dark/90 rounded-lg text-xs font-mono tracking-wider uppercase transition-all cursor-pointer"
                      >{t('ui.championshippage.a77e33e8d3')}</button>
                    ) : (
                      <a 
                        href="#apply-form-section"
                        className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white rounded-lg text-xs font-mono tracking-wider uppercase text-center cursor-pointer font-bold"
                      >{t('ui.championshippage.645661f0ee')}</a>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </section>

        {/* 7. EXPERTS / JURY BLOCK */}
        <section className="relative z-10 py-16 md:py-24 section-accent-rose max-w-7xl mx-auto px-[6%] md:px-[10%]">
          <div className="text-center space-y-3 mx-auto">
            <h2 className="text-2xl sm:text-3xl font-serif text-brand-dark tracking-tight">{t('ui.championshippage.4591330e49')}</h2>
            <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">{t('ui.championshippage.642a217314')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mx-auto">
            {cmsData.mentors.map((mentor, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="bg-white/[0.12] glass-card border border-white/[0.15] p-6 rounded-2xl text-left flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-[#bc4638]/5 to-[#bd5b82]/5 border border-white/80 flex items-center justify-center font-serif text-sm font-bold text-[#bc4638]">
                      {mentor.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-serif font-bold leading-tight text-brand-dark">{mentor.name}</h3>
                      <p className="text-[11px] font-mono text-brand-slate tracking-wide mt-0.5 leading-tight">{mentor.role}</p>
                    </div>
                  </div>
                </div>
                <div className="pt-3">
                  <span className="text-[11px] sm:text-[10px] font-mono uppercase tracking-wider text-[#bc4638] block mb-1">{t('ui.championshippage.40baedef9b')}</span>
                  <p className="text-xs text-brand-slate font-light leading-relaxed">{mentor.expertise}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 9. EMBEDDED FORM & UX STATES */}          <section id="apply-form-section" className="relative z-10 max-w-7xl mx-auto scroll-mt-24 px-[6%] md:px-[10%]">
          <div className="bg-white/[0.10] glass-xl border border-white/[0.15] rounded-3xl p-6 sm:p-10 space-y-8 max-w-3xl mx-auto">
            
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
                            className="w-full bg-white border border-[#d8d1cc] focus:border-[#bc4638]/60 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-dark transition-all"
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
                            className="w-full bg-white border border-[#d8d1cc] focus:border-[#bc4638]/60 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-dark transition-all"
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
                            className="w-full bg-white border border-[#d8d1cc] focus:border-[#bc4638]/60 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-dark transition-all"
                          />
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-slate">{t('ui.championshippage.450778ada1')}</label>
                          <input 
                            type="text" 
                            placeholder={t('ui.championshippage.6dfb2adc1d')}
                            value={formData.city}
                            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full bg-white border border-[#d8d1cc] focus:border-[#bc4638]/60 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-dark transition-all"
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
                            className="w-full bg-white border border-[#d8d1cc] focus:border-[#bc4638]/60 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-dark transition-all"
                          />
                        </div>

                        {/* Interactive Scenario Selection in the form */}
                        <div className="space-y-2 text-left">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-slate">{t('ui.championshippage.d0dd2427')}</label>
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
                                className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                                  formData.hasTeam === opt.id 
                                    ? 'bg-[#bc4638]/5 border-[#bc4638]/50 ring-1 ring-[#bc4638]/30' 
                                    : 'bg-white/50 border-[#d8d1cc]/60 hover:bg-white'
                                }`}
                              >
                                <span className="block text-xs font-serif font-bold text-brand-dark">{opt.label}</span>
                                <span className="block text-[10px] text-brand-slate font-light mt-0.5">{opt.sub}</span>
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
                              className="bg-white border border-[#d8d1cc] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#bc4638]"
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
                              className="w-full bg-white border border-[#d8d1cc] focus:border-[#bc4638]/60 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-dark transition-all"
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
                            className="w-full bg-white border border-[#d8d1cc] focus:border-[#bc4638]/60 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-dark transition-all"
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
                              <span>{t('ui.championshippage.c1e5fa9018')}</span>
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
            <h2 className="text-2xl sm:text-3xl font-serif text-brand-dark">{t('ui.findteampage.f119ad282e')}</h2>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-white/[0.08] glass-card border border-white/[0.12] rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-serif font-semibold text-brand-dark text-xs sm:text-sm md:text-base cursor-pointer"
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
                       <p className="p-5 pt-0 text-xs sm:text-sm text-brand-slate font-normal md:font-light leading-relaxed bg-white/10 text-left">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.section>

        {/* 11. FINAL CALL TO ACTION */}
        <motion.section
          {...fadeInScale}
          className="relative z-10 py-16 md:py-24 max-w-7xl mx-auto px-[6%] md:px-[10%] section-accent-warm"
        >
          <div className="bg-gradient-to-br from-[#bc4638]/8 via-white/[0.12] to-[#bd5b82]/8 glass-xl border border-white/[0.15] rounded-3xl p-8 sm:p-12 text-center space-y-6">
            
            <h2 className="text-3xl sm:text-4xl font-serif text-brand-dark tracking-tight leading-tight max-w-2xl mx-auto">{t('ui.championshippage.c0e506f98a')}</h2>
            <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed max-w-md mx-auto">{t('ui.championshippage.424ad3a346')}{cmsData.maxParticipants}{t('ui.championshippage.79e49fa24f')}</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {cmsData.registrationStatus !== 'closed' ? (
                <a
                  href="#apply-form-section"
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white hover:opacity-95 text-xs font-mono tracking-widest rounded-xl transition-all shadow-lg shadow-[#bc4638]/15 font-bold uppercase"
                >{t('ui.app.24cd8dc78d')}</a>
              ) : (
                <button
                  disabled
                  className="w-full sm:w-auto px-8 py-3.5 bg-gray-300 text-gray-500 rounded-xl text-xs font-mono tracking-widest uppercase cursor-not-allowed font-bold"
                >{t('ui.championshippage.a9e0cfbc2d')}</button>
              )}

              <button
                onClick={() => handleNavigateFromChampionship('scenarios')}
                className="w-full sm:w-auto px-8 py-3.5 bg-white/50 border border-[#d8d1cc] text-[#5b6472] hover:border-[#bc4638]/60 text-xs font-mono tracking-widest rounded-xl transition-all cursor-pointer uppercase font-semibold"
              >{t('ui.app.d13f387e64')}</button>
            </div>
          </div>
        </motion.section>

      </div>
    </div>
  );
}
