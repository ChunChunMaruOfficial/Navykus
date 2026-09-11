import type {
  ActivityItem,
  Expert,
  FaqItem,
  JuryMember,
  TeamMember,
  Tournament,
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

const publicId = (doc: any) => String(doc.id);

/**
 * Resolves a Payload upload relation (populated at depth >= 1) to a URL the
 * public Express server can serve. Files live at `uploads/media/<filename>`
 * and are served from `/media/<filename>`; `doc.url` is not reliable here
 * (it points at the Payload API route), so prefer the filename.
 */
export const mediaUrlFromRelation = (relation: unknown): string | null => {
  if (typeof relation === 'string') return relation || null;
  if (!relation || typeof relation !== 'object') return null;
  const record = relation as Record<string, unknown>;
  if (typeof record.filename === 'string' && record.filename) return `/media/${record.filename}`;
  if (typeof record.url === 'string' && record.url) return record.url;
  return null;
};

const normalizeJury = (rows: unknown): JuryMember[] => (Array.isArray(rows) ? rows : [])
  .map((row: any, index) => ({
    id: String(row?.id || index),
    name: typeof row?.name === 'string' ? row.name.trim() : '',
    role: typeof row?.role === 'string' ? row.role.trim() : '',
    photo: mediaUrlFromRelation(row?.photo) || '',
  }))
  .filter((member) => member.name);

export const normalizeTournament = (doc: any): Tournament => ({
  id: publicId(doc),
  title: doc.title,
  type: doc.type,
  date: doc.date,
  registrationDeadline: doc.registrationDeadline,
  description: doc.description,
  pitch: doc.pitch,
  aboutHeading: doc.aboutHeading || undefined,
  skills: listValues(doc.skills),
  mentors: listValues(doc.mentors),
  maxParticipants: Number(doc.maxParticipants || 0),
  suitableFor: doc.suitableFor,
  format: doc.format,
  targetAudience: doc.targetAudience,
  ageLimit: doc.ageLimit,
  teamsAllowed: doc.teamsAllowed,
  language: doc.language,
  expectedResult: doc.expectedResult,
  themesText: doc.themesText,
  evaluationCriteriaText: doc.evaluationCriteriaText,
  coverImage: mediaUrlFromRelation(doc.coverImage) ?? undefined,
  heroImage: mediaUrlFromRelation(doc.heroImage) ?? undefined,
  aboutImage: mediaUrlFromRelation(doc.aboutImage) ?? undefined,
  registrationStatus: ['open', 'suspended', 'closed'].includes(doc.registrationStatus) ? doc.registrationStatus : 'open',
  seoTitle: doc.seoTitle || undefined,
  seoDescription: doc.seoDescription || undefined,
  jury: normalizeJury(doc.juryMembers),
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
  photo: mediaUrlFromRelation(doc.photo) ?? undefined,
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
  portfolioLink: doc.portfolioLink,
  sourceContext: doc.sourceContext,
  createdAt: doc.createdAt,
  isApproved: Boolean(doc.isApproved),
});

export const normalizeFaq = (doc: any): FaqItem => ({
  id: publicId(doc),
  page: doc.page,
  question: doc.question,
  answer: doc.answer,
});
