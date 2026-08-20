import type { TeamMember } from '../types';
import { useCmsCollection, useCmsLanguage } from './useCmsCollection';

type CmsTeamMemberDoc = {
  id: string | number;
  name: string;
  age: number;
  country: string;
  city?: string;
  shortBio: string;
  interests: string[] | Array<{ value: string }>;
  skills: string[] | Array<{ value: string }>;
  targetRoles: string[];
  targetProject?: string;
  whyLooking: string;
  contact: string;
  contactType: 'telegram' | 'email';
  isApproved: boolean;
  createdAt: string;
};

const mapCmsTeamMember = (doc: CmsTeamMemberDoc): TeamMember => ({
  id: String(doc.id),
  name: doc.name?.trim() || '',
  age: doc.age,
  country: doc.country?.trim() || '',
  city: doc.city?.trim() || '',
  shortBio: doc.shortBio?.trim() || '',
  interests: Array.isArray(doc.interests)
    ? doc.interests.map((i: string | { value: string }) => (typeof i === 'string' ? i : i.value)).map((value) => value.trim()).filter(Boolean)
    : [],
  skills: Array.isArray(doc.skills)
    ? doc.skills.map((s: string | { value: string }) => (typeof s === 'string' ? s : s.value)).map((value) => value.trim()).filter(Boolean)
    : [],
  targetRoles: doc.targetRoles as TeamMember['targetRoles'],
  targetProject: doc.targetProject?.trim() || '',
  whyLooking: doc.whyLooking?.trim() || '',
  contact: doc.contact,
  contactType: doc.contactType,
  createdAt: doc.createdAt,
  isApproved: doc.isApproved,
});

const hasVisibleTeamMemberText = (doc: TeamMember) =>
  Boolean(doc.name || doc.country || doc.city || doc.shortBio || doc.whyLooking || doc.targetProject || doc.interests.length || doc.skills.length);

export const useCmsTeamMembers = () => {
  const language = useCmsLanguage();
  return useCmsCollection<CmsTeamMemberDoc, TeamMember>({
    path: `/api/team-members?limit=200&depth=1&sort=-createdAt&lang=${encodeURIComponent(language)}`,
    map: mapCmsTeamMember,
    filter: hasVisibleTeamMemberText,
  }).data || [];
};
