'use client';
import { usePathname } from 'next/navigation';

export const MediaTreeNavLink = () => {
  const pathname = usePathname() || '';
  const active = pathname === '/admin/media-tree' || pathname.startsWith('/admin/media-tree/');
  return (
    <a
      href="/admin/media-tree"
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
      Дерево медиа
    </a>
  );
};

export default MediaTreeNavLink;