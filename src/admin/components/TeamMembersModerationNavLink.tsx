'use client';

import { usePathname } from 'next/navigation';

export const TeamMembersModerationNavLink = () => {
  const pathname = usePathname() || '';
  const active = pathname === '/admin/team-members-moderation' || pathname.startsWith('/admin/team-members-moderation/');
  return (
    <a
      href="/admin/team-members-moderation"
      style={{
        display: 'block',
        padding: '10px 16px',
        textDecoration: 'none',
        fontSize: 14,
        fontWeight: active ? 600 : 400,
        color: 'var(--theme-text)',
        background: active ? 'var(--theme-elevation-100)' : 'transparent',
      }}
    >
      Модерация анкет
    </a>
  );
};

export default TeamMembersModerationNavLink;
