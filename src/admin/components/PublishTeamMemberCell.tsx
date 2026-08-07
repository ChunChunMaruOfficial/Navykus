'use client';

import { useRouter } from 'next/navigation';
import { useState, type MouseEvent } from 'react';

type PublishTeamMemberRowData = {
  id?: string | number;
  moderationStatus?: string;
  isApproved?: boolean;
  _status?: string;
};

type PublishTeamMemberCellProps = {
  rowData?: PublishTeamMemberRowData;
};

export const PublishTeamMemberCell = ({ rowData }: PublishTeamMemberCellProps) => {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const id = rowData?.id;
  const isPublished = state === 'done'
    || (rowData?.moderationStatus === 'approved'
      && rowData?.isApproved === true
      && (rowData?._status === undefined || rowData?._status === 'published'));
  const disabled = !id || isPublished || state === 'saving';

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!id || disabled) return;

    setState('saving');

    try {
      const response = await fetch(`/payload-api/team-members/${encodeURIComponent(String(id))}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moderationStatus: 'approved',
          isApproved: true,
          _status: 'published',
          reviewedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish team member');
      }

      setState('done');
      router.refresh();
    } catch {
      setState('error');
    }
  };

  const label = state === 'saving' ? 'Публикуем...' : isPublished ? 'Опубликован' : 'Опубликовать';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={state === 'error' ? 'Не удалось опубликовать' : undefined}
      style={{
        minHeight: '30px',
        padding: '5px 10px',
        borderRadius: '4px',
        border: '1px solid',
        borderColor: state === 'error' ? '#b42318' : isPublished ? '#d0d5dd' : '#175cd3',
        background: state === 'error' ? '#fef3f2' : isPublished ? '#f2f4f7' : '#eff8ff',
        color: state === 'error' ? '#b42318' : isPublished ? '#667085' : '#175cd3',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: '12px',
        fontWeight: 600,
        lineHeight: 1.25,
        opacity: state === 'saving' ? 0.75 : 1,
      }}
    >
      {label}
    </button>
  );
};

export default PublishTeamMemberCell;
