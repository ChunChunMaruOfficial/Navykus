export interface Tournament {
  id: string;
  title: string;
  type: string;
  date: string;
  registrationDeadline: string;
  description: string;
  skills: string[];
  mentors: string[];
  maxParticipants: number;
  suitableFor?: string;
  format?: string;
}

export interface ApplicationForm {
  name: string;
  email: string;
  grade: string;
  city: string;
  interest: string;
  tournamentId?: string;
  projectFile?: File | null;
}

export interface Ticket {
  ticketId: string;
  userName: string;
  email: string;
  date: string;
  coordinate: string;
  status: 'confirmed' | 'pending';
}

export interface Pillar {
  label: string;
  title: string;
  description: string;
}

export interface Expert {
  id: string;
  name: string;
  type: 'jury' | 'mentor' | 'expert';
  role: string;
  expertise: string;
  description: string;
  photo?: string;
  tournamentId?: string;
  isCmsPlaceholder?: boolean;
}

export interface ParticipationScenario {
  id: string;
  title: string;
  who: string;
  why: string;
  ctaText: string;
  actionType: 'apply' | 'team' | 'activity' | 'general';
}

export interface TrustPoint {
  id: string;
  title: string;
  description: string;
}

export interface FaqItem {
  id: string;
  page: PageKey;
  question: string;
  answer: string;
}

export type PageKey =
  | 'home'
  | 'about'
  | 'championship'
  | 'activities'
  | 'find-team'
  | 'opportunities';

export interface ActivityItem {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  format: string;
  date: string;
  imageUrl: string;
  category: ActivityCategory;
  status: ActivityStatus;
  who: string;
  benefits: string[];
  prerequisites: string;
  ctaText: string;
  ctaLink?: string;
}

export type ActivityCategory =
  | 'educational'
  | 'project'
  | 'social'
  | 'online-meeting'
  | 'workshop'
  | 'team';

export type ActivityStatus = 'coming' | 'ongoing' | 'completed';

export type TeamRole = 'developer' | 'designer' | 'researcher' | 'product_manager' | 'marketer' | 'team_lead' | 'analyst' | 'other';

export type TeamIntent = 'looking_for_team' | 'looking_for_members';

export type ParticipationFormat = 'online' | 'offline' | 'any';

export interface TeamMember {
  id: string;
  name: string;
  age: number;
  country: string;
  city?: string;
  shortBio: string;
  interests: string[];
  skills: string[];
  targetRoles: TeamRole[];
  targetProject?: string;
  whyLooking: string;
  contact: string;
  contactType: 'telegram' | 'email' | 'discord';
  createdAt: string;
  isApproved: boolean;
}

