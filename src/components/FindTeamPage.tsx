import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  Send,
  Mail,
  Check,
  Filter,
  UserCheck,
  CheckCircle,
  SlidersHorizontal,
} from 'lucide-react';
import {
  fadeUp,
  fadeUpLarge,
  fadeInScale,
  cardStaggerContainer,
  cardItemFadeUp,
} from '../motion-animations';
import BrandImage from './BrandImage';
import StudyBackground from './StudyBackground';

const heroFadeUpLarge = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.75,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  },
};
import { useLocalizedData } from '../i18n/useLocalizedData';
import { useCmsFaqs } from '../hooks/useCmsFaqs';
import { useCmsTeamMembers } from '../hooks/useCmsTeamMembers';
import type { PlatformUser } from '../api';
import type { FaqItem as CmsFaqItem, TeamMember, TeamRole, TeamIntent } from '../types';

const FIND_TEAM_SEARCH_CLASS =
  'w-full rounded-xl border border-[#d8d1cc] bg-white/70 py-3 pl-11 pr-4 text-xs text-brand-dark outline-none transition-colors placeholder:text-brand-slate/40 focus:border-brand-dark/45 focus:bg-white sm:text-sm';

const FIND_TEAM_FIELD_CLASS =
  'w-full rounded-xl border border-[#d8d1cc] bg-white/70 px-3 py-2.5 text-xs text-brand-dark outline-none transition-colors placeholder:text-brand-slate/40 focus:border-brand-dark/45 focus:bg-white';

const FIND_TEAM_SELECT_CLASS = `${FIND_TEAM_FIELD_CLASS} cursor-pointer`;

const ROLE_LABELS: Record<TeamRole, string> = {
  developer: 'ui.findteampage.19b22472b1',
  designer: 'ui.findteampage.2b4d128aaa',
  researcher: 'ui.findteampage.e3ca2f8474',
  product_manager: 'ui.findteampage.112b3c45fd',
  marketer: 'ui.findteampage.e825746a47',
  team_lead: 'ui.findteampage.93bb4d70fe',
  analyst: 'ui.findteampage.ff8ca90dda',
  other: 'ui.findteampage.5994c1f5c8',
};

const CONTACT_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  email: 'Email',
  discord: 'Discord',
};

const FIND_TEAM_FAQ_ITEMS = [
  {
    id: 'find-team-faq-1',
    question: 'ui.findteampage.6954042f',
    answer: 'ui.findteampage.a264de7b48',
  },
  {
    id: 'find-team-faq-2',
    question: 'ui.findteampage.291b48f0',
    answer: 'ui.findteampage.c4adff98dd',
  },
  {
    id: 'find-team-faq-3',
    question: 'ui.findteampage.32c49e31',
    answer: 'ui.findteampage.bb017e0e8a',
  },
  {
    id: 'find-team-faq-4',
    question: 'ui.findteampage.5167e97a',
    answer: 'ui.findteampage.b734b04eb7',
  },
  {
    id: 'find-team-faq-5',
    question: 'ui.findteampage.27f20eac',
    answer: 'ui.findteampage.a80b8b09d5',
  },
] as const;

const COUNTRY_FLAGS: Record<string, string> = {
  '\u0420\u043e\u0441\u0441\u0438\u044f': '🇷🇺',
  '\u041a\u0430\u0437\u0430\u0445\u0441\u0442\u0430\u043d': '🇰🇿',
  '\u042f\u043f\u043e\u043d\u0438\u044f': '🇯🇵',
  '\u0423\u0437\u0431\u0435\u043a\u0438\u0441\u0442\u0430\u043d': '🇺🇿',
  '\u0423\u043a\u0440\u0430\u0438\u043d\u0430': '🇺🇦',
  '\u041e\u0410\u042d': '🇦🇪',
  '\u0412\u044c\u0435\u0442\u043d\u0430\u043c': '🇻🇳',
};

const getInitials = (name: string) => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join('');

const getAvatarGradient = (id: string) => {
  const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    'from-[#bc4638] to-[#bd5b82]',
    'from-[#6b8f71] to-[#4a7c5c]',
    'from-[#c9a96e] to-[#bd5b82]',
    'from-[#3d6b8f] to-[#8a6b9d]',
  ];
  return gradients[hash % gradients.length];
};

interface FindTeamPageProps {
  onNavigateToSection: (id: string) => void;
  onOpenApplyModal: () => void;
  authUser?: PlatformUser | null;
  onOpenAuthModal?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Detailed Profile Modal                                            */
/* ------------------------------------------------------------------ */

function DetailedProfileModal({
  member,
  onClose,
  onOpenApplyModal,
  onContacted,
}: {
  member: TeamMember;
  onClose: () => void;
  onOpenApplyModal: () => void;
  onContacted?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const handleOpenContact = () => {
    const url = member.contactType === 'telegram'
      ? `https://t.me/${member.contact.replace(/^@/, '')}`
      : member.contactType === 'email'
      ? `mailto:${member.contact}`
      : null;
    if (url) {
      window.open(url, '_blank', 'noopener');
      setToastMessage(t('ui.findteampage.3765795ef8'));
    } else {
      navigator.clipboard.writeText(member.contact);
      setToastMessage('Скопировано');
    }
    onContacted?.(member.id);
  };

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
          className="relative w-[92%] sm:w-full max-w-5xl max-h-[85vh] overflow-y-auto scrollbar-soft bg-white/35 backdrop-blur-3xl border border-white/60 rounded-3xl shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.45),0_40px_120px_rgba(27,24,22,0.12)] z-10"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-brand-bg-3/50 text-brand-dark transition-colors z-20"
            aria-label={t('ui.applicationmodal.877618185f')}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* Header */}
            <div className="space-y-6">
              <div className={`relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br ${getAvatarGradient(member.id)} shadow-[0_18px_55px_rgba(91,100,114,0.12)] lg:hidden`}>
                <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-serif text-5xl font-semibold text-white/92">
                    {getInitials(member.name)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-serif text-brand-dark tracking-tight">
                  {member.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-brand-slate font-medium">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {member.age}{t('ui.championshippage.b47dce337d')}</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {member.country}
                    {member.city && `, ${member.city}`}
                  </span>
                </div>
              </div>

              {/* Sections */}
              <section>
                <h3 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold mb-2">{t('ui.findteampage.53fa567ce7')}</h3>
                <p className="text-xs sm:text-sm text-brand-slate font-normal md:font-light leading-relaxed">{member.shortBio}</p>
              </section>

              <section>
                <h3 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold mb-2.5">{t('ui.findteampage.747ac9c080')}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {member.interests.map((interest) => (
                    <span key={interest} className="text-xs px-3 py-1 rounded-full bg-brand-rose-deep/10 text-brand-rose-deep font-medium border border-brand-rose-deep/15">
                      {interest}
                    </span>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold mb-2.5">{t('ui.findteampage.176bd58504')}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {member.skills.map((skill) => (
                    <span key={skill} className="text-xs px-3 py-1 rounded-full bg-brand-terracotta/10 text-brand-terracotta font-medium border border-brand-terracotta/15">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold mb-2.5">{t('ui.findteampage.20be1bd637')}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {member.targetRoles.map((role) => (
                    <span key={role} className="text-xs px-3 py-1 rounded-full bg-white/40 border border-white/60 text-brand-dark font-medium">
                      {t(ROLE_LABELS[role])}
                    </span>
                  ))}
                </div>
              </section>

              {member.targetProject && (
                <section>
                  <h3 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold mb-2.5">{t('ui.findteampage.43584e6c75')}</h3>
                  <p className="text-xs sm:text-sm text-brand-slate font-normal md:font-light">{member.targetProject}</p>
                </section>
              )}

              <section>
                <h3 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold mb-2.5">{t('ui.findteampage.0d5ce0304e')}</h3>
                <p className="text-xs sm:text-sm text-brand-slate font-normal md:font-light leading-relaxed">{member.whyLooking}</p>
              </section>

            </div>

            <aside className="space-y-6">
              <div className={`relative hidden aspect-square overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br ${getAvatarGradient(member.id)} shadow-[0_18px_55px_rgba(91,100,114,0.12)] lg:block`}>
                <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-serif text-5xl font-semibold text-white/92 sm:text-6xl">
                    {getInitials(member.name)}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/35 bg-white/18 px-3 py-2 text-left text-white shadow-sm backdrop-blur-md">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/70">profile photo</div>
                  <div className="mt-0.5 truncate text-sm font-semibold">{member.name}</div>
                </div>
              </div>                  {/* Contact Info */}
              <section className="bg-white/20 border border-white/40 rounded-2xl p-5 space-y-3">
                <h3 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold">{t('ui.activitiespage.1f75230b6e')}</h3>
                <div className="flex items-center gap-3 rounded-xl border border-white/40 bg-white/25 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/50">
                    {member.contactType === 'telegram' ? (
                      <Send className="h-4 w-4 text-sky-600" />
                    ) : member.contactType === 'email' ? (
                      <Mail className="h-4 w-4 text-rose-600" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-indigo-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-brand-slate">
                      {CONTACT_LABELS[member.contactType] || member.contactType}
                    </div>
                    <div className="truncate text-sm font-medium text-brand-dark">{member.contact}</div>
                  </div>
                  <button
                    onClick={handleOpenContact}
                    className="shrink-0 rounded-lg border border-white/50 bg-white/40 p-2 text-brand-slate hover:text-brand-dark hover:bg-white/70 transition-all cursor-pointer"
                    title={member.contactType === 'discord' ? 'Copy username' : 'Open'}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-[10px] leading-relaxed text-brand-slate/70">{t('ui.enhancements.privateContact')}</p>
              </section>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleOpenContact}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white px-6 py-3 rounded-xl text-xs font-medium shadow-lg shadow-[#bc4638]/20 transition-all cursor-pointer hover:shadow-[#bc4638]/35"
                >
                  <Send className="w-4 h-4" />{t('ui.findteampage.3765795ef8')}</button>
                <button
                  onClick={onOpenApplyModal}
                  className="w-full bg-white/40 backdrop-blur-md border border-[#d8d1cc] text-[#5b6472] hover:border-brand-terracotta/60 px-6 py-3 rounded-xl text-xs font-medium transition-all cursor-pointer"
                >{t('ui.app.8c26059674')}</button>
              </div>
            </aside>
          </div>
        </motion.div>

        {/* Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.92 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50/90 backdrop-blur-md px-5 py-2.5 shadow-lg"
            >
              <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
              <span className="text-xs font-medium text-emerald-800">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
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
  contactedIds,
  ...rest
}: {
  member: TeamMember;
  onOpen: (m: TeamMember) => void;
  contactedIds?: string[];
  key?: string;
}) {
  const { t } = useTranslation();
  const isDimmed = !member.isApproved;
  const isContacted = contactedIds?.includes(member.id);

  return (
    <motion.div
      variants={cardItemFadeUp.variants}
      className={`bg-white/[0.12] glass-card surface-elevated-soft border border-white/[0.15] rounded-2xl p-5 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-300 ${isDimmed ? 'opacity-40 grayscale' : 'hover:bg-white/[0.2] hover:border-brand-terracotta/20'}`}
    >
      <div className="space-y-3">
        {/* Name + meta */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <div
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${getAvatarGradient(member.id)} text-sm font-bold text-white shadow-sm`}
              aria-label={`${member.name}, ${COUNTRY_FLAGS[member.country] || ''} ${member.country}`}
            >
              {getInitials(member.name)}
            </div>
            <div className="min-w-0 space-y-0.5">
              <h3 className="text-base font-serif font-medium text-brand-dark leading-tight">{member.name}</h3>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-brand-slate">
                <span>{member.age}{t('ui.championshippage.b47dce337d')}</span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" /> {COUNTRY_FLAGS[member.country] || ''} {member.country}
                </span>
                <span>UTC+3</span>
              </div>
            </div>
          </div>
          <span className={`text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full border shrink-0 ${
            member.targetRoles.length <= 1
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-brand-rose-deep/10 text-brand-rose-deep border-brand-rose-deep/20'
          }`}>
            {member.targetRoles.length <= 1 ? t('ui.findteampage.c02f23906a') : t('ui.findteampage.f432e88ad8')}
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

      {/* Contacted badge */}
      {isContacted && (
        <div className="mt-4 flex">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/70 bg-emerald-50/85 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.08em] text-emerald-700 shadow-sm shadow-emerald-900/5">
            <CheckCircle className="h-3.5 w-3.5" strokeWidth={2.4} />
            {t('platform.status.contacted')}
          </span>
        </div>
      )}

      {/* CTA */}
      <div className="pt-4 mt-2">
        <button
          onClick={() => onOpen(member)}
          className="w-full bg-white/40 hover:bg-white/70 border border-[#d8d1cc] hover:border-brand-terracotta/40 text-[#5b6472] hover:text-brand-terracotta text-[11px] font-mono tracking-wider py-2.5 rounded-xl transition-all duration-300 cursor-pointer text-center font-medium"
        >{t('ui.findteampage.81dc2b6ebe')}</button>
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
    <div className="bg-white/[0.08] glass-card surface-elevated-soft border border-white/[0.12] rounded-2xl overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left font-serif font-semibold text-brand-dark text-lg sm:text-xl md:text-2xl cursor-pointer"
      >
        <span>{question}</span>
        <ChevronDown className={`w-4 h-4 text-brand-slate/60 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="p-5 pt-0 text-sm sm:text-base text-brand-slate font-normal md:font-light leading-relaxed bg-white/10 text-left">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Team Profile Modal (Register / My Profile)                        */
/* ------------------------------------------------------------------ */

function TeamProfileModal({
  authUser,
  onClose,
  onOpenAuthModal,
}: {
  authUser?: PlatformUser | null;
  onClose: () => void;
  onOpenAuthModal?: () => void;
}) {
  const { t } = useTranslation();
  const { teamMembers } = useLocalizedData();
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formCountry, setFormCountry] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formContactType, setFormContactType] = useState('telegram');
  const [formContact, setFormContact] = useState('');
  const [formSkills, setFormSkills] = useState<string[]>([]);
  const [formInterests, setFormInterests] = useState<string[]>([]);
  const [formRoles, setFormRoles] = useState<TeamRole[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formWhyLooking, setFormWhyLooking] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const uniqueCountries = useMemo(
    () => Array.from(new Set(teamMembers.map((m) => m.country))),
    [teamMembers],
  );
  const allSkills = useMemo(
    () => Array.from(new Set(teamMembers.flatMap((m) => m.skills))).sort(),
    [teamMembers],
  );
  const allInterests = useMemo(
    () => Array.from(new Set(teamMembers.flatMap((m) => m.interests))).sort(),
    [teamMembers],
  );
  const filteredSkillOptions = useMemo(() => {
    const q = skillInput.toLowerCase().trim();
    if (!q) return allSkills;
    return allSkills.filter((s) => s.toLowerCase().includes(q));
  }, [allSkills, skillInput]);
  const filteredInterestOptions = useMemo(() => {
    const q = interestInput.toLowerCase().trim();
    if (!q) return allInterests;
    return allInterests.filter((i) => i.toLowerCase().includes(q));
  }, [allInterests, interestInput]);

  // If user is authenticated, build a profile from authUser data
  const userProfile = authUser ? {
    name: authUser.firstName || authUser.name || authUser.email,
    age: parseInt(authUser.ageGroup || '0', 10) || 16,
    country: authUser.country || '',
    city: authUser.city || '',
    shortBio: authUser.biography || '',
    interests: authUser.interests || [],
    skills: authUser.skills || [],
    contact: authUser.email,
    contactType: 'email' as const,
  } : null;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];
    if (!formName.trim()) errors.push(t('ui.app.02ce21d910'));
    if (!formEmail.trim() || !formEmail.includes('@')) errors.push('Укажите корректный email');
    if (!formAge.trim() || isNaN(Number(formAge)) || Number(formAge) < 10 || Number(formAge) > 24) errors.push(t('ui.app.1c3299a85e'));
    if (!formCountry.trim()) errors.push(t('ui.app.92ca287f55'));
    if (!formContact.trim()) errors.push(t('ui.app.a4bae5e597'));

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors([]);
    sessionStorage.setItem('navykus.pendingFindTeamProfile', JSON.stringify({
      name: formName.trim(),
      email: formEmail.trim(),
      age: formAge.trim(),
      country: formCountry.trim(),
      city: formCity.trim(),
      contactType: formContactType,
      contact: formContact.trim(),
      skills: formSkills,
      interests: formInterests,
      targetRoles: formRoles,
      shortBio: formBio.trim(),
      whyLooking: formWhyLooking.trim(),
    }));
    onOpenAuthModal?.();
    onClose();
  };

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
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative max-h-[calc(100vh-2rem)] w-[96%] sm:w-full max-w-2xl bg-white/35 backdrop-blur-3xl border border-white/60 rounded-3xl shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.45),0_40px_120px_rgba(27,24,22,0.12)] z-10 overflow-y-auto scrollbar-soft"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-brand-bg-3/50 text-brand-dark transition-colors z-20"
            aria-label={t('ui.applicationmodal.877618185f')}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8">
            {authUser && userProfile ? (
              /* ===== AUTHENTICATED: My Profile ===== */
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif text-brand-dark tracking-tight">{t('ui.findteampage.myProfile')}</h2>
                  <p className="text-xs sm:text-sm text-brand-slate mt-1 font-light">{t('ui.findteampage.myProfileDesc')}</p>
                </div>

                <div className="bg-white/[0.12] glass-card surface-elevated-soft border border-white/[0.15] rounded-2xl p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${getAvatarGradient(authUser.id)} text-base font-bold text-white shadow-sm`}>
                      {getInitials(userProfile.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-serif font-medium text-brand-dark">{userProfile.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-brand-slate mt-0.5">
                        {userProfile.age > 0 && <span>{userProfile.age}{t('ui.championshippage.b47dce337d')}</span>}
                        {(userProfile.country || userProfile.city) && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" /> {[userProfile.country, userProfile.city].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {userProfile.shortBio && (
                    <div className="mb-3">
                      <h4 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold mb-1.5">{t('ui.findteampage.53fa567ce7')}</h4>
                      <p className="text-xs text-brand-slate font-light leading-relaxed">{userProfile.shortBio}</p>
                    </div>
                  )}

                  {userProfile.interests.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold mb-1.5">{t('ui.findteampage.747ac9c080')}</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {userProfile.interests.map((i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-rose-deep/10 text-brand-rose-deep font-medium">{i}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {userProfile.skills.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold mb-1.5">{t('ui.findteampage.176bd58504')}</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {userProfile.skills.map((s) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-terracotta/10 text-brand-terracotta font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-white/20 border border-white/40 rounded-xl p-4">
                    <h4 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold mb-1.5">{t('ui.activitiespage.1f75230b6e')}</h4>
                    <div className="flex items-center gap-2 text-xs text-brand-slate">
                      <Mail className="w-3.5 h-3.5 text-rose-600" />
                      <span>{authUser.email}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full bg-brand-dark text-white text-xs font-medium py-3 rounded-xl transition-all duration-200 cursor-pointer text-center hover:bg-brand-dark/95"
                >{t('ui.applicationmodal.4b5dbcf3e2')}</button>
              </div>
            ) : (
              /* ===== NOT AUTH: Registration Form ===== */
              <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif text-brand-dark tracking-tight">{t('platform.auth.registerTitle')}</h2>
                  <p className="text-xs sm:text-sm text-brand-slate mt-1 font-light">{t('ui.findteampage.registerDesc')}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">{t('ui.applicationmodal.34fda9e41a')}<span className="text-brand-terracotta">*</span></label>
                    <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={t('ui.applicationmodal.bd41d2e3e9')} className={FIND_TEAM_FIELD_CLASS} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">Email<span className="text-brand-terracotta">*</span></label>
                    <input type="email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="name@example.com" className={FIND_TEAM_FIELD_CLASS} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">{t('ui.championshippage.b520139c06')}<span className="text-brand-terracotta">*</span></label>
                    <input type="number" required value={formAge} onChange={(e) => setFormAge(e.target.value)} placeholder={t('ui.championshippage.7a94346b9f')} className={FIND_TEAM_FIELD_CLASS} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">{t('ui.findteampage.d45e4de05b')}<span className="text-brand-terracotta">*</span></label>
                    <select value={formCountry} onChange={(e) => setFormCountry(e.target.value)} className={FIND_TEAM_SELECT_CLASS}>
                      <option value="">{t('ui.findteampage.b4a5be85c1')}</option>
                      {uniqueCountries.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">{t('ui.championshippage.450778ada1')}</label>
                    <input type="text" value={formCity} onChange={(e) => setFormCity(e.target.value)} placeholder={t('ui.championshippage.6dfb2adc1d')} className={FIND_TEAM_FIELD_CLASS} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">{t('ui.findteampage.c8d0e2f4a7')}<span className="text-brand-terracotta">*</span></label>
                      <select value={formContactType} onChange={(e) => setFormContactType(e.target.value)} className={FIND_TEAM_SELECT_CLASS}>
                        {Object.keys(CONTACT_LABELS).map((ct) => <option key={ct} value={ct}>{CONTACT_LABELS[ct]}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">{t('ui.findteampage.3765795ef8')}<span className="text-brand-terracotta">*</span></label>
                      <input type="text" required value={formContact} onChange={(e) => setFormContact(e.target.value)} placeholder="@username" className={FIND_TEAM_FIELD_CLASS} />
                    </div>
                  </div>
                </div>

                {/* Skills multi-tag */}
                <div>
                  <label className="block text-[10px] font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">{t('ui.findteampage.e4f6b0a2c1')}</label>
                  <div className="relative">
                    <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder={t('ui.findteampage.f5a7c1d3e4')} className={FIND_TEAM_FIELD_CLASS} />
                    {skillInput.trim() && filteredSkillOptions.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full bg-white/95 backdrop-blur-md border border-white/60 rounded-xl shadow-lg max-h-36 overflow-y-auto scrollbar-soft">
                        {filteredSkillOptions.filter((s) => !formSkills.includes(s)).slice(0, 20).map((s) => (
                          <button key={s} type="button" onClick={() => { setFormSkills((prev) => [...prev, s]); setSkillInput(''); }} className="w-full text-left px-3 py-1.5 text-xs text-brand-dark hover:bg-brand-terracotta/10 transition-colors cursor-pointer">{s}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  {formSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formSkills.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 text-[10px] font-mono bg-brand-terracotta/10 text-brand-terracotta border border-brand-terracotta/20 rounded-full px-2.5 py-0.5">
                          {s}
                          <button type="button" onClick={() => setFormSkills((prev) => prev.filter((x) => x !== s))} className="hover:text-brand-terracotta cursor-pointer"><X className="w-2.5 h-2.5" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Interests multi-tag */}
                <div>
                  <label className="block text-[10px] font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">{t('ui.findteampage.a6b8c0d2e5')}</label>
                  <div className="relative">
                    <input type="text" value={interestInput} onChange={(e) => setInterestInput(e.target.value)} placeholder={t('ui.findteampage.b7c9d1e3f6')} className={FIND_TEAM_FIELD_CLASS} />
                    {interestInput.trim() && filteredInterestOptions.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full bg-white/95 backdrop-blur-md border border-white/60 rounded-xl shadow-lg max-h-36 overflow-y-auto scrollbar-soft">
                        {filteredInterestOptions.filter((i) => !formInterests.includes(i)).slice(0, 20).map((i) => (
                          <button key={i} type="button" onClick={() => { setFormInterests((prev) => [...prev, i]); setInterestInput(''); }} className="w-full text-left px-3 py-1.5 text-xs text-brand-dark hover:bg-brand-rose-deep/10 transition-colors cursor-pointer">{i}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  {formInterests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formInterests.map((i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[10px] font-mono bg-brand-rose-deep/10 text-brand-rose-deep border border-brand-rose-deep/15 rounded-full px-2.5 py-0.5">
                          {i}
                          <button type="button" onClick={() => setFormInterests((prev) => prev.filter((x) => x !== i))} className="hover:text-brand-rose-deep cursor-pointer"><X className="w-2.5 h-2.5" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Target roles */}
                <div>
                  <label className="block text-[10px] font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">{t('ui.findteampage.c0a1b9f7e4')}</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(ROLE_LABELS) as TeamRole[]).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setFormRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role])}
                        className={`text-[10px] font-mono tracking-wider px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                          formRoles.includes(role)
                            ? 'bg-brand-terracotta/10 border-brand-terracotta/30 text-brand-terracotta'
                            : 'bg-white/40 border-white/50 text-brand-slate hover:bg-white/60'
                        }`}
                      >
                        {t(ROLE_LABELS[role])}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bio / Why looking */}
                <div>
                  <label className="block text-[10px] font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">{t('ui.findteampage.0d5ce0304e')}</label>
                  <textarea
                    rows={3}
                    value={formWhyLooking}
                    onChange={(e) => setFormWhyLooking(e.target.value)}
                    placeholder={t('ui.findteampage.b7c9d1e3f6')}
                    className={FIND_TEAM_FIELD_CLASS + ' resize-none'}
                  />
                </div>

                {formErrors.length > 0 && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl">
                    {formErrors.map((err, i) => <p key={i}>{err}</p>)}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white rounded-xl text-xs font-medium shadow-lg shadow-[#bc4638]/20 hover:shadow-[#bc4638]/35 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{t('platform.auth.registerAction')}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */

export default function FindTeamPage({ onOpenApplyModal, authUser, onOpenAuthModal }: FindTeamPageProps) {
  const { t, i18n } = useTranslation();
  const { tournaments } = useLocalizedData();
  const teamMembers = useCmsTeamMembers();
  const faqItems = useCmsFaqs(
    'find-team',
    FIND_TEAM_FAQ_ITEMS.map<CmsFaqItem>((faq) => ({
      id: faq.id,
      page: 'find-team',
      question: t(faq.question),
      answer: t(faq.answer),
    })),
  );
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedAgeRange, setSelectedAgeRange] = useState('all');
  const [selectedTournament, setSelectedTournament] = useState('all');
  const [selectedIntent, setSelectedIntent] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  // Advanced search state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [skillInput, setSkillInput] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedContactType, setSelectedContactType] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [filtersHydrated, setFiltersHydrated] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Check if any advanced filter params are present → auto-open advanced search
    const hasAdvancedParams =
      (params.get('city') && params.get('city') !== 'all') ||
      (params.get('role') && params.get('role') !== 'all') ||
      (params.get('contact') && params.get('contact') !== 'all') ||
      (params.get('sort') && params.get('sort') !== 'newest') ||
      !!params.get('skills') ||
      !!params.get('interests');
    setShowAdvanced(hasAdvancedParams);

    setSearchQuery(params.get('q') || '');
    setSelectedCountry(params.get('country') || 'all');
    setSelectedAgeRange(params.get('age') || 'all');
    setSelectedTournament(params.get('tournament') || 'all');
    setSelectedIntent(params.get('intent') || 'all');
    setSelectedCity(params.get('city') || 'all');
    setSelectedRole(params.get('role') || 'all');
    setSelectedContactType(params.get('contact') || 'all');
    setSortBy((params.get('sort') as typeof sortBy) || 'newest');
    setSelectedSkills(params.get('skills')?.split(',').filter(Boolean) || []);
    setSelectedInterests(params.get('interests')?.split(',').filter(Boolean) || []);
    setFiltersHydrated(true);
  }, []);

  useEffect(() => {
    if (!filtersHydrated) return;
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedCountry !== 'all') params.set('country', selectedCountry);
    if (selectedAgeRange !== 'all') params.set('age', selectedAgeRange);
    if (selectedTournament !== 'all') params.set('tournament', selectedTournament);
    if (selectedIntent !== 'all') params.set('intent', selectedIntent);
    if (selectedCity !== 'all') params.set('city', selectedCity);
    if (selectedRole !== 'all') params.set('role', selectedRole);
    if (selectedContactType !== 'all') params.set('contact', selectedContactType);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (selectedSkills.length) params.set('skills', selectedSkills.join(','));
    if (selectedInterests.length) params.set('interests', selectedInterests.join(','));
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
  }, [filtersHydrated, searchQuery, selectedCountry, selectedAgeRange, selectedTournament, selectedIntent, selectedCity, selectedRole, selectedContactType, sortBy, selectedSkills, selectedInterests]);

  useEffect(() => {
    setSelectedCountry('all');
    setSelectedAgeRange('all');
    setSelectedTournament('all');
    setSelectedIntent('all');
    setSelectedCity('all');
    setSelectedRole('all');
    setSelectedSkills([]);
    setSelectedInterests([]);
    setSelectedContactType('all');
    setSortBy('newest');
  }, [i18n.resolvedLanguage, i18n.language]);

  // Contacted state (persisted)
  const [contactedIds, setContactedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ft_contacted') || '[]');
    } catch { return []; }
  });
  const markContacted = useCallback((id: string) => {
    setContactedIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem('ft_contacted', JSON.stringify(next));
      return next;
    });
  }, []);

  // Modal state
  const [selectedProfile, setSelectedProfile] = useState<TeamMember | null>(null);
  const [showTeamProfileModal, setShowTeamProfileModal] = useState(false);

  const handleOpenTeamProfile = () => {
    setShowTeamProfileModal(true);
  };

  /* ---------- Derived data ---------- */

  const ageRangeFilter = (age: number) => {
    if (selectedAgeRange === 'all') return true;
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

    const filtered = teamMembers.filter((member) => {
      if (!member.isApproved) return false;

      if (selectedCountry !== 'all' && member.country !== selectedCountry) return false;
      if (!ageRangeFilter(member.age)) return false;

      if (selectedTournament !== 'all') {
        if (member.targetProject && !member.targetProject.toLowerCase().includes(selectedTournament.toLowerCase())) {
          return false;
        }
      }

      if (!intentFilter(member)) return false;

      if (selectedCity !== 'all' && member.city !== selectedCity) return false;

      if (selectedRole !== 'all' && !member.targetRoles.includes(selectedRole as TeamRole)) return false;

      if (selectedSkills.length > 0) {
        const memberSkillsLower = member.skills.map((s) => s.toLowerCase());
        const allSkillsMatch = selectedSkills.every((s) => memberSkillsLower.includes(s.toLowerCase()));
        if (!allSkillsMatch) return false;
      }

      if (selectedInterests.length > 0) {
        const memberInterestsLower = member.interests.map((i) => i.toLowerCase());
        const allInterestsMatch = selectedInterests.every((i) => memberInterestsLower.includes(i.toLowerCase()));
        if (!allInterestsMatch) return false;
      }

      if (selectedContactType !== 'all' && member.contactType !== selectedContactType) return false;

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

    // Contacted status filter
    if (selectedContactType === 'contacted') {
      return filtered.filter((m) => contactedIds.includes(m.id));
    }

    const sorted = [...filtered];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    }
    return sorted;
  }, [teamMembers, searchQuery, selectedCountry, selectedAgeRange, selectedTournament, selectedIntent, selectedCity, selectedRole, selectedSkills, selectedInterests, selectedContactType, sortBy]);

  const uniqueCountries = useMemo(
    () => Array.from(new Set(teamMembers.map((member) => member.country))),
    [teamMembers],
  );

  const uniqueCities = useMemo(
    () => Array.from(new Set(teamMembers.map((member) => member.city).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b)),
    [teamMembers],
  );

  const allSkills = useMemo(
    () => Array.from(new Set(teamMembers.flatMap((member) => member.skills))).sort((a, b) => a.localeCompare(b)),
    [teamMembers],
  );

  const allInterests = useMemo(
    () => Array.from(new Set(teamMembers.flatMap((member) => member.interests))).sort((a, b) => a.localeCompare(b)),
    [teamMembers],
  );

  const filteredSkillOptions = useMemo(() => {
    const q = skillInput.toLowerCase().trim();
    if (!q) return allSkills;
    return allSkills.filter((s) => s.toLowerCase().includes(q));
  }, [allSkills, skillInput]);

  const filteredInterestOptions = useMemo(() => {
    const q = interestInput.toLowerCase().trim();
    if (!q) return allInterests;
    return allInterests.filter((i) => i.toLowerCase().includes(q));
  }, [allInterests, interestInput]);

  /* ---------- Active advanced filter count ---------- */

  const activeAdvancedCount = useMemo(
    () =>
      (selectedCity !== 'all' ? 1 : 0) +
      (selectedRole !== 'all' ? 1 : 0) +
      (selectedContactType !== 'all' ? 1 : 0) +
      (sortBy !== 'newest' ? 1 : 0) +
      selectedSkills.length +
      selectedInterests.length,
    [selectedCity, selectedRole, selectedContactType, sortBy, selectedSkills, selectedInterests],
  );

  /* ---------- Active filter pills ---------- */

  const activeFilters = [
    selectedCountry !== 'all' && { label: selectedCountry, clear: () => setSelectedCountry('all') },
    selectedAgeRange !== 'all' && { label: selectedAgeRange, clear: () => setSelectedAgeRange('all') },
    selectedTournament !== 'all' && { label: selectedTournament, clear: () => setSelectedTournament('all') },
    selectedIntent !== 'all' && { label: selectedIntent === 'looking_for_team' ? t('ui.findteampage.c02f23906a') : t('ui.findteampage.f432e88ad8'), clear: () => setSelectedIntent('all') },
    selectedCity !== 'all' && { label: selectedCity, clear: () => setSelectedCity('all') },
    selectedRole !== 'all' && { label: t(ROLE_LABELS[selectedRole as TeamRole]), clear: () => setSelectedRole('all') },
    ...selectedSkills.map((s) => ({ label: s, clear: () => setSelectedSkills((prev) => prev.filter((x) => x !== s)) })),
    ...selectedInterests.map((i) => ({ label: i, clear: () => setSelectedInterests((prev) => prev.filter((x) => x !== i)) })),
    selectedContactType !== 'all' && { label: CONTACT_LABELS[selectedContactType], clear: () => setSelectedContactType('all') },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCountry('all');
    setSelectedAgeRange('all');
    setSelectedTournament('all');
    setSelectedIntent('all');
    setSelectedCity('all');
    setSelectedRole('all');
    setSelectedSkills([]);
    setSelectedInterests([]);
    setSelectedContactType('all');
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#fff8f5] via-[#fffaf7] to-[#fdf6f4] text-[#111111] font-sans overflow-x-hidden">

      {/* Background systems */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply z-0" style={{ backgroundImage: "radial-gradient(circle, #111 0.6px, transparent 0.8px)", backgroundSize: "18px 18px" }}></div>
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.25]" style={{ backgroundImage: "linear-gradient(#d8d1cc 1px, transparent 1px), linear-gradient(90deg, #d8d1cc 1px, transparent 1px)", backgroundSize: "120px 120px" }}></div>
      </div>
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-12%] right-[-8%] w-[700px] h-[700px] rounded-full blur-[140px] opacity-20 animate-ambient-1" style={{ background: "radial-gradient(circle at 30% 20%, #f38b76, #bc4638 60%, #80261b)" }}></div>
        <div className="absolute top-[15%] left-[-12%] w-[500px] h-[500px] rounded-full blur-[130px] opacity-15 animate-ambient-2" style={{ background: "radial-gradient(circle at 60% 40%, #e28fb1, #bd5b82 65%, transparent)" }}></div>
        <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 animate-ambient-4" style={{ background: "radial-gradient(circle, #bc4638, #f38b76 60%, transparent)" }}></div>
      </div>
      <StudyBackground />

      {/* ======================== HERO BLOCK ======================== */}
      <section className="relative z-10 pt-24 pb-12 md:pt-24 md:pb-16 max-w-7xl mx-auto px-[6%] md:px-[10%]">
        <motion.div {...heroFadeUpLarge} className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)] md:items-center">

          <div className="space-y-6 text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-brand-dark tracking-tight leading-tight">{t('ui.app.d13f387e64')}</h1>
            <p className="max-w-3xl text-sm sm:text-base text-brand-slate font-normal md:font-light leading-relaxed">{t('ui.findteampage.801f72c2a4')}</p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={handleOpenTeamProfile}
                className="px-8 py-4 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white rounded-2xl text-sm font-medium shadow-xl shadow-[#bc4638]/25 hover:shadow-[#bc4638]/35 hover:scale-[1.01] transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
              >{authUser ? t('ui.findteampage.myProfile') : t('platform.auth.registerAction')}<ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
              {teamMembers.length > 0 && (
                <button
                  onClick={() => {
                    const el = document.getElementById('profiles-section');
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="px-8 py-4 bg-white/40 backdrop-blur-md border border-[#d8d1cc] hover:border-[#bc4638]/60 rounded-2xl text-sm font-medium text-[#5b6472] hover:text-[#bc4638] transition-all text-center cursor-pointer"
                >{t('ui.findteampage.83874460f8')}</button>
              )}
            </div>
          </div>
          <BrandImage
            src="/images/find-team/team-discussion.jpg"
            alt={t('ui.enhancements.findTeamHeroAlt')}
            aspectRatio="4 / 3"
            objectPosition="50% 38%"
            sizes="(min-width: 768px) 42vw, 100vw"
            overlay
          />
        </motion.div>
      </section>

      {/* ======================== FILTERS & SEARCH ======================== */}
      {teamMembers.length > 0 && (
        <section id="filters-section" className="relative z-10 pt-8 md:pt-12 pb-0 max-w-7xl mx-auto px-[6%] md:px-[10%]">
          <motion.div {...fadeUp} className="space-y-6">
          {/* Search bar */}
          <div className="flex items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-slate/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('ui.findteampage.0247c0a466')}
                className={FIND_TEAM_SEARCH_CLASS}
              />
            </div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-1.5 border rounded-xl px-3.5 py-3 sm:py-3 text-xs font-mono tracking-tight cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                activeAdvancedCount > 0
                  ? 'bg-brand-terracotta/10 border-brand-terracotta/30 text-brand-terracotta hover:bg-brand-terracotta/15 hover:border-brand-terracotta/50'
                  : 'bg-white/80 hover:bg-white border-[#d8d1cc] hover:border-brand-terracotta/40 text-brand-dark'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span>{t('ui.findteampage.c1d2e3f4a5b')}</span>
              {activeAdvancedCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-brand-terracotta text-white text-[9px] font-bold px-1 leading-none">
                  {activeAdvancedCount}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center gap-2 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl px-4 py-2.5 text-xs font-mono text-brand-dark tracking-wider cursor-pointer"
          >
            <Filter className="w-4 h-4" />{t('ui.findteampage.5412a9a9b7')}<ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
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
                    <label className="text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">{t('ui.findteampage.d45e4de05b')}</label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className={FIND_TEAM_SELECT_CLASS}
                    >
                      <option value="all">{t('ui.findteampage.b4a5be85c1')}</option>
                      {uniqueCountries.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Age */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">{t('ui.championshippage.ff03252b22')}</label>
                    <select
                      value={selectedAgeRange}
                      onChange={(e) => setSelectedAgeRange(e.target.value)}
                      className={FIND_TEAM_SELECT_CLASS}
                    >
                      <option value="all">{t('ui.findteampage.16e18813d5')}</option>
                      <option>12–14</option>
                      <option>15–16</option>
                      <option>17–18</option>
                    </select>
                  </div>

                  {/* Tournament */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">{t('ui.findteampage.6da0530772')}</label>
                    <select
                      value={selectedTournament}
                      onChange={(e) => setSelectedTournament(e.target.value)}
                      className={FIND_TEAM_SELECT_CLASS}
                    >
                      <option value="all">{t('ui.findteampage.803266d644')}</option>
                      {tournaments.map((t) => (
                        <option key={t.id}>{t.type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Intent */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">{t('ui.findteampage.44e0803cef')}</label>
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
                          {intent === 'all' ? t('ui.findteampage.9a5bee689e') : intent === 'looking_for_team' ? t('ui.findteampage.ce8d9ae9f6') : t('ui.findteampage.5bcf8be47e')}
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
                    >{t('ui.findteampage.449ee8d719')}</button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Advanced filter controls */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Row 1: City / Role / Contact type / Sort */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* City */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">{t('ui.findteampage.b9c1f7e3a0')}</label>
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className={FIND_TEAM_SELECT_CLASS}
                      >
                        <option value="all">{t('ui.findteampage.a2e4f8c1d3')}</option>
                        {uniqueCities.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Role */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">{t('ui.findteampage.c0a1b9f7e4')}</label>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className={FIND_TEAM_SELECT_CLASS}
                      >
                        <option value="all">{t('ui.findteampage.d3e5a9c1b2')}</option>
                        {(Object.keys(ROLE_LABELS) as TeamRole[]).map((r) => (
                          <option key={r} value={r}>{t(ROLE_LABELS[r])}</option>
                        ))}
                      </select>
                    </div>

                    {/* Contact type */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">{t('ui.findteampage.c8d0e2f4a7')}</label>
                      <select
                        value={selectedContactType}
                        onChange={(e) => setSelectedContactType(e.target.value)}
                        className={FIND_TEAM_SELECT_CLASS}
                      >
                        <option value="all">{t('ui.findteampage.d9e1f3a5b8')}</option>
                        {(Object.keys(CONTACT_LABELS) as Array<keyof typeof CONTACT_LABELS>).map((ct) => (
                          <option key={ct} value={ct}>{CONTACT_LABELS[ct]}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sort */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">{t('ui.findteampage.e0f2a4b6c9')}</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                        className={FIND_TEAM_SELECT_CLASS}
                      >
                        <option value="newest">{t('ui.findteampage.f1a3b5c7d0')}</option>
                        <option value="oldest">{t('ui.findteampage.a4b6c8d0e2')}</option>
                        <option value="name">{t('ui.findteampage.b5c7d9e1f3')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Skills multi-select + Interests multi-select */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Skills */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">{t('ui.findteampage.e4f6b0a2c1')}</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          placeholder={t('ui.findteampage.f5a7c1d3e4')}
                          className={FIND_TEAM_FIELD_CLASS}
                        />
                        {skillInput.trim() && filteredSkillOptions.length > 0 && (
                          <div className="absolute z-20 mt-1 w-full bg-white/95 backdrop-blur-md border border-white/60 rounded-xl shadow-lg max-h-48 overflow-y-auto scrollbar-soft">
                            {filteredSkillOptions
                              .filter((s) => !selectedSkills.includes(s))
                              .slice(0, 30)
                              .map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSkills((prev) => [...prev, s]);
                                    setSkillInput('');
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs text-brand-dark hover:bg-brand-terracotta/10 transition-colors cursor-pointer"
                                >
                                  {s}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                      {selectedSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {selectedSkills.map((s) => (
                            <span key={s} className="inline-flex items-center gap-1 text-[10px] font-mono tracking-wider bg-brand-terracotta/10 text-brand-terracotta border border-brand-terracotta/20 rounded-full px-3 py-1">
                              {s}
                              <button onClick={() => setSelectedSkills((prev) => prev.filter((x) => x !== s))} className="hover:text-brand-terracotta transition-colors cursor-pointer">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Interests */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-brand-dark/70 uppercase tracking-wider">{t('ui.findteampage.a6b8c0d2e5')}</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={interestInput}
                          onChange={(e) => setInterestInput(e.target.value)}
                          placeholder={t('ui.findteampage.b7c9d1e3f6')}
                          className={FIND_TEAM_FIELD_CLASS}
                        />
                        {interestInput.trim() && filteredInterestOptions.length > 0 && (
                          <div className="absolute z-20 mt-1 w-full bg-white/95 backdrop-blur-md border border-white/60 rounded-xl shadow-lg max-h-48 overflow-y-auto scrollbar-soft">
                            {filteredInterestOptions
                              .filter((i) => !selectedInterests.includes(i))
                              .slice(0, 30)
                              .map((i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    setSelectedInterests((prev) => [...prev, i]);
                                    setInterestInput('');
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs text-brand-dark hover:bg-brand-rose-deep/10 transition-colors cursor-pointer"
                                >
                                  {i}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                      {selectedInterests.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {selectedInterests.map((i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-[10px] font-mono tracking-wider bg-brand-rose-deep/10 text-brand-rose-deep border border-brand-rose-deep/15 rounded-full px-3 py-1">
                              {i}
                              <button onClick={() => setSelectedInterests((prev) => prev.filter((x) => x !== i))} className="hover:text-brand-rose-deep transition-colors cursor-pointer">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
      )}

      {/* ======================== PROFILES LIST ======================== */}
      {teamMembers.length > 0 && (
        <section id="profiles-section" className="relative z-10 pt-2 md:pt-2 pb-8 md:pb-12 max-w-7xl mx-auto px-[6%] md:px-[10%]">
          {/* Results count */}
          <div className="mb-6 flex items-center justify-between">
            <span className="text-xs font-mono text-brand-slate">{t('ui.findteampage.b62712adf3')}<strong className="text-brand-dark">{filteredMembers.length}</strong>
              {filteredMembers.length === 1 && t('ui.findteampage.762a11aca5')}
              {filteredMembers.length >= 2 && filteredMembers.length <= 4 && t('ui.findteampage.1e5680932c')}
              {filteredMembers.length >= 5 && t('ui.findteampage.eef8a6796e')}
            </span>
          </div>

          {filteredMembers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-24 text-center"
            >
              <p className="text-3xl font-serif font-semibold tracking-tight text-brand-dark/40 sm:text-4xl md:text-5xl">
                {t('ui.findteampage.13cae99e23')}
              </p>
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
                  contactedIds={contactedIds}
                />
              ))}
            </motion.div>
          )}
        </section>
      )}

      {/* ======================== SAFETY & TRUST ======================== */}
      <section className="relative z-10 py-12 md:py-16 max-w-7xl mx-auto px-[6%] md:px-[10%]">
        <motion.div {...fadeUp} className="mx-auto mb-10 max-w-3xl space-y-3 text-center">
          <h2 className="text-3xl font-serif text-brand-dark tracking-tight sm:text-4xl md:text-5xl">{t('ui.findteampage.e1cd2e34c2')}</h2>
          <p className="mx-auto max-w-2xl text-xs sm:text-sm text-brand-slate font-normal md:font-light leading-relaxed">{t('ui.findteampage.fc35e86bc0')}</p>
        </motion.div>
        <motion.div {...cardStaggerContainer} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              Icon: ShieldCheck,
              iconColor: 'text-emerald-600/[0.13]',
              title: t('ui.findteampage.068a88033b'),
              desc: t('ui.findteampage.3db06b0fab'),
            },
            {
              Icon: EyeOff,
              iconColor: 'text-brand-terracotta/[0.14]',
              title: t('ui.findteampage.fb356b50e3'),
              desc: t('ui.findteampage.fdb87a056d'),
            },
            {
              Icon: MessageSquare,
              iconColor: 'text-brand-rose-deep/[0.13]',
              title: t('ui.findteampage.a85a36cdb3'),
              desc: t('ui.findteampage.4ee576bd39'),
            },
            {
              Icon: LifeBuoy,
              iconColor: 'text-brand-coral/[0.14]',
              title: t('ui.findteampage.b574813bb4'),
              desc: t('ui.findteampage.9a780980af'),
            },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              variants={cardItemFadeUp.variants}
              className="group relative overflow-hidden bg-white/[0.12] glass-card surface-elevated-soft border border-white/[0.15] p-6 rounded-2xl hover:bg-white/[0.2] hover:border-[#bc4638]/25 transition-[background-color,border-color,box-shadow,transform] duration-300 hover:-translate-y-1"
            >
              <item.Icon
                className={`pointer-events-none absolute left-5 top-1/2 h-16 w-16 -translate-y-1/2 select-none ${item.iconColor} transition-transform duration-300 group-hover:scale-105`}
                aria-hidden="true"
                strokeWidth={1.45}
              />
              <div className="relative space-y-3 pl-20">
                <h3 className="text-base font-serif font-semibold leading-tight text-brand-dark sm:text-lg">{item.title}</h3>
                <p className="text-xs text-brand-slate font-normal md:font-light leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ======================== FAQ ======================== */}
      <section className="relative z-10 py-16 md:py-24 max-w-7xl mx-auto px-[6%] md:px-[10%] space-y-6 section-accent-warm">
        <motion.div {...fadeUp} className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-brand-dark tracking-tight">{t('ui.findteampage.f119ad282e')}</h2>
        </motion.div>
        <motion.div {...fadeUp} className="space-y-4">
          {faqItems.map((faq) => (
            <FAQItem key={faq.id} question={faq.question} answer={faq.answer} />
          ))}
        </motion.div>
      </section>

      {/* ======================== DETAIL MODAL ======================== */}
      {selectedProfile && (
        <DetailedProfileModal
          member={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onOpenApplyModal={onOpenApplyModal}
          onContacted={markContacted}
        />
      )}

      {showTeamProfileModal && (
        <TeamProfileModal
          authUser={authUser}
          onClose={() => setShowTeamProfileModal(false)}
          onOpenAuthModal={onOpenAuthModal}
        />
      )}
    </div>
  );
}
