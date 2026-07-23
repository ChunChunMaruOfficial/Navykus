import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiUrl } from '../api';
import { useLocalizedData } from '../i18n/useLocalizedData';
import type { TeamMember } from '../types';

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
  const { t } = useTranslation();
  const { teamMembers: fallbackMembers } = useLocalizedData();
  const [cmsMembers, setCmsMembers] = useState<TeamMember[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch(apiUrl('/api/team-members?limit=200&depth=1&sort=-createdAt'))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch team members');
        return res.json();
      })
      .then((data: { docs?: CmsTeamMemberDoc[] } | CmsTeamMemberDoc[]) => {
        if (!isMounted) return;
        const docs = Array.isArray(data) ? data : (data.docs || []);
        const mapped = docs.map(mapCmsTeamMember);
        setCmsMembers(mapped);
      })
      .catch(() => {
        if (isMounted) setCmsMembers([]);
      });

    return () => {
      isMounted = false;
    };
  }, [t]);

  return useMemo(() => {
    if (!cmsMembers?.length) return fallbackMembers;
    return cmsMembers;
  }, [cmsMembers, fallbackMembers]);
};
