'use client';
import { usePathname } from 'next/navigation';

export const ChampionshipArchiveNavLink = () => {
  const pathname = usePathname() || '';
  const active = pathname === '/admin/championship-archive' || pathname.startsWith('/admin/championship-archive/');
  return (
    <a
      href="/admin/championship-archive"
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
      Архив чемпионатов
    </a>
  );
};

export default ChampionshipArchiveNavLink;
