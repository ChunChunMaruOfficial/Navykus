import type {
  ActivityItem,
  Expert,
  FaqItem,
  ParticipationScenario,
  Pillar,
  TeamMember,
  Tournament,
  TrustPoint,
} from '../src/types';

const listValues = (items: unknown): string[] => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'value' in item) return String(item.value || '');
      return '';
    })
    .filter(Boolean);
};

const publicId = (doc: any) => String(doc.legacyId || doc.id);

export const normalizeTournament = (doc: any): Tournament => ({
  id: publicId(doc),
  title: doc.title,
  type: doc.type,
  date: doc.date,
  registrationDeadline: doc.registrationDeadline,
  description: doc.description,
  skills: listValues(doc.skills),
  mentors: listValues(doc.mentors),
  maxParticipants: Number(doc.maxParticipants || 0),
  suitableFor: doc.suitableFor,
  format: doc.format,
});

export const normalizeActivity = (doc: any): ActivityItem => ({
  id: publicId(doc),
  title: doc.title,
  shortDescription: doc.shortDescription,
  fullDescription: doc.fullDescription,
  format: doc.format,
  date: doc.date,
  imageUrl: doc.imageUrl,
  category: doc.category,
  status: doc.status,
  who: doc.who,
  benefits: listValues(doc.benefits),
  prerequisites: doc.prerequisites,
  ctaText: doc.ctaText,
  ctaLink: doc.ctaLink,
});

export const normalizeExpert = (doc: any): Expert => ({
  id: publicId(doc),
  name: doc.name,
  type: doc.type || 'expert',
  role: doc.role,
  expertise: doc.expertise,
  description: doc.description,
  photo: typeof doc.photo === 'object' && doc.photo ? doc.photo.url : doc.photo,
  tournamentId: typeof doc.tournamentId === 'object' && doc.tournamentId
    ? publicId(doc.tournamentId)
    : doc.tournamentId || undefined,
});

export const normalizeTeamMember = (doc: any): TeamMember => ({
  id: publicId(doc),
  name: doc.name,
  age: Number(doc.age || 0),
  country: doc.country,
  city: doc.city,
  shortBio: doc.shortBio,
  interests: listValues(doc.interests),
  skills: listValues(doc.skills),
  targetRoles: Array.isArray(doc.targetRoles) ? doc.targetRoles : [],
  targetProject: doc.targetProject,
  whyLooking: doc.whyLooking,
  contact: doc.contact,
  contactType: doc.contactType,
  createdAt: doc.createdAt,
  isApproved: Boolean(doc.isApproved),
});

export const normalizeTrustPoint = (doc: any): TrustPoint => ({
  id: publicId(doc),
  title: doc.title,
  description: doc.description,
});

export const normalizePillar = (doc: any): Pillar => ({
  label: doc.label,
  title: doc.title,
  description: doc.description,
});

export const normalizeFaq = (doc: any): FaqItem => ({
  id: publicId(doc),
  page: doc.page,
  question: doc.question,
  answer: doc.answer,
});

export const normalizeStat = (doc: any) => ({
  value: doc.value,
  label: doc.label,
});

export const normalizeScenario = (doc: any): ParticipationScenario => ({
  id: publicId(doc),
  title: doc.title,
  who: doc.who,
  why: doc.why,
  ctaText: doc.ctaText,
  actionType: doc.actionType || 'general',
});
