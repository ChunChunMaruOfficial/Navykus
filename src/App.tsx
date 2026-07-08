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
  ChevronDown
} from 'lucide-react';
import GlassCrystal from './components/GlassCrystal';
import ApplicationModal from './components/ApplicationModal';
import { TOURNAMENTS, PILLARS, STATS } from './data';

const LANGUAGES = [
  { code: 'RU', name: 'Русский', flag: '🇷🇺' },
  { code: 'EN', name: 'English', flag: '🇬🇧' },
  { code: 'KK', name: 'Қазақша', flag: '🇰🇿' },
  { code: 'UZ', name: 'Oʻzbekcha', flag: '🇺🇿' },
  { code: 'AR', name: 'العربية', flag: '🇸🇦' },
  { code: 'DE', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ES', name: 'Español', flag: '🇪🇸' },
  { code: 'TR', name: 'Türkçe', flag: '🇹🇷' },
];

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTourney, setSelectedTourney] = useState<string | undefined>(undefined);
  const [scrolled, setScrolled] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [lang, setLang] = useState<string>('RU');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // Close dropdown on click outside
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

  // Monitor scroll for header background opacity adjustment and hiding on scroll down
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setScrolled(currentScrollY > 40);
      
      if (currentScrollY <= 40) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const openApplyModal = (tournamentId?: string) => {
    setSelectedTourney(tournamentId);
    setIsModalOpen(true);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#fffaf7] text-[#111111] font-sans overflow-x-hidden selection:bg-brand-pink-dust/30 selection:text-brand-dark">
      
      {/* Subtle Dust/Grain Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply z-0" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }}></div>

      {/* BACKGROUND GRAPHIC LINES (PREMIUM COORDINATE SYSTEM / GRID GUIDES) */}
      <div id="grid-background-system" className="absolute inset-0 pointer-events-none z-0">
        {/* Fine background grid pattern from design theme */}
        <div className="absolute inset-0 opacity-[0.35]" style={{ backgroundImage: "linear-gradient(#d8d1cc 1px, transparent 1px), linear-gradient(90deg, #d8d1cc 1px, transparent 1px)", backgroundSize: "120px 120px" }}></div>
        
        {/* Asymmetric thematic visual vertical lines */}
        <div className="absolute left-[120px] top-0 bottom-0 w-[1px] bg-[#d8d1cc] opacity-40"></div>
        <div className="absolute right-[400px] top-0 bottom-0 w-[1px] bg-[#d8d1cc] opacity-40"></div>

        {/* Decorative Grid coordinate ticks */}
        <div className="absolute left-[120px] top-[120px] w-2 h-2 -translate-x-1 -translate-y-1 bg-brand-terracotta/30 rounded-full" />
        <div className="absolute right-[400px] top-[120px] w-2 h-2 -translate-x-1 -translate-y-1 bg-brand-rose-deep/30 rounded-full" />
      </div>

      {/* AMBIENT GLOWS AND SPOTLIGHTS (DEPTH) */}
      <div id="ambient-lighting-engine" className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-20" style={{ background: "radial-gradient(circle, #bd5b82, #bc4638)" }}></div>
        <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-10" style={{ background: "radial-gradient(circle, #d89aa9, transparent)" }}></div>
      </div>



      {/* NAVIGATION HEADER */}
      <header 
        id="navbar-system"
        className={`fixed left-1/2 -translate-x-1/2 w-[95%] lg:w-[90%] max-w-5xl z-40 transition-all duration-500 ease-in-out ${
          showHeader 
            ? (scrolled ? 'top-4 opacity-100' : 'top-6 opacity-100') 
            : '-top-24 opacity-0 pointer-events-none'
        }`}
      >
        <div className="relative w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 rounded-full border border-white/60 backdrop-blur-2xl bg-white/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_12px_40px_rgba(189,91,130,0.08)] transition-all duration-300">
          
          {/* Logo Name */}
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 group cursor-pointer"
          >
            {/* Same Logo as GlassCrystal (Hero Section) */}
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

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-8 text-[11px] lg:text-[12px] font-medium text-[#5b6472] uppercase tracking-wider">
            <button 
              onClick={() => scrollToSection('project-pillars')}
              className="hover:text-[#bc4638] transition-colors cursor-pointer"
            >
              {lang === 'RU' ? 'О проекте' : 'About'}
            </button>
            <button 
              onClick={() => scrollToSection('tournaments')}
              className="hover:text-[#bc4638] transition-colors cursor-pointer"
            >
              {lang === 'RU' ? 'Чемпионат' : 'Championship'}
            </button>
            <button 
              onClick={() => openApplyModal()}
              className="hover:text-[#bc4638] transition-colors cursor-pointer"
            >
              {lang === 'RU' ? 'Найти команду' : 'Find a Team'}
            </button>
            <button 
              onClick={() => scrollToSection('tournaments')}
              className="hover:text-[#bc4638] transition-colors cursor-pointer"
            >
              {lang === 'RU' ? 'Активности' : 'Activities'}
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
                    className="absolute right-0 mt-2 w-48 rounded-2xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_15px_40px_rgba(189,91,130,0.12)] p-1.5 z-50 overflow-hidden"
                  >
                    <div className="max-h-60 overflow-y-auto space-y-0.5">
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
                            <span>{l.name}</span>
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
              <span className="inline lg:hidden">
                {lang === 'RU' ? 'Подать анкету' : 'Apply'}
              </span>
              <span className="hidden lg:inline">
                {lang === 'RU' ? 'Подать свою анкету' : 'Apply Now'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section 
        id="hero-intro"
        className="relative z-10 pt-40 pb-20 md:pt-48 md:pb-28 max-w-7xl mx-auto px-[6%] md:px-[10%] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
      >
        {/* Left Side: Elegant Text & Typography */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="lg:col-span-7 space-y-8 text-left z-10"
        >
          
          <div className="flex flex-col gap-4">


            {/* Main Editorial Title with stunning serif/sans mix and italic */}
            <h1 className="text-3xl sm:text-4xl md:text-[42px] lg:text-[54px] xl:text-[62px] leading-[1.05] text-[#111111] font-serif font-light italic tracking-tight text-balance">
              Навыкус — международное<br/>
              <span className="not-italic font-normal">сообщество для активных<br/> школьников</span>
            </h1>

            {/* Luxury Subtitle */}
            <p className="text-[#5b6472] text-sm sm:text-base md:text-lg leading-relaxed max-w-[540px] font-light text-balance">
              Участвуй в онлайн-чемпионатах, развивай навыки будущего, находи единомышленников по всему миру и создавай проекты под руководством экспертов.
            </p>
          </div>

          {/* Dual Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 pt-2">
            <button
              onClick={() => openApplyModal()}
              className="px-8 py-4 bg-white/25 border border-white/70 backdrop-blur-xl rounded-2xl text-[14px] font-medium text-[#111111] shadow-[inset_0_1px_2px_rgba(255,255,255,0.5),0_12px_42px_rgba(0,0,0,0.03)] hover:bg-white/45 hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_15px_45px_rgba(189,91,130,0.1)] hover:border-white/80 transition-all flex items-center justify-center gap-3 cursor-pointer group"
            >
              <span className="relative">
                Подать заявку на мероприятие
                <span className="absolute bottom-0 left-0 right-0 h-[1px] bg-brand-dark scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </span>
              <ArrowUpRight className="w-4 h-4 text-[#bc4638] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>

            <button
              onClick={() => scrollToSection('project-pillars')}
              className="px-8 py-4 bg-[#fcf8f5]/15 backdrop-blur-md border border-[#d8d1cc]/60 hover:border-brand-dark/40 rounded-2xl text-[14px] font-medium text-[#5b6472] hover:bg-brand-dark hover:text-white hover:backdrop-blur-none transition-all text-center cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.01)]"
            >
              Узнать о проекте
            </button>
          </div>

          {/* Micro Trust Indicators */}
          <div className="pt-6 border-t border-brand-pink-dust/10 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-brand-slate/80">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#bd5b82]" />
              <span>2,500+ Студентов</span>
            </div>
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#bc4638]" />
              <span>Глобальная сеть контактов</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Gigantic Refracting Glassmorphic Brand Logo */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="hidden lg:flex lg:col-span-5 justify-center lg:justify-end relative"
        >
          <div className="relative w-full max-w-[480px] lg:max-w-none lg:-mr-12">
            <GlassCrystal />
          </div>
        </motion.div>
      </section>

      {/* SECTION 2: STATS SUMMARY BANNER (LUXURY PRESENTATION) */}
      <motion.section 
        id="key-statistics" 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-7xl mx-auto px-[6%] md:px-[10%] py-12"
      >
        <div className="bg-white/20 backdrop-blur-xl border border-white/60 rounded-3xl p-8 md:p-10 shadow-[inset_0_1px_3px_rgba(255,255,255,0.4),0_20px_50px_rgba(27,24,22,0.02)]">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-4 divide-y sm:divide-y-0 lg:divide-x divide-brand-pink-dust/20">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center lg:px-6 first:pt-0 pt-6 sm:pt-0">
                <div className="text-3xl md:text-4xl font-serif font-light text-brand-terracotta tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs font-mono text-brand-slate tracking-wider uppercase mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* SECTION 3: CORE PILLARS (ЧТО ТАКОЕ НАВЫКУС) */}
      <section 
        id="project-pillars" 
        className="relative z-10 py-20 md:py-28 max-w-7xl mx-auto px-[6%] md:px-[10%] space-y-16"
      >
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto space-y-4"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-brand-dark tracking-tight">
            Что такое Навыкус?
          </h2>
          <p className="text-base text-brand-slate font-light leading-relaxed">
            Навыкус — международная образовательная платформа и сообщество активных школьников, где идеи превращаются в реальные проекты.
          </p>
        </motion.div>

        {/* 3 Columns of Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PILLARS.map((pillar, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
              whileHover={{ y: -6 }}
              className="bg-white/15 backdrop-blur-2xl border border-white/60 p-8 rounded-2xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.45),0_15px_35px_rgba(27,24,22,0.02)] hover:bg-white/30 hover:border-white/80 hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_25px_50px_rgba(189,91,130,0.08)] transition-[background-color,border-color,box-shadow] duration-500 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="font-mono text-[11px] text-brand-rose-deep font-semibold tracking-wider">
                  {pillar.label}
                </div>
                <h3 className="text-xl font-serif font-medium text-brand-dark">
                  {pillar.title}
                </h3>
                <p className="text-xs text-brand-slate font-light leading-relaxed">
                  {pillar.description}
                </p>
              </div>
              
              <div className="pt-6 mt-6 border-t border-brand-pink-dust/10 flex items-center justify-between text-xs font-mono text-brand-slate hover:text-brand-dark transition-colors cursor-pointer group">
                <span>ПОДРОБНЕЕ</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-terracotta transform group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 4: TOURNAMENTS & CHAMPIONSHIPS (МЕРОПРИЯТИЯ) */}
      <section 
        id="tournaments" 
        className="relative z-10 py-20 md:py-28 max-w-7xl mx-auto px-[6%] md:px-[10%] space-y-12"
      >
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-pink-dust/20 pb-8"
        >
          <div className="space-y-3 text-left">
            <span className="text-[10px] font-mono tracking-widest text-brand-rose-deep bg-brand-rose-deep/5 px-3 py-1 rounded-full uppercase">
              БЛИЖАЙШИЕ СОБЫТИЯ
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-brand-dark tracking-tight">
              Интеллектуальные турниры
            </h2>
            <p className="text-sm text-brand-slate max-w-lg font-light">
              Выберите интересующую вас программу, подайте заявку и начните свой международный путь развития проектов.
            </p>
          </div>

          {/* Filtering buttons */}
          <div className="flex flex-wrap gap-2 font-mono text-[10px] tracking-wider">
            {['all', 'Кейс-чемпионат', 'Проектный инкубатор', 'Дебаты и дипломатия'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg border backdrop-blur-md transition-all duration-300 cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-brand-dark border-brand-dark text-white shadow-md' 
                    : 'bg-white/20 border-white/50 text-brand-slate hover:bg-white/45 hover:text-brand-dark hover:border-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]'
                }`}
              >
                {tab === 'all' ? 'ВСЕ СОБЫТИЯ' : tab.toUpperCase()}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tournaments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {TOURNAMENTS
            .filter((t) => activeTab === 'all' || t.type === activeTab)
            .map((tourney, index) => (
              <motion.div 
                key={tourney.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: (index % 3) * 0.15, ease: "easeOut" }}
                className="bg-white/15 backdrop-blur-2xl border border-white/60 p-6 rounded-2xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.45),0_20px_45px_rgba(27,24,22,0.02)] flex flex-col justify-between group hover:bg-white/30 hover:border-white/80 hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_30px_60px_rgba(189,91,130,0.08)] transition-[background-color,border-color,box-shadow] duration-500"
              >
                <div>
                  {/* Category Label */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-mono tracking-wider text-brand-terracotta bg-brand-terracotta/10 px-2.5 py-1 rounded-md uppercase font-semibold">
                      {tourney.type}
                    </span>
                    <span className="text-[10px] font-mono text-brand-slate flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand-rose-deep" />
                      до {tourney.registrationDeadline.split(' ')[0]} {tourney.registrationDeadline.split(' ')[1]}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-serif font-medium text-brand-dark group-hover:text-brand-terracotta transition-colors duration-200 mb-3">
                    {tourney.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-brand-slate leading-relaxed mb-6 font-light">
                    {tourney.description}
                  </p>

                  {/* Skills Tag Cloud */}
                  <div className="mb-6 space-y-2">
                    <div className="text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">Какие навыки прокачаешь:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {tourney.skills.map((skill, index) => (
                        <span key={index} className="text-[10px] bg-white/40 backdrop-blur-sm text-brand-dark px-2 py-0.5 rounded border border-white/60 shadow-[inset_0_0.5px_1px_rgba(255,255,255,0.4)]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Mentors / Experts list */}
                  <div className="border-t border-brand-pink-dust/10 pt-4 mb-6 space-y-2">
                    <div className="text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-brand-rose-deep" />
                      <span>Эксперты & Менторы:</span>
                    </div>
                    <div className="space-y-1">
                      {tourney.mentors.map((mentor, index) => (
                        <div key={index} className="text-xs text-brand-slate flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-brand-terracotta" />
                          <span className="font-light">{mentor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  onClick={() => openApplyModal(tourney.id)}
                  className="w-full bg-white/30 backdrop-blur-md hover:bg-brand-terracotta hover:text-white text-brand-dark text-xs font-mono tracking-wider py-3.5 rounded-xl border border-white/60 hover:border-brand-terracotta shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] hover:shadow-lg hover:shadow-brand-terracotta/15 transition-all duration-500 cursor-pointer text-center font-medium"
                >
                  ЗАРЕГИСТРИРОВАТЬСЯ
                </button>
              </motion.div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer id="footer-system" className="relative z-10 border-t border-[#d8d1cc]/40 bg-white/20 backdrop-blur-sm py-16">
        <div className="max-w-7xl mx-auto px-[6%] md:px-[10%] flex flex-col md:flex-row justify-between items-end gap-8">
          
          {/* Footer Left: Philosophy Brief */}
          <div className="flex flex-col gap-2 text-left">
            <h3 className="text-2xl font-serif font-light italic text-[#111111]">
              Что такое Навыкус?
            </h3>
            <p className="text-[14px] text-[#5b6472] max-w-[420px] font-light leading-relaxed">
              Международная образовательная платформа и сообщество активных школьников, где идеи превращаются в реальные проекты.
            </p>
          </div>
          
          {/* Footer Right: Professional Signature & Credits */}
          <div className="flex flex-col items-stretch md:items-end gap-2.5">
            <div className="w-12 h-[1px] bg-[#bc4638] self-start md:self-auto"></div>
            <div className="text-[9px] font-mono tracking-[0.2em] text-[#5b6472] uppercase opacity-80">
              © 2026 Navikus Global Education
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

