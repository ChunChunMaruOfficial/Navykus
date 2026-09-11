'use client';

import { useRowLabel } from '@payloadcms/ui';

/** Array row title in «Жюри»: the person's name instead of «Член жюри 01». */
export const JuryRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ name?: string }>();
  const name = typeof data?.name === 'string' ? data.name.trim() : '';
  return <span>{name || `Член жюри ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`}</span>;
};

export default JuryRowLabel;
