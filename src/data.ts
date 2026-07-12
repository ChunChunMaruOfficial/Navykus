import ru from './i18n/locales/ru/translation.json';
import type {
  ActivityItem,
  Expert,
  ParticipationScenario,
  Pillar,
  TeamMember,
  Tournament,
  TrustPoint,
} from './types';

const data = ru.data;

export const TOURNAMENTS = data.tournaments as Tournament[];
export const PILLARS = data.pillars as Pillar[];
export const EXPERTS = data.experts as Expert[];
export const SCENARIOS = data.scenarios as ParticipationScenario[];
export const TRUST_POINTS = data.trustPoints as TrustPoint[];
export const STATS = data.stats;
export const ACTIVITIES = data.activities as ActivityItem[];
export const TEAM_MEMBERS = data.teamMembers as TeamMember[];
