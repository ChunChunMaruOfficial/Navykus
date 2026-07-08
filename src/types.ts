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
}

export interface ApplicationForm {
  name: string;
  email: string;
  grade: string;
  city: string;
  interest: string;
  tournamentId?: string;
}

export interface Ticket {
  ticketId: string;
  userName: string;
  email: string;
  date: string;
  coordinate: string;
  status: 'confirmed' | 'pending';
}
