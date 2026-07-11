import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUpRight,
  Search,
  Users,
  ShieldCheck,
  EyeOff,
  MessageSquare,
  LifeBuoy,
  ChevronDown,
  X,
  MapPin,
  Mail,
  Send,
  Filter,
  UserCheck,
} from 'lucide-react';
import {
  fadeUp,
  fadeUpLarge,
  fadeInScale,
  cardStaggerContainer,
  cardItemFadeUp,
} from '../motion-animations';

const heroFadeUpLarge = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.75,
    ease: [0.22, 1, 0.36, 1],
  },
};
import { TEAM_MEMBERS, TOURNAMENTS } from '../data';
import type { TeamMember, TeamRole, TeamIntent } from '../types';

const ROLE_LABELS: Record<TeamRole, string> = {
  developer: 'Разработчик',
  designer: 'Дизайнер',
  researcher: 'Исследователь',
  product_manager: 'Продуктовый менеджер',
  marketer: 'Маркетолог',
  team_lead: 'Лидер команды',
  analyst: 'Аналитик',
  other: 'Другое',
};

const CONTACT_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  email: 'Email',
  discord: 'Discord',
};

const UNIQUE_COUNTRIES = Array.from(new Set(TEAM_MEMBERS.map((m) => m.country)));

const getAvailableInterests = () => {
  const set = new Set<string>();
  TEAM_MEMBERS.forEach((m) => m.interests.forEach((i) => set.add(i)));
  return Array.from(set).sort();
};

interface FindTeamPageProps {
  onBackToHome: () => void;
  onNavigateToSection: (id: string) => void;
  onOpenApplyModal: () => void;
}

/* ------------------------------------------------------------------ */
/*  Detailed Profile Modal                                            */
/* ------------------------------------------------------------------ */

