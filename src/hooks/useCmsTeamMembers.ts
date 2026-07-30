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
  contactType: 'telegram' | 'email' | 'discord';
  isApproved: boolean;
  createdAt: string;
};

const mapCmsTeamMember = (doc: CmsTeamMemberDoc): TeamMember => ({
  id: String(doc.id),
  name: doc.name,
  age: doc.age,
  country: doc.country,
  city: doc.city,
  shortBio: doc.shortBio,
  interests: Array.isArray(doc.interests)
    ? doc.interests.map((i: string | { value: string }) => (typeof i === 'string' ? i : i.value))
    : [],
  skills: Array.isArray(doc.skills)
    ? doc.skills.map((s: string | { value: string }) => (typeof s === 'string' ? s : s.value))
    : [],
  targetRoles: doc.targetRoles as TeamMember['targetRoles'],
  targetProject: doc.targetProject,
  whyLooking: doc.whyLooking,
  contact: doc.contact,
  contactType: doc.contactType,
  createdAt: doc.createdAt,
  isApproved: doc.isApproved,
});

export const useCmsTeamMembers = () => {
  const language = useCmsLanguage();
  return useCmsCollection<CmsTeamMemberDoc, TeamMember>({
    path: `/api/team-members?limit=200&depth=1&sort=-createdAt&lang=${encodeURIComponent(language)}`,
    map: mapCmsTeamMember,
  }).data || [];
};
