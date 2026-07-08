import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowUpRight, 
  Sparkles, 
  Compass, 
  Users, 
  Calendar, 
  BookOpen, 
  MapPin, 
  Clock, 
  ArrowRight,
  GraduationCap,
  ChevronDown,
  Globe,
  Award,
  Search,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  UserCheck,
  Briefcase
} from 'lucide-react';
import GlassCrystal from './components/GlassCrystal';
import ApplicationModal from './components/ApplicationModal';
import AboutProjectPage from './components/AboutProjectPage';
import ChampionshipPage from './components/ChampionshipPage';
import { TOURNAMENTS, PILLARS, STATS, EXPERTS, SCENARIOS, TRUST_POINTS } from './data';

const LANGUAGES = [
  { code: 'RU', name: 'Русский', flag: '🇷🇺' },
  { code: 'EN', name: 'English', flag: '🇬🇧' },
  { code: 'KK', name: 'Қазақша', flag: '🇰🇿' },
  { code: 'UZ', name: 'Oʻzbekcha', flag: '🇺🇿' },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'about' | 'championship'>('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTourney, setSelectedTourney] = useState<string | undefined>(undefined);
  const [scrolled, setScrolled] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [lang, setLang] = useState<string>('RU');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // Embedded Application Form State
  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formInterest, setFormInterest] = useState('Разработка проектов');
  const [formSubmitStatus, setFormSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Close language dropdown on outside click
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

  // Handle header show/hide and visual style on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 40);
      
      if (currentScrollY <= 40) {
        showHeader || setShowHeader(true);
      } else if (currentScrollY > lastScrollY) {
        showHeader && setShowHeader(false);
      } else {
        showHeader || setShowHeader(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, showHeader]);

  const openApplyModal = (tournamentId?: string) => {
    setSelectedTourney(tournamentId);
    setIsModalOpen(true);
  };

  const scrollToSection = (id: string) => {
    if (currentPage !== 'home') {
      setCurrentPage('home');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Inline Form Validation and Submit
  const handleInlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];
    if (!formName.trim()) {
      errors.push('Пожалуйста, введите ваше имя');
    }
    if (!formAge.trim() || isNaN(Number(formAge)) || Number(formAge) < 10 || Number(formAge) > 22) {
      errors.push('Укажите корректный возраст (от 10 до 22 лет)');
    }
    if (!formLocation.trim()) {
      errors.push('Пожалуйста, укажите вашу страну или город');
    }
    if (!formContact.trim()) {
      errors.push('Укажите ваш email, Telegram или другой мессенджер');
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      setFormSubmitStatus('error');
      return;
    }

    setFormErrors([]);
    setFormSubmitStatus('submitting');

    // Simulate database write / UX feedback loader
    setTimeout(() => {
      setFormSubmitStatus('success');
      // Reset form on success
      setFormName('');
      setFormAge('');
      setFormLocation('');
      setFormContact('');
    }, 1500);
  };

  const nearestTournament = TOURNAMENTS[0]; // Sustainable Cities as nearest

  return (
    <div className="relative min-h-screen bg-[#fffaf7] text-[#111111] font-sans overflow-x-hidden selection:bg-brand-pink-dust/30 selection:text-brand-dark">
      
      {/* Subtle Dust/Grain Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply z-0" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }}></div>

      {/* BACKGROUND GRAPHIC LINES (PREMIUM COORDINATE SYSTEM / GRID GUIDES) */}
      <div id="grid-background-system" className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.25]" style={{ backgroundImage: "linear-gradient(#d8d1cc 1px, transparent 1px), linear-gradient(90deg, #d8d1cc 1px, transparent 1px)", backgroundSize: "120px 120px" }}></div>
        <div className="absolute left-[8%] top-0 bottom-0 w-[1px] bg-[#d8d1cc] opacity-30"></div>
        <div className="absolute right-[8%] top-0 bottom-0 w-[1px] bg-[#d8d1cc] opacity-30"></div>
      </div>

      {/* AMBIENT GLOWS AND SPOTLIGHTS (DEPTH) */}
      <div id="ambient-lighting-engine" className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-15" style={{ background: "radial-gradient(circle, #bd5b82, #bc4638)" }}></div>
        <div className="absolute bottom-[20%] left-[5%] w-[500px] h-[500px] rounded-full blur-[110px] opacity-10" style={{ background: "radial-gradient(circle, #d89aa9, transparent)" }}></div>
      </div>

      {/* NAVIGATION HEADER */}
      <header 
        id="navbar-system"
        className={`fixed left-1/2 -translate-x-1/2 w-[95%] lg:w-[90%] max-w-6xl z-40 transition-all duration-500 ease-in-out ${
          showHeader 
            ? (scrolled ? 'top-4 opacity-100' : 'top-6 opacity-100') 
            : '-top-24 opacity-0 pointer-events-none'
        }`}
      >
        <div className="relative w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 rounded-full border border-white/60 backdrop-blur-2xl bg-white/35 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_12px_40px_rgba(189,91,130,0.06)] transition-all duration-300">
          
          {/* Logo Name */}
          <button 
            onClick={() => {
              setCurrentPage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <svg 
              viewBox="0 0 400 480" 
              className="w-5 h-6 sm:w-6 sm:h-7 drop-shadow-[0_4px_12px_rgba(188,70,56,0.15)] transition-transform duration-500 ease-out group-hover:scale-110"
            >
              <defs>
                <linearGradient id="header-logo-left-grad" x1="15%" y1="0%" x2="85%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                  <stop offset="25%" stopColor="#f38b76" stopOpacity="0.75" />
                  <stop offset="65%" stopColor="#bc4638" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#80261b" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="header-logo-right-grad" x1="15%" y1="0%" x2="85%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                  <stop offset="25%" stopColor="#e28fb1" stopOpacity="0.75" />
                  <stop offset="65%" stopColor="#bd5b82" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#803251" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="header-logo-h-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#bc4638" stopOpacity="0.85" />
                  <stop offset="20%" stopColor="#f38b76" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#d57e8c" stopOpacity="0.8" />
                  <stop offset="80%" stopColor="#e28fb1" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#bd5b82" stopOpacity="0.85" />
                </linearGradient>
              </defs>
              <circle cx="102.5" cy="75" r="42.5" fill="url(#header-logo-left-grad)" />
              <circle cx="297.5" cy="75" r="42.5" fill="url(#header-logo-right-grad)" />
              <path 
                d="M 60,180 A 42.5,42.5 0 0,1 145,180 L 145,220 C 145,236.5 158.5,250 175,250 L 225,250 C 241.5,250 255,236.5 255,220 L 255,180 A 42.5,42.5 0 0,1 340,180 L 340,400 A 42.5,42.5 0 0,1 255,400 L 255,360 C 255,343.5 241.5,330 225,330 L 175,330 C 158.5,330 145,343.5 145,360 L 145,400 A 42.5,42.5 0 0,1 60,400 Z" 
                fill="url(#header-logo-h-grad)" 
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1.5"
              />
            </svg>
            <span className="font-semibold tracking-tight text-sm sm:text-base text-[#111111]">
              Навыкус
            </span>
          </button>

          {/* Navigation Links (UX Pathing) */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-8 text-[11px] lg:text-[12px] font-medium text-[#5b6472] uppercase tracking-wider">
            <button 
              onClick={() => {
                setCurrentPage('about');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`hover:text-[#bc4638] transition-colors cursor-pointer ${currentPage === 'about' ? 'text-[#bc4638] font-bold underline decoration-2 underline-offset-4' : ''}`}
            >
              О проекте
            </button>
            <button 
              onClick={() => {
                setCurrentPage('championship');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`hover:text-[#bc4638] transition-colors cursor-pointer ${currentPage === 'championship' ? 'text-[#bc4638] font-bold underline decoration-2 underline-offset-4' : ''}`}
            >
              Чемпионат
            </button>
            <button 
              onClick={() => scrollToSection('scenarios')}
              className="hover:text-[#bc4638] transition-colors cursor-pointer"
            >
              Сценарии участия
            </button>
            <button 
              onClick={() => scrollToSection('mentors-block')}
              className="hover:text-[#bc4638] transition-colors cursor-pointer"
            >
              Эксперты
            </button>
            <button 
              onClick={() => scrollToSection('trust-block')}
              className="hover:text-[#bc4638] transition-colors cursor-pointer"
            >
              Преимущества
            </button>
          </nav>

          {/* Right Actions: Language Switcher & CTA Button */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLangDropdownOpen(!isLangDropdownOpen);
                }}
                className="flex items-center gap-1 bg-white/20 hover:bg-white/35 border border-white/40 px-2 sm:px-3 py-1.5 rounded-full text-[12px] font-mono shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)] transition-all cursor-pointer text-brand-dark"
              >
                <span>{LANGUAGES.find(l => l.code === lang)?.flag}</span>
                <span className="font-semibold tracking-wider text-[11px] sm:text-[12px]">{lang}</span>
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
                      {LANGUAGES.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => {
                            setLang(l.code);
                            setIsLangDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${
                            lang === l.code
                              ? 'bg-brand-dark text-white font-medium'
                              : 'text-brand-slate hover:bg-white/40 hover:text-brand-dark'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{l.flag}</span>
                            <span>{l.code}</span>
                          </div>
                          {lang === l.code && (
                            <span className="w-1.5 h-1.5 bg-brand-terracotta rounded-full"></span>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Header CTA Button */}
            <button
              onClick={() => openApplyModal()}
              className="bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-[12px] font-medium shadow-lg shadow-[#bc4638]/20 hover:scale-[1.02] transition-transform cursor-pointer whitespace-nowrap"
            >
              <span className="inline lg:hidden">Подать анкету</span>
              <span className="hidden lg:inline">Подать свою анкету</span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {currentPage === 'home' ? (
          <motion.div
            key="home-page"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            {/* 1. HERO BLOCK */}
      <section 
        id="hero-intro"
        className="relative z-10 pt-36 pb-16 md:pt-48 md:pb-24 max-w-7xl mx-auto px-[6%] md:px-[10%] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
      >
        {/* Left Side: Editorial Typography & Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="lg:col-span-7 space-y-8 text-left z-10"
        >
          <div className="flex flex-col gap-4">
            {/* Core Header Title */}
            <h1 className="text-3xl sm:text-4xl md:text-[44px] lg:text-[52px] xl:text-[58px] leading-[1.1] text-[#111111] font-serif font-light italic tracking-tight text-balance">
              Навыкус — твой старт в<br/>
              <span className="not-italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#bc4638] to-[#bd5b82]">международное сообщество</span><br/>
              активных школьников
            </h1>

            {/* Persuasive Subtitle */}
            <p className="text-[#5b6472] text-sm sm:text-base md:text-lg leading-relaxed max-w-[560px] font-light text-balance">
              Развивай ключевые навыки будущего через онлайн-чемпионаты, создавай жизнеспособные проекты и находи единомышленников по всему миру под руководством опытных экспертов.
            </p>
          </div>

          {/* Primary & Secondary CTA Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <button
              onClick={() => openApplyModal()}
              className="px-8 py-4 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white rounded-2xl text-[14px] font-medium shadow-xl shadow-[#bc4638]/25 hover:shadow-[#bc4638]/35 hover:scale-[1.01] transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <span>Подать заявку</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>

            <button
              onClick={() => scrollToSection('scenarios')}
              className="px-8 py-4 bg-white/40 backdrop-blur-md border border-[#d8d1cc] hover:border-[#bc4638]/60 rounded-2xl text-[14px] font-medium text-[#5b6472] hover:text-[#bc4638] transition-all text-center cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.01)]"
            >
              Найти команду
            </button>
          </div>

          {/* Trust Metrics Sub-system */}
          <div className="pt-6 border-t border-brand-pink-dust/10 flex flex-wrap items-center gap-x-8 gap-y-4 text-xs text-brand-slate/90">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#bd5b82]" />
              <span><strong>2,500+</strong> Студентов-участников</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#bc4638]" />
              <span><strong>15+</strong> Стран присутствия</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-700" />
              <span><strong>40+</strong> Экспертов из MIT & YC</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Gigantic Refracting Glassmorphic Brand Logo (No Tech-Larping) */}
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

      {/* STATS HERO GRID BANNER (CMS READY) */}
      <motion.section 
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-7xl mx-auto px-[6%] md:px-[10%] py-6"
      >
        <div className="bg-white/20 backdrop-blur-xl border border-white/60 rounded-3xl p-6 md:p-8 shadow-[inset_0_1px_3px_rgba(255,255,255,0.4),0_15px_45px_rgba(27,24,22,0.01)]">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-4 divide-y sm:divide-y-0 lg:divide-x divide-[#d8d1cc]/40">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center lg:px-4 first:pt-0 pt-4 sm:pt-0">
                <div className="text-2xl md:text-3xl font-serif font-light text-[#bc4638] tracking-tight">
                  {stat.value}
                </div>
                <div className="text-[10px] font-mono text-brand-slate tracking-wider uppercase mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 2. BLOCK: WHAT IS NAVYKUS (О ПРОЕКТЕ & НАПРАВЛЕНИЯ) */}
      <section 
        id="what-is-navykus" 
        className="relative z-10 py-16 md:py-24 max-w-7xl mx-auto px-[6%] md:px-[10%] space-y-12"
      >
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <span className="text-[10px] font-mono tracking-[0.2em] text-[#bc4638] uppercase font-semibold">
            О НАШЕЙ МИССИИ
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-brand-dark tracking-tight">
            Что такое Навыкус?
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-brand-slate font-light leading-relaxed max-w-2xl mx-auto text-balance">
            Навыкус — это инновационная экосистема, которая стирает границы между странами и школьными партами. Мы помогаем талантливой молодежи находить друг друга, запускать жизнеспособные проекты и заявлять о себе на международной арене.
          </p>
        </motion.div>

        {/* 4 Cards representing directions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PILLARS.map((pillar, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
              className="bg-white/15 backdrop-blur-2xl border border-white/60 p-6 sm:p-7 rounded-2xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.45),0_12px_30px_rgba(27,24,22,0.01)] hover:bg-white/30 hover:border-white/80 hover:shadow-[0_20px_40px_rgba(189,91,130,0.06)] transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="font-mono text-[10px] text-[#bd5b82] font-semibold tracking-wider">
                  {pillar.label}
                </div>
                <h3 className="text-lg font-serif font-medium text-brand-dark">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. BLOCK: NEAREST CHAMPIONSHIP (БЛИЖАЙШИЙ ЧЕМПИОНАТ) */}
      <section 
        id="nearest-championship"
        className="relative z-10 py-16 md:py-20 max-w-7xl mx-auto px-[6%] md:px-[10%]"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white/20 backdrop-blur-2xl border border-white/70 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.45),0_30px_70px_rgba(189,91,130,0.05)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        >
          {/* Main Info Block */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono tracking-wider text-[#bc4638] bg-[#bc4638]/10 px-2.5 py-1 rounded-md uppercase font-semibold">
                БЛИЖАЙШЕЕ МЕРОПРИЯТИЕ
              </span>
              <span className="text-[10px] font-mono text-brand-slate flex items-center gap-1.5 bg-white/40 px-2.5 py-1 rounded-md border border-white/60">
                <Clock className="w-3.5 h-3.5 text-[#bd5b82]" />
                Онлайн-формат
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-brand-dark tracking-tight leading-tight">
              {nearestTournament.title}
            </h3>

            <p className="text-xs sm:text-sm md:text-base text-brand-slate font-light leading-relaxed">
              {nearestTournament.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-brand-pink-dust/10 pt-5">
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">КОМУ ПОДХОДИТ</div>
                <div className="text-xs text-brand-slate font-light">
                  {nearestTournament.suitableFor}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">РЕГЛАМЕНТ И СРОКИ</div>
                <div className="text-xs text-brand-slate font-light">
                  <strong>Сроки:</strong> {nearestTournament.date}<br/>
                  <strong>Регистрация до:</strong> {nearestTournament.registrationDeadline}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-3">
              {nearestTournament.skills.map((skill, sIdx) => (
                <span 
                  key={sIdx} 
                  className="text-xs font-mono font-medium tracking-wide bg-[#bc4638]/8 text-[#bc4638] border border-[#bc4638]/25 px-3 py-1 rounded-full shadow-[0_2px_4px_rgba(188,70,56,0.04)]"
                >
                  {skill}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <button
                onClick={() => openApplyModal(nearestTournament.id)}
                className="px-6 py-3 bg-[#bc4638] text-white hover:bg-[#bc4638]/90 text-xs sm:text-sm font-mono tracking-wider rounded-xl transition-all shadow-md shadow-[#bc4638]/15 cursor-pointer text-center font-medium"
              >
                ПОДАТЬ ЗАЯВКУ НА КУБОК
              </button>
              <button
                onClick={() => scrollToSection('scenarios')}
                className="px-6 py-3 bg-white/40 border border-[#d8d1cc] text-[#5b6472] hover:border-brand-dark/40 text-xs sm:text-sm font-mono tracking-wider rounded-xl transition-all cursor-pointer text-center"
              >
                ПОДРОБНЕЕ О ТУРНИРАХ
              </button>
            </div>
          </div>

          {/* Visual card sidebar (Faceted information) */}
          <div className="lg:col-span-5 bg-white/30 backdrop-blur-md border border-white/50 rounded-2xl p-6 space-y-6">
            <h4 className="text-xs font-mono text-brand-dark uppercase tracking-widest border-b border-[#d8d1cc]/40 pb-3 font-semibold">
              Жюри и наставники кубка
            </h4>
            <div className="space-y-4">
              {nearestTournament.mentors.map((mentor, mIdx) => (
                <div key={mIdx} className="flex gap-3 text-left">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#bc4638]/20 to-[#bd5b82]/20 flex items-center justify-center font-mono text-[11px] font-bold text-[#bc4638] shrink-0 border border-white/80">
                    {mIdx + 1}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-serif font-medium text-brand-dark">
                      {mentor.split(' (')[0]}
                    </div>
                    <div className="text-[10px] text-brand-slate font-light">
                      {mentor.split(' (')[1] ? mentor.split(' (')[1].replace(')', '') : 'Приглашенный эксперт'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-[#d8d1cc]/40 pt-4 text-center">
              <span className="text-[10px] font-mono text-brand-slate uppercase block mb-1">ОСТАЛОСЬ МЕСТ</span>
              <span className="text-xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#bc4638] to-[#bd5b82]">
                {nearestTournament.maxParticipants} мест в отборе
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 4. BLOCK: PARTICIPATION SCENARIOS (ВОЗМОЖНОСТИ УЧАСТИЯ) */}
      <section 
        id="scenarios"
        className="relative z-10 py-16 md:py-24 max-w-7xl mx-auto px-[6%] md:px-[10%] space-y-12"
      >
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto space-y-3"
        >
          <span className="text-[10px] font-mono tracking-[0.2em] text-[#bc4638] uppercase font-semibold">
            ТРАЕКТОРИИ РОСТА
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-brand-dark tracking-tight">
            Возможности участия в платформе
          </h2>
          <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
            Мы спроектировали разные траектории для каждого участника. Найдите свой сценарий и сделайте первый шаг.
          </p>
        </motion.div>

        {/* 4 Scenarios Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SCENARIOS.map((scenario, idx) => (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: "easeOut" }}
              className="bg-white/15 backdrop-blur-2xl border border-white/60 p-6 rounded-2xl shadow-[0_10px_25px_rgba(27,24,22,0.01)] flex flex-col justify-between hover:bg-white/30 hover:border-[#bc4638]/40 transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#bc4638]/5 to-[#bd5b82]/5 border border-white/80 flex items-center justify-center text-brand-rose-deep shrink-0 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4)]">
                  {idx === 0 && <Award className="w-5 h-5 text-[#bc4638]" />}
                  {idx === 1 && <Users className="w-5 h-5 text-[#bd5b82]" />}
                  {idx === 2 && <UserCheck className="w-5 h-5 text-[#bc4638]" />}
                  {idx === 3 && <Calendar className="w-5 h-5 text-[#bd5b82]" />}
                </div>
                
                <h3 className="text-base sm:text-lg font-serif font-medium text-brand-dark">
                  {scenario.title}
                </h3>

                <div className="space-y-2 text-xs sm:text-sm">
                  <p className="text-brand-dark/80">
                    <strong className="font-mono text-[9px] uppercase tracking-wider text-[#bc4638] block mb-0.5">Кто нажимает:</strong>
                    {scenario.who}
                  </p>
                  <p className="text-brand-slate font-light leading-relaxed">
                    <strong className="font-mono text-[9px] uppercase tracking-wider text-[#bd5b82] block mb-0.5">Зачем:</strong>
                    {scenario.why}
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[#d8d1cc]/40">
                <button
                  onClick={() => {
                    if (scenario.actionType === 'apply') {
                      scrollToSection('nearest-championship');
                    } else if (scenario.actionType === 'team') {
                      openApplyModal();
                    } else if (scenario.actionType === 'general') {
                      scrollToSection('embedded-application-form');
                    } else {
                      scrollToSection('what-is-navykus');
                    }
                  }}
                  className="w-full bg-white/40 hover:bg-[#bc4638] hover:text-white border border-[#d8d1cc] text-[#5b6472] text-[11px] font-mono tracking-wider py-2.5 rounded-xl transition-all duration-300 cursor-pointer text-center font-medium"
                >
                  {scenario.ctaText.toUpperCase()}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. BLOCK: EXPERTS / MENTORS (ЭКСПЕРТЫ С CMS-ЗАГЛУШКОЙ) */}
      <section 
        id="mentors-block"
        className="relative z-10 py-16 md:py-24 max-w-7xl mx-auto px-[6%] md:px-[10%] space-y-12"
      >
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto space-y-3"
        >
          <span className="text-[10px] font-mono tracking-[0.2em] text-[#bc4638] uppercase font-semibold">
            НАСТАВНИКИ & ЭКСПЕРТЫ
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-brand-dark tracking-tight">
            Экспертный совет ближайшего чемпионата
          </h2>
          <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
            Ваши идеи будут оценивать авторы глобальных исследований и практики из международных компаний.
          </p>
        </motion.div>

        {/* Experts Grid (including dynamic CMS slots) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {EXPERTS.map((expert, index) => (
            <motion.div
              key={expert.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
              className={`bg-white/15 backdrop-blur-2xl p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 ${
                expert.isCmsPlaceholder 
                  ? 'border border-dashed border-[#bc4638]/40 bg-[#bc4638]/2 hover:bg-[#bc4638]/5' 
                  : 'border border-white/60 shadow-[0_10px_30px_rgba(27,24,22,0.01)] hover:bg-white/30 hover:shadow-[0_20px_40px_rgba(189,91,130,0.05)]'
              }`}
            >
              <div className="space-y-4">
                {/* Visual Avatar Header using abstract styling */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-serif text-sm font-semibold border ${
                    expert.isCmsPlaceholder 
                      ? 'bg-white/40 text-[#bc4638] border-dashed border-[#bc4638]/40' 
                      : 'bg-gradient-to-tr from-[#bc4638]/10 to-[#bd5b82]/10 text-brand-dark border-white/80'
                  }`}>
                    {expert.isCmsPlaceholder ? '+' : expert.name.split(' ').map(n => n[0]).join('').substring(0,2)}
                  </div>
                  <div>
                    <h3 className="text-sm font-serif font-semibold text-brand-dark leading-tight">
                      {expert.name}
                    </h3>
                    <p className="text-[10px] font-mono text-brand-slate uppercase tracking-wider">
                      {expert.isCmsPlaceholder ? 'РЕЗЕРВ CMS' : 'ЭКСПЕРТ'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-serif font-medium text-brand-dark">
                    {expert.role}
                  </div>
                  <div className="text-[10px] font-mono text-[#bc4638] font-semibold uppercase tracking-wider">
                    {expert.expertise}
                  </div>
                </div>

                <p className="text-xs text-brand-slate leading-relaxed font-light">
                  {expert.description}
                </p>
              </div>

              {expert.isCmsPlaceholder && (
                <div className="pt-4 mt-4 border-t border-dashed border-[#bc4638]/20 text-[9px] font-mono text-[#bc4638]/80 text-center uppercase tracking-wider">
                  Карточка управляется в панели администратора
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* 6. BLOCK: EMBEDDED SHORT APPLICATION FORM (ВСТРОЕННАЯ ФОРМА ЗАЯВКИ С ВАЛИДАЦИЕЙ) */}
      <section 
        id="embedded-application-form"
        className="relative z-10 py-16 md:py-24 max-w-7xl mx-auto px-[6%] md:px-[10%]"
      >
        <div className="bg-white/30 backdrop-blur-3xl border border-white/60 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-[0_40px_100px_rgba(27,24,22,0.06)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Header Texts */}
          <div className="lg:col-span-5 space-y-4 text-left">
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#bc4638] bg-[#bc4638]/5 px-3 py-1 rounded-full uppercase font-semibold">
              БЫСТРАЯ РЕГИСТРАЦИЯ
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-brand-dark tracking-tight leading-tight">
              Сделай первый шаг навстречу проектам
            </h2>
            <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
              Заполни короткую анкету. Выбери интересующее направление или конкретный чемпионат. Наш координатор свяжется с тобой в Telegram или по почте, чтобы подтвердить участие и помочь сориентироваться в сообществе.
            </p>
            <div className="space-y-2 pt-4">
              <div className="flex items-center gap-2 text-xs text-brand-slate">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                <span>Валидация данных в режиме реального времени</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-brand-slate">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                <span>Безопасная передача персональных данных</span>
              </div>
            </div>
          </div>

          {/* Interactive validation Form Container */}
          <div className="lg:col-span-7 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {formSubmitStatus === 'success' ? (
                /* Success feedback UX layout */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8 space-y-4"
                >
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-6 h-6 animate-bounce" />
                  </div>
                  <h3 className="text-xl font-serif text-brand-dark">Заявка успешно принята!</h3>
                  <p className="text-xs sm:text-sm text-brand-slate max-w-md mx-auto font-light leading-relaxed">
                    Твоя анкета добавлена в международную базу платформы «Навыкус». Мы сгенерировали временный координатный хэш участника и отправили подтверждение. Ожидай сообщения в течение 24 часов!
                  </p>
                  <div className="pt-4">
                    <button
                      onClick={() => setFormSubmitStatus('idle')}
                      className="px-6 py-2 bg-brand-dark text-white text-xs font-mono tracking-wider rounded-xl hover:bg-brand-dark/95 transition-all"
                    >
                      ЗАПОЛНИТЬ ЕЩЕ РАЗ
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* The Actual Form */
                <form onSubmit={handleInlineSubmit} className="space-y-4">
                  {/* Realtime dynamic validation errors */}
                  {formSubmitStatus === 'error' && formErrors.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50/50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-left text-xs text-red-700"
                    >
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <strong className="font-semibold">Проверьте правильность заполнения:</strong>
                        <ul className="list-disc list-inside space-y-0.5 opacity-90 font-light">
                          {formErrors.map((err, errIdx) => (
                            <li key={errIdx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="text-left">
                      <label className="block text-[10px] font-mono tracking-wider text-brand-dark/70 mb-1 uppercase font-semibold">
                        Ваше имя *
                      </label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Екатерина"
                        className="w-full bg-white hover:bg-white/90 focus:bg-white border border-[#c1b8b0] focus:border-brand-terracotta rounded-xl px-4 py-2.5 text-xs sm:text-sm text-brand-dark outline-none transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] placeholder:text-brand-slate/40"
                      />
                    </div>

                    {/* Age */}
                    <div className="text-left">
                      <label className="block text-[10px] font-mono tracking-wider text-brand-dark/70 mb-1 uppercase font-semibold">
                        Возраст *
                      </label>
                      <input
                        type="text"
                        value={formAge}
                        onChange={(e) => setFormAge(e.target.value)}
                        placeholder="16"
                        className="w-full bg-white hover:bg-white/90 focus:bg-white border border-[#c1b8b0] focus:border-brand-terracotta rounded-xl px-4 py-2.5 text-xs sm:text-sm text-brand-dark outline-none transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] placeholder:text-brand-slate/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Country/City */}
                    <div className="text-left">
                      <label className="block text-[10px] font-mono tracking-wider text-brand-dark/70 mb-1 uppercase font-semibold">
                        Страна / Город *
                      </label>
                      <input
                        type="text"
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        placeholder="Казахстан, Алматы"
                        className="w-full bg-white hover:bg-white/90 focus:bg-white border border-[#c1b8b0] focus:border-brand-terracotta rounded-xl px-4 py-2.5 text-xs sm:text-sm text-brand-dark outline-none transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] placeholder:text-brand-slate/40"
                      />
                    </div>

                    {/* Contact (Email or Messenger) */}
                    <div className="text-left">
                      <label className="block text-[10px] font-mono tracking-wider text-brand-dark/70 mb-1 uppercase font-semibold">
                        Почта или Telegram *
                      </label>
                      <input
                        type="text"
                        value={formContact}
                        onChange={(e) => setFormContact(e.target.value)}
                        placeholder="@username или e-mail"
                        className="w-full bg-white hover:bg-white/90 focus:bg-white border border-[#c1b8b0] focus:border-brand-terracotta rounded-xl px-4 py-2.5 text-xs sm:text-sm text-brand-dark outline-none transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] placeholder:text-brand-slate/40"
                      />
                    </div>
                  </div>

                  {/* Program / Interest select */}
                  <div className="text-left">
                    <label className="block text-[10px] font-mono tracking-wider text-brand-dark/70 mb-1 uppercase font-semibold">
                      Интересующее направление
                    </label>
                    <select
                      value={formInterest}
                      onChange={(e) => setFormInterest(e.target.value)}
                      className="w-full bg-white hover:bg-white/90 focus:bg-white border border-[#c1b8b0] focus:border-brand-terracotta rounded-xl px-4 py-2.5 text-xs sm:text-sm text-brand-dark outline-none transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                    >
                      <option className="bg-brand-bg-2 text-brand-dark">Разработка проектов</option>
                      <option className="bg-brand-bg-2 text-brand-dark">Решение кейсов</option>
                      <option className="bg-brand-bg-2 text-brand-dark">Дебаты и дипломатия</option>
                      <option className="bg-brand-bg-2 text-brand-dark">Научные исследования</option>
                    </select>
                  </div>

                  {/* Submission actions */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={formSubmitStatus === 'submitting'}
                      className="w-full bg-brand-dark hover:bg-[#bc4638] text-white text-xs font-mono tracking-widest py-3.5 rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                    >
                      {formSubmitStatus === 'submitting' ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>ОТПРАВКА ДАННЫХ...</span>
                        </>
                      ) : (
                        <span>ОТПРАВИТЬ ЗАЯВКУ НА УЧАСТИЕ</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 7. BLOCK: TRUST BLOCK (ПОКАЗАТЕЛИ ДОВЕРИЯ) */}
      <section 
        id="trust-block"
        className="relative z-10 py-16 md:py-24 max-w-7xl mx-auto px-[6%] md:px-[10%] space-y-12"
      >
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto space-y-3"
        >
          <span className="text-[10px] font-mono tracking-[0.2em] text-[#bc4638] uppercase font-semibold">
            ЦЕННОСТИ И ДОВЕРИЕ
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-brand-dark tracking-tight">
            Почему родители и эксперты выбирают Навыкус?
          </h2>
          <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
            Мы строим безопасную, прикладную и академически насыщенную среду для всестороннего развития талантов.
          </p>
        </motion.div>

        {/* Bento Grid or styled cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TRUST_POINTS.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
              className={`bg-white/15 backdrop-blur-2xl border border-white/60 p-6 rounded-2xl shadow-[0_10px_25px_rgba(27,24,22,0.01)] flex flex-col justify-between ${
                index === 0 || index === 3 ? 'md:col-span-2' : 'md:col-span-1'
              }`}
            >
              <div className="space-y-3 text-left">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#bc4638]/5 to-[#bd5b82]/5 flex items-center justify-center border border-white/80 font-mono text-[10px] font-bold text-[#bc4638] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
                  {index + 1}
                </div>
                <h3 className="text-base sm:text-lg font-serif font-semibold text-brand-dark">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 8. FINAL CALL TO ACTION (ФИНАЛЬНЫЙ CTA) */}
      <section 
        id="final-cta"
        className="relative z-10 py-16 md:py-24 max-w-5xl mx-auto px-[6%] md:px-[10%]"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-br from-[#bc4638]/10 via-white/40 to-[#bd5b82]/10 backdrop-blur-2xl border border-white/80 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl"
        >
          <span className="text-[10px] font-mono tracking-[0.2em] text-[#bc4638] uppercase font-semibold">
            ТВОЙ ШАНС СЕГОДНЯ
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-brand-dark tracking-tight leading-tight max-w-2xl mx-auto">
            Готов начать свой путь?
          </h2>
          <p className="text-sm sm:text-base text-brand-slate font-light leading-relaxed max-w-md mx-auto">
            Подай заявку на ближайший международный чемпионат или присоединяйся к нашему нетворкинг-сообществу.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => openApplyModal()}
              className="px-8 py-3.5 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white hover:opacity-95 text-xs font-mono tracking-widest rounded-xl transition-all shadow-lg shadow-[#bc4638]/15 cursor-pointer font-semibold uppercase"
            >
              ПОДАТЬ ЗАЯВКУ
            </button>
            <button
              onClick={() => scrollToSection('scenarios')}
              className="px-8 py-3.5 bg-white/50 border border-[#d8d1cc] text-[#5b6472] hover:border-[#bc4638]/60 text-xs font-mono tracking-widest rounded-xl transition-all cursor-pointer uppercase"
            >
              НАЙТИ КОМАНДУ
            </button>
          </div>
        </motion.div>
      </section>
          </motion.div>
        ) : currentPage === 'about' ? (
          <motion.div
            key="about-page"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="w-full"
          >
            <AboutProjectPage 
              onBackToHome={() => {
                setCurrentPage('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateToSection={scrollToSection}
              onOpenApplyModal={() => openApplyModal()}
            />
          </motion.div>
        ) : (
          <motion.div
            key="championship-page"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="w-full"
          >
            <ChampionshipPage 
              onBackToHome={() => {
                setCurrentPage('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateToSection={scrollToSection}
              onOpenApplyModal={() => openApplyModal()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 9. FOOTER */}
      <footer id="footer-system" className="relative z-10 border-t border-[#d8d1cc]/40 bg-white/20 backdrop-blur-sm py-16">
        <div className="max-w-6xl mx-auto px-[6%] md:px-[10%] space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
            {/* Logo and short description */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg text-brand-dark tracking-tight">Навыкус</span>
              </div>
              <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed max-w-xs">
                Международная образовательная платформа и сообщество активных школьников. Развиваем софт-скиллы и запускаем глобальные проекты.
              </p>
            </div>

            {/* Links columns */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold">Навигация</h4>
              <ul className="space-y-1.5 text-xs text-brand-slate font-light">
                <li><button onClick={() => { setCurrentPage('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-[#bc4638] transition-colors cursor-pointer">О платформе</button></li>
                <li><button onClick={() => { setCurrentPage('championship'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-[#bc4638] transition-colors cursor-pointer">Ближайший кубок</button></li>
                <li><button onClick={() => scrollToSection('scenarios')} className="hover:text-[#bc4638] transition-colors cursor-pointer">Сценарии и роли</button></li>
                <li><button onClick={() => scrollToSection('mentors-block')} className="hover:text-[#bc4638] transition-colors cursor-pointer">Эксперты совета</button></li>
              </ul>
            </div>

            {/* Contact details */}
            <div className="md:col-span-4 space-y-3">
              <h4 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold">Контакты и Поддержка</h4>
              <ul className="space-y-1.5 text-xs text-brand-slate font-light">
                <li>Email: <a href="mailto:info@navykus.org" className="hover:text-[#bc4638] transition-colors">info@navykus.org</a></li>
                <li>Telegram: <a href="https://t.me/navykus_com" target="_blank" rel="noreferrer" className="hover:text-[#bc4638] transition-colors">@navykus_com</a></li>
                <li>Координатор: <span className="text-brand-dark/80">+7 (999) 000-00-00</span></li>
              </ul>
            </div>
          </div>

          {/* Legal and credits */}
          <div className="border-t border-[#d8d1cc]/40 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap gap-4 text-[10px] text-brand-slate/80 font-light">
              <span>© 2026 Navikus Global Education</span>
              <a href="#" className="hover:text-[#bc4638] transition-colors">Политика конфиденциальности</a>
              <a href="#" className="hover:text-[#bc4638] transition-colors">Пользовательское соглашение</a>
            </div>
            <div className="text-[9px] font-mono tracking-[0.15em] text-[#5b6472] opacity-40 lowercase">
              made by dioxoid digital
            </div>
          </div>

        </div>
      </footer>

      {/* REGISTRATION SLIDING GLASS MODAL */}
      <ApplicationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedTournamentId={selectedTourney}
      />
    </div>
  );
}
