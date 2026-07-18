import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  Code2,
  Compass,
  FilePlus2,
  Filter,
  GraduationCap,
  Heart,
  Landmark,
  Languages,
  LineChart,
  MapPin,
  Medal,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import GlassCrystal from './GlassCrystal';
import {
  cardItemFadeUp,
  cardStaggerContainer,
  fadeInScale,
  fadeUp,
  fadeUpLarge,
  heroFadeUpLarge,
} from '../motion-animations';
import type { SupportedLanguage } from '../i18n/languages';
import { useCmsOpportunities } from '../hooks/useCmsOpportunities';
import BrandImage from './BrandImage';

const catalogStaggerContainer = {
  ...cardStaggerContainer,
  viewport: {
    ...cardStaggerContainer.viewport,
    margin: '0px 0px 260px 0px',
  },
};

type CategoryId =
  | 'championships'
  | 'olympiads'
  | 'contests'
  | 'internships'
  | 'projects'
  | 'research'
  | 'volunteering'
  | 'grants'
  | 'scholarships'
  | 'hackathons'
  | 'exchanges'
  | 'summer'
  | 'online';

type DirectionId = 'business' | 'science' | 'tech' | 'social' | 'creative' | 'leadership';
type FormatId = 'online' | 'offline' | 'hybrid';
type CostId = 'free' | 'paid' | 'scholarship';
type SourceId = 'navykus' | 'verified' | 'partner';
type ParticipationId = 'individual' | 'team' | 'both';
type SortId = 'recommended' | 'deadline' | 'match' | 'newest' | 'popular';
type RouteMode = 'catalog' | 'detail' | 'recommendations' | 'favorites' | 'compare' | 'submit' | 'profile';
type ApplicationStatus = 'draft' | 'submitted' | 'review' | 'accepted' | 'completed';

type LText = Record<SupportedLanguage, string>;

type Opportunity = {
  id: string;
  slug: string;
  source: SourceId;
  category: CategoryId;
  direction: DirectionId;
  format: FormatId;
  participation: ParticipationId;
  cost: CostId;
  title: LText;
  organizer: LText;
  summary: LText;
  description: LText;
  country: LText;
  city: LText;
  languages: SupportedLanguage[];
  skills: LText[];
  keywords: string[];
  minAge: number;
  maxAge: number;
  grades: number[];
  deadline?: string;
  startDate: string;
  finalDeadline: boolean;
  registrationOpen: boolean;
  seats: number;
  savedCount: number;
  imageUrl: string;
  editorPick: boolean;
  recommended: boolean;
  requirements: LText[];
  outcomes: LText[];
  externalUrl?: string;
  portfolioValue: number;
  publishedAt: string;
};

type UserApplication = {
  id: string;
  opportunityId: string;
  status: ApplicationStatus;
  submittedAt: string;
  note: string;
};

type PortfolioRecord = {
  id: string;
  opportunityId: string;
  title: string;
  result: string;
  createdAt: string;
};

type QuizState = {
  age: string;
  grade: string;
  interests: DirectionId[];
  skills: string[];
  goal: string;
  format: FormatId | 'any';
  time: 'weekend' | 'after-school' | 'intensive';
  cost: CostId | 'any';
  language: SupportedLanguage | 'any';
  participation: ParticipationId | 'any';
};

type Filters = {
  q: string;
  category: CategoryId | 'all';
  direction: DirectionId | 'all';
  format: FormatId | 'all';
  source: SourceId | 'all';
  cost: CostId | 'all';
  deadline: 'all' | '7' | '14' | '30' | 'rolling';
  age: string;
  grade: string;
  country: string;
  language: SupportedLanguage | 'all';
  participation: ParticipationId | 'all';
  remoteOnly: boolean;
  beginner: boolean;
  portfolio: boolean;
};

const STORAGE_KEYS = {
  favorites: 'navykus.opportunities.favorites',
  compare: 'navykus.opportunities.compare',
  applications: 'navykus.opportunities.applications',
  portfolio: 'navykus.opportunities.portfolio',
  proposals: 'navykus.opportunities.proposals',
};

const EMPTY_FILTERS: Filters = {
  q: '',
  category: 'all',
  direction: 'all',
  format: 'all',
  source: 'all',
  cost: 'all',
  deadline: 'all',
  age: '',
  grade: '',
  country: 'all',
  language: 'all',
  participation: 'all',
  remoteOnly: false,
  beginner: false,
  portfolio: false,
};

const createEmptyFilters = (): Filters => ({ ...EMPTY_FILTERS });

const EMPTY_QUIZ: QuizState = {
  age: '',
  grade: '',
  interests: [],
  skills: [],
  goal: '',
  format: 'any',
  time: 'after-school',
  cost: 'any',
  language: 'any',
  participation: 'any',
};

const lt = (value: Record<string, string>): LText => ({
  ru: value.ru,
  en: value.en,
  kk: value.kk,
  uz: value.uz,
  ar: value.ar,
  de: value.de,
  es: value.es,
  tr: value.tr,
});

const pick = (value: LText, language: SupportedLanguage) => value[language] || value.ru;

export const OPPORTUNITIES_NAV_LABELS: LText = lt({
  ru: '\u0412\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u0438',
  en: 'Opportunities',
  kk: '\u041c\u04af\u043c\u043a\u0456\u043d\u0434\u0456\u043a\u0442\u0435\u0440',
  uz: 'Imkoniyatlar',
  ar: 'الفرص',
  de: 'Chancen',
  es: 'Oportunidades',
  tr: 'Fırsatlar',
});

const UI = {
  breadcrumbHome: lt({ ru: '\u0413\u043b\u0430\u0432\u043d\u0430\u044f', en: 'Home', kk: '\u0411\u0430\u0441\u0442\u044b \u0431\u0435\u0442', uz: 'Bosh sahifa', ar: 'الرئيسية', de: 'Startseite', es: 'Inicio', tr: 'Ana sayfa' }),
  title: lt({ ru: '\u0412\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u0438 \u0434\u043b\u044f \u0448\u043a\u043e\u043b\u044c\u043d\u0438\u043a\u043e\u0432', en: 'Opportunities for students', kk: '\u041e\u049b\u0443\u0448\u044b\u043b\u0430\u0440\u0493\u0430 \u0430\u0440\u043d\u0430\u043b\u0493\u0430\u043d \u043c\u04af\u043c\u043a\u0456\u043d\u0434\u0456\u043a\u0442\u0435\u0440', uz: 'Oquvchilar uchun imkoniyatlar', ar: 'فرص للطلاب', de: 'Chancen für Schüler', es: 'Oportunidades para estudiantes', tr: 'Öğrenciler için fırsatlar' }),
  heroText: lt({
    ru: '\u041d\u0430\u0445\u043e\u0434\u0438\u0442\u0435 \u0447\u0435\u043c\u043f\u0438\u043e\u043d\u0430\u0442\u044b, \u0441\u0442\u0430\u0436\u0438\u0440\u043e\u0432\u043a\u0438, \u0433\u0440\u0430\u043d\u0442\u044b, \u0438\u0441\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u043d\u0438\u044f, \u043f\u0440\u043e\u0435\u043a\u0442\u043d\u044b\u0435 \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u044b \u0438 \u043c\u0435\u0436\u0434\u0443\u043d\u0430\u0440\u043e\u0434\u043d\u044b\u0435 \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u044f, \u043a\u043e\u0442\u043e\u0440\u044b\u0435 \u043f\u043e\u043c\u043e\u0433\u0443\u0442 \u0440\u0430\u0437\u0432\u0438\u0432\u0430\u0442\u044c \u043d\u0430\u0432\u044b\u043a\u0438 \u0438 \u0441\u043e\u0437\u0434\u0430\u0432\u0430\u0442\u044c \u0440\u0435\u0430\u043b\u044c\u043d\u044b\u0435 \u043f\u0440\u043e\u0435\u043a\u0442\u044b.',
    en: 'Find championships, internships, grants, research, project programs and global events that help build skills and real projects.',
    kk: '\u0414\u0430\u0493\u0434\u044b\u043b\u0430\u0440\u0434\u044b \u0434\u0430\u043c\u044b\u0442\u044b\u043f, \u043d\u0430\u049b\u0442\u044b \u0436\u043e\u0431\u0430\u043b\u0430\u0440 \u0436\u0430\u0441\u0430\u0443\u0493\u0430 \u043a\u04e9\u043c\u0435\u043a\u0442\u0435\u0441\u0435\u0442\u0456\u043d \u0447\u0435\u043c\u043f\u0438\u043e\u043d\u0430\u0442\u0442\u0430\u0440, \u0442\u0430\u0493\u044b\u043b\u044b\u043c\u0434\u0430\u043c\u0430\u043b\u0430\u0440, \u0433\u0440\u0430\u043d\u0442\u0442\u0430\u0440, \u0437\u0435\u0440\u0442\u0442\u0435\u0443\u043b\u0435\u0440 \u0436\u04d9\u043d\u0435 \u0445\u0430\u043b\u044b\u049b\u0430\u0440\u0430\u043b\u044b\u049b \u0431\u0430\u0493\u0434\u0430\u0440\u043b\u0430\u043c\u0430\u043b\u0430\u0440\u0434\u044b \u0442\u0430\u0431\u044b\u04a3\u044b\u0437.',
    uz: 'Konikmalarni rivojlantiradigan va haqiqiy loyihalar yaratishga yordam beradigan chempionatlar, amaliyotlar, grantlar va xalqaro dasturlarni toping.',
    ar: 'اعثر على بطولات وتدريبات ومنح وبرامج بحث ومشاريع دولية تساعدك على بناء المهارات والمشاريع الحقيقية.',
    de: 'Finde Wettbewerbe, Praktika, Stipendien, Forschung, Projektprogramme und internationale Events für echte Skills und Projekte.',
    es: 'Encuentra campeonatos, prácticas, becas, investigación, programas de proyectos y eventos internacionales para crear proyectos reales.',
    tr: 'Becerileri geliştiren ve gerçek projeler üretmeye yardımcı olan şampiyonaları, stajları, hibeleri, araştırmaları ve uluslararası programları keşfet.',
  }),
  search: lt({ ru: '\u041f\u043e\u0438\u0441\u043a \u043f\u043e \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044e, \u043d\u0430\u0432\u044b\u043a\u0430\u043c, \u0441\u0442\u0440\u0430\u043d\u0435, \u043e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0442\u043e\u0440\u0443...', en: 'Search by title, skills, country, organizer...', kk: '\u0410\u0442\u0430\u0443\u044b, \u0434\u0430\u0493\u0434\u044b\u043b\u0430\u0440, \u0435\u043b, \u04b1\u0439\u044b\u043c\u0434\u0430\u0441\u0442\u044b\u0440\u0443\u0448\u044b \u0431\u043e\u0439\u044b\u043d\u0448\u0430 \u0456\u0437\u0434\u0435\u0443...', uz: 'Nomi, konikmalar, mamlakat, tashkilotchi boyicha qidirish...', ar: 'ابحث بالعنوان أو المهارات أو البلد أو المنظم...', de: 'Suche nach Titel, Skills, Land, Organisation...', es: 'Buscar por título, habilidades, país u organizador...', tr: 'Başlık, beceri, ülke veya düzenleyici ile ara...' }),
  matchMe: lt({ ru: '\u041f\u043e\u0434\u043e\u0431\u0440\u0430\u0442\u044c \u0434\u043b\u044f \u043c\u0435\u043d\u044f', en: 'Match me', kk: '\u041c\u0430\u0493\u0430\u043d \u0442\u0430\u04a3\u0434\u0430\u0443', uz: 'Menga mosini topish', ar: 'اختر لي', de: 'Für mich finden', es: 'Recomendar para mí', tr: 'Bana uygun bul' }),
  published: lt({ ru: '\u043e\u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u043d\u043d\u044b\u0445 \u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u0435\u0439', en: 'published opportunities', kk: '\u0436\u0430\u0440\u0438\u044f\u043b\u0430\u043d\u0493\u0430\u043d \u043c\u04af\u043c\u043a\u0456\u043d\u0434\u0456\u043a', uz: 'e’lon qilingan imkoniyat', ar: 'فرصة منشورة', de: 'veröffentlichte Chancen', es: 'oportunidades publicadas', tr: 'yayındaki fırsat' }),
  recommended: lt({ ru: '\u0420\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0443\u0435\u043c', en: 'Recommended', kk: '\u04b0\u0441\u044b\u043d\u044b\u043b\u0430\u0434\u044b', uz: 'Tavsiya qilamiz', ar: 'موصى به', de: 'Empfohlen', es: 'Recomendamos', tr: 'Önerilen' }),
  urgent: lt({ ru: '\u0423\u0441\u043f\u0435\u0439 \u043f\u043e\u0434\u0430\u0442\u044c \u0437\u0430\u044f\u0432\u043a\u0443', en: 'Apply soon', kk: '\u04e8\u0442\u0456\u043d\u0456\u043c \u0431\u0435\u0440\u0443\u0433\u0435 \u04af\u043b\u0433\u0435\u0440', uz: 'Ariza berishga ulgur', ar: 'قدّم قريباً', de: 'Bald bewerben', es: 'Postula pronto', tr: 'Yakında başvur' }),
  filters: lt({ ru: '\u0424\u0438\u043b\u044c\u0442\u0440\u044b', en: 'Filters', kk: '\u0421\u04af\u0437\u0433\u0456\u043b\u0435\u0440', uz: 'Filtrlar', ar: 'الفلاتر', de: 'Filter', es: 'Filtros', tr: 'Filtreler' }),
  results: lt({ ru: '\u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u043e\u0432', en: 'results', kk: '\u043d\u04d9\u0442\u0438\u0436\u0435', uz: 'natija', ar: 'نتيجة', de: 'Ergebnisse', es: 'resultados', tr: 'sonuç' }),
  sort: lt({ ru: '\u0421\u043e\u0440\u0442\u0438\u0440\u043e\u0432\u043a\u0430', en: 'Sort', kk: '\u0421\u04b1\u0440\u044b\u043f\u0442\u0430\u0443', uz: 'Saralash', ar: 'الترتيب', de: 'Sortieren', es: 'Ordenar', tr: 'Sırala' }),
  loadMore: lt({ ru: '\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u0435\u0449\u0451', en: 'Show more', kk: '\u0422\u0430\u0493\u044b \u043a\u04e9\u0440\u0441\u0435\u0442\u0443', uz: 'Yana korsatish', ar: 'عرض المزيد', de: 'Mehr anzeigen', es: 'Mostrar más', tr: 'Daha fazla göster' }),
  details: lt({ ru: '\u041f\u043e\u0434\u0440\u043e\u0431\u043d\u0435\u0435', en: 'Details', kk: '\u0422\u043e\u043b\u044b\u0493\u044b\u0440\u0430\u049b', uz: 'Batafsil', ar: 'تفاصيل', de: 'Details', es: 'Detalles', tr: 'Detaylar' }),
  favorite: lt({ ru: '\u0418\u0437\u0431\u0440\u0430\u043d\u043d\u043e\u0435', en: 'Favorite', kk: '\u0422\u0430\u04a3\u0434\u0430\u0443\u043b\u044b', uz: 'Sevimli', ar: 'المفضلة', de: 'Favorit', es: 'Favorito', tr: 'Favori' }),
  compare: lt({ ru: '\u0421\u0440\u0430\u0432\u043d\u0438\u0442\u044c', en: 'Compare', kk: '\u0421\u0430\u043b\u044b\u0441\u0442\u044b\u0440\u0443', uz: 'Solishtirish', ar: 'قارن', de: 'Vergleichen', es: 'Comparar', tr: 'Karşılaştır' }),
  fromNavykus: lt({ ru: '\u041e\u0442 \u041d\u0430\u0432\u044b\u043a\u0443\u0441', en: 'By Navykus', kk: '\u041d\u0430\u0432\u044b\u043a\u0443\u0441\u0442\u0430\u043d', uz: 'Navykusdan', ar: 'من Navykus', de: 'Von Navykus', es: 'De Navykus', tr: 'Navykus tarafından' }),
  verified: lt({ ru: '\u041f\u0440\u043e\u0432\u0435\u0440\u0435\u043d\u043e', en: 'Verified', kk: '\u0422\u0435\u043a\u0441\u0435\u0440\u0456\u043b\u0433\u0435\u043d', uz: 'Tekshirilgan', ar: 'موثّق', de: 'Geprüft', es: 'Verificado', tr: 'Doğrulandı' }),
  partner: lt({ ru: '\u041f\u0430\u0440\u0442\u043d\u0451\u0440', en: 'Partner', kk: '\u0421\u0435\u0440\u0456\u043a\u0442\u0435\u0441', uz: 'Hamkor', ar: 'شريك', de: 'Partner', es: 'Socio', tr: 'Ortak' }),
  deadline: lt({ ru: '\u0414\u0435\u0434\u043b\u0430\u0439\u043d', en: 'Deadline', kk: '\u041c\u0435\u0440\u0437\u0456\u043c', uz: 'Muddat', ar: 'الموعد النهائي', de: 'Frist', es: 'Fecha límite', tr: 'Son tarih' }),
  daysLeft: lt({ ru: '\u0434\u043d. \u043e\u0441\u0442\u0430\u043b\u043e\u0441\u044c', en: 'days left', kk: '\u043a\u04af\u043d \u049b\u0430\u043b\u0434\u044b', uz: 'kun qoldi', ar: 'أيام متبقية', de: 'Tage übrig', es: 'días restantes', tr: 'gün kaldı' }),
  rolling: lt({ ru: '\u041f\u043e\u0441\u0442\u043e\u044f\u043d\u043d\u044b\u0439 \u043d\u0430\u0431\u043e\u0440', en: 'Rolling intake', kk: '\u0422\u04b1\u0440\u0430\u049b\u0442\u044b \u049b\u0430\u0431\u044b\u043b\u0434\u0430\u0443', uz: 'Doimiy qabul', ar: 'قبول مستمر', de: 'Laufende Aufnahme', es: 'Convocatoria continua', tr: 'Sürekli kayıt' }),
  registrationOpen: lt({ ru: '\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f \u043e\u0442\u043a\u0440\u044b\u0442\u0430', en: 'Registration open', kk: '\u0422\u0456\u0440\u043a\u0435\u0443 \u0430\u0448\u044b\u049b', uz: 'Royxatdan otish ochiq', ar: 'التسجيل مفتوح', de: 'Anmeldung offen', es: 'Inscripción abierta', tr: 'Kayıt açık' }),
  registrationClosed: lt({ ru: '\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f \u0437\u0430\u043a\u0440\u044b\u0442\u0430', en: 'Registration closed', kk: '\u0422\u0456\u0440\u043a\u0435\u0443 \u0436\u0430\u0431\u044b\u049b', uz: 'Royxatdan otish yopiq', ar: 'التسجيل مغلق', de: 'Anmeldung geschlossen', es: 'Inscripción cerrada', tr: 'Kayıt kapalı' }),
  apply: lt({ ru: '\u041f\u043e\u0434\u0430\u0442\u044c \u0437\u0430\u044f\u0432\u043a\u0443', en: 'Apply', kk: '\u04e8\u0442\u0456\u043d\u0456\u043c \u0431\u0435\u0440\u0443', uz: 'Ariza berish', ar: 'تقديم', de: 'Bewerben', es: 'Postular', tr: 'Başvur' }),
  externalApply: lt({ ru: '\u041f\u0435\u0440\u0435\u0439\u0442\u0438 \u043d\u0430 \u0441\u0430\u0439\u0442', en: 'Open website', kk: '\u0421\u0430\u0439\u0442\u049b\u0430 \u04e9\u0442\u0443', uz: 'Saytga otish', ar: 'افتح الموقع', de: 'Website öffnen', es: 'Abrir sitio', tr: 'Siteyi aç' }),
  noResults: lt({ ru: '\u041d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e', en: 'No results', kk: '\u0415\u0448\u0442\u0435\u04a3\u0435 \u0442\u0430\u0431\u044b\u043b\u043c\u0430\u0434\u044b', uz: 'Natija topilmadi', ar: 'لا توجد نتائج', de: 'Keine Ergebnisse', es: 'Sin resultados', tr: 'Sonuç yok' }),
  clearFilters: lt({ ru: '\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u0444\u0438\u043b\u044c\u0442\u0440\u044b', en: 'Clear filters', kk: '\u0421\u04af\u0437\u0433\u0456\u043b\u0435\u0440\u0434\u0456 \u0442\u0430\u0437\u0430\u043b\u0430\u0443', uz: 'Filtrlarni tozalash', ar: 'مسح الفلاتر', de: 'Filter löschen', es: 'Limpiar filtros', tr: 'Filtreleri temizle' }),
  recommendationsTitle: lt({ ru: '\u041f\u0435\u0440\u0441\u043e\u043d\u0430\u043b\u044c\u043d\u044b\u0439 \u043f\u043e\u0434\u0431\u043e\u0440', en: 'Personal matching', kk: '\u0416\u0435\u043a\u0435 \u0442\u0430\u04a3\u0434\u0430\u0443', uz: 'Shaxsiy tanlov', ar: 'ترشيح شخصي', de: 'Persönliche Empfehlung', es: 'Selección personal', tr: 'Kişisel eşleştirme' }),
  recommendationsDescription: lt({ ru: '\u041f\u043e\u0434\u0431\u043e\u0440 \u0443\u0447\u0438\u0442\u044b\u0432\u0430\u0435\u0442 \u0432\u043e\u0437\u0440\u0430\u0441\u0442, \u043a\u043b\u0430\u0441\u0441, \u0444\u043e\u0440\u043c\u0430\u0442 \u0443\u0447\u0430\u0441\u0442\u0438\u044f, \u0438\u043d\u0442\u0435\u0440\u0435\u0441\u044b \u0438 \u0442\u043e, \u0433\u0434\u0435 \u0432\u044b \u0443\u0436\u0435 \u043f\u0440\u043e\u0431\u043e\u0432\u0430\u043b\u0438 \u0441\u0435\u0431\u044f: \u043a\u0435\u0439\u0441\u044b, \u0438\u0441\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u043d\u0438\u044f, \u043a\u043e\u043c\u0430\u043d\u0434\u043d\u044b\u0435 \u043f\u0440\u043e\u0435\u043a\u0442\u044b \u0438 \u0441\u043c\u0435\u0436\u043d\u044b\u0435 \u043d\u0430\u0432\u044b\u043a\u0438.', en: 'Matching uses your age, grade, preferred format, interests, and what you have already tried: cases, research, team projects, and related skills.', kk: 'Matching uses your age, grade, preferred format, interests, and what you have already tried.', uz: 'Matching uses your age, grade, preferred format, interests, and what you have already tried.', ar: 'Matching uses your age, grade, preferred format, interests, and what you have already tried.', de: 'Matching uses your age, grade, preferred format, interests, and what you have already tried.', es: 'Matching uses your age, grade, preferred format, interests, and what you have already tried.', tr: 'Matching uses your age, grade, preferred format, interests, and what you have already tried.' }),
  favoritesTitle: lt({ ru: '\u0418\u0437\u0431\u0440\u0430\u043d\u043d\u044b\u0435 \u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u0438', en: 'Favorite opportunities', kk: '\u0422\u0430\u04a3\u0434\u0430\u0443\u043b\u044b \u043c\u04af\u043c\u043a\u0456\u043d\u0434\u0456\u043a\u0442\u0435\u0440', uz: 'Sevimli imkoniyatlar', ar: 'الفرص المفضلة', de: 'Favorisierte Chancen', es: 'Oportunidades favoritas', tr: 'Favori fırsatlar' }),
  compareTitle: lt({ ru: '\u0421\u0440\u0430\u0432\u043d\u0435\u043d\u0438\u0435 \u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u0435\u0439', en: 'Opportunity comparison', kk: '\u041c\u04af\u043c\u043a\u0456\u043d\u0434\u0456\u043a\u0442\u0435\u0440\u0434\u0456 \u0441\u0430\u043b\u044b\u0441\u0442\u044b\u0440\u0443', uz: 'Imkoniyatlarni solishtirish', ar: 'مقارنة الفرص', de: 'Chancenvergleich', es: 'Comparación de oportunidades', tr: 'Fırsat karşılaştırması' }),
  submitTitle: lt({ ru: '\u041f\u0440\u0435\u0434\u043b\u043e\u0436\u0438\u0442\u044c \u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u044c', en: 'Submit an opportunity', kk: '\u041c\u04af\u043c\u043a\u0456\u043d\u0434\u0456\u043a \u04b1\u0441\u044b\u043d\u0443', uz: 'Imkoniyat taklif qilish', ar: 'اقترح فرصة', de: 'Chance einreichen', es: 'Proponer oportunidad', tr: 'Fırsat öner' }),
  profileTitle: lt({ ru: '\u041c\u043e\u0438 \u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u0438', en: 'My opportunities', kk: '\u041c\u0435\u043d\u0456\u04a3 \u043c\u04af\u043c\u043a\u0456\u043d\u0434\u0456\u043a\u0442\u0435\u0440\u0456\u043c', uz: 'Mening imkoniyatlarim', ar: 'فرصي', de: 'Meine Chancen', es: 'Mis oportunidades', tr: 'Fırsatlarım' }),
  tracker: lt({ ru: '\u0422\u0440\u0435\u043a\u0435\u0440 \u0437\u0430\u044f\u0432\u043e\u043a', en: 'Application tracker', kk: '\u04e8\u0442\u0456\u043d\u0456\u043c \u0442\u0440\u0435\u043a\u0435\u0440\u0456', uz: 'Ariza trekeri', ar: 'متتبع الطلبات', de: 'Bewerbungsstatus', es: 'Seguimiento', tr: 'Başvuru takibi' }),
  portfolio: lt({ ru: '\u041f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e', en: 'Portfolio', kk: '\u041f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e', uz: 'Portfolio', ar: 'الملف الشخصي', de: 'Portfolio', es: 'Portafolio', tr: 'Portfolyo' }),
  addResult: lt({ ru: '\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442', en: 'Add result', kk: '\u041d\u04d9\u0442\u0438\u0436\u0435 \u049b\u043e\u0441\u0443', uz: 'Natija qoshish', ar: 'إضافة نتيجة', de: 'Ergebnis hinzufügen', es: 'Añadir resultado', tr: 'Sonuç ekle' }),
  findTeam: lt({ ru: '\u041d\u0430\u0439\u0442\u0438 \u043a\u043e\u043c\u0430\u043d\u0434\u0443', en: 'Find a team', kk: '\u041a\u043e\u043c\u0430\u043d\u0434\u0430 \u0442\u0430\u0431\u0443', uz: 'Jamoa topish', ar: 'ابحث عن فريق', de: 'Team finden', es: 'Encontrar equipo', tr: 'Takım bul' }),
  saved: lt({ ru: '\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043e', en: 'Saved', kk: '\u0421\u0430\u049b\u0442\u0430\u043b\u0434\u044b', uz: 'Saqlandi', ar: 'تم الحفظ', de: 'Gespeichert', es: 'Guardado', tr: 'Kaydedildi' }),
  applicationSaved: lt({ ru: '\u0417\u0430\u044f\u0432\u043a\u0430 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0430 \u0432 \u0442\u0440\u0435\u043a\u0435\u0440\u0435', en: 'Application saved to tracker', kk: '\u04e8\u0442\u0456\u043d\u0456\u043c \u0442\u0440\u0435\u043a\u0435\u0440\u0433\u0435 \u0441\u0430\u049b\u0442\u0430\u043b\u0434\u044b', uz: 'Ariza trekerga saqlandi', ar: 'تم حفظ الطلب', de: 'Bewerbung gespeichert', es: 'Solicitud guardada', tr: 'Başvuru kaydedildi' }),
  proposalSaved: lt({ ru: '\u041f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u0435 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u043e \u043d\u0430 \u043c\u043e\u0434\u0435\u0440\u0430\u0446\u0438\u044e', en: 'Proposal sent to moderation', kk: '\u04b0\u0441\u044b\u043d\u044b\u0441 \u043c\u043e\u0434\u0435\u0440\u0430\u0446\u0438\u044f\u0493\u0430 \u0436\u0456\u0431\u0435\u0440\u0456\u043b\u0434\u0456', uz: 'Taklif moderatsiyaga yuborildi', ar: 'تم إرسال الاقتراح للمراجعة', de: 'Vorschlag zur Prüfung gesendet', es: 'Propuesta enviada a moderación', tr: 'Öneri moderasyona gönderildi' }),
  all: lt({ ru: '\u0412\u0441\u0435', en: 'All', kk: '\u0411\u0430\u0440\u043b\u044b\u0493\u044b', uz: 'Hammasi', ar: '\u0627\u0644\u0643\u0644', de: 'Alle', es: 'Todo', tr: 'Tumu' }),
  any: lt({ ru: '\u041b\u044e\u0431\u043e\u0439', en: 'Any', kk: '\u041a\u0435\u0437 \u043a\u0435\u043b\u0433\u0435\u043d', uz: 'Istalgan', ar: '\u0623\u064a', de: 'Beliebig', es: 'Cualquiera', tr: 'Herhangi' }),
  formatLabel: lt({ ru: '\u0424\u043e\u0440\u043c\u0430\u0442', en: 'Format', kk: '\u0424\u043e\u0440\u043c\u0430\u0442', uz: 'Format', ar: '\u0627\u0644\u0635\u064a\u063a\u0629', de: 'Format', es: 'Formato', tr: 'Format' }),
  sourceLabel: lt({ ru: '\u0418\u0441\u0442\u043e\u0447\u043d\u0438\u043a', en: 'Source', kk: '\u0414\u0435\u0440\u0435\u043a\u043a\u04e9\u0437', uz: 'Manba', ar: '\u0627\u0644\u0645\u0635\u062f\u0631', de: 'Quelle', es: 'Fuente', tr: 'Kaynak' }),
  costLabel: lt({ ru: '\u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c', en: 'Cost', kk: '\u049a\u04b1\u043d\u044b', uz: 'Narx', ar: '\u0627\u0644\u062a\u0643\u0644\u0641\u0629', de: 'Kosten', es: 'Costo', tr: 'Ucret' }),
  countryLabel: lt({ ru: '\u0421\u0442\u0440\u0430\u043d\u0430', en: 'Country', kk: '\u0415\u043b', uz: 'Mamlakat', ar: '\u0627\u0644\u0628\u0644\u062f', de: 'Land', es: 'Pais', tr: 'Ulke' }),
  ageLabel: lt({ ru: '\u0412\u043e\u0437\u0440\u0430\u0441\u0442', en: 'Age', kk: '\u0416\u0430\u0441', uz: 'Yosh', ar: '\u0627\u0644\u0639\u0645\u0631', de: 'Alter', es: 'Edad', tr: 'Yas' }),
  gradeLabel: lt({ ru: '\u041a\u043b\u0430\u0441\u0441', en: 'Grade', kk: '\u0421\u044b\u043d\u044b\u043f', uz: 'Sinf', ar: '\u0627\u0644\u0635\u0641', de: 'Klasse', es: 'Grado', tr: 'Sinif' }),
  onlineOnly: lt({ ru: '\u0422\u043e\u043b\u044c\u043a\u043e \u043e\u043d\u043b\u0430\u0439\u043d', en: 'Online only', kk: '\u0422\u0435\u043a \u043e\u043d\u043b\u0430\u0439\u043d', uz: 'Faqat onlayn', ar: '\u0639\u0628\u0631 \u0627\u0644\u0625\u0646\u062a\u0631\u0646\u062a \u0641\u0642\u0637', de: 'Nur online', es: 'Solo online', tr: 'Sadece online' }),
  beginner: lt({ ru: '\u0414\u043b\u044f \u043d\u043e\u0432\u0438\u0447\u043a\u043e\u0432', en: 'Beginner', kk: '\u0416\u0430\u04a3\u0430 \u0431\u0430\u0441\u0442\u0430\u0493\u0430\u043d', uz: 'Boshlovchi', ar: '\u0644\u0644\u0645\u0628\u062a\u062f\u0626\u064a\u0646', de: 'Einsteiger', es: 'Principiante', tr: 'Baslangic' }),
  portfolioValue: lt({ ru: '\u0426\u0435\u043d\u043d\u043e \u0434\u043b\u044f \u043f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e', en: 'Portfolio value', kk: '\u041f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e\u0493\u0430 \u049b\u04b1\u043d\u0434\u044b', uz: 'Portfolio uchun foydali', ar: '\u0642\u064a\u0645\u0629 \u0644\u0644\u0645\u0644\u0641', de: 'Portfolio-Wert', es: 'Valor para portafolio', tr: 'Portfolyo degeri' }),
  matchScore: lt({ ru: '\u0421\u043e\u0432\u043f\u0430\u0434\u0435\u043d\u0438\u0435', en: 'Match score', kk: '\u0421\u04d9\u0439\u043a\u0435\u0441\u0442\u0456\u043a', uz: 'Moslik', ar: '\u062f\u0631\u062c\u0629 \u0627\u0644\u062a\u0637\u0627\u0628\u0642', de: 'Match-Wert', es: 'Coincidencia', tr: 'Uyum puani' }),
  newest: lt({ ru: '\u041d\u043e\u0432\u044b\u0435', en: 'Newest', kk: '\u0416\u0430\u04a3\u0430', uz: 'Yangi', ar: '\u0627\u0644\u0623\u062d\u062f\u062b', de: 'Neueste', es: 'Nuevas', tr: 'Yeni' }),
  popular: lt({ ru: '\u041f\u043e\u043f\u0443\u043b\u044f\u0440\u043d\u044b\u0435', en: 'Popular', kk: '\u0422\u0430\u043d\u044b\u043c\u0430\u043b', uz: 'Mashhur', ar: '\u0627\u0644\u0623\u0634\u0647\u0631', de: 'Beliebt', es: 'Populares', tr: 'Populer' }),
  languagesLabel: lt({ ru: '\u042f\u0437\u044b\u043a\u0438', en: 'Languages', kk: '\u0422\u0456\u043b\u0434\u0435\u0440', uz: 'Tillar', ar: '\u0627\u0644\u0644\u063a\u0627\u062a', de: 'Sprachen', es: 'Idiomas', tr: 'Diller' }),
  requirementsLabel: lt({ ru: '\u0422\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u044f', en: 'Requirements', kk: '\u0422\u0430\u043b\u0430\u043f\u0442\u0430\u0440', uz: 'Talablar', ar: '\u0627\u0644\u0645\u062a\u0637\u0644\u0628\u0627\u062a', de: 'Anforderungen', es: 'Requisitos', tr: 'Gereksinimler' }),
  motivationLabel: lt({ ru: '\u041c\u043e\u0442\u0438\u0432\u0430\u0446\u0438\u044f', en: 'Motivation', kk: '\u041c\u043e\u0442\u0438\u0432\u0430\u0446\u0438\u044f', uz: 'Motivatsiya', ar: '\u0627\u0644\u062f\u0627\u0641\u0639', de: 'Motivation', es: 'Motivacion', tr: 'Motivasyon' }),
  teamLabel: lt({ ru: '\u041a\u043e\u043c\u0430\u043d\u0434\u0430', en: 'Team', kk: '\u041a\u043e\u043c\u0430\u043d\u0434\u0430', uz: 'Jamoa', ar: '\u0627\u0644\u0641\u0631\u064a\u0642', de: 'Team', es: 'Equipo', tr: 'Takim' }),
  interestsLabel: lt({ ru: '\u0418\u043d\u0442\u0435\u0440\u0435\u0441\u044b', en: 'Interests', kk: '\u049a\u044b\u0437\u044b\u0493\u0443\u0448\u044b\u043b\u044b\u049b\u0442\u0430\u0440', uz: 'Qiziqishlar', ar: '\u0627\u0644\u0627\u0647\u062a\u0645\u0627\u0645\u0627\u062a', de: 'Interessen', es: 'Intereses', tr: 'Ilgi alanlari' }),
  titleLabel: lt({ ru: '\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435', en: 'Title', kk: '\u0410\u0442\u0430\u0443\u044b', uz: 'Nomi', ar: '\u0627\u0644\u0639\u0646\u0648\u0627\u0646', de: 'Titel', es: 'Titulo', tr: 'Baslik' }),
  organizerLabel: lt({ ru: '\u041e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0442\u043e\u0440', en: 'Organizer', kk: '\u04b0\u0439\u044b\u043c\u0434\u0430\u0441\u0442\u044b\u0440\u0443\u0448\u044b', uz: 'Tashkilotchi', ar: '\u0627\u0644\u0645\u0646\u0638\u0645', de: 'Organisator', es: 'Organizador', tr: 'Duzenleyen' }),
  linkLabel: lt({ ru: '\u0421\u0441\u044b\u043b\u043a\u0430', en: 'Link', kk: '\u0421\u0456\u043b\u0442\u0435\u043c\u0435', uz: 'Havola', ar: '\u0627\u0644\u0631\u0627\u0628\u0637', de: 'Link', es: 'Enlace', tr: 'Baglanti' }),
  noteLabel: lt({ ru: '\u041a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0439', en: 'Note', kk: '\u0415\u0441\u043a\u0435\u0440\u0442\u043f\u0435', uz: 'Izoh', ar: '\u0645\u0644\u0627\u062d\u0638\u0629', de: 'Notiz', es: 'Nota', tr: 'Not' }),
  days7: lt({ ru: '7 \u0434\u043d\u0435\u0439', en: '7 days', kk: '7 \u043a\u04af\u043d', uz: '7 kun', ar: '7 \u0623\u064a\u0627\u0645', de: '7 Tage', es: '7 dias', tr: '7 gun' }),
  days14: lt({ ru: '14 \u0434\u043d\u0435\u0439', en: '14 days', kk: '14 \u043a\u04af\u043d', uz: '14 kun', ar: '14 \u064a\u0648\u0645\u0627', de: '14 Tage', es: '14 dias', tr: '14 gun' }),
  days30: lt({ ru: '30 \u0434\u043d\u0435\u0439', en: '30 days', kk: '30 \u043a\u04af\u043d', uz: '30 kun', ar: '30 \u064a\u0648\u0645\u0627', de: '30 Tage', es: '30 dias', tr: '30 gun' }),
};

const CATEGORIES: Array<{ id: CategoryId; label: LText; icon: React.ReactNode }> = [
  { id: 'championships', label: lt({ ru: '\u0427\u0435\u043c\u043f\u0438\u043e\u043d\u0430\u0442\u044b', en: 'Championships', kk: '\u0427\u0435\u043c\u043f\u0438\u043e\u043d\u0430\u0442\u0442\u0430\u0440', uz: 'Chempionatlar', ar: 'بطولات', de: 'Meisterschaften', es: 'Campeonatos', tr: 'Şampiyonalar' }), icon: <Trophy className="h-4 w-4" /> },
  { id: 'olympiads', label: lt({ ru: '\u041e\u043b\u0438\u043c\u043f\u0438\u0430\u0434\u044b', en: 'Olympiads', kk: '\u041e\u043b\u0438\u043c\u043f\u0438\u0430\u0434\u0430\u043b\u0430\u0440', uz: 'Olimpiadalar', ar: 'أولمبيادات', de: 'Olympiaden', es: 'Olimpiadas', tr: 'Olimpiyatlar' }), icon: <Medal className="h-4 w-4" /> },
  { id: 'contests', label: lt({ ru: '\u041a\u043e\u043d\u043a\u0443\u0440\u0441\u044b', en: 'Contests', kk: '\u0411\u0430\u0439\u049b\u0430\u0443\u043b\u0430\u0440', uz: 'Tanlovlar', ar: 'مسابقات', de: 'Wettbewerbe', es: 'Concursos', tr: 'Yarışmalar' }), icon: <Award className="h-4 w-4" /> },
  { id: 'internships', label: lt({ ru: '\u0421\u0442\u0430\u0436\u0438\u0440\u043e\u0432\u043a\u0438', en: 'Internships', kk: '\u0422\u0430\u0493\u044b\u043b\u044b\u043c\u0434\u0430\u043c\u0430\u043b\u0430\u0440', uz: 'Amaliyotlar', ar: 'تدريبات', de: 'Praktika', es: 'Prácticas', tr: 'Stajlar' }), icon: <BriefcaseBusiness className="h-4 w-4" /> },
  { id: 'projects', label: lt({ ru: '\u041f\u0440\u043e\u0435\u043a\u0442\u043d\u044b\u0435 \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u044b', en: 'Project programs', kk: '\u0416\u043e\u0431\u0430\u043b\u044b\u049b \u0431\u0430\u0493\u0434\u0430\u0440\u043b\u0430\u043c\u0430\u043b\u0430\u0440', uz: 'Loyiha dasturlari', ar: 'برامج مشاريع', de: 'Projektprogramme', es: 'Programas de proyecto', tr: 'Proje programları' }), icon: <Target className="h-4 w-4" /> },
  { id: 'research', label: lt({ ru: '\u0418\u0441\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u043d\u0438\u044f', en: 'Research', kk: '\u0417\u0435\u0440\u0442\u0442\u0435\u0443\u043b\u0435\u0440', uz: 'Tadqiqotlar', ar: 'بحث', de: 'Forschung', es: 'Investigación', tr: 'Araştırma' }), icon: <BookOpen className="h-4 w-4" /> },
  { id: 'volunteering', label: lt({ ru: '\u0412\u043e\u043b\u043e\u043d\u0442\u0451\u0440\u0441\u0442\u0432\u043e', en: 'Volunteering', kk: '\u0415\u0440\u0456\u043a\u0442\u0456\u043b\u0456\u043a', uz: 'Volontyorlik', ar: 'تطوع', de: 'Ehrenamt', es: 'Voluntariado', tr: 'Gönüllülük' }), icon: <Users className="h-4 w-4" /> },
  { id: 'grants', label: lt({ ru: '\u0413\u0440\u0430\u043d\u0442\u044b', en: 'Grants', kk: '\u0413\u0440\u0430\u043d\u0442\u0442\u0430\u0440', uz: 'Grantlar', ar: 'منح', de: 'Förderungen', es: 'Subvenciones', tr: 'Hibeler' }), icon: <CircleDollarSign className="h-4 w-4" /> },
  { id: 'scholarships', label: lt({ ru: '\u0421\u0442\u0438\u043f\u0435\u043d\u0434\u0438\u0438', en: 'Scholarships', kk: '\u0421\u0442\u0438\u043f\u0435\u043d\u0434\u0438\u044f\u043b\u0430\u0440', uz: 'Stipendiyalar', ar: 'منح دراسية', de: 'Stipendien', es: 'Becas', tr: 'Burslar' }), icon: <GraduationCap className="h-4 w-4" /> },
  { id: 'hackathons', label: lt({ ru: '\u0425\u0430\u043a\u0430\u0442\u043e\u043d\u044b', en: 'Hackathons', kk: '\u0425\u0430\u043a\u0430\u0442\u043e\u043d\u0434\u0430\u0440', uz: 'Xakatonlar', ar: 'هاكاثونات', de: 'Hackathons', es: 'Hackatones', tr: 'Hackathonlar' }), icon: <Code2 className="h-4 w-4" /> },
  { id: 'exchanges', label: lt({ ru: '\u041c\u0435\u0436\u0434\u0443\u043d\u0430\u0440\u043e\u0434\u043d\u044b\u0435 \u043e\u0431\u043c\u0435\u043d\u044b', en: 'Exchanges', kk: '\u0425\u0430\u043b\u044b\u049b\u0430\u0440\u0430\u043b\u044b\u049b \u0430\u043b\u043c\u0430\u0441\u0443', uz: 'Xalqaro almashinuv', ar: 'تبادل دولي', de: 'Austausch', es: 'Intercambios', tr: 'Değişim programları' }), icon: <Landmark className="h-4 w-4" /> },
  { id: 'summer', label: lt({ ru: '\u041b\u0435\u0442\u043d\u0438\u0435 \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u044b', en: 'Summer programs', kk: '\u0416\u0430\u0437\u0493\u044b \u0431\u0430\u0493\u0434\u0430\u0440\u043b\u0430\u043c\u0430\u043b\u0430\u0440', uz: 'Yozgi dasturlar', ar: 'برامج صيفية', de: 'Sommerprogramme', es: 'Programas de verano', tr: 'Yaz programları' }), icon: <Sparkles className="h-4 w-4" /> },
  { id: 'online', label: lt({ ru: '\u041e\u043d\u043b\u0430\u0439\u043d-\u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u044b', en: 'Online programs', kk: '\u041e\u043d\u043b\u0430\u0439\u043d \u0431\u0430\u0493\u0434\u0430\u0440\u043b\u0430\u043c\u0430\u043b\u0430\u0440', uz: 'Onlayn dasturlar', ar: 'برامج عبر الإنترنت', de: 'Onlineprogramme', es: 'Programas online', tr: 'Çevrim içi programlar' }), icon: <Compass className="h-4 w-4" /> },
];

const DIRECTIONS: Record<DirectionId, LText> = {
  business: lt({ ru: '\u0411\u0438\u0437\u043d\u0435\u0441 \u0438 \u043f\u0440\u0435\u0434\u043f\u0440\u0438\u043d\u0438\u043c\u0430\u0442\u0435\u043b\u044c\u0441\u0442\u0432\u043e', en: 'Business', kk: '\u0411\u0438\u0437\u043d\u0435\u0441', uz: 'Biznes', ar: 'الأعمال', de: 'Business', es: 'Negocios', tr: 'İş dünyası' }),
  science: lt({ ru: '\u041d\u0430\u0443\u043a\u0430 \u0438 \u0438\u0441\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u043d\u0438\u044f', en: 'Science', kk: '\u0492\u044b\u043b\u044b\u043c', uz: 'Fan', ar: 'العلوم', de: 'Wissenschaft', es: 'Ciencia', tr: 'Bilim' }),
  tech: lt({ ru: '\u0422\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0438\u0438', en: 'Technology', kk: '\u0422\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0438\u044f', uz: 'Texnologiya', ar: 'التقنية', de: 'Technologie', es: 'Tecnología', tr: 'Teknoloji' }),
  social: lt({ ru: '\u0421\u043e\u0446\u0438\u0430\u043b\u044c\u043d\u044b\u0435 \u043f\u0440\u043e\u0435\u043a\u0442\u044b', en: 'Social impact', kk: '\u04d8\u043b\u0435\u0443\u043c\u0435\u0442\u0442\u0456\u043a \u0436\u043e\u0431\u0430\u043b\u0430\u0440', uz: 'Ijtimoiy loyihalar', ar: 'الأثر الاجتماعي', de: 'Soziale Wirkung', es: 'Impacto social', tr: 'Sosyal etki' }),
  creative: lt({ ru: '\u041a\u0440\u0435\u0430\u0442\u0438\u0432\u043d\u044b\u0435 \u0438\u043d\u0434\u0443\u0441\u0442\u0440\u0438\u0438', en: 'Creative industries', kk: '\u041a\u0440\u0435\u0430\u0442\u0438\u0432 \u0438\u043d\u0434\u0443\u0441\u0442\u0440\u0438\u044f\u043b\u0430\u0440', uz: 'Kreativ sohalar', ar: 'الصناعات الإبداعية', de: 'Kreativwirtschaft', es: 'Industrias creativas', tr: 'Yaratıcı endüstriler' }),
  leadership: lt({ ru: '\u041b\u0438\u0434\u0435\u0440\u0441\u0442\u0432\u043e', en: 'Leadership', kk: '\u041a\u04e9\u0448\u0431\u0430\u0441\u0448\u044b\u043b\u044b\u049b', uz: 'Yetakchilik', ar: 'القيادة', de: 'Leadership', es: 'Liderazgo', tr: 'Liderlik' }),
};

const FORMATS: Record<FormatId, LText> = {
  online: lt({ ru: '\u041e\u043d\u043b\u0430\u0439\u043d', en: 'Online', kk: '\u041e\u043d\u043b\u0430\u0439\u043d', uz: 'Onlayn', ar: 'عن بعد', de: 'Online', es: 'Online', tr: 'Çevrim içi' }),
  offline: lt({ ru: '\u041e\u0447\u043d\u043e', en: 'In person', kk: '\u041e\u0444\u043b\u0430\u0439\u043d', uz: 'Oflayn', ar: 'حضوري', de: 'Vor Ort', es: 'Presencial', tr: 'Yüz yüze' }),
  hybrid: lt({ ru: '\u0413\u0438\u0431\u0440\u0438\u0434', en: 'Hybrid', kk: '\u0413\u0438\u0431\u0440\u0438\u0434', uz: 'Gibrid', ar: 'هجين', de: 'Hybrid', es: 'Híbrido', tr: 'Hibrit' }),
};

const COSTS: Record<CostId, LText> = {
  free: lt({ ru: '\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e', en: 'Free', kk: '\u0422\u0435\u0433\u0456\u043d', uz: 'Bepul', ar: 'مجاني', de: 'Kostenlos', es: 'Gratis', tr: 'Ücretsiz' }),
  paid: lt({ ru: '\u041f\u043b\u0430\u0442\u043d\u043e', en: 'Paid', kk: '\u0410\u049b\u044b\u043b\u044b', uz: 'Pullik', ar: 'مدفوع', de: 'Kostenpflichtig', es: 'De pago', tr: 'Ücretli' }),
  scholarship: lt({ ru: '\u0415\u0441\u0442\u044c \u0441\u0442\u0438\u043f\u0435\u043d\u0434\u0438\u044f', en: 'Scholarship available', kk: '\u0421\u0442\u0438\u043f\u0435\u043d\u0434\u0438\u044f \u0431\u0430\u0440', uz: 'Stipendiya bor', ar: 'توجد منحة', de: 'Stipendium verfügbar', es: 'Beca disponible', tr: 'Burs var' }),
};

const PARTICIPATION: Record<ParticipationId, LText> = {
  individual: lt({ ru: '\u0418\u043d\u0434\u0438\u0432\u0438\u0434\u0443\u0430\u043b\u044c\u043d\u043e', en: 'Individual', kk: '\u0416\u0435\u043a\u0435', uz: 'Yakka', ar: 'فردي', de: 'Einzeln', es: 'Individual', tr: 'Bireysel' }),
  team: lt({ ru: '\u041a\u043e\u043c\u0430\u043d\u0434\u0430', en: 'Team', kk: '\u041a\u043e\u043c\u0430\u043d\u0434\u0430', uz: 'Jamoa', ar: 'فريق', de: 'Team', es: 'Equipo', tr: 'Takım' }),
  both: lt({ ru: '\u0418\u043d\u0434\u0438\u0432\u0438\u0434\u0443\u0430\u043b\u044c\u043d\u043e \u0438\u043b\u0438 \u043a\u043e\u043c\u0430\u043d\u0434\u0430', en: 'Individual or team', kk: '\u0416\u0435\u043a\u0435 \u043d\u0435\u043c\u0435\u0441\u0435 \u043a\u043e\u043c\u0430\u043d\u0434\u0430', uz: 'Yakka yoki jamoa', ar: 'فردي أو فريق', de: 'Einzeln oder Team', es: 'Individual o equipo', tr: 'Bireysel veya takım' }),
};

const skill = (ru: string, en: string, kk: string, uz: string, ar: string, de: string, es: string, tr: string) => lt({ ru, en, kk, uz, ar, de, es, tr });

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: 'op-001',
    slug: 'navykus-global-case-cup',
    source: 'navykus',
    category: 'championships',
    direction: 'business',
    format: 'online',
    participation: 'team',
    cost: 'free',
    title: lt({ ru: 'Navykus Global Case Cup: Sustainable Cities', en: 'Navykus Global Case Cup: Sustainable Cities', kk: 'Navykus Global Case Cup: Sustainable Cities', uz: 'Navykus Global Case Cup: Sustainable Cities', ar: 'كأس Navykus للحالات: المدن المستدامة', de: 'Navykus Global Case Cup: Nachhaltige Städte', es: 'Navykus Global Case Cup: Ciudades sostenibles', tr: 'Navykus Global Case Cup: Sürdürülebilir Şehirler' }),
    organizer: lt({ ru: '\u041d\u0430\u0432\u044b\u043a\u0443\u0441', en: 'Navykus', kk: 'Navykus', uz: 'Navykus', ar: 'Navykus', de: 'Navykus', es: 'Navykus', tr: 'Navykus' }),
    summary: lt({ ru: '\u041a\u043e\u043c\u0430\u043d\u0434\u043d\u044b\u0439 \u043e\u043d\u043b\u0430\u0439\u043d-\u0447\u0435\u043c\u043f\u0438\u043e\u043d\u0430\u0442 \u043f\u043e \u0440\u0435\u0448\u0435\u043d\u0438\u044e \u0433\u043e\u0440\u043e\u0434\u0441\u043a\u043e\u0433\u043e \u043a\u0435\u0439\u0441\u0430 \u0441 \u044d\u043a\u0441\u043f\u0435\u0440\u0442\u0430\u043c\u0438 \u0438 \u0444\u0438\u043d\u0430\u043b\u044c\u043d\u043e\u0439 \u0437\u0430\u0449\u0438\u0442\u043e\u0439.', en: 'A team online championship for solving an urban case with experts and a final pitch.', kk: '\u049a\u0430\u043b\u0430\u043b\u044b\u049b \u043a\u0435\u0439\u0441\u0442\u0456 \u0441\u0430\u0440\u0430\u043f\u0448\u044b\u043b\u0430\u0440\u043c\u0435\u043d \u0448\u0435\u0448\u0443\u0433\u0435 \u0430\u0440\u043d\u0430\u043b\u0493\u0430\u043d \u043a\u043e\u043c\u0430\u043d\u0434\u0430\u043b\u044b\u049b \u043e\u043d\u043b\u0430\u0439\u043d \u0447\u0435\u043c\u043f\u0438\u043e\u043d\u0430\u0442.', uz: 'Shahar muammosini ekspertlar bilan hal qilishga qaratilgan onlayn jamoaviy chempionat.', ar: 'بطولة جماعية عبر الإنترنت لحل تحد حضري مع خبراء وعرض نهائي.', de: 'Online-Teamwettbewerb zur Lösung eines urbanen Cases mit Experten und Finale.', es: 'Campeonato online por equipos para resolver un caso urbano con expertos y presentación final.', tr: 'Uzmanlarla kentsel bir vakayı çözmeye yönelik çevrim içi takım şampiyonası.' }),
    description: lt({ ru: '\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u0438 \u0438\u0441\u0441\u043b\u0435\u0434\u0443\u044e\u0442 \u043f\u0440\u043e\u0431\u043b\u0435\u043c\u0443 \u0443\u0441\u0442\u043e\u0439\u0447\u0438\u0432\u043e\u0433\u043e \u0433\u043e\u0440\u043e\u0434\u0430, \u0441\u043e\u0431\u0438\u0440\u0430\u044e\u0442 \u043a\u043e\u043c\u0430\u043d\u0434\u0443, \u0441\u0442\u0440\u043e\u044f\u0442 \u0440\u0435\u0448\u0435\u043d\u0438\u0435 \u0438 \u0437\u0430\u0449\u0438\u0449\u0430\u044e\u0442 \u043f\u0440\u043e\u0435\u043a\u0442 \u043f\u0435\u0440\u0435\u0434 \u043c\u0435\u0436\u0434\u0443\u043d\u0430\u0440\u043e\u0434\u043d\u044b\u043c \u0436\u044e\u0440\u0438.', en: 'Participants research a sustainable city challenge, form a team, build a solution and present it to an international jury.', kk: '\u049a\u0430\u0442\u044b\u0441\u0443\u0448\u044b\u043b\u0430\u0440 \u0442\u04b1\u0440\u0430\u049b\u0442\u044b \u049b\u0430\u043b\u0430 \u043c\u04d9\u0441\u0435\u043b\u0435\u0441\u0456\u043d \u0437\u0435\u0440\u0442\u0442\u0435\u043f, \u043a\u043e\u043c\u0430\u043d\u0434\u0430 \u049b\u04b1\u0440\u044b\u043f, \u0448\u0435\u0448\u0456\u043c\u0434\u0456 \u0445\u0430\u043b\u044b\u049b\u0430\u0440\u0430\u043b\u044b\u049b \u049b\u0430\u0437\u044b\u043b\u0430\u0440\u0493\u0430 \u04b1\u0441\u044b\u043d\u0430\u0434\u044b.', uz: 'Ishtirokchilar barqaror shahar muammosini organib, jamoa tuzadi va yechimni xalqaro hay’atga taqdim etadi.', ar: 'يبحث المشاركون تحدي المدينة المستدامة، ويكوّنون فريقاً، ويبنون حلاً ويعرضونه على لجنة دولية.', de: 'Teilnehmende erforschen eine nachhaltige Stadtfrage, bilden ein Team, entwickeln eine Lösung und pitchen vor einer internationalen Jury.', es: 'Los participantes investigan un reto de ciudad sostenible, forman equipo, crean una solución y la defienden ante un jurado internacional.', tr: 'Katılımcılar sürdürülebilir şehir sorununu araştırır, takım kurar, çözüm geliştirir ve uluslararası jüriye sunar.' }),
    country: lt({ ru: '\u041c\u0435\u0436\u0434\u0443\u043d\u0430\u0440\u043e\u0434\u043d\u043e', en: 'Global', kk: '\u0425\u0430\u043b\u044b\u049b\u0430\u0440\u0430\u043b\u044b\u049b', uz: 'Xalqaro', ar: 'عالمي', de: 'Global', es: 'Global', tr: 'Küresel' }),
    city: lt({ ru: '\u041e\u043d\u043b\u0430\u0439\u043d', en: 'Online', kk: '\u041e\u043d\u043b\u0430\u0439\u043d', uz: 'Onlayn', ar: 'عبر الإنترنت', de: 'Online', es: 'Online', tr: 'Çevrim içi' }),
    languages: ['ru', 'en'],
    skills: [skill('\u0418\u0441\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u043d\u0438\u0435', 'Research', '\u0417\u0435\u0440\u0442\u0442\u0435\u0443', 'Tadqiqot', 'بحث', 'Recherche', 'Investigación', 'Araştırma'), skill('\u041f\u0440\u0435\u0437\u0435\u043d\u0442\u0430\u0446\u0438\u044f', 'Pitching', '\u0422\u0430\u043d\u044b\u0441\u0442\u044b\u0440\u0443', 'Taqdimot', 'عرض', 'Pitching', 'Presentación', 'Sunum'), skill('\u041a\u043e\u043c\u0430\u043d\u0434\u043d\u0430\u044f \u0440\u0430\u0431\u043e\u0442\u0430', 'Teamwork', '\u041a\u043e\u043c\u0430\u043d\u0434\u0430\u043b\u044b\u049b \u0436\u04b1\u043c\u044b\u0441', 'Jamoa ishi', 'عمل جماعي', 'Teamarbeit', 'Trabajo en equipo', 'Takım çalışması')],
    keywords: ['case cup', 'sustainable cities', '\u0443\u0440\u0431\u0430\u043d\u0438\u0441\u0442\u0438\u043a\u0430', '\u043a\u043e\u043c\u0430\u043d\u0434\u0430'],
    minAge: 14,
    maxAge: 18,
    grades: [8, 9, 10, 11],
    deadline: '2026-07-24',
    startDate: '2026-08-01',
    finalDeadline: true,
    registrationOpen: true,
    seats: 96,
    savedCount: 318,
    imageUrl: '/images/championship/championship-presentation.jpg',
    editorPick: true,
    recommended: true,
    requirements: [skill('\u041a\u043e\u043c\u0430\u043d\u0434\u0430 3-5 \u0447\u0435\u043b\u043e\u0432\u0435\u043a \u0438\u043b\u0438 \u0433\u043e\u0442\u043e\u0432\u043d\u043e\u0441\u0442\u044c \u043d\u0430\u0439\u0442\u0438 \u043a\u043e\u043c\u0430\u043d\u0434\u0443', 'Team of 3-5 or readiness to find one', '3-5 \u0430\u0434\u0430\u043c\u043d\u0430\u043d \u043a\u043e\u043c\u0430\u043d\u0434\u0430 \u043d\u0435\u043c\u0435\u0441\u0435 \u043e\u043d\u044b \u0442\u0430\u0431\u0443\u0493\u0430 \u0434\u0430\u0439\u044b\u043d\u0434\u044b\u049b', '3-5 kishilik jamoa yoki jamoa topishga tayyorlik', 'فريق من 3-5 أو استعداد لإيجاد فريق', 'Team von 3-5 oder Bereitschaft zur Teamsuche', 'Equipo de 3-5 o disposición a encontrar uno', '3-5 kişilik takım veya takım bulma isteği')],
    outcomes: [skill('\u041f\u0440\u043e\u0435\u043a\u0442 \u0432 \u043f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e \u0438 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442 \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u0430', 'Portfolio project and certificate', '\u041f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e \u0436\u043e\u0431\u0430\u0441\u044b \u0436\u04d9\u043d\u0435 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442', 'Portfolio loyihasi va sertifikat', 'مشروع في الملف وشهادة', 'Portfolio-Projekt und Zertifikat', 'Proyecto de portafolio y certificado', 'Portfolyo projesi ve sertifika')],
    portfolioValue: 95,
    publishedAt: '2026-07-02',
  },
  {
    id: 'op-002',
    slug: 'youth-research-lab',
    source: 'navykus',
    category: 'research',
    direction: 'science',
    format: 'hybrid',
    participation: 'individual',
    cost: 'free',
    title: lt({ ru: 'Youth Research Lab', en: 'Youth Research Lab', kk: 'Youth Research Lab', uz: 'Youth Research Lab', ar: 'مختبر أبحاث الشباب', de: 'Youth Research Lab', es: 'Youth Research Lab', tr: 'Youth Research Lab' }),
    organizer: lt({ ru: '\u041d\u0430\u0432\u044b\u043a\u0443\u0441 \u0438 \u043c\u0435\u043d\u0442\u043e\u0440\u044b MIT', en: 'Navykus and MIT mentors', kk: 'Navykus \u0436\u04d9\u043d\u0435 MIT \u043c\u0435\u043d\u0442\u043e\u0440\u043b\u0430\u0440\u044b', uz: 'Navykus va MIT mentorlar', ar: 'Navykus وموجهو MIT', de: 'Navykus und MIT-Mentoren', es: 'Navykus y mentores de MIT', tr: 'Navykus ve MIT mentorları' }),
    summary: lt({ ru: '\u0428\u0435\u0441\u0442\u0438\u043d\u0435\u0434\u0435\u043b\u044c\u043d\u0430\u044f \u043b\u0430\u0431\u043e\u0440\u0430\u0442\u043e\u0440\u0438\u044f \u0434\u043b\u044f \u043f\u0435\u0440\u0432\u043e\u0439 \u0438\u0441\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u0442\u0435\u043b\u044c\u0441\u043a\u043e\u0439 \u0440\u0430\u0431\u043e\u0442\u044b.', en: 'A six-week lab for a first research paper.', kk: '\u0410\u043b\u0493\u0430\u0448\u049b\u044b \u0437\u0435\u0440\u0442\u0442\u0435\u0443 \u0436\u04b1\u043c\u044b\u0441\u044b\u043d\u0430 \u0430\u0440\u043d\u0430\u043b\u0493\u0430\u043d \u0430\u043b\u0442\u044b \u0430\u043f\u0442\u0430\u043b\u044b\u049b \u0437\u0435\u0440\u0442\u0445\u0430\u043d\u0430.', uz: 'Birinchi tadqiqot ishi uchun olti haftalik laboratoriya.', ar: 'مختبر لمدة ستة أسابيع لأول ورقة بحثية.', de: 'Sechswöchiges Labor für die erste Forschungsarbeit.', es: 'Laboratorio de seis semanas para el primer trabajo de investigación.', tr: 'İlk araştırma çalışması için altı haftalık laboratuvar.' }),
    description: lt({ ru: '\u041f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0430 \u043f\u043e\u043c\u043e\u0433\u0430\u0435\u0442 \u0432\u044b\u0431\u0440\u0430\u0442\u044c \u0432\u043e\u043f\u0440\u043e\u0441, \u0441\u043e\u0431\u0440\u0430\u0442\u044c \u0434\u0430\u043d\u043d\u044b\u0435, \u043e\u0444\u043e\u0440\u043c\u0438\u0442\u044c \u0432\u044b\u0432\u043e\u0434\u044b \u0438 \u043f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u0438\u0442\u044c \u043f\u043e\u0441\u0442\u0435\u0440 \u0434\u043b\u044f \u043f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e.', en: 'The program helps choose a question, collect data, write findings and prepare a portfolio poster.', kk: '\u0411\u0430\u0493\u0434\u0430\u0440\u043b\u0430\u043c\u0430 \u0441\u04b1\u0440\u0430\u049b \u0442\u0430\u04a3\u0434\u0430\u0443\u0493\u0430, \u0434\u0435\u0440\u0435\u043a \u0436\u0438\u043d\u0430\u0443\u0493\u0430 \u0436\u04d9\u043d\u0435 \u043f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e \u043f\u043e\u0441\u0442\u0435\u0440\u0456\u043d \u0434\u0430\u0439\u044b\u043d\u0434\u0430\u0443\u0493\u0430 \u043a\u04e9\u043c\u0435\u043a\u0442\u0435\u0441\u0435\u0434\u0456.', uz: 'Dastur savol tanlash, ma’lumot yigish va portfolio posteri tayyorlashga yordam beradi.', ar: 'يساعد البرنامج في اختيار سؤال وجمع البيانات وكتابة النتائج وإعداد ملصق للملف.', de: 'Das Programm hilft bei Frage, Datenerhebung, Ergebnissen und Portfolio-Poster.', es: 'Ayuda a elegir pregunta, recoger datos, redactar hallazgos y preparar un póster.', tr: 'Soru seçme, veri toplama, sonuç yazma ve portfolyo posteri hazırlamaya yardımcı olur.' }),
    country: lt({ ru: '\u041c\u0435\u0436\u0434\u0443\u043d\u0430\u0440\u043e\u0434\u043d\u043e', en: 'Global', kk: '\u0425\u0430\u043b\u044b\u049b\u0430\u0440\u0430\u043b\u044b\u049b', uz: 'Xalqaro', ar: 'عالمي', de: 'Global', es: 'Global', tr: 'Küresel' }),
    city: lt({ ru: '\u041e\u043d\u043b\u0430\u0439\u043d + \u0432\u0441\u0442\u0440\u0435\u0447\u0438', en: 'Online + meetups', kk: '\u041e\u043d\u043b\u0430\u0439\u043d + \u043a\u0435\u0437\u0434\u0435\u0441\u0443\u043b\u0435\u0440', uz: 'Onlayn + uchrashuvlar', ar: 'عن بعد + لقاءات', de: 'Online + Treffen', es: 'Online + encuentros', tr: 'Çevrim içi + buluşmalar' }),
    languages: ['ru', 'en'],
    skills: [skill('\u041d\u0430\u0443\u0447\u043d\u043e\u0435 \u043f\u0438\u0441\u044c\u043c\u043e', 'Academic writing', '\u0492\u044b\u043b\u044b\u043c\u0438 \u0436\u0430\u0437\u0443', 'Akademik yozuv', 'كتابة أكاديمية', 'Akademisches Schreiben', 'Escritura académica', 'Akademik yazım'), skill('\u0410\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0430', 'Analytics', '\u0410\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0430', 'Analitika', 'تحليل', 'Analyse', 'Análisis', 'Analitik')],
    keywords: ['research', 'paper', 'poster', 'science'],
    minAge: 15,
    maxAge: 18,
    grades: [9, 10, 11],
    deadline: '2026-08-05',
    startDate: '2026-08-12',
    finalDeadline: true,
    registrationOpen: true,
    seats: 40,
    savedCount: 204,
    imageUrl: '/images/activities/cover-educational.svg',
    editorPick: true,
    recommended: true,
    requirements: [skill('\u0418\u043d\u0442\u0435\u0440\u0435\u0441 \u043a \u0438\u0441\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u0442\u0435\u043b\u044c\u0441\u043a\u043e\u0439 \u0442\u0435\u043c\u0435', 'Interest in a research topic', '\u0417\u0435\u0440\u0442\u0442\u0435\u0443 \u0442\u0430\u049b\u044b\u0440\u044b\u0431\u044b\u043d\u0430 \u049b\u044b\u0437\u044b\u0493\u0443\u0448\u044b\u043b\u044b\u049b', 'Tadqiqot mavzusiga qiziqish', 'اهتمام بموضوع بحثي', 'Interesse an einem Forschungsthema', 'Interés por un tema de investigación', 'Araştırma konusuna ilgi')],
    outcomes: [skill('\u041f\u043e\u0441\u0442\u0435\u0440, \u0430\u043d\u043d\u043e\u0442\u0430\u0446\u0438\u044f \u0438 \u0437\u0430\u043f\u0438\u0441\u044c \u0437\u0430\u0449\u0438\u0442\u044b', 'Poster, abstract and defense recording', '\u041f\u043e\u0441\u0442\u0435\u0440, \u0430\u04a3\u0434\u0430\u0442\u043f\u0430 \u0436\u04d9\u043d\u0435 \u049b\u043e\u0440\u0493\u0430\u0443 \u0436\u0430\u0437\u0431\u0430\u0441\u044b', 'Poster, annotatsiya va himoya yozuvi', 'ملصق وملخص وتسجيل عرض', 'Poster, Abstract und Verteidigungsvideo', 'Póster, resumen y grabación', 'Poster, özet ve savunma kaydı')],
    portfolioValue: 88,
    publishedAt: '2026-07-04',
  },
  {
    id: 'op-003',
    slug: 'ai-for-good-hackathon',
    source: 'verified',
    category: 'hackathons',
    direction: 'tech',
    format: 'online',
    participation: 'team',
    cost: 'free',
    title: lt({ ru: 'AI for Good Junior Hackathon', en: 'AI for Good Junior Hackathon', kk: 'AI for Good Junior Hackathon', uz: 'AI for Good Junior Hackathon', ar: 'هاكاثون الذكاء الاصطناعي للخير', de: 'AI for Good Junior Hackathon', es: 'AI for Good Junior Hackathon', tr: 'AI for Good Junior Hackathon' }),
    organizer: lt({ ru: 'Global Youth Tech Network', en: 'Global Youth Tech Network', kk: 'Global Youth Tech Network', uz: 'Global Youth Tech Network', ar: 'شبكة الشباب التقنية العالمية', de: 'Global Youth Tech Network', es: 'Global Youth Tech Network', tr: 'Global Youth Tech Network' }),
    summary: lt({ ru: '48 \u0447\u0430\u0441\u043e\u0432 \u043d\u0430 \u043f\u0440\u043e\u0442\u043e\u0442\u0438\u043f AI-\u0440\u0435\u0448\u0435\u043d\u0438\u044f \u0434\u043b\u044f \u0441\u043e\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0439 \u0437\u0430\u0434\u0430\u0447\u0438.', en: '48 hours to prototype an AI solution for a social challenge.', kk: '\u04d8\u043b\u0435\u0443\u043c\u0435\u0442\u0442\u0456\u043a \u043c\u04d9\u0441\u0435\u043b\u0435 \u04af\u0448\u0456\u043d AI \u043f\u0440\u043e\u0442\u043e\u0442\u0438\u043f\u0456\u043d\u0435 48 \u0441\u0430\u0493\u0430\u0442.', uz: 'Ijtimoiy muammo uchun AI prototipiga 48 soat.', ar: '48 ساعة لنموذج أولي لحل ذكاء اصطناعي لقضية اجتماعية.', de: '48 Stunden für einen KI-Prototyp zu einer sozialen Herausforderung.', es: '48 horas para prototipar una solución de IA social.', tr: 'Sosyal sorun için AI prototipi geliştirmeye 48 saat.' }),
    description: lt({ ru: '\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u0438 \u0440\u0430\u0431\u043e\u0442\u0430\u044e\u0442 \u0441 \u043e\u0442\u043a\u0440\u044b\u0442\u044b\u043c\u0438 \u0434\u0430\u043d\u043d\u044b\u043c\u0438, \u0441\u043e\u0437\u0434\u0430\u044e\u0442 \u043f\u0440\u043e\u0442\u043e\u0442\u0438\u043f \u0438 \u043f\u043e\u043b\u0443\u0447\u0430\u044e\u0442 \u043e\u0431\u0440\u0430\u0442\u043d\u0443\u044e \u0441\u0432\u044f\u0437\u044c \u043e\u0442 \u0438\u043d\u0436\u0435\u043d\u0435\u0440\u043e\u0432.', en: 'Participants use open data, build a prototype and receive feedback from engineers.', kk: '\u049a\u0430\u0442\u044b\u0441\u0443\u0448\u044b\u043b\u0430\u0440 \u0430\u0448\u044b\u049b \u0434\u0435\u0440\u0435\u043a\u0442\u0435\u0440\u043c\u0435\u043d \u0436\u04b1\u043c\u044b\u0441 \u0456\u0441\u0442\u0435\u043f, \u043f\u0440\u043e\u0442\u043e\u0442\u0438\u043f \u0436\u0430\u0441\u0430\u043f, \u0438\u043d\u0436\u0435\u043d\u0435\u0440\u043b\u0435\u0440\u0434\u0435\u043d \u043f\u0456\u043a\u0456\u0440 \u0430\u043b\u0430\u0434\u044b.', uz: 'Ishtirokchilar ochiq ma’lumotlardan foydalanib prototip yaratadi va muhandislardan fikr oladi.', ar: 'يستخدم المشاركون البيانات المفتوحة ويبنون نموذجاً ويحصلون على ملاحظات مهندسين.', de: 'Teilnehmende nutzen offene Daten, bauen einen Prototyp und erhalten Feedback.', es: 'Usan datos abiertos, crean un prototipo y reciben comentarios de ingenieros.', tr: 'Katılımcılar açık veriyle prototip oluşturur ve mühendislerden geri bildirim alır.' }),
    country: lt({ ru: '\u041c\u0435\u0436\u0434\u0443\u043d\u0430\u0440\u043e\u0434\u043d\u043e', en: 'Global', kk: '\u0425\u0430\u043b\u044b\u049b\u0430\u0440\u0430\u043b\u044b\u049b', uz: 'Xalqaro', ar: 'عالمي', de: 'Global', es: 'Global', tr: 'Küresel' }),
    city: lt({ ru: '\u041e\u043d\u043b\u0430\u0439\u043d', en: 'Online', kk: '\u041e\u043d\u043b\u0430\u0439\u043d', uz: 'Onlayn', ar: 'عبر الإنترنت', de: 'Online', es: 'Online', tr: 'Çevrim içi' }),
    languages: ['en'],
    skills: [skill('AI', 'AI', 'AI', 'AI', 'ذكاء اصطناعي', 'KI', 'IA', 'AI'), skill('\u041f\u0440\u043e\u0442\u043e\u0442\u0438\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435', 'Prototyping', '\u041f\u0440\u043e\u0442\u043e\u0442\u0438\u043f\u0442\u0435\u0443', 'Prototiplash', 'نمذجة', 'Prototyping', 'Prototipado', 'Prototipleme')],
    keywords: ['ai', 'machine learning', 'hackathon', 'social impact'],
    minAge: 13,
    maxAge: 18,
    grades: [7, 8, 9, 10, 11],
    deadline: '2026-07-20',
    startDate: '2026-07-27',
    finalDeadline: true,
    registrationOpen: true,
    seats: 160,
    savedCount: 411,
    imageUrl: '/images/championship/technology-case.jpg',
    editorPick: true,
    recommended: true,
    requirements: [skill('\u041d\u043e\u0443\u0442\u0431\u0443\u043a \u0438 \u0431\u0430\u0437\u043e\u0432\u044b\u0439 \u043e\u043f\u044b\u0442 \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f', 'Laptop and basic coding experience', '\u041d\u043e\u0443\u0442\u0431\u0443\u043a \u0436\u04d9\u043d\u0435 \u0431\u0430\u0493\u0434\u0430\u0440\u043b\u0430\u043c\u0430\u043b\u0430\u0443 \u043d\u0435\u0433\u0456\u0437\u0434\u0435\u0440\u0456', 'Noutbuk va dasturlash asoslari', 'حاسوب وخبرة برمجة أساسية', 'Laptop und Coding-Grundlagen', 'Portátil y programación básica', 'Dizüstü bilgisayar ve temel kodlama')],
    outcomes: [skill('\u041f\u0440\u043e\u0442\u043e\u0442\u0438\u043f \u0438 \u0434\u0435\u043c\u043e-\u0432\u0438\u0434\u0435\u043e', 'Prototype and demo video', '\u041f\u0440\u043e\u0442\u043e\u0442\u0438\u043f \u0436\u04d9\u043d\u0435 \u0434\u0435\u043c\u043e \u0431\u0435\u0439\u043d\u0435', 'Prototip va demo video', 'نموذج وفيديو عرض', 'Prototyp und Demo-Video', 'Prototipo y demo', 'Prototip ve demo videosu')],
    externalUrl: 'https://example.org/ai-for-good-junior',
    portfolioValue: 82,
    publishedAt: '2026-07-06',
  },
  {
    id: 'op-004',
    slug: 'central-asia-scholarship',
    source: 'verified',
    category: 'scholarships',
    direction: 'leadership',
    format: 'hybrid',
    participation: 'individual',
    cost: 'scholarship',
    title: lt({ ru: 'Central Asia Young Leaders Scholarship', en: 'Central Asia Young Leaders Scholarship', kk: 'Central Asia Young Leaders Scholarship', uz: 'Central Asia Young Leaders Scholarship', ar: 'منحة قادة آسيا الوسطى الشباب', de: 'Central Asia Young Leaders Scholarship', es: 'Beca Jóvenes Líderes de Asia Central', tr: 'Orta Asya Genç Liderler Bursu' }),
    organizer: lt({ ru: 'Education Bridge Foundation', en: 'Education Bridge Foundation', kk: 'Education Bridge Foundation', uz: 'Education Bridge Foundation', ar: 'مؤسسة جسر التعليم', de: 'Education Bridge Foundation', es: 'Education Bridge Foundation', tr: 'Education Bridge Foundation' }),
    summary: lt({ ru: '\u0421\u0442\u0438\u043f\u0435\u043d\u0434\u0438\u044f \u043d\u0430 \u043b\u0438\u0434\u0435\u0440\u0441\u043a\u0443\u044e \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0443 \u0441 \u043e\u043d\u043b\u0430\u0439\u043d-\u043c\u043e\u0434\u0443\u043b\u044f\u043c\u0438 \u0438 \u043e\u0447\u043d\u044b\u043c \u0444\u0438\u043d\u0430\u043b\u043e\u043c.', en: 'A scholarship for a leadership program with online modules and an in-person final.', kk: '\u041e\u043d\u043b\u0430\u0439\u043d \u043c\u043e\u0434\u0443\u043b\u044c\u0434\u0435\u0440 \u043c\u0435\u043d \u043e\u0444\u043b\u0430\u0439\u043d \u0444\u0438\u043d\u0430\u043b\u044b \u0431\u0430\u0440 \u043a\u04e9\u0448\u0431\u0430\u0441\u0448\u044b\u043b\u044b\u049b \u0431\u0430\u0493\u0434\u0430\u0440\u043b\u0430\u043c\u0430\u0441\u044b\u043d\u0430 \u0441\u0442\u0438\u043f\u0435\u043d\u0434\u0438\u044f.', uz: 'Onlayn modullar va oflayn finalga ega yetakchilik dasturi stipendiyasi.', ar: 'منحة لبرنامج قيادة مع وحدات عبر الإنترنت ونهائي حضوري.', de: 'Stipendium für ein Leadership-Programm mit Online-Modulen und Präsenzfinale.', es: 'Beca para liderazgo con módulos online y final presencial.', tr: 'Çevrim içi modüller ve yüz yüze final içeren liderlik bursu.' }),
    description: lt({ ru: '\u041f\u043e\u0434\u0445\u043e\u0434\u0438\u0442 \u0448\u043a\u043e\u043b\u044c\u043d\u0438\u043a\u0430\u043c, \u043a\u043e\u0442\u043e\u0440\u044b\u0435 \u0437\u0430\u043f\u0443\u0441\u043a\u0430\u044e\u0442 \u0441\u043e\u0446\u0438\u0430\u043b\u044c\u043d\u044b\u0435 \u0438\u043d\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u044b \u0438 \u0445\u043e\u0442\u044f\u0442 \u043f\u043e\u043b\u0443\u0447\u0438\u0442\u044c \u043c\u0435\u043d\u0442\u043e\u0440\u0441\u043a\u0443\u044e \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0443.', en: 'For students launching social initiatives who need mentoring support.', kk: '\u04d8\u043b\u0435\u0443\u043c\u0435\u0442\u0442\u0456\u043a \u0431\u0430\u0441\u0442\u0430\u043c\u0430\u043b\u0430\u0440 \u0436\u0430\u0441\u0430\u043f \u0436\u04af\u0440\u0433\u0435\u043d \u043e\u049b\u0443\u0448\u044b\u043b\u0430\u0440\u0493\u0430 \u043c\u0435\u043d\u0442\u043e\u0440\u043b\u044b\u049b \u049b\u043e\u043b\u0434\u0430\u0443 \u0431\u0435\u0440\u0435\u0434\u0456.', uz: 'Ijtimoiy tashabbus boshlagan oquvchilarga mentorlik beradi.', ar: 'للطلاب الذين يطلقون مبادرات اجتماعية ويريدون إرشاداً.', de: 'Für Schüler mit sozialen Initiativen und Mentoringbedarf.', es: 'Para estudiantes con iniciativas sociales que buscan mentoría.', tr: 'Sosyal girişim başlatan ve mentorluk isteyen öğrenciler için.' }),
    country: lt({ ru: '\u041a\u0430\u0437\u0430\u0445\u0441\u0442\u0430\u043d', en: 'Kazakhstan', kk: '\u049a\u0430\u0437\u0430\u049b\u0441\u0442\u0430\u043d', uz: 'Qozogiston', ar: 'كازاخستان', de: 'Kasachstan', es: 'Kazajistán', tr: 'Kazakistan' }),
    city: lt({ ru: '\u0410\u043b\u043c\u0430\u0442\u044b', en: 'Almaty', kk: '\u0410\u043b\u043c\u0430\u0442\u044b', uz: 'Olmaota', ar: 'ألماتي', de: 'Almaty', es: 'Almaty', tr: 'Almatı' }),
    languages: ['ru', 'en', 'kk'],
    skills: [skill('\u041b\u0438\u0434\u0435\u0440\u0441\u0442\u0432\u043e', 'Leadership', '\u041a\u04e9\u0448\u0431\u0430\u0441\u0448\u044b\u043b\u044b\u049b', 'Yetakchilik', 'قيادة', 'Leadership', 'Liderazgo', 'Liderlik'), skill('\u0421\u043e\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0435 \u0432\u043b\u0438\u044f\u043d\u0438\u0435', 'Social impact', '\u04d8\u043b\u0435\u0443\u043c\u0435\u0442\u0442\u0456\u043a \u04d9\u0441\u0435\u0440', 'Ijtimoiy ta’sir', 'أثر اجتماعي', 'Soziale Wirkung', 'Impacto social', 'Sosyal etki')],
    keywords: ['scholarship', 'leadership', 'central asia'],
    minAge: 15,
    maxAge: 18,
    grades: [9, 10, 11],
    deadline: '2026-07-26',
    startDate: '2026-08-18',
    finalDeadline: true,
    registrationOpen: true,
    seats: 24,
    savedCount: 156,
    imageUrl: '/images/activities/cover-educational.svg',
    editorPick: false,
    recommended: true,
    requirements: [skill('\u041a\u043e\u0440\u043e\u0442\u043a\u043e\u0435 \u043c\u043e\u0442\u0438\u0432\u0430\u0446\u0438\u043e\u043d\u043d\u043e\u0435 \u043f\u0438\u0441\u044c\u043c\u043e', 'Short motivation letter', '\u049a\u044b\u0441\u049b\u0430 \u043c\u043e\u0442\u0438\u0432\u0430\u0446\u0438\u044f\u043b\u044b\u049b \u0445\u0430\u0442', 'Qisqa motivatsion xat', 'رسالة دافع قصيرة', 'Kurzes Motivationsschreiben', 'Carta breve de motivación', 'Kısa motivasyon mektubu')],
    outcomes: [skill('\u0421\u0442\u0438\u043f\u0435\u043d\u0434\u0438\u044f \u0438 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u043b\u044c\u043d\u044b\u0439 \u043c\u0435\u043d\u0442\u043e\u0440', 'Scholarship and personal mentor', '\u0421\u0442\u0438\u043f\u0435\u043d\u0434\u0438\u044f \u0436\u04d9\u043d\u0435 \u0436\u0435\u043a\u0435 \u043c\u0435\u043d\u0442\u043e\u0440', 'Stipendiya va shaxsiy mentor', 'منحة ومرشد شخصي', 'Stipendium und persönlicher Mentor', 'Beca y mentor personal', 'Burs ve kişisel mentor')],
    externalUrl: 'https://example.org/central-asia-scholarship',
    portfolioValue: 76,
    publishedAt: '2026-07-01',
  },
  {
    id: 'op-005',
    slug: 'berlin-summer-design-school',
    source: 'partner',
    category: 'summer',
    direction: 'creative',
    format: 'offline',
    participation: 'individual',
    cost: 'paid',
    title: lt({ ru: 'Berlin Summer Design School', en: 'Berlin Summer Design School', kk: 'Berlin Summer Design School', uz: 'Berlin Summer Design School', ar: 'مدرسة برلين الصيفية للتصميم', de: 'Berlin Summer Design School', es: 'Escuela de Diseño de Verano de Berlín', tr: 'Berlin Yaz Tasarım Okulu' }),
    organizer: lt({ ru: 'Berlin Youth Design Hub', en: 'Berlin Youth Design Hub', kk: 'Berlin Youth Design Hub', uz: 'Berlin Youth Design Hub', ar: 'مركز برلين لتصميم الشباب', de: 'Berlin Youth Design Hub', es: 'Berlin Youth Design Hub', tr: 'Berlin Youth Design Hub' }),
    summary: lt({ ru: '\u0414\u0432\u0435 \u043d\u0435\u0434\u0435\u043b\u0438 \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u043e\u0432\u043e\u0433\u043e \u0434\u0438\u0437\u0430\u0439\u043d\u0430, \u0438\u0441\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u043d\u0438\u0439 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0435\u0439 \u0438 \u043f\u0443\u0431\u043b\u0438\u0447\u043d\u043e\u0439 \u043f\u0440\u0435\u0437\u0435\u043d\u0442\u0430\u0446\u0438\u0438.', en: 'Two weeks of product design, user research and public presentation.', kk: '\u04e8\u043d\u0456\u043c \u0434\u0438\u0437\u0430\u0439\u043d\u044b, \u043f\u0430\u0439\u0434\u0430\u043b\u0430\u043d\u0443\u0448\u044b \u0437\u0435\u0440\u0442\u0442\u0435\u0443\u0456 \u0436\u04d9\u043d\u0435 \u043f\u0440\u0435\u0437\u0435\u043d\u0442\u0430\u0446\u0438\u044f\u0493\u0430 \u0435\u043a\u0456 \u0430\u043f\u0442\u0430.', uz: 'Mahsulot dizayni, foydalanuvchi tadqiqoti va taqdimotga ikki hafta.', ar: 'أسبوعان في تصميم المنتجات وبحث المستخدمين والعرض العام.', de: 'Zwei Wochen Produktdesign, User Research und öffentliche Präsentation.', es: 'Dos semanas de diseño de producto, investigación y presentación.', tr: 'Ürün tasarımı, kullanıcı araştırması ve sunumla iki hafta.' }),
    description: lt({ ru: '\u041e\u0444\u043b\u0430\u0439\u043d-\u0438\u043d\u0442\u0435\u043d\u0441\u0438\u0432 \u0434\u043b\u044f \u0448\u043a\u043e\u043b\u044c\u043d\u0438\u043a\u043e\u0432, \u043a\u043e\u0442\u043e\u0440\u044b\u0435 \u0445\u043e\u0442\u044f\u0442 \u0441\u043e\u0431\u0440\u0430\u0442\u044c \u0434\u0438\u0437\u0430\u0439\u043d-\u043a\u0435\u0439\u0441 \u0438 \u043f\u043e\u043f\u0440\u043e\u0431\u043e\u0432\u0430\u0442\u044c \u043c\u0435\u0436\u0434\u0443\u043d\u0430\u0440\u043e\u0434\u043d\u0443\u044e \u0441\u0440\u0435\u0434\u0443.', en: 'An in-person intensive for students who want to build a design case and try an international environment.', kk: '\u0414\u0438\u0437\u0430\u0439\u043d-\u043a\u0435\u0439\u0441 \u0436\u0430\u0441\u0430\u043f, \u0445\u0430\u043b\u044b\u049b\u0430\u0440\u0430\u043b\u044b\u049b \u043e\u0440\u0442\u0430\u0434\u0430 \u0442\u04d9\u0436\u0456\u0440\u0438\u0431\u0435 \u0430\u043b\u0493\u044b\u0441\u044b \u043a\u0435\u043b\u0435\u0442\u0456\u043d \u043e\u049b\u0443\u0448\u044b\u043b\u0430\u0440\u0493\u0430 \u0430\u0440\u043d\u0430\u043b\u0493\u0430\u043d \u0438\u043d\u0442\u0435\u043d\u0441\u0438\u0432.', uz: 'Dizayn keys yaratish va xalqaro muhitni sinash istagan oquvchilar uchun intensiv.', ar: 'برنامج حضوري مكثف لبناء دراسة تصميم وتجربة بيئة دولية.', de: 'Präsenzintensiv für Schüler, die einen Designcase und internationale Erfahrung suchen.', es: 'Intensivo presencial para crear un caso de diseño y vivir un entorno internacional.', tr: 'Tasarım vakası oluşturmak ve uluslararası ortamı denemek isteyenler için yüz yüze yoğun program.' }),
    country: lt({ ru: '\u0413\u0435\u0440\u043c\u0430\u043d\u0438\u044f', en: 'Germany', kk: '\u0413\u0435\u0440\u043c\u0430\u043d\u0438\u044f', uz: 'Germaniya', ar: 'ألمانيا', de: 'Deutschland', es: 'Alemania', tr: 'Almanya' }),
    city: lt({ ru: '\u0411\u0435\u0440\u043b\u0438\u043d', en: 'Berlin', kk: '\u0411\u0435\u0440\u043b\u0438\u043d', uz: 'Berlin', ar: 'برلين', de: 'Berlin', es: 'Berlín', tr: 'Berlin' }),
    languages: ['en', 'de'],
    skills: [skill('\u0414\u0438\u0437\u0430\u0439\u043d-\u043c\u044b\u0448\u043b\u0435\u043d\u0438\u0435', 'Design thinking', '\u0414\u0438\u0437\u0430\u0439\u043d \u043e\u0439\u043b\u0430\u0443', 'Dizayn fikrlash', 'تفكير تصميمي', 'Design Thinking', 'Design thinking', 'Tasarım odaklı düşünme'), skill('UX-\u0438\u0441\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u043d\u0438\u044f', 'UX research', 'UX \u0437\u0435\u0440\u0442\u0442\u0435\u0443', 'UX tadqiqot', 'بحث UX', 'UX Research', 'Investigación UX', 'UX araştırması')],
    keywords: ['design', 'ux', 'summer school', 'berlin'],
    minAge: 16,
    maxAge: 18,
    grades: [10, 11],
    deadline: '2026-08-12',
    startDate: '2026-08-24',
    finalDeadline: true,
    registrationOpen: true,
    seats: 30,
    savedCount: 92,
    imageUrl: '/images/activities/cover-project.svg',
    editorPick: false,
    recommended: false,
    requirements: [skill('\u041f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e \u0438\u043b\u0438 \u043a\u043e\u0440\u043e\u0442\u043a\u043e\u0435 \u0434\u0438\u0437\u0430\u0439\u043d-\u0437\u0430\u0434\u0430\u043d\u0438\u0435', 'Portfolio or short design task', '\u041f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e \u043d\u0435\u043c\u0435\u0441\u0435 \u049b\u044b\u0441\u049b\u0430 \u0434\u0438\u0437\u0430\u0439\u043d \u0442\u0430\u043f\u0441\u044b\u0440\u043c\u0430\u0441\u044b', 'Portfolio yoki qisqa dizayn vazifasi', 'ملف أو مهمة تصميم قصيرة', 'Portfolio oder kurze Designaufgabe', 'Portafolio o tarea breve', 'Portfolyo veya kısa tasarım görevi')],
    outcomes: [skill('\u0414\u0438\u0437\u0430\u0439\u043d-\u043a\u0435\u0439\u0441 \u0438 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442', 'Design case and certificate', '\u0414\u0438\u0437\u0430\u0439\u043d \u043a\u0435\u0439\u0441 \u0436\u04d9\u043d\u0435 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442', 'Dizayn keys va sertifikat', 'دراسة تصميم وشهادة', 'Designcase und Zertifikat', 'Caso de diseño y certificado', 'Tasarım vakası ve sertifika')],
    externalUrl: 'https://example.org/berlin-summer-design-school',
    portfolioValue: 70,
    publishedAt: '2026-07-07',
  },
  {
    id: 'op-006',
    slug: 'volunteer-impact-sprint',
    source: 'verified',
    category: 'volunteering',
    direction: 'social',
    format: 'online',
    participation: 'both',
    cost: 'free',
    title: lt({ ru: 'Volunteer Impact Sprint', en: 'Volunteer Impact Sprint', kk: 'Volunteer Impact Sprint', uz: 'Volunteer Impact Sprint', ar: 'سباق التطوع للأثر', de: 'Volunteer Impact Sprint', es: 'Sprint de Impacto Voluntario', tr: 'Gönüllü Etki Sprinti' }),
    organizer: lt({ ru: 'Open Social Labs', en: 'Open Social Labs', kk: 'Open Social Labs', uz: 'Open Social Labs', ar: 'Open Social Labs', de: 'Open Social Labs', es: 'Open Social Labs', tr: 'Open Social Labs' }),
    summary: lt({ ru: '\u041c\u0435\u0441\u044f\u0447\u043d\u044b\u0439 \u0432\u043e\u043b\u043e\u043d\u0442\u0451\u0440\u0441\u043a\u0438\u0439 \u0441\u043f\u0440\u0438\u043d\u0442 \u0434\u043b\u044f \u0448\u043a\u043e\u043b\u044c\u043d\u0438\u043a\u043e\u0432, \u043a\u043e\u0442\u043e\u0440\u044b\u0435 \u0445\u043e\u0442\u044f\u0442 \u043f\u043e\u043c\u043e\u0447\u044c \u041d\u041a\u041e \u0446\u0438\u0444\u0440\u043e\u0432\u044b\u043c \u043f\u0440\u043e\u0435\u043a\u0442\u043e\u043c.', en: 'A one-month volunteer sprint for students helping NGOs with digital projects.', kk: '\u04ae\u0415\u04b0-\u0493\u0430 \u0446\u0438\u0444\u0440\u043b\u044b\u049b \u0436\u043e\u0431\u0430\u043c\u0435\u043d \u043a\u04e9\u043c\u0435\u043a\u0442\u0435\u0441\u0435\u0442\u0456\u043d \u043e\u049b\u0443\u0448\u044b\u043b\u0430\u0440\u0493\u0430 \u0431\u0456\u0440 \u0430\u0439\u043b\u044b\u049b \u0432\u043e\u043b\u043e\u043d\u0442\u0435\u0440\u043b\u0456\u043a \u0441\u043f\u0440\u0438\u043d\u0442.', uz: 'NNTlarga raqamli loyiha bilan yordam beradigan bir oylik volontyor sprint.', ar: 'سباق تطوعي لشهر لمساعدة الجمعيات بمشاريع رقمية.', de: 'Einmonatiger Freiwilligen-Sprint für digitale NGO-Projekte.', es: 'Sprint voluntario de un mes para apoyar ONG con proyectos digitales.', tr: 'STKlara dijital projeyle destek olmak için bir aylık gönüllü sprint.' }),
    description: lt({ ru: '\u0412\u044b \u0432\u044b\u0431\u0438\u0440\u0430\u0435\u0442\u0435 \u0437\u0430\u0434\u0430\u0447\u0443, \u043d\u0430\u0445\u043e\u0434\u0438\u0442\u0435 \u043a\u043e\u043c\u0430\u043d\u0434\u0443 \u0438 \u0444\u0438\u043a\u0441\u0438\u0440\u0443\u0435\u0442\u0435 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442 \u0432 \u043f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e \u0441 \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u0435\u043c \u043e\u0442 \u043a\u0443\u0440\u0430\u0442\u043e\u0440\u0430.', en: 'Choose a task, find a team and record the outcome in your portfolio with mentor confirmation.', kk: '\u0422\u0430\u043f\u0441\u044b\u0440\u043c\u0430 \u0442\u0430\u04a3\u0434\u0430\u043f, \u043a\u043e\u043c\u0430\u043d\u0434\u0430 \u0442\u0430\u0443\u044b\u043f, \u043d\u04d9\u0442\u0438\u0436\u0435\u043d\u0456 \u043a\u0443\u0440\u0430\u0442\u043e\u0440 \u0440\u0430\u0441\u0442\u0430\u0443\u044b\u043c\u0435\u043d \u043f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e\u0493\u0430 \u049b\u043e\u0441\u044b\u04a3\u044b\u0437.', uz: 'Vazifa tanlab, jamoa topib, natijani mentor tasdigi bilan portfolioga kiriting.', ar: 'اختر مهمة، وابحث عن فريق، وسجل النتيجة في ملفك مع تأكيد المرشد.', de: 'Aufgabe wählen, Team finden und Ergebnis mit Mentorbestätigung im Portfolio sichern.', es: 'Elige tarea, encuentra equipo y registra el resultado con confirmación.', tr: 'Görev seç, takım bul ve sonucu mentor onayıyla portfolyoya ekle.' }),
    country: lt({ ru: '\u041c\u0435\u0436\u0434\u0443\u043d\u0430\u0440\u043e\u0434\u043d\u043e', en: 'Global', kk: '\u0425\u0430\u043b\u044b\u049b\u0430\u0440\u0430\u043b\u044b\u049b', uz: 'Xalqaro', ar: 'عالمي', de: 'Global', es: 'Global', tr: 'Küresel' }),
    city: lt({ ru: '\u041e\u043d\u043b\u0430\u0439\u043d', en: 'Online', kk: '\u041e\u043d\u043b\u0430\u0439\u043d', uz: 'Onlayn', ar: 'عبر الإنترنت', de: 'Online', es: 'Online', tr: 'Çevrim içi' }),
    languages: ['ru', 'en', 'es'],
    skills: [skill('\u041a\u043e\u043c\u043c\u0443\u043d\u0438\u043a\u0430\u0446\u0438\u044f', 'Communication', '\u041a\u043e\u043c\u043c\u0443\u043d\u0438\u043a\u0430\u0446\u0438\u044f', 'Kommunikatsiya', 'تواصل', 'Kommunikation', 'Comunicación', 'İletişim'), skill('\u041f\u0440\u043e\u0435\u043a\u0442\u043d\u044b\u0439 \u043c\u0435\u043d\u0435\u0434\u0436\u043c\u0435\u043d\u0442', 'Project management', '\u0416\u043e\u0431\u0430\u043d\u044b \u0431\u0430\u0441\u049b\u0430\u0440\u0443', 'Loyiha boshqaruvi', 'إدارة مشاريع', 'Projektmanagement', 'Gestión de proyectos', 'Proje yönetimi')],
    keywords: ['volunteer', 'ngo', 'social', 'portfolio'],
    minAge: 12,
    maxAge: 18,
    grades: [6, 7, 8, 9, 10, 11],
    startDate: '2026-08-03',
    finalDeadline: false,
    registrationOpen: true,
    seats: 120,
    savedCount: 187,
    imageUrl: '/images/opportunities/volunteer-project.jpg',
    editorPick: false,
    recommended: true,
    requirements: [skill('2-3 \u0447\u0430\u0441\u0430 \u0432 \u043d\u0435\u0434\u0435\u043b\u044e', '2-3 hours per week', '\u0410\u043f\u0442\u0430\u0441\u044b\u043d\u0430 2-3 \u0441\u0430\u0493\u0430\u0442', 'Haftasiga 2-3 soat', '2-3 ساعات أسبوعياً', '2-3 Stunden pro Woche', '2-3 horas por semana', 'Haftada 2-3 saat')],
    outcomes: [skill('\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043d\u043d\u044b\u0439 \u0432\u043e\u043b\u043e\u043d\u0442\u0451\u0440\u0441\u043a\u0438\u0439 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442', 'Verified volunteer outcome', '\u0420\u0430\u0441\u0442\u0430\u043b\u0493\u0430\u043d \u0432\u043e\u043b\u043e\u043d\u0442\u0435\u0440\u043b\u0456\u043a \u043d\u04d9\u0442\u0438\u0436\u0435', 'Tasdiqlangan volontyorlik natijasi', 'نتيجة تطوعية موثقة', 'Bestätigtes Freiwilligenergebnis', 'Resultado voluntario verificado', 'Doğrulanmış gönüllü sonucu')],
    externalUrl: 'https://example.org/volunteer-impact-sprint',
    portfolioValue: 68,
    publishedAt: '2026-07-08',
  },
  {
    id: 'op-007',
    slug: 'data-literacy-olympiad',
    source: 'verified',
    category: 'olympiads',
    direction: 'tech',
    format: 'online',
    participation: 'individual',
    cost: 'free',
    title: lt({ ru: 'Data Literacy Olympiad', en: 'Data Literacy Olympiad', kk: 'Data Literacy Olympiad', uz: 'Data Literacy Olympiad', ar: 'أولمبياد فهم البيانات', de: 'Data Literacy Olympiad', es: 'Olimpiada de Alfabetización de Datos', tr: 'Veri Okuryazarlığı Olimpiyatı' }),
    organizer: lt({ ru: 'Open Data School', en: 'Open Data School', kk: 'Open Data School', uz: 'Open Data School', ar: 'مدرسة البيانات المفتوحة', de: 'Open Data School', es: 'Open Data School', tr: 'Open Data School' }),
    summary: lt({ ru: '\u041e\u043d\u043b\u0430\u0439\u043d-\u043e\u043b\u0438\u043c\u043f\u0438\u0430\u0434\u0430 \u043f\u043e \u0430\u043d\u0430\u043b\u0438\u0437\u0443 \u0434\u0430\u043d\u043d\u044b\u0445, \u0432\u0438\u0437\u0443\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u0438 \u0438 \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u043c\u0443 \u043c\u044b\u0448\u043b\u0435\u043d\u0438\u044e.', en: 'An online olympiad in data analysis, visualization and critical thinking.', kk: '\u0414\u0435\u0440\u0435\u043a\u0442\u0435\u0440 \u0442\u0430\u043b\u0434\u0430\u0443\u044b, \u0432\u0438\u0437\u0443\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u044f \u0436\u04d9\u043d\u0435 \u0441\u044b\u043d\u0438 \u043e\u0439\u043b\u0430\u0443 \u0431\u043e\u0439\u044b\u043d\u0448\u0430 \u043e\u043d\u043b\u0430\u0439\u043d \u043e\u043b\u0438\u043c\u043f\u0438\u0430\u0434\u0430.', uz: 'Ma’lumot tahlili, vizualizatsiya va tanqidiy fikrlash boyicha onlayn olimpiada.', ar: 'أولمبياد عبر الإنترنت في تحليل البيانات والتصور والتفكير النقدي.', de: 'Online-Olympiade zu Datenanalyse, Visualisierung und kritischem Denken.', es: 'Olimpiada online de análisis de datos, visualización y pensamiento crítico.', tr: 'Veri analizi, görselleştirme ve eleştirel düşünme olimpiyatı.' }),
    description: lt({ ru: '\u0417\u0430\u0434\u0430\u043d\u0438\u044f \u043f\u0440\u043e\u0432\u0435\u0440\u044f\u044e\u0442 \u0443\u043c\u0435\u043d\u0438\u0435 \u0447\u0438\u0442\u0430\u0442\u044c \u0433\u0440\u0430\u0444\u0438\u043a\u0438, \u043d\u0430\u0445\u043e\u0434\u0438\u0442\u044c \u0438\u0441\u043a\u0430\u0436\u0435\u043d\u0438\u044f \u0438 \u043e\u0431\u044a\u044f\u0441\u043d\u044f\u0442\u044c \u0432\u044b\u0432\u043e\u0434\u044b \u043f\u043e\u043d\u044f\u0442\u043d\u044b\u043c \u044f\u0437\u044b\u043a\u043e\u043c.', en: 'Tasks test graph reading, spotting distortions and explaining insights clearly.', kk: '\u0422\u0430\u043f\u0441\u044b\u0440\u043c\u0430\u043b\u0430\u0440 \u0433\u0440\u0430\u0444\u0438\u043a \u043e\u049b\u0443\u0434\u044b, \u0431\u04b1\u0440\u043c\u0430\u043b\u0430\u0443\u0434\u044b \u0442\u0430\u0431\u0443\u0434\u044b \u0436\u04d9\u043d\u0435 \u049b\u043e\u0440\u044b\u0442\u044b\u043d\u0434\u044b\u043d\u044b \u0442\u04af\u0441\u0456\u043d\u0434\u0456\u0440\u0443\u0434\u0456 \u0442\u0435\u043a\u0441\u0435\u0440\u0435\u0434\u0456.', uz: 'Vazifalar grafik oqish, xatolik topish va xulosani tushuntirishni tekshiradi.', ar: 'تختبر المهام قراءة الرسوم واكتشاف التشويه وشرح النتائج بوضوح.', de: 'Aufgaben prüfen Diagrammlesen, Verzerrungen und klare Erklärung.', es: 'Evalúa lectura de gráficos, sesgos y explicación clara.', tr: 'Grafik okuma, çarpıtma bulma ve içgörü anlatmayı ölçer.' }),
    country: lt({ ru: '\u041c\u0435\u0436\u0434\u0443\u043d\u0430\u0440\u043e\u0434\u043d\u043e', en: 'Global', kk: '\u0425\u0430\u043b\u044b\u049b\u0430\u0440\u0430\u043b\u044b\u049b', uz: 'Xalqaro', ar: 'عالمي', de: 'Global', es: 'Global', tr: 'Küresel' }),
    city: lt({ ru: '\u041e\u043d\u043b\u0430\u0439\u043d', en: 'Online', kk: '\u041e\u043d\u043b\u0430\u0439\u043d', uz: 'Onlayn', ar: 'عبر الإنترنت', de: 'Online', es: 'Online', tr: 'Çevrim içi' }),
    languages: ['ru', 'en', 'de', 'es'],
    skills: [skill('\u0414\u0430\u043d\u043d\u044b\u0435', 'Data', '\u0414\u0435\u0440\u0435\u043a\u0442\u0435\u0440', 'Ma’lumotlar', 'بيانات', 'Daten', 'Datos', 'Veri'), skill('\u041a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0435 \u043c\u044b\u0448\u043b\u0435\u043d\u0438\u0435', 'Critical thinking', '\u0421\u044b\u043d\u0438 \u043e\u0439\u043b\u0430\u0443', 'Tanqidiy fikrlash', 'تفكير نقدي', 'Kritisches Denken', 'Pensamiento crítico', 'Eleştirel düşünme')],
    keywords: ['data', 'olympiad', 'visualization'],
    minAge: 13,
    maxAge: 18,
    grades: [7, 8, 9, 10, 11],
    deadline: '2026-07-18',
    startDate: '2026-07-21',
    finalDeadline: true,
    registrationOpen: true,
    seats: 500,
    savedCount: 275,
    imageUrl: '/images/activities/cover-educational.svg',
    editorPick: false,
    recommended: false,
    requirements: [skill('\u0411\u0430\u0437\u043e\u0432\u0430\u044f \u043c\u0430\u0442\u0435\u043c\u0430\u0442\u0438\u043a\u0430 \u0438 \u0432\u043d\u0438\u043c\u0430\u0442\u0435\u043b\u044c\u043d\u043e\u0441\u0442\u044c', 'Basic math and attention', '\u041d\u0435\u0433\u0456\u0437\u0433\u0456 \u043c\u0430\u0442\u0435\u043c\u0430\u0442\u0438\u043a\u0430 \u0436\u04d9\u043d\u0435 \u043c\u04b1\u049b\u0438\u044f\u0442\u0442\u044b\u049b', 'Asosiy matematika va e’tibor', 'رياضيات أساسية وانتباه', 'Grundlagenmathe und Aufmerksamkeit', 'Matemática básica y atención', 'Temel matematik ve dikkat')],
    outcomes: [skill('\u0414\u0438\u043f\u043b\u043e\u043c \u0438 \u0440\u0430\u0437\u0431\u043e\u0440 \u0440\u0435\u0448\u0435\u043d\u0438\u0439', 'Diploma and solution review', '\u0414\u0438\u043f\u043b\u043e\u043c \u0436\u04d9\u043d\u0435 \u0448\u0435\u0448\u0456\u043c \u0442\u0430\u043b\u0434\u0430\u0443\u044b', 'Diplom va yechim tahlili', 'دبلوم ومراجعة الحلول', 'Diplom und Lösungsreview', 'Diploma y revisión', 'Diploma ve çözüm incelemesi')],
    externalUrl: 'https://example.org/data-literacy-olympiad',
    portfolioValue: 61,
    publishedAt: '2026-07-09',
  },
];

const getLanguage = (language: string): SupportedLanguage => {
  if (['ru', 'en', 'kk', 'uz', 'ar', 'de', 'es', 'tr'].includes(language)) {
    return language as SupportedLanguage;
  }
  return 'ru';
};

const normalizeSearch = (value: string) =>
  value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\u0451/g, '\u0435')
    .trim();

const readJson = <T,>(key: string, fallback: T): T => {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};

const getDaysLeft = (deadline?: string) => {
  if (!deadline) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(`${deadline}T00:00:00`);
  return Math.ceil((end.getTime() - start.getTime()) / 86400000);
};

const getRoute = (): { mode: RouteMode; slug?: string } => {
  if (typeof window === 'undefined') return { mode: 'catalog' };
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/activities/opportunities/recommendations') return { mode: 'recommendations' };
  if (path === '/activities/opportunities/favorites') return { mode: 'favorites' };
  if (path === '/activities/opportunities/compare') return { mode: 'compare' };
  if (path === '/activities/opportunities/submit') return { mode: 'submit' };
  if (path === '/profile/opportunities') return { mode: 'profile' };
  if (path.startsWith('/activities/opportunities/')) {
    return { mode: 'detail', slug: decodeURIComponent(path.replace('/activities/opportunities/', '')) };
  }
  return { mode: 'catalog' };
};

