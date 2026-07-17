import { useEffect, useMemo, useState } from 'react';

export type CmsTournamentDoc = {
  id: string | number;
  title: string;
  type: string;
  description: string;
  date: string;
  registrationDeadline: string;
  maxParticipants: number;
  skills?: Array<{ value: string }> | string[];
  mentors?: Array<{ value: string }> | string[];
  suitableFor?: string;
  format?: string;
};

export type CmsMappedTournament = {
  id: string;
  title: string;
  type: string;
  description: string;
  date: string;
  registrationDeadline: string;
  maxParticipants: number;
  skills: string[];
  mentors: string[];
  suitableFor: string;
  format: string;
};

const listValues = (items: unknown): string[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object' && 'value' in item) return String((item as { value: string }).value || '');
    return '';
  }).filter(Boolean);
};

const mapCmsDoc = (doc: CmsTournamentDoc): CmsMappedTournament => ({
  id: String(doc.id),
  title: doc.title,
  type: doc.type || '',
  description: doc.description || '',
  date: doc.date || '',
  registrationDeadline: doc.registrationDeadline || '',
  maxParticipants: doc.maxParticipants || 0,
  skills: listValues(doc.skills),
  mentors: listValues(doc.mentors),
  suitableFor: doc.suitableFor || '',
  format: doc.format || '',
});

export const useCmsTournaments = () => {
  const [tournaments, setTournaments] = useState<CmsMappedTournament[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    const apiBase = (import.meta as any).env?.VITE_API_URL || ((import.meta as any).env?.DEV ? 'http://localhost:4000' : '');

    fetch(`${apiBase}/api/championships?limit=50`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch tournaments');
        return res.json();
      })
      .then((data: { docs: CmsTournamentDoc[] }) => {
        if (!isMounted) return;
        setTournaments(data.docs.map(mapCmsDoc));
      })
      .catch(() => {
        if (isMounted) setTournaments([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return tournaments;
};
