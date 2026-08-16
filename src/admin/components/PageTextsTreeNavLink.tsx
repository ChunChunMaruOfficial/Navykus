'use client';
import { usePathname } from 'next/navigation';

export const PageTextsTreeNavLink = () => {
  const pathname = usePathname() || '';
  const active = pathname === '/admin/page-texts-tree' || pathname.startsWith('/admin/page-texts-tree/');
  return (
    <a
      href="/admin/page-texts-tree"
      style={{
        display: 'block',
        padding: '10px 16px',
        textDecoration: 'none',
        fontSize: 14,
        fontWeight: active ? 600 : 400,
        color: active ? 'inherit' : '#666',
        background: active ? 'rgba(0,0,0,0.06)' : 'transparent',
      }}
    >
      Дерево текстов
    </a>
  );
};

export default PageTextsTreeNavLink;