const navigate = (path: string) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const getSourceLabel = (source: SourceId, language: SupportedLanguage) => {
  if (source === 'navykus') return pick(UI.fromNavykus, language);
  if (source === 'verified') return pick(UI.verified, language);
  return pick(UI.partner, language);
};

const scoreOpportunity = (opportunity: Opportunity, quiz: QuizState, language: SupportedLanguage) => {
  let score = 28;
  const age = Number(quiz.age);
  const grade = Number(quiz.grade);
  if (age && age >= opportunity.minAge && age <= opportunity.maxAge) score += 16;
  if (grade && opportunity.grades.includes(grade)) score += 12;
  if (quiz.interests.includes(opportunity.direction)) score += 18;
  if (quiz.format !== 'any' && quiz.format === opportunity.format) score += 10;
  if (quiz.cost !== 'any' && quiz.cost === opportunity.cost) score += 8;
  if (quiz.language !== 'any' && opportunity.languages.includes(quiz.language)) score += 6;
  if (quiz.participation !== 'any' && (opportunity.participation === quiz.participation || opportunity.participation === 'both')) score += 6;
  if (quiz.skills.length) {
    const haystack = opportunity.skills.map((item) => normalizeSearch(pick(item, language))).join(' ');
    score += Math.min(12, quiz.skills.filter((item) => haystack.includes(normalizeSearch(item))).length * 4);
  }
  if (opportunity.recommended) score += 4;
  return Math.max(5, Math.min(100, score));
};

const routeTitle = (mode: RouteMode, language: SupportedLanguage, opportunity?: Opportunity) => {
  if (opportunity) return `${pick(opportunity.title, language)} — ${pick(OPPORTUNITIES_NAV_LABELS, language)}`;
  if (mode === 'recommendations') return `${pick(UI.recommendationsTitle, language)} — Navykus`;
  if (mode === 'favorites') return `${pick(UI.favoritesTitle, language)} — Navykus`;
  if (mode === 'compare') return `${pick(UI.compareTitle, language)} — Navykus`;
  if (mode === 'submit') return `${pick(UI.submitTitle, language)} — Navykus`;
  if (mode === 'profile') return `${pick(UI.profileTitle, language)} — Navykus`;
  return `${pick(UI.title, language)} — Navykus`;
};

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="grid gap-2 text-[10px] font-mono uppercase tracking-widest text-brand-dark/70">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-xl border border-[#d8d1cc] bg-white/70 px-3 py-2 text-xs normal-case tracking-normal text-brand-dark outline-none transition-colors focus:border-brand-dark/45"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/40 p-4 backdrop-blur-md">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/60 text-[#bc4638]">
        {icon}
      </div>
      <div className="text-2xl font-serif font-semibold text-brand-dark">{value}</div>
      <div className="mt-1 text-[11px] text-brand-slate">{label}</div>
    </div>
  );
}