function DetailedProfileModal({
  member,
  onClose,
  onOpenApplyModal,
}: {
  member: TeamMember;
  onClose: () => void;
  onOpenApplyModal: () => void;
}) {
  const contactLink = member.contactType === 'telegram'
    ? `https://t.me/${member.contact.replace('@', '')}`
    : member.contactType === 'email'
      ? `mailto:${member.contact}`
      : '#';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-dark/20 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-[92%] sm:w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white/35 backdrop-blur-3xl border border-white/60 rounded-3xl shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.45),0_40px_120px_rgba(27,24,22,0.12)] z-10"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-brand-bg-3/50 text-brand-dark transition-colors z-20"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-10">
            {/* Header */}
            <div className="space-y-1 mb-6">
              <h2 className="text-2xl sm:text-3xl font-serif text-brand-dark tracking-tight">
                {member.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-brand-slate font-medium">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {member.age} лет
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {member.country}
                  {member.city && `, ${member.city}`}
                </span>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-6">
              <section>
                <h3 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold mb-2">Обо мне</h3>
                <p className="text-xs sm:text-sm text-brand-slate font-normal md:font-light leading-relaxed">{member.shortBio}</p>
              </section>

              <section>
                <h3 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold mb-2.5">Интересы</h3>
                <div className="flex flex-wrap gap-1.5">
                  {member.interests.map((interest) => (
                    <span key={interest} className="text-xs px-3 py-1 rounded-full bg-brand-rose-deep/10 text-brand-rose-deep font-medium border border-brand-rose-deep/15">
                      {interest}
                    </span>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold mb-2.5">Навыки</h3>
                <div className="flex flex-wrap gap-1.5">
                  {member.skills.map((skill) => (
                    <span key={skill} className="text-xs px-3 py-1 rounded-full bg-brand-terracotta/10 text-brand-terracotta font-medium border border-brand-terracotta/15">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold mb-2.5">Ищет роль</h3>
                <div className="flex flex-wrap gap-1.5">
                  {member.targetRoles.map((role) => (
                    <span key={role} className="text-xs px-3 py-1 rounded-full bg-white/40 border border-white/60 text-brand-dark font-medium">
                      {ROLE_LABELS[role]}
                    </span>
                  ))}
                </div>
              </section>

              {member.targetProject && (
                <section>
                  <h3 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold mb-2.5">Целевой проект</h3>
                  <p className="text-xs sm:text-sm text-brand-slate font-normal md:font-light">{member.targetProject}</p>
                </section>
              )}

              <section>
                <h3 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold mb-2.5">Почему ищу команду</h3>
                <p className="text-xs sm:text-sm text-brand-slate font-normal md:font-light leading-relaxed">{member.whyLooking}</p>
              </section>

              <section className="bg-white/20 border border-white/40 rounded-2xl p-5">
                <h3 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold mb-2.5">Контакты</h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-brand-slate font-semibold">{CONTACT_LABELS[member.contactType]}:</span>
                  <span className="text-sm font-medium text-brand-dark">{member.contact}</span>
                </div>
              </section>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={contactLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white px-6 py-3 rounded-xl text-xs font-medium shadow-lg shadow-[#bc4638]/20 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Связаться
                </a>
                <button
                  onClick={onOpenApplyModal}
                  className="flex-1 bg-white/40 backdrop-blur-md border border-[#d8d1cc] text-[#5b6472] hover:border-brand-terracotta/60 px-6 py-3 rounded-xl text-xs font-medium transition-all cursor-pointer"
                >
                  Подать свою анкету
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Profile Card (compact)                                            */
/* ------------------------------------------------------------------ */

function ProfileCard({
  member,
  onOpen,
  ...rest
}: {
  member: TeamMember;
  onOpen: (m: TeamMember) => void;
  key?: string;
}) {
  const isDimmed = !member.isApproved;

  return (
    <motion.div
      variants={cardItemFadeUp.variants}
      className={`bg-white/[0.12] glass-card border border-white/[0.15] rounded-2xl p-5 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-300 ${isDimmed ? 'opacity-40 grayscale' : 'hover:bg-white/[0.2] hover:border-brand-terracotta/20'}`}
    >
      <div className="space-y-3">
        {/* Name + meta */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-serif font-medium text-brand-dark leading-tight">{member.name}</h3>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-brand-slate">
              <span>{member.age} лет</span>
              <span className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3" /> {member.country}
              </span>
            </div>
          </div>
          <span className={`text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full border shrink-0 ${
            member.targetRoles.length <= 1
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-brand-rose-deep/10 text-brand-rose-deep border-brand-rose-deep/20'
          }`}>
            {member.targetRoles.length <= 1 ? 'Ищет команду' : 'Ищет участников'}
          </span>
        </div>

        {/* Bio */}
        <p className={`text-xs text-brand-slate font-normal md:font-light leading-relaxed ${isDimmed ? 'line-clamp-3' : 'line-clamp-2'}`}>
          {member.shortBio}
        </p>

        {/* Interests */}
        <div className="flex flex-wrap gap-1.5">
          {member.interests.slice(0, 4).map((interest) => (
            <span key={interest} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-rose-deep/10 text-brand-rose-deep font-medium">
              {interest}
            </span>
          ))}
          {member.interests.length > 4 && (
            <span className="text-[10px] text-brand-slate font-medium">+{member.interests.length - 4}</span>
          )}
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5">
          {member.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-terracotta/10 text-brand-terracotta font-medium">
              {skill}
            </span>
          ))}
          {member.skills.length > 3 && (
            <span className="text-[10px] text-brand-slate font-medium">+{member.skills.length - 3}</span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="pt-4 mt-2">
        <button
          onClick={() => onOpen(member)}
          className="w-full bg-white/40 hover:bg-white/70 border border-[#d8d1cc] hover:border-brand-terracotta/40 text-[#5b6472] hover:text-brand-terracotta text-[11px] font-mono tracking-wider py-2.5 rounded-xl transition-all duration-300 cursor-pointer text-center font-medium"
        >
          Открыть анкету
        </button>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ Item                                                          */
/* ------------------------------------------------------------------ */

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white/[0.12] glass-card border border-white/[0.15] rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 sm:p-6 text-left cursor-pointer hover:bg-white/[0.15] transition-colors"
      >
        <span className="text-sm sm:text-base font-medium text-brand-dark pr-4">{question}</span>
        <ChevronDown className={`w-4 h-4 text-brand-slate shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="px-5 sm:px-6 pb-5 sm:pb-6 text-xs sm:text-sm text-brand-slate font-normal md:font-light leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */

export default function FindTeamPage({ onBackToHome, onOpenApplyModal }: FindTeamPageProps) {
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('Все страны');
  const [selectedAgeRange, setSelectedAgeRange] = useState('Любой');
  const [selectedTournament, setSelectedTournament] = useState('Любое');
  const [selectedIntent, setSelectedIntent] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [selectedProfile, setSelectedProfile] = useState<TeamMember | null>(null);

  /* ---------- Derived data ---------- */

  const ageRangeFilter = (age: number) => {
    if (selectedAgeRange === 'Любой') return true;
    if (selectedAgeRange === '12–14') return age >= 12 && age <= 14;
    if (selectedAgeRange === '15–16') return age >= 15 && age <= 16;
    if (selectedAgeRange === '17–18') return age >= 17 && age <= 18;
    return true;
  };

  const intentFilter = (member: TeamMember) => {
    if (selectedIntent === 'all') return true;
    const intent: TeamIntent = member.targetRoles.length <= 1 ? 'looking_for_team' : 'looking_for_members';
    return intent === selectedIntent;
  };

  const filteredMembers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return TEAM_MEMBERS.filter((member) => {
      if (!member.isApproved) return false;

      if (selectedCountry !== 'Все страны' && member.country !== selectedCountry) return false;
      if (!ageRangeFilter(member.age)) return false;

      if (selectedTournament !== 'Любое') {
        if (member.targetProject && !member.targetProject.toLowerCase().includes(selectedTournament.toLowerCase())) {
          return false;
        }
      }

      if (!intentFilter(member)) return false;

      if (query) {
        const searchable = [
          member.name,
          ...member.interests,
          ...member.skills,
          member.shortBio,
          member.whyLooking,
        ].join(' ').toLowerCase();
        if (!searchable.includes(query)) return false;
      }

      return true;
    });
  }, [searchQuery, selectedCountry, selectedAgeRange, selectedTournament, selectedIntent]);

  /* ---------- Active filter pills ---------- */

  const activeFilters = [
    selectedCountry !== 'Все страны' && { label: selectedCountry, clear: () => setSelectedCountry('Все страны') },
    selectedAgeRange !== 'Любой' && { label: selectedAgeRange, clear: () => setSelectedAgeRange('Любой') },
    selectedTournament !== 'Любое' && { label: selectedTournament, clear: () => setSelectedTournament('Любое') },
    selectedIntent !== 'all' && { label: selectedIntent === 'looking_for_team' ? 'Ищет команду' : 'Ищет участников', clear: () => setSelectedIntent('all') },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCountry('Все страны');
    setSelectedAgeRange('Любой');
    setSelectedTournament('Любое');
    setSelectedIntent('all');
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#fff8f5] via-[#fffaf7] to-[#fdf6f4] text-[#111111] font-sans overflow-x-hidden">

      {/* Background systems */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply z-0" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }}></div>
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.25]" style={{ backgroundImage: "linear-gradient(#d8d1cc 1px, transparent 1px), linear-gradient(90deg, #d8d1cc 1px, transparent 1px)", backgroundSize: "120px 120px" }}></div>
      </div>
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-12%] right-[-8%] w-[700px] h-[700px] rounded-full blur-[140px] opacity-20 animate-ambient-1" style={{ background: "radial-gradient(circle at 30% 20%, #f38b76, #bc4638 60%, #80261b)" }}></div>
        <div className="absolute top-[15%] left-[-12%] w-[500px] h-[500px] rounded-full blur-[130px] opacity-15 animate-ambient-2" style={{ background: "radial-gradient(circle at 60% 40%, #e28fb1, #bd5b82 65%, transparent)" }}></div>
        <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 animate-ambient-4" style={{ background: "radial-gradient(circle, #bc4638, #f38b76 60%, transparent)" }}></div>
      </div>

      {/* ======================== HERO BLOCK ======================== */}
      <section className="relative z-10 pt-32 pb-12 md:pt-40 md:pb-16 max-w-7xl mx-auto px-[6%] md:px-[10%]">
        <motion.div {...heroFadeUpLarge} className="space-y-8">
          {/* Breadcrumb / back */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="flex items-center gap-1.5 text-xs font-mono text-brand-slate hover:text-brand-terracotta transition-colors cursor-pointer"
            >
              ← На главную
            </button>
            <span className="text-[10px] font-mono text-brand-pink-dust uppercase tracking-widest">— Найти команду</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-brand-dark tracking-tight leading-tight">
              Найти команду
            </h1>
            <p className="text-sm sm:text-base text-brand-slate font-normal md:font-light leading-relaxed max-w-2xl">
              Здесь можно найти участников для чемпионата или проекта. Выбери подходящего человека и свяжись с ним.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={onOpenApplyModal}
              className="px-8 py-4 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white rounded-2xl text-sm font-medium shadow-xl shadow-[#bc4638]/25 hover:shadow-[#bc4638]/35 hover:scale-[1.01] transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              Подать свою анкету
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('profiles-section');
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="px-8 py-4 bg-white/40 backdrop-blur-md border border-[#d8d1cc] hover:border-[#bc4638]/60 rounded-2xl text-sm font-medium text-[#5b6472] hover:text-[#bc4638] transition-all text-center cursor-pointer"
            >
              Смотреть анкеты
            </button>
          </div>
        </motion.div>
      </section>

      {/* ======================== SCENARIO EXPLANATION ======================== */}
      <section className="relative z-10 py-12 md:py-16 max-w-7xl mx-auto px-[6%] md:px-[10%]">
        <motion.div {...cardStaggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Users className="w-5 h-5 text-brand-rose-deep" />,
              num: '01',
              title: 'Посмотри анкеты',
              desc: 'Просмотри анкеты участников из 15+ стран и найди подходящих людей.',
            },
            {
              icon: <Search className="w-5 h-5 text-brand-terracotta" />,
              num: '02',
              title: 'Выбери участника',
              desc: 'Найди человека с похожими интересами и навыками.',
            },
            {
              icon: <ArrowUpRight className="w-5 h-5 text-brand-rose-deep" />,
              num: '03',
              title: 'Свяжись с ним',
              desc: 'Напиши участнику или подай свою анкету, чтобы тебя нашли.',
            },
          ].map((step, idx) => (
            <motion.div
              key={step.num}
              variants={cardItemFadeUp.variants}
              className="bg-white/[0.12] glass-card border border-white/[0.15] p-6 rounded-2xl hover:bg-white/[0.2] transition-[background-color,border-color,box-shadow] duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#bc4638]/5 to-[#bd5b82]/5 border border-white/80 flex items-center justify-center shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
                  {step.icon}
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-brand-rose-deep font-semibold tracking-wider">{step.num}</div>
                  <h3 className="text-base font-serif font-medium text-brand-dark">{step.title}</h3>
                  <p className="text-xs text-brand-slate font-normal md:font-light leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ======================== FILTERS & SEARCH ======================== */}
      <section id="filters-section" className="relative z-10 py-8 md:py-12 max-w-7xl mx-auto px-[6%] md:px-[10%]">
        <motion.div {...fadeUp} className="space-y-6">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-slate/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени, интересам или навыкам..."
              className="w-full bg-white/40 backdrop-blur-md border border-white/50 focus:border-brand-terracotta/60 rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-brand-dark outline-none transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] placeholder:text-brand-slate/40"
            />
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center gap-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl px-4 py-2.5 text-xs font-mono text-brand-dark tracking-wider cursor-pointer"
          >
            <Filter className="w-4 h-4" />
            Фильтры
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Filter controls */}
          <AnimatePresence>
            {(showFilters || undefined) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden sm:block"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Country */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">Страна</label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full bg-white/40 backdrop-blur-md border border-white/50 focus:border-brand-terracotta/60 rounded-xl px-3 py-2.5 text-xs text-brand-dark outline-none cursor-pointer"
                    >
                      <option>Все страны</option>
                      {UNIQUE_COUNTRIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Age */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">Возраст</label>
                    <select
                      value={selectedAgeRange}
                      onChange={(e) => setSelectedAgeRange(e.target.value)}
                      className="w-full bg-white/40 backdrop-blur-md border border-white/50 focus:border-brand-terracotta/60 rounded-xl px-3 py-2.5 text-xs text-brand-dark outline-none cursor-pointer"
                    >
                      <option>Любой</option>
                      <option>12–14</option>
                      <option>15–16</option>
                      <option>17–18</option>
                    </select>
                  </div>

                  {/* Tournament */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">Направление</label>
                    <select
                      value={selectedTournament}
                      onChange={(e) => setSelectedTournament(e.target.value)}
                      className="w-full bg-white/40 backdrop-blur-md border border-white/50 focus:border-brand-terracotta/60 rounded-xl px-3 py-2.5 text-xs text-brand-dark outline-none cursor-pointer"
                    >
                      <option>Любое</option>
                      {TOURNAMENTS.map((t) => (
                        <option key={t.id}>{t.type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Intent */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">Ищет</label>
                    <div className="flex gap-2">
                      {(['all', 'looking_for_team', 'looking_for_members'] as const).map((intent) => (
                        <button
                          key={intent}
                          onClick={() => setSelectedIntent(intent)}
                          className={`flex-1 text-[10px] font-mono tracking-wider py-2.5 rounded-xl border transition-all cursor-pointer text-center font-medium ${
                            selectedIntent === intent
                              ? 'bg-brand-terracotta/10 border-brand-terracotta/30 text-brand-terracotta'
                              : 'bg-white/30 border-white/40 text-brand-slate hover:bg-white/50'
                          }`}
                        >
                          {intent === 'all' ? 'Всех' : intent === 'looking_for_team' ? 'Команду' : 'Участников'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Active filter pills + reset */}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  {activeFilters.map((f, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[10px] font-mono tracking-wider bg-white/50 border border-white/60 rounded-full px-3 py-1.5 text-brand-dark"
                    >
                      {f.label}
                      <button onClick={f.clear} className="hover:text-brand-terracotta transition-colors cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {activeFilters.length > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-[10px] font-mono tracking-wider text-brand-slate hover:text-brand-terracotta transition-colors cursor-pointer underline underline-offset-2"
                    >
                      Сбросить всё
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* ======================== PROFILES LIST ======================== */}
      <section id="profiles-section" className="relative z-10 py-8 md:py-12 max-w-7xl mx-auto px-[6%] md:px-[10%]">
        {/* Results count */}
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs font-mono text-brand-slate">
            Найдено: <strong className="text-brand-dark">{filteredMembers.length}</strong>
            {filteredMembers.length === 1 && ' участник'}
            {filteredMembers.length >= 2 && filteredMembers.length <= 4 && ' участника'}
            {filteredMembers.length >= 5 && ' участников'}
          </span>
        </div>

        {filteredMembers.length === 0 ? (
          /* EMPTY STATE: no results or no members */
          <motion.div
            {...fadeInScale}
            className="text-center py-20 space-y-4"
          >
            <div className="w-14 h-14 bg-brand-bg-2 rounded-full flex items-center justify-center mx-auto border border-white/60">
              {TEAM_MEMBERS.length === 0 ? (
                <Users className="w-6 h-6 text-brand-slate/40" />
              ) : (
                <Search className="w-6 h-6 text-brand-slate/40" />
              )}
            </div>
            <h3 className="text-lg font-serif text-brand-dark">
              {TEAM_MEMBERS.length === 0 ? 'Пока никто не подал анкету' : 'По выбранным фильтрам никого не найдено'}
            </h3>
            <p className="text-xs sm:text-sm text-brand-slate font-normal md:font-light max-w-md mx-auto">
              {TEAM_MEMBERS.length === 0
                ? 'Будь первым — подай свою анкету и присоединись к сообществу.'
                : 'Попробуй изменить фильтры или подай свою анкету.'}
            </p>
            <button
              onClick={onOpenApplyModal}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white px-6 py-3 rounded-xl text-xs font-medium shadow-lg shadow-[#bc4638]/20 transition-all cursor-pointer mt-2"
            >
              Подать свою анкету
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            {...cardStaggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {filteredMembers.map((member) => (
              <ProfileCard
                key={member.id}
                member={member}
                onOpen={setSelectedProfile}
              />
            ))}
          </motion.div>
        )}
      </section>

      {/* ======================== SAFETY & TRUST ======================== */}
      <section className="relative z-10 py-12 md:py-16 max-w-7xl mx-auto px-[6%] md:px-[10%]">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <h2 className="text-2xl sm:text-3xl font-serif text-brand-dark tracking-tight">
            Безопасность и доверие
          </h2>
          <p className="text-xs sm:text-sm text-brand-slate font-normal md:font-light leading-relaxed">
            Мы заботимся о безопасности каждого участника сообщества.
          </p>
        </motion.div>
        <motion.div {...cardStaggerContainer} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
              title: 'Проверенные анкеты',
              desc: 'Анкеты проходят проверку перед публикацией. Мы гарантируем, что данные верифицированы.',
            },
            {
              icon: <EyeOff className="w-5 h-5 text-brand-terracotta" />,
              title: 'Безопасность данных',
              desc: 'Мы не публикуем лишние личные данные. Контакты доступны только в подробной анкете.',
            },
            {
              icon: <MessageSquare className="w-5 h-5 text-brand-rose-deep" />,
              title: 'Безопасные каналы',
              desc: 'Связывайтесь через Telegram или email — наши проверенные каналы коммуникации.',
            },
            {
              icon: <LifeBuoy className="w-5 h-5 text-brand-coral" />,
              title: 'Помощь',
              desc: 'При возникновении проблем или подозрительных ситуаций свяжитесь с организаторами.',
            },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              variants={cardItemFadeUp.variants}
              className="bg-white/[0.12] glass-card border border-white/[0.15] p-6 rounded-2xl hover:bg-white/[0.2] transition-[background-color,border-color,box-shadow] duration-300"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white/40 border border-white/80 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
                  {item.icon}
                </div>
                <h3 className="text-sm font-serif font-medium text-brand-dark">{item.title}</h3>
                <p className="text-xs text-brand-slate font-normal md:font-light leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ======================== CTA: НЕ НАШЁЛ КОМАНДУ? ======================== */}
      <section className="relative z-10 py-12 md:py-16 max-w-5xl mx-auto px-[6%] md:px-[10%]">
        <motion.div
          {...fadeInScale}
          className="bg-gradient-to-br from-[#bc4638]/5 via-white/[0.12] to-[#bd5b82]/8 glass-xl border border-white/[0.15] rounded-3xl p-8 sm:p-12 text-center space-y-6"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-brand-dark tracking-tight">
            Не нашёл подходящего участника?
          </h2>
          <p className="text-sm sm:text-base text-brand-slate font-normal md:font-light leading-relaxed max-w-md mx-auto">
            Оставь свою анкету — и другие школьники найдут именно тебя. Заполни анкету за 2 минуты и присоединись к международному сообществу.
          </p>
          <button
            onClick={onOpenApplyModal}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white px-8 py-3.5 rounded-xl text-xs font-medium shadow-lg shadow-[#bc4638]/20 transition-all cursor-pointer"
          >
            Подать свою анкету
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </motion.div>
      </section>

      {/* ======================== FAQ ======================== */}
      <section className="relative z-10 py-12 md:py-20 max-w-3xl mx-auto px-[6%] md:px-[10%]">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <h2 className="text-2xl sm:text-3xl font-serif text-brand-dark tracking-tight">
            Часто задаваемые вопросы
          </h2>
        </motion.div>
        <motion.div {...fadeUp} className="space-y-4">
          <FAQItem
            question="Как подать анкету?"
            answer="Нажми кнопку «Подать свою анкету» в шапке сайта или в любом месте этой страницы. Заполни форму: имя, возраст, страна, интересы, навыки и контакты. Анкета появится после проверки модератором."
          />
          <FAQItem
            question="Когда анкета появится на сайте?"
            answer="Обычно проверка занимает 1–2 рабочих дня. После публикации твоя анкета будет доступна в разделе «Найти команду» для всех участников сообщества."
          />
          <FAQItem
            question="Можно ли редактировать анкету?"
            answer="Да — свяжись с координатором в Telegram, и мы поможем обновить данные или заменить контактную информацию."
          />
          <FAQItem
            question="Что делать, если я уже нашёл команду?"
            answer="Сообщи координатору — мы скроем анкету из общего списка, чтобы не получать лишние сообщения. Ты всегда можешь вернуть её позже."
          />
          <FAQItem
            question="Как безопасно связаться с участником?"
            answer="Используй контакты, указанные в анкете (Telegram или email). Не передавай личные данные (адрес, школу, паспорт) и не переходите по подозрительным ссылкам. При сомнениях — свяжись с организаторами."
          />
        </motion.div>
      </section>

      {/* ======================== DETAIL MODAL ======================== */}
      {selectedProfile && (
        <DetailedProfileModal
          member={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onOpenApplyModal={onOpenApplyModal}
        />
      )}
    </div>
  );
}