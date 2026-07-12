import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  ActivityItem,
  Expert,
  ParticipationScenario,
  Pillar,
  TeamMember,
  Tournament,
  TrustPoint,
} from '../types';

type LocalizedData = {
  tournaments: Tournament[];
  pillars: Pillar[];
  experts: Expert[];
  scenarios: ParticipationScenario[];
  trustPoints: TrustPoint[];
  stats: Array<{ value: string; label: string }>;
  activities: ActivityItem[];
  teamMembers: TeamMember[];
};

export const useLocalizedData = () => {
  const { t, i18n } = useTranslation();

  return useMemo(
    () => t('data', { returnObjects: true }) as LocalizedData,
    [i18n.resolvedLanguage, i18n.language, t],
  );
};