function OpportunityCard({
  opportunity,
  language,
  isFavorite,
  isCompared,
  match,
  onFavorite,
  onCompare,
}: {
  opportunity: Opportunity;
  language: SupportedLanguage;
  isFavorite: boolean;
  isCompared: boolean;
  match: number;
  onFavorite: () => void;
  onCompare: () => void;
}) {
  const daysLeft = getDaysLeft(opportunity.deadline);
  const deadlineText = opportunity.deadline
    ? `${daysLeft !== null && daysLeft >= 0 ? `${daysLeft} ${pick(UI.daysLeft, language)}` : pick(UI.registrationClosed, language)}`
    : pick(UI.rolling, language);

  return (
    <motion.article
      {...cardItemFadeUp}
      className="group relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-[1.35rem] border border-white/65 bg-white/46 surface-elevated-soft backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="overflow-hidden bg-white/36">
        <BrandImage
          src={opportunity.imageUrl}
          alt={pick(opportunity.title, language)}
          aspectRatio="16 / 9"
          objectPosition={opportunity.category === 'volunteering' ? '50% 48%' : '50% 50%'}
          sizes="(min-width: 1024px) 30vw, 100vw"
          className="rounded-none border-0 shadow-none"
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${
            opportunity.source === 'navykus' ? 'bg-[#bc4638]/10 text-[#8d3026]' : 'bg-emerald-500/10 text-emerald-700'
          }`}>
            {opportunity.source === 'navykus' ? <Sparkles className="h-3 w-3" /> : <BadgeCheck className="h-3 w-3" />}
            {getSourceLabel(opportunity.source, language)}
          </span>
          {opportunity.editorPick && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#bd5b82]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8a3859]">
              <Star className="h-3 w-3" />
              editor
            </span>
          )}
        </div>

        <h3 className="text-xl font-serif font-semibold leading-tight text-brand-dark sm:text-2xl">
          {pick(opportunity.title, language)}
        </h3>
        <p className="mt-2 text-xs font-medium text-brand-slate">{pick(opportunity.organizer, language)}</p>
        <p className="mt-4 text-sm leading-relaxed text-brand-slate">{pick(opportunity.summary, language)}</p>

        <div className="mt-5 grid grid-cols-2 gap-2 text-[11px] text-brand-slate">
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/55 px-3 py-2">
            <CalendarClock className="h-3.5 w-3.5 text-[#bc4638]" />
            {deadlineText}
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/55 px-3 py-2">
            <MapPin className="h-3.5 w-3.5 text-[#bd5b82]" />
            {pick(opportunity.city, language)}
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/55 px-3 py-2">
            <Users className="h-3.5 w-3.5 text-[#6b8f71]" />
            {pick(PARTICIPATION[opportunity.participation], language)}
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/55 px-3 py-2">
            <LineChart className="h-3.5 w-3.5 text-[#c9a96e]" />
            {match}%
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {opportunity.skills.slice(0, 3).map((item) => (
            <span key={pick(item, language)} className="rounded-full border border-white/60 bg-white/45 px-3 py-1 text-[11px] text-brand-slate">
              {pick(item, language)}
            </span>
          ))}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
          <button
            type="button"
            onClick={() => navigate(`/activities/opportunities/${opportunity.slug}`)}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-dark px-4 py-2.5 text-xs font-semibold text-white transition-transform hover:scale-[1.01]"
          >
            {pick(UI.details, language)}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onFavorite}
            aria-pressed={isFavorite}
            title={pick(UI.favorite, language)}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
              isFavorite ? 'border-[#bd5b82]/30 bg-[#bd5b82]/12 text-[#bd5b82]' : 'border-white/60 bg-white/45 text-brand-slate hover:text-[#bd5b82]'
            }`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onCompare}
            aria-pressed={isCompared}
            title={pick(UI.compare, language)}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
              isCompared ? 'border-[#bc4638]/30 bg-[#bc4638]/12 text-[#bc4638]' : 'border-white/60 bg-white/45 text-brand-slate hover:text-[#bc4638]'
            }`}
          >
            <Scale className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="skeleton-card overflow-hidden rounded-[1.35rem] border border-white/55 bg-white/35 p-6">
          <div className="skeleton-bone mb-5 h-6 w-32 rounded-full" />
          <div className="skeleton-bone h-7 w-4/5 rounded-xl" />
          <div className="skeleton-bone mt-3 h-3 w-full rounded-full" />
          <div className="skeleton-bone mt-2 h-3 w-2/3 rounded-full" />
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="skeleton-bone h-10 rounded-xl" />
            <div className="skeleton-bone h-10 rounded-xl" />
          </div>
          <div className="skeleton-bone mt-6 h-11 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export default function OpportunitiesPage({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { i18n } = useTranslation();
  const language = getLanguage(i18n.resolvedLanguage || i18n.language || 'ru');
  const [route, setRoute] = useState(getRoute);
  const [filters, setFilters] = useState<Filters>(createEmptyFilters);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortId>('recommended');
  const [visibleCount, setVisibleCount] = useState(6);
  const [showFilters, setShowFilters] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>(() => readJson<string[]>(STORAGE_KEYS.favorites, []));
  const [compare, setCompare] = useState<string[]>(() => readJson<string[]>(STORAGE_KEYS.compare, []));
  const [applications, setApplications] = useState<UserApplication[]>(() => readJson<UserApplication[]>(STORAGE_KEYS.applications, []));
  const [portfolio, setPortfolio] = useState<PortfolioRecord[]>(() => readJson<PortfolioRecord[]>(STORAGE_KEYS.portfolio, []));
  const [quiz, setQuiz] = useState<QuizState>(EMPTY_QUIZ);
  const [applicationNote, setApplicationNote] = useState('');
  const [proposal, setProposal] = useState({ title: '', organizer: '', link: '', note: '' });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success'>('idle');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const cmsOpportunities = useCmsOpportunities();
  const allOpportunities = useMemo(() => {
    if (!cmsOpportunities?.length) return OPPORTUNITIES;
    const mapped: Opportunity[] = (cmsOpportunities || []).map((doc) => ({
      id: `cms-${doc.id}`,
      slug: doc.slug,
      source: 'verified' as SourceId,
      category: (doc.type === 'olympiad' ? 'olympiads' : doc.type === 'volunteering' ? 'volunteering' : doc.type === 'internship' ? 'internships' : 'projects') as CategoryId,
      direction: 'social' as DirectionId,
      format: (['online', 'offline', 'hybrid'].includes(doc.format) ? doc.format : 'online') as FormatId,
      participation: 'both' as ParticipationId,
      cost: (doc.cost === 'paid' ? 'paid' : doc.cost === 'scholarship' ? 'scholarship' : 'free') as CostId,
      title: lt({ ru: doc.title, en: doc.title, kk: doc.title, uz: doc.title, ar: doc.title, de: doc.title, es: doc.title, tr: doc.title }),
      organizer: lt({ ru: doc.organization, en: doc.organization, kk: doc.organization, uz: doc.organization, ar: doc.organization, de: doc.organization, es: doc.organization, tr: doc.organization }),
      summary: lt({ ru: doc.shortDescription, en: doc.shortDescription, kk: doc.shortDescription, uz: doc.shortDescription, ar: doc.shortDescription, de: doc.shortDescription, es: doc.shortDescription, tr: doc.shortDescription }),
      description: lt({ ru: doc.fullDescription || doc.shortDescription, en: doc.fullDescription || doc.shortDescription, kk: doc.fullDescription || doc.shortDescription, uz: doc.fullDescription || doc.shortDescription, ar: doc.fullDescription || doc.shortDescription, de: doc.fullDescription || doc.shortDescription, es: doc.fullDescription || doc.shortDescription, tr: doc.fullDescription || doc.shortDescription }),
      country: lt({ ru: doc.country, en: doc.country, kk: doc.country, uz: doc.country, ar: doc.country, de: doc.country, es: doc.country, tr: doc.country }),
      city: lt({ ru: '', en: '', kk: '', uz: '', ar: '', de: '', es: '', tr: '' }),
      languages: doc.languages.filter((l): l is SupportedLanguage => ['ru','en','kk','uz','ar','de','es','tr'].includes(l)),
      skills: [],
      keywords: [doc.organization, doc.type].filter(Boolean),
      minAge: doc.ageMin || 0,
      maxAge: doc.ageMax || 25,
      grades: [],
      deadline: doc.deadline,
      startDate: '',
      finalDeadline: !!doc.deadline,
      registrationOpen: !doc.deadline || new Date(doc.deadline) > new Date(),
      seats: 0,
      savedCount: 0,
      imageUrl: doc.logoUrl || '',
      editorPick: false,
      recommended: false,
      requirements: [],
      outcomes: (doc.benefits || []).map((b) => lt({ ru: b, en: b, kk: b, uz: b, ar: b, de: b, es: b, tr: b })),
      externalUrl: doc.officialUrl,
      portfolioValue: 0,
      publishedAt: doc.createdAt,
    }));
    return [...mapped, ...OPPORTUNITIES];
  }, [cmsOpportunities]);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 350);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onPop = () => setRoute(getRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFilters({
      ...createEmptyFilters(),
      q: params.get('q') || '',
      category: (params.get('category') as CategoryId | null) || 'all',
      direction: (params.get('direction') as DirectionId | null) || 'all',
      format: (params.get('format') as FormatId | null) || 'all',
      source: (params.get('source') as SourceId | null) || 'all',
      cost: (params.get('cost') as CostId | null) || 'all',
      deadline: (params.get('deadline') as Filters['deadline'] | null) || 'all',
      age: params.get('age') || '',
      grade: params.get('grade') || '',
      country: params.get('country') || 'all',
      language: (params.get('language') as SupportedLanguage | null) || 'all',
      participation: (params.get('participation') as ParticipationId | null) || 'all',
      remoteOnly: params.get('remote') === '1',
      beginner: params.get('beginner') === '1',
      portfolio: params.get('portfolio') === '1',
    });
    setSortBy((params.get('sort') as SortId | null) || 'recommended');
    setVisibleCount(6);
  }, [route.mode]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(filters.q), 320);
    return () => window.clearTimeout(timer);
  }, [filters.q]);

  useEffect(() => writeJson(STORAGE_KEYS.favorites, favorites), [favorites]);
  useEffect(() => writeJson(STORAGE_KEYS.compare, compare), [compare]);
  useEffect(() => writeJson(STORAGE_KEYS.applications, applications), [applications]);
  useEffect(() => writeJson(STORAGE_KEYS.portfolio, portfolio), [portfolio]);

  const selectedOpportunity = route.slug
    ? OPPORTUNITIES.find((opportunity) => opportunity.slug === route.slug)
    : undefined;
  const catalogHeroClass = embedded
    ? "relative z-10 w-full overflow-hidden pb-8"
    : "relative z-10 w-full overflow-hidden pb-8 -mt-6";

  const catalogSectionClass = embedded
    ? "relative z-10 mx-auto max-w-7xl px-0"
    : "relative z-10 mx-auto max-w-7xl px-[6%] md:px-[10%]";
  const catalogGridClass = embedded
    ? "relative z-10 mx-auto grid max-w-7xl gap-6 px-0 pb-16 lg:grid-cols-[300px_minmax(0,1fr)]"
    : "relative z-10 mx-auto grid max-w-7xl gap-6 px-[6%] pb-16 md:px-[10%] lg:grid-cols-[300px_minmax(0,1fr)]";
  const pageShellClass = embedded
    ? "relative z-10 mx-auto max-w-7xl px-0 pb-16 pt-4"
    : "relative z-10 mx-auto max-w-7xl px-[6%] pb-20 pt-4 md:px-[10%]";
  const narrowPageShellClass = embedded
    ? "relative z-10 mx-auto max-w-5xl px-0 pb-16 pt-4"
    : "relative z-10 mx-auto max-w-5xl px-[6%] pb-20 pt-4 md:px-[10%]";

  useEffect(() => {
    document.title = routeTitle(route.mode, language, selectedOpportunity);
    const description = selectedOpportunity ? pick(selectedOpportunity.summary, language) : pick(UI.heroText, language);
    const metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (metaDescription) metaDescription.content = description;
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]') || document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = window.location.origin + window.location.pathname;
    document.head.appendChild(canonical);
  }, [language, route.mode, selectedOpportunity]);

  const categoryCounts = useMemo(() => {
    return CATEGORIES.reduce<Record<CategoryId, number>>((acc, category) => {
      acc[category.id] = allOpportunities.filter((opportunity) => opportunity.category === category.id).length;
      return acc;
    }, {} as Record<CategoryId, number>);
  }, []);

  const countries = useMemo(
    () => Array.from(new Set(allOpportunities.map((item) => pick(item.country, language)))).sort((a, b) => a.localeCompare(b)),
    [language],
  );

  const quizScores = useMemo(() => {
    return allOpportunities.reduce<Record<string, number>>((acc, opportunity) => {
      acc[opportunity.id] = scoreOpportunity(opportunity, quiz, language);
      return acc;
    }, {});
  }, [language, quiz]);

  const filtered = useMemo(() => {
    const q = normalizeSearch(debouncedQuery);
    const age = Number(filters.age);
    const grade = Number(filters.grade);

    const result = allOpportunities.filter((opportunity) => {
      if (filters.category !== 'all' && opportunity.category !== filters.category) return false;
      if (filters.direction !== 'all' && opportunity.direction !== filters.direction) return false;
      if (filters.format !== 'all' && opportunity.format !== filters.format) return false;
      if (filters.source !== 'all' && opportunity.source !== filters.source) return false;
      if (filters.cost !== 'all' && opportunity.cost !== filters.cost) return false;
      if (filters.country !== 'all' && pick(opportunity.country, language) !== filters.country) return false;
      if (filters.language !== 'all' && !opportunity.languages.includes(filters.language)) return false;
      if (filters.participation !== 'all' && opportunity.participation !== filters.participation && opportunity.participation !== 'both') return false;
      if (filters.remoteOnly && opportunity.format !== 'online') return false;
      if (filters.beginner && opportunity.minAge > 14) return false;
      if (filters.portfolio && opportunity.portfolioValue < 70) return false;
      if (age && (age < opportunity.minAge || age > opportunity.maxAge)) return false;
      if (grade && !opportunity.grades.includes(grade)) return false;

      const daysLeft = getDaysLeft(opportunity.deadline);
      if (filters.deadline === 'rolling' && opportunity.deadline) return false;
      if (filters.deadline !== 'all' && filters.deadline !== 'rolling') {
        const limit = Number(filters.deadline);
        if (daysLeft === null || daysLeft < 0 || daysLeft > limit) return false;
      }

      if (!q) return true;
      const haystack = normalizeSearch([
        pick(opportunity.title, language),
        pick(opportunity.organizer, language),
        pick(opportunity.summary, language),
        pick(opportunity.description, language),
        pick(CATEGORIES.find((category) => category.id === opportunity.category)?.label || CATEGORIES[0].label, language),
        pick(DIRECTIONS[opportunity.direction], language),
        ...opportunity.skills.map((item) => pick(item, language)),
        pick(opportunity.country, language),
        pick(opportunity.city, language),
        ...opportunity.keywords,
      ].join(' '));

      return haystack.includes(q);
    });

    return result.sort((a, b) => {
      if (sortBy === 'deadline') return (getDaysLeft(a.deadline) ?? 999) - (getDaysLeft(b.deadline) ?? 999);
      if (sortBy === 'match') return (quizScores[b.id] || 0) - (quizScores[a.id] || 0);
      if (sortBy === 'newest') return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      if (sortBy === 'popular') return b.savedCount - a.savedCount;
      return Number(b.recommended) - Number(a.recommended) || Number(b.editorPick) - Number(a.editorPick) || (getDaysLeft(a.deadline) ?? 999) - (getDaysLeft(b.deadline) ?? 999);
    });
  }, [debouncedQuery, filters, language, quizScores, sortBy]);

  const recommended = useMemo(
    () => allOpportunities.filter((opportunity) => opportunity.recommended).slice(0, 4),
    [],
  );

  const urgent = useMemo(
    () => allOpportunities.filter((opportunity) => {
      const days = getDaysLeft(opportunity.deadline);
      return opportunity.finalDeadline && opportunity.registrationOpen && days !== null && days >= 0 && days <= 14;
    }).sort((a, b) => (getDaysLeft(a.deadline) ?? 99) - (getDaysLeft(b.deadline) ?? 99)),
    [],
  );

  const visibleItems = filtered.slice(0, visibleCount);

  const syncFiltersToUrl = (nextFilters: Filters, nextSort = sortBy) => {
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value === '' || value === 'all' || value === false) return;
      params.set(key === 'remoteOnly' ? 'remote' : key, value === true ? '1' : String(value));
    });
    if (nextSort !== 'recommended') params.set('sort', nextSort);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    const catalogPath = currentPath.startsWith('/activities/opportunities') ? '/activities/opportunities' : '/activities/events';
    window.history.replaceState({}, '', `${catalogPath}${suffix}`);
  };

  const updateFilters = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    setVisibleCount(6);
    if (route.mode === 'catalog') syncFiltersToUrl(next);
  };

  const resetFilters = () => {
    const next = createEmptyFilters();
    setFilters(next);
    setDebouncedQuery('');
    setSortBy('recommended');
    setVisibleCount(6);
    if (route.mode === 'catalog') syncFiltersToUrl(next, 'recommended');
  };

  const toggleFavorite = (id: string) => {
    setFavorites((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  };

  const toggleCompare = (id: string) => {
    setCompare((items) => {
      if (items.includes(id)) return items.filter((item) => item !== id);
      return [...items.slice(-2), id];
    });
  };

  const applyToOpportunity = (opportunityId: string) => {
    setApplications((items) => {
      if (items.some((item) => item.opportunityId === opportunityId)) return items;
      return [
        {
          id: `app-${Date.now()}`,
          opportunityId,
          status: 'submitted',
          submittedAt: new Date().toISOString(),
          note: applicationNote.trim(),
        },
        ...items,
      ];
    });
    setApplicationNote('');
    setSubmitStatus('success');
    window.setTimeout(() => setSubmitStatus('idle'), 2400);
  };

  const addPortfolioResult = (opportunity: Opportunity) => {
    setPortfolio((items) => [
      {
        id: `portfolio-${Date.now()}`,
        opportunityId: opportunity.id,
        title: pick(opportunity.title, language),
        result: pick(opportunity.outcomes[0], language),
        createdAt: new Date().toISOString(),
      },
      ...items,
    ]);
  };

  const renderCard = (opportunity: Opportunity) => (
    <OpportunityCard
      key={opportunity.id}
      opportunity={opportunity}
      language={language}
      isFavorite={favorites.includes(opportunity.id)}
      isCompared={compare.includes(opportunity.id)}
      match={quizScores[opportunity.id] || scoreOpportunity(opportunity, EMPTY_QUIZ, language)}
      onFavorite={() => toggleFavorite(opportunity.id)}
      onCompare={() => toggleCompare(opportunity.id)}
    />
  );

  const renderHeaderActions = () => (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => navigate('/activities/opportunities/recommendations')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#bc4638] to-[#bd5b82] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-[#bc4638]/15">
        <Sparkles className="h-4 w-4" />
        {pick(UI.matchMe, language)}
      </button>
      <button onClick={() => navigate('/activities/opportunities/favorites')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/60 bg-white/45 px-4 py-2 text-xs font-semibold text-brand-slate">
        <Heart className="h-4 w-4" />
        {favorites.length}
      </button>
      <button onClick={() => navigate('/activities/opportunities/compare')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/60 bg-white/45 px-4 py-2 text-xs font-semibold text-brand-slate">
        <Scale className="h-4 w-4" />
        {compare.length}
      </button>
    </div>
  );

  const renderCatalog = () => (
    <>
      <section className={catalogHeroClass}>
        {!embedded && (
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-dark/10 to-transparent" />
        )}

        <div className={!embedded ? "mx-auto max-w-7xl px-[6%] md:px-[10%]" : ""}>
        <div className={embedded ? "grid gap-6" : "grid gap-8"}>
        <motion.div {...heroFadeUpLarge} className="space-y-6">
          <div className="space-y-4">
            <h1 className={`${embedded ? "text-3xl sm:text-4xl lg:text-5xl" : "text-4xl sm:text-6xl lg:text-7xl"} font-serif font-semibold leading-[0.98] tracking-tight text-brand-dark`}>
              {pick(UI.title, language)}
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-brand-slate sm:text-base">{pick(UI.heroText, language)}</p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="relative block">
              <span className="sr-only">{pick(UI.search, language)}</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-slate/60" />
              <input
                ref={searchInputRef}
                value={filters.q}
                onChange={(event) => updateFilters({ q: event.target.value })}
                placeholder={pick(UI.search, language)}
                className="min-h-12 w-full rounded-2xl border border-white/65 bg-white/60 py-3 pl-11 pr-4 text-sm text-brand-dark shadow-[0_10px_35px_rgba(91,100,114,0.08)] outline-none backdrop-blur-xl transition-colors placeholder:text-brand-slate/45 focus:border-[#8f99a8]"
              />
            </label>
            <button onClick={() => navigate('/activities/opportunities/recommendations')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-brand-dark px-5 py-3 text-xs font-semibold text-white">
              <Sparkles className="h-4 w-4" />
              {pick(UI.matchMe, language)}
            </button>
          </div>
          {urgent.length > 0 && (
            <div className="rounded-[1.5rem] border border-[#bc4638]/12 bg-[#bc4638]/7 p-4 surface-elevated-soft backdrop-blur-md">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-serif font-semibold text-brand-dark">
                <CalendarClock className="h-5 w-5 text-[#bc4638]" />
                {pick(UI.urgent, language)}
              </h2>
              <div className="grid gap-3 md:grid-cols-3">
                {urgent.slice(0, 3).map((opportunity) => (
                  <button key={opportunity.id} onClick={() => navigate(`/activities/opportunities/${opportunity.slug}`)} className="rounded-2xl bg-white/55 p-4 text-left text-xs text-brand-slate">
                    <span className="font-semibold text-[#bc4638]">{getDaysLeft(opportunity.deadline)} {pick(UI.daysLeft, language)}</span>
                    <div className="mt-1 font-serif text-base font-semibold text-brand-dark">{pick(opportunity.title, language)}</div>
                    <div className="mt-1">{opportunity.registrationOpen ? pick(UI.registrationOpen, language) : pick(UI.registrationClosed, language)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
        </div>
        </div>
      </section>

      <section className={catalogSectionClass}>
        <motion.div {...fadeUp} className="flex gap-2 overflow-x-auto pb-3 scrollbar-soft" aria-label={pick(OPPORTUNITIES_NAV_LABELS, language)}>
          {CATEGORIES.map((category) => {
            const isActive = filters.category === category.id;
            return (
              <button
                key={category.id}
                onClick={() => updateFilters({ category: isActive ? 'all' : category.id })}
                aria-selected={isActive}
                className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-2xl border px-4 py-2 text-[11px] font-semibold uppercase tracking-wide transition-all ${
                  isActive ? 'border-brand-dark bg-brand-dark text-white shadow-md' : 'border-white/60 bg-white/45 text-brand-slate hover:bg-white hover:text-brand-dark'
                }`}
              >
                {category.icon}
                {pick(category.label, language)}
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${isActive ? 'bg-white/15 text-white' : 'bg-brand-dark/6 text-brand-slate'}`}>{categoryCounts[category.id]}</span>
              </button>
            );
          })}
        </motion.div>
      </section>

      <section className={catalogGridClass}>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-3 hidden min-h-11 items-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-4 py-2 text-xs font-semibold text-brand-dark backdrop-blur-md lg:flex">
            <Filter className="h-4 w-4" />
            {pick(UI.filters, language)}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            aria-expanded={showFilters}
            className="mb-3 inline-flex min-h-11 w-full items-center justify-between rounded-2xl border border-white/60 bg-white/55 px-4 py-2 text-xs font-semibold text-brand-dark backdrop-blur-md lg:hidden"
          >
            <span className="inline-flex items-center gap-2"><Filter className="h-4 w-4" />{pick(UI.filters, language)}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} gap-4 rounded-[1.35rem] border border-white/60 bg-white/42 p-4 surface-elevated-soft backdrop-blur-xl lg:grid`}>
            <SelectField label={pick(UI.filters, language)} value={filters.direction} onChange={(value) => updateFilters({ direction: value as DirectionId | 'all' })} options={[{ value: 'all', label: pick(UI.all, language) }, ...Object.entries(DIRECTIONS).map(([value, label]) => ({ value, label: pick(label, language) }))]} />
            <SelectField label={pick(UI.formatLabel, language)} value={filters.format} onChange={(value) => updateFilters({ format: value as FormatId | 'all' })} options={[{ value: 'all', label: pick(UI.all, language) }, ...Object.entries(FORMATS).map(([value, label]) => ({ value, label: pick(label, language) }))]} />
            <SelectField label={pick(UI.sourceLabel, language)} value={filters.source} onChange={(value) => updateFilters({ source: value as SourceId | 'all' })} options={[{ value: 'all', label: pick(UI.all, language) }, { value: 'navykus', label: pick(UI.fromNavykus, language) }, { value: 'verified', label: pick(UI.verified, language) }, { value: 'partner', label: pick(UI.partner, language) }]} />
            <SelectField label={pick(UI.costLabel, language)} value={filters.cost} onChange={(value) => updateFilters({ cost: value as CostId | 'all' })} options={[{ value: 'all', label: pick(UI.all, language) }, ...Object.entries(COSTS).map(([value, label]) => ({ value, label: pick(label, language) }))]} />
            <SelectField label={pick(UI.deadline, language)} value={filters.deadline} onChange={(value) => updateFilters({ deadline: value as Filters['deadline'] })} options={[{ value: 'all', label: pick(UI.all, language) }, { value: '7', label: pick(UI.days7, language) }, { value: '14', label: pick(UI.days14, language) }, { value: '30', label: pick(UI.days30, language) }, { value: 'rolling', label: pick(UI.rolling, language) }]} />
            <SelectField label={pick(UI.countryLabel, language)} value={filters.country} onChange={(value) => updateFilters({ country: value })} options={[{ value: 'all', label: pick(UI.all, language) }, ...countries.map((country) => ({ value: country, label: country }))]} />
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
              <label className="grid min-w-0 gap-2 text-[10px] font-mono uppercase tracking-widest text-brand-dark/70">
                {pick(UI.ageLabel, language)}
                <input value={filters.age} onChange={(event) => updateFilters({ age: event.target.value })} inputMode="numeric" className="min-h-11 min-w-0 w-full rounded-xl border border-[#d8d1cc] bg-white/70 px-3 text-xs outline-none" />
              </label>
              <label className="grid min-w-0 gap-2 text-[10px] font-mono uppercase tracking-widest text-brand-dark/70">
                {pick(UI.gradeLabel, language)}
                <input value={filters.grade} onChange={(event) => updateFilters({ grade: event.target.value })} inputMode="numeric" className="min-h-11 min-w-0 w-full rounded-xl border border-[#d8d1cc] bg-white/70 px-3 text-xs outline-none" />
              </label>
            </div>
            {[
              ['remoteOnly', pick(UI.onlineOnly, language)],
              ['beginner', pick(UI.beginner, language)],
              ['portfolio', pick(UI.portfolioValue, language)],
            ].map(([key, label]) => (
              <label key={key} className="flex min-h-10 items-center gap-3 rounded-xl bg-white/45 px-3 text-xs text-brand-slate">
                <input type="checkbox" checked={Boolean(filters[key as keyof Filters])} onChange={(event) => updateFilters({ [key]: event.target.checked } as Partial<Filters>)} />
                {label}
              </label>
            ))}
            <button type="button" onClick={resetFilters} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d8d1cc] bg-white/55 px-4 py-2 text-xs font-semibold text-brand-slate">
              <RefreshCw className="h-4 w-4" />
              {pick(UI.clearFilters, language)}
            </button>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex flex-col gap-3 rounded-[1.25rem] border border-white/60 bg-white/35 p-3 surface-elevated-soft backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs font-mono uppercase tracking-widest text-brand-slate" aria-live="polite">
              <strong className="text-brand-dark">{filtered.length}</strong> {pick(UI.results, language)}
            </div>
            <SelectField label={pick(UI.sort, language)} value={sortBy} onChange={(value) => { setSortBy(value as SortId); syncFiltersToUrl(filters, value as SortId); }} options={[
              { value: 'recommended', label: pick(UI.recommended, language) },
              { value: 'deadline', label: pick(UI.deadline, language) },
              { value: 'match', label: pick(UI.matchScore, language) },
              { value: 'newest', label: pick(UI.newest, language) },
              { value: 'popular', label: pick(UI.popular, language) },
            ]} />
          </div>
          {isLoading ? (
            <SkeletonGrid />
          ) : visibleItems.length > 0 ? (
            <>
              <motion.div {...catalogStaggerContainer} className="grid items-stretch gap-5 lg:grid-cols-2">
                {visibleItems.map(renderCard)}
              </motion.div>
              {visibleCount < filtered.length && (
                <div className="mt-8 flex justify-center">
                  <button onClick={() => setVisibleCount((value) => value + 6)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-dark px-5 py-2 text-xs font-semibold text-white">
                    <Plus className="h-4 w-4" />
                    {pick(UI.loadMore, language)}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-[1.5rem] border border-white/60 bg-white/45 p-8 text-center surface-elevated-soft backdrop-blur-md">
              <Search className="mx-auto mb-3 h-8 w-8 text-brand-slate/60" />
              <h3 className="font-serif text-2xl font-semibold text-brand-dark">{pick(UI.noResults, language)}</h3>
              <button onClick={() => { resetFilters(); searchInputRef.current?.focus(); }} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand-dark px-5 text-xs font-semibold text-white">
                {pick(UI.clearFilters, language)}
              </button>
            </div>
          )}
        </div>
      </section>

      {recommended.length > 0 && (
        <section className={`${catalogSectionClass} py-8`}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-serif font-semibold text-brand-dark">{pick(UI.recommended, language)}</h2>
            {renderHeaderActions()}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {recommended.map((opportunity) => (
              <button
                key={opportunity.id}onClick={() => navigate(`/activities/opportunities/${opportunity.slug}`)} className="rounded-2xl border border-white/60 bg-white/40 p-4 text-left surface-elevated-soft backdrop-blur-md transition-transform hover:-translate-y-0.5"
              >
                <span className="mb-3 inline-flex rounded-full bg-[#bc4638]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8d3026]">
                  {getSourceLabel(opportunity.source, language)}
                </span>
                <h3 className="text-base font-serif font-semibold leading-tight text-brand-dark">{pick(opportunity.title, language)}</h3>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-brand-slate">{pick(opportunity.summary, language)}</p>
              </button>
            ))}
          </div>
        </section>
      )}

    </>
  );

  const renderDetail = () => {
    if (!selectedOpportunity) {
      return (
        <section className={`${pageShellClass} text-center`}>
          <h1 className="font-serif text-4xl font-semibold text-brand-dark">{pick(UI.noResults, language)}</h1>
          <button onClick={() => navigate('/activities/opportunities')} className="mt-6 rounded-xl bg-brand-dark px-5 py-3 text-xs font-semibold text-white">{pick(OPPORTUNITIES_NAV_LABELS, language)}</button>
        </section>
      );
    }

    const application = applications.find((item) => item.opportunityId === selectedOpportunity.id);
    const schema = {
      '@context': 'https://schema.org',
      '@type': selectedOpportunity.category === 'scholarships' ? 'Scholarship' : selectedOpportunity.category === 'internships' ? 'Internship' : selectedOpportunity.category === 'research' ? 'EducationalOccupationalProgram' : 'Event',
      name: pick(selectedOpportunity.title, language),
      description: pick(selectedOpportunity.summary, language),
      organizer: pick(selectedOpportunity.organizer, language),
      startDate: selectedOpportunity.startDate,
      applicationDeadline: selectedOpportunity.deadline,
    };

    return (
      <section className={pageShellClass}>
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
        <button onClick={() => navigate('/opportunities')} className="mb-8 inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/35 px-4 py-2 text-xs font-mono uppercase tracking-wider text-brand-slate backdrop-blur-md">
          <ArrowRight className="h-3.5 w-3.5 rotate-180" />
          {pick(OPPORTUNITIES_NAV_LABELS, language)}
        </button>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <motion.article {...fadeUpLarge} className="overflow-hidden rounded-[2rem] border border-white/65 bg-white/42 surface-elevated backdrop-blur-xl">
            <div className="relative h-56 overflow-hidden bg-gradient-to-br from-[#bc4638]/15 to-[#bd5b82]/15 sm:h-72">
              <img src={selectedOpportunity.imageUrl} alt={pick(selectedOpportunity.title, language)} className="h-full w-full object-cover opacity-45" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#fffaf7] via-[#fffaf7]/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="mb-3 inline-flex rounded-full bg-white/65 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#bc4638] backdrop-blur-md">
                  {getSourceLabel(selectedOpportunity.source, language)}
                </span>
                <h1 className="max-w-4xl text-4xl font-serif font-semibold leading-tight text-brand-dark sm:text-5xl">{pick(selectedOpportunity.title, language)}</h1>
              </div>
            </div>
            <div className="space-y-8 p-6 sm:p-8">
              <p className="text-base leading-relaxed text-brand-slate">{pick(selectedOpportunity.description, language)}</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <Metric icon={<CalendarClock className="h-4 w-4" />} value={selectedOpportunity.deadline || '∞'} label={pick(UI.deadline, language)} />
                <Metric icon={<Languages className="h-4 w-4" />} value={selectedOpportunity.languages.map((item) => item.toUpperCase()).join(', ')} label={pick(UI.languagesLabel, language)} />
                <Metric icon={<LineChart className="h-4 w-4" />} value={`${quizScores[selectedOpportunity.id]}%`} label={pick(UI.matchScore, language)} />
              </div>
              <section>
                <h2 className="mb-3 font-serif text-2xl font-semibold text-brand-dark">{pick(UI.requirementsLabel, language)}</h2>
                <ul className="grid gap-2">
                  {selectedOpportunity.requirements.map((item) => (
                    <li key={pick(item, language)} className="flex gap-2 text-sm text-brand-slate"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#6b8f71]" />{pick(item, language)}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h2 className="mb-3 font-serif text-2xl font-semibold text-brand-dark">{pick(UI.portfolio, language)}</h2>
                <ul className="grid gap-2">
                  {selectedOpportunity.outcomes.map((item) => (
                    <li key={pick(item, language)} className="flex gap-2 text-sm text-brand-slate"><Award className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a96e]" />{pick(item, language)}</li>
                  ))}
                </ul>
              </section>
            </div>
          </motion.article>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[1.5rem] border border-white/65 bg-white/48 p-5 surface-elevated-soft backdrop-blur-xl">
              <div className="mb-4 grid gap-2 text-xs text-brand-slate">
                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[#bd5b82]" />{pick(selectedOpportunity.country, language)}, {pick(selectedOpportunity.city, language)}</span>
                <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-[#6b8f71]" />{pick(PARTICIPATION[selectedOpportunity.participation], language)}</span>
                <span className="inline-flex items-center gap-2"><CircleDollarSign className="h-4 w-4 text-[#c9a96e]" />{pick(COSTS[selectedOpportunity.cost], language)}</span>
              </div>
              {selectedOpportunity.source === 'navykus' ? (
                <div className="space-y-3">
                  <label className="grid gap-2 text-[10px] font-mono uppercase tracking-widest text-brand-dark/70">
                    {pick(UI.motivationLabel, language)}
                    <textarea value={applicationNote} onChange={(event) => setApplicationNote(event.target.value)} rows={4} className="rounded-xl border border-[#d8d1cc] bg-white/70 p-3 text-xs normal-case tracking-normal outline-none" />
                  </label>
                  <button disabled={Boolean(application)} onClick={() => applyToOpportunity(selectedOpportunity.id)} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#bc4638] to-[#bd5b82] px-5 py-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                    {application ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                    {application ? pick(UI.applicationSaved, language) : pick(UI.apply, language)}
                  </button>
                  <AnimatePresence>
                    {submitStatus === 'success' && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700">
                        {pick(UI.applicationSaved, language)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <a href={selectedOpportunity.externalUrl || '#'} target="_blank" rel="noreferrer" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#bc4638] to-[#bd5b82] px-5 py-3 text-xs font-semibold text-white">
                  {pick(UI.externalApply, language)}
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => toggleFavorite(selectedOpportunity.id)}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5 ${
                    favorites.includes(selectedOpportunity.id)
                      ? 'border-[#bd5b82]/25 bg-[#bd5b82]/12 text-[#8a3859]'
                      : 'border-white/65 bg-white/62 text-brand-slate hover:border-[#bd5b82]/25 hover:text-[#8a3859]'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${favorites.includes(selectedOpportunity.id) ? 'fill-current' : ''}`} />
                  {pick(UI.favorite, language)}
                </button>
                <button
                  onClick={() => toggleCompare(selectedOpportunity.id)}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5 ${
                    compare.includes(selectedOpportunity.id)
                      ? 'border-[#3d6b8f]/25 bg-[#3d6b8f]/12 text-[#274d68]'
                      : 'border-white/65 bg-white/62 text-brand-slate hover:border-[#3d6b8f]/25 hover:text-[#274d68]'
                  }`}
                >
                  <Scale className="h-4 w-4" />
                  {pick(UI.compare, language)}
                </button>
                <button
                  onClick={() => navigate('/find-team')}
                  className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#6b8f71]/25 bg-[#6b8f71]/12 px-3 py-2 text-xs font-semibold text-[#355a40] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#6b8f71]/16"
                >
                  <Users className="h-4 w-4" />
                  {pick(UI.findTeam, language)}
                </button>
              </div>
            </div>
            <button onClick={() => addPortfolioResult(selectedOpportunity)} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#c9a96e]/25 bg-[#c9a96e]/10 px-5 py-3 text-xs font-semibold text-[#7a5c21]">
              <FilePlus2 className="h-4 w-4" />
              {pick(UI.addResult, language)}
            </button>
          </aside>
        </div>
      </section>
    );
  };

  const renderRecommendations = () => {
    const matches = [...OPPORTUNITIES].sort((a, b) => (quizScores[b.id] || 0) - (quizScores[a.id] || 0));
    return (
      <section className={pageShellClass}>
        <Header
          title={pick(UI.recommendationsTitle, language)}
          description={pick(UI.recommendationsDescription, language)}
          language={language}
        />
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="rounded-[1.5rem] border border-white/60 bg-white/42 p-5 surface-elevated-soft backdrop-blur-xl">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-2 text-[10px] font-mono uppercase tracking-widest text-brand-dark/70">
                  {pick(UI.ageLabel, language)}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={10}
                    max={19}
                    placeholder="15"
                    value={quiz.age}
                    onChange={(event) => setQuiz({ ...quiz, age: event.target.value.replace(/\D/g, '').slice(0, 2) })}
                    className="min-h-11 w-full rounded-xl border border-[#d8d1cc] bg-white/70 px-3 text-xs normal-case tracking-normal text-brand-dark outline-none focus:border-brand-dark/45"
                  />
                </label>
                <label className="grid gap-2 text-[10px] font-mono uppercase tracking-widest text-brand-dark/70">
                  {pick(UI.gradeLabel, language)}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={5}
                    max={11}
                    placeholder="9"
                    value={quiz.grade}
                    onChange={(event) => setQuiz({ ...quiz, grade: event.target.value.replace(/\D/g, '').slice(0, 2) })}
                    className="min-h-11 w-full rounded-xl border border-[#d8d1cc] bg-white/70 px-3 text-xs normal-case tracking-normal text-brand-dark outline-none focus:border-brand-dark/45"
                  />
                </label>
              </div>
              <SelectField label={pick(UI.formatLabel, language)} value={quiz.format} onChange={(value) => setQuiz({ ...quiz, format: value as QuizState['format'] })} options={[{ value: 'any', label: pick(UI.any, language) }, ...Object.entries(FORMATS).map(([value, label]) => ({ value, label: pick(label, language) }))]} />
              <SelectField label={pick(UI.costLabel, language)} value={quiz.cost} onChange={(value) => setQuiz({ ...quiz, cost: value as QuizState['cost'] })} options={[{ value: 'any', label: pick(UI.any, language) }, ...Object.entries(COSTS).map(([value, label]) => ({ value, label: pick(label, language) }))]} />
              <SelectField label={pick(UI.teamLabel, language)} value={quiz.participation} onChange={(value) => setQuiz({ ...quiz, participation: value as QuizState['participation'] })} options={[{ value: 'any', label: pick(UI.any, language) }, ...Object.entries(PARTICIPATION).map(([value, label]) => ({ value, label: pick(label, language) }))]} />
              <div className="grid gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-brand-dark/70">{pick(UI.interestsLabel, language)}</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(DIRECTIONS).map(([value, label]) => (
                    <button key={value} onClick={() => setQuiz((state) => ({ ...state, interests: state.interests.includes(value as DirectionId) ? state.interests.filter((item) => item !== value) : [...state.interests, value as DirectionId] }))} className={`rounded-full px-3 py-1.5 text-[11px] ${quiz.interests.includes(value as DirectionId) ? 'bg-brand-dark text-white' : 'bg-white/55 text-brand-slate'}`}>
                      {pick(label, language)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <motion.div {...cardStaggerContainer} className="grid items-stretch gap-5 lg:grid-cols-2">
            {matches.map(renderCard)}
</motion.div>

        {!embedded && (
        <motion.div {...fadeInScale} className="relative hidden min-h-[330px] overflow-hidden rounded-[2rem] border border-white/60 bg-white/35 surface-elevated backdrop-blur-xl lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-[#bc4638]/8 via-transparent to-[#bd5b82]/12" />
          <div className="absolute inset-0 scale-90">
            <GlassCrystal />
          </div>
          <div className="absolute bottom-5 left-5 right-5 grid grid-cols-2 gap-3">
            <Metric icon={<ClipboardCheck className="h-4 w-4" />} value={OPPORTUNITIES.length} label={pick(UI.published, language)} />
            <Metric icon={<Heart className="h-4 w-4" />} value={favorites.length} label={pick(UI.saved, language)} />
          </div>
        </motion.div>
        )}
         </div>
       </section>
    );
  };

  const renderFavorites = () => {
    const items = allOpportunities.filter((opportunity) => favorites.includes(opportunity.id));
    return (
      <section className={pageShellClass}>
        <Header title={pick(UI.favoritesTitle, language)} language={language} />
        {items.length ? <motion.div {...cardStaggerContainer} className="grid items-stretch gap-5 lg:grid-cols-2">{items.map(renderCard)}</motion.div> : <EmptyState language={language} />}
      </section>
    );
  };

  const renderCompare = () => {
    const items = allOpportunities.filter((opportunity) => compare.includes(opportunity.id));
    return (
      <section className={pageShellClass}>
        <Header title={pick(UI.compareTitle, language)} language={language} />
        {items.length ? (
          <div className="overflow-x-auto scrollbar-soft rounded-[1.5rem] border border-white/60 bg-white/42 p-4 surface-elevated-soft backdrop-blur-xl">
            <table className="min-w-[760px] w-full border-separate border-spacing-0 text-left text-sm">
              <tbody>
                {[
                  [pick(UI.titleLabel, language), (item: Opportunity) => pick(item.title, language)],
                  [pick(UI.deadline, language), (item: Opportunity) => item.deadline || pick(UI.rolling, language)],
                  [pick(UI.formatLabel, language), (item: Opportunity) => pick(FORMATS[item.format], language)],
                  [pick(UI.costLabel, language), (item: Opportunity) => pick(COSTS[item.cost], language)],
                  [pick(UI.ageLabel, language), (item: Opportunity) => `${item.minAge}-${item.maxAge}`],
                  [pick(UI.matchScore, language), (item: Opportunity) => `${quizScores[item.id]}%`],
                ].map(([label, getValue]) => (
                  <tr key={String(label)} className="border-b border-white/50">
                    <th className="w-40 px-3 py-4 text-xs uppercase tracking-widest text-brand-slate">{String(label)}</th>
                    {items.map((item) => (
                      <td key={item.id} className="px-3 py-4 text-brand-dark">{(getValue as (item: Opportunity) => string)(item)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState language={language} />}
      </section>
    );
  };

  const renderSubmit = () => {
    const submitProposal = (event: React.FormEvent) => {
      event.preventDefault();
      const proposals = readJson<unknown[]>(STORAGE_KEYS.proposals, []);
      writeJson(STORAGE_KEYS.proposals, [{ ...proposal, status: 'moderation', createdAt: new Date().toISOString() }, ...proposals]);
      setProposal({ title: '', organizer: '', link: '', note: '' });
      setSubmitStatus('success');
      window.setTimeout(() => setSubmitStatus('idle'), 2400);
    };
    return (
      <section className={narrowPageShellClass}>
        <Header title={pick(UI.submitTitle, language)} language={language} />
        <form onSubmit={submitProposal} className="grid gap-4 rounded-[1.5rem] border border-white/60 bg-white/42 p-6 surface-elevated-soft backdrop-blur-xl">
          {(['title', 'organizer', 'link'] as const).map((field) => (
            <label key={field} className="grid gap-2 text-[10px] font-mono uppercase tracking-widest text-brand-dark/70">
              {field === 'title' ? pick(UI.titleLabel, language) : field === 'organizer' ? pick(UI.organizerLabel, language) : pick(UI.linkLabel, language)}
              <input required value={proposal[field]} onChange={(event) => setProposal({ ...proposal, [field]: event.target.value })} className="min-h-12 rounded-xl border border-[#d8d1cc] bg-white/70 px-3 text-sm normal-case tracking-normal outline-none" />
            </label>
          ))}
          <label className="grid gap-2 text-[10px] font-mono uppercase tracking-widest text-brand-dark/70">
            {pick(UI.noteLabel, language)}
            <textarea value={proposal.note} onChange={(event) => setProposal({ ...proposal, note: event.target.value })} rows={5} className="rounded-xl border border-[#d8d1cc] bg-white/70 p-3 text-sm normal-case tracking-normal outline-none" />
          </label>
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-dark px-5 text-xs font-semibold text-white">
            <Send className="h-4 w-4" />
            {pick(UI.submitTitle, language)}
          </button>
          {submitStatus === 'success' && <div className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700">{pick(UI.proposalSaved, language)}</div>}
        </form>
      </section>
    );
  };

  const renderProfile = () => (
    <section className={pageShellClass}>
      <Header title={pick(UI.profileTitle, language)} language={language} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/60 bg-white/42 p-5 surface-elevated-soft backdrop-blur-xl">
          <h2 className="mb-4 font-serif text-2xl font-semibold text-brand-dark">{pick(UI.tracker, language)}</h2>
          <div className="grid gap-3">
            {applications.length ? applications.map((application) => {
              const opportunity = OPPORTUNITIES.find((item) => item.id === application.opportunityId);
              return (
                <div key={application.id} className="rounded-2xl bg-white/55 p-4 text-sm text-brand-slate">
                  <div className="font-semibold text-brand-dark">{opportunity ? pick(opportunity.title, language) : application.opportunityId}</div>
                  <div className="mt-1 inline-flex rounded-full bg-[#bc4638]/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-[#8d3026]">{application.status}</div>
                </div>
              );
            }) : <EmptyState language={language} />}
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-white/60 bg-white/42 p-5 surface-elevated-soft backdrop-blur-xl">
          <h2 className="mb-4 font-serif text-2xl font-semibold text-brand-dark">{pick(UI.portfolio, language)}</h2>
          <div className="grid gap-3">
            {portfolio.length ? portfolio.map((record) => (
              <div key={record.id} className="rounded-2xl bg-white/55 p-4 text-sm text-brand-slate">
                <div className="font-semibold text-brand-dark">{record.title}</div>
                <div className="mt-1">{record.result}</div>
              </div>
            )) : <EmptyState language={language} />}
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="relative w-full overflow-hidden pb-6 text-brand-dark">
      {route.mode === 'catalog' && renderCatalog()}
      {route.mode === 'detail' && renderDetail()}
      {route.mode === 'recommendations' && renderRecommendations()}
      {route.mode === 'favorites' && renderFavorites()}
      {route.mode === 'compare' && renderCompare()}
      {route.mode === 'submit' && renderSubmit()}
      {route.mode === 'profile' && renderProfile()}
    </div>
  );
}

function Header({ title, description, language }: { title: string; description?: string; language: SupportedLanguage }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <button onClick={() => navigate('/opportunities')} className="mb-4 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brand-slate hover:text-[#bc4638]">
          <ArrowRight className="h-3.5 w-3.5 rotate-180" />
          {pick(OPPORTUNITIES_NAV_LABELS, language)}
        </button>
        <h1 className="text-4xl font-serif font-semibold leading-tight text-brand-dark sm:text-5xl">{title}</h1>
        {description && (
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-brand-slate sm:text-base">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyState({ language }: { language: SupportedLanguage }) {
  return (
    <div className="rounded-[1.5rem] border border-white/60 bg-white/42 p-8 text-center surface-elevated-soft backdrop-blur-xl">
      <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-brand-slate/55" />
      <h3 className="font-serif text-2xl font-semibold text-brand-dark">{pick(UI.noResults, language)}</h3>
      <button onClick={() => navigate('/opportunities/recommendations')} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-dark px-5 py-2 text-xs font-semibold text-white">
        <Sparkles className="h-4 w-4" />
        {pick(UI.matchMe, language)}
      </button>
    </div>
  );
}
