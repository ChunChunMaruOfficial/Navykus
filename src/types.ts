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
  role: string;
  expertise: string;
  description: string;
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

