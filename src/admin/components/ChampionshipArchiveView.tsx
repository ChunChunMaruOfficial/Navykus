'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@payloadcms/ui';

type MediaRef = { url?: string | null; filename?: string | null } | number | string | null | undefined;

type Championship = {
  id: string | number;
  title?: string | null;
  date?: string | null;
  registrationStatus?: 'open' | 'suspended' | 'closed' | null;
  isFeatured?: boolean | null;
  _status?: 'draft' | 'published' | null;
  coverImage?: MediaRef;
  heroImage?: MediaRef;
  updatedAt?: string | null;
};

const ADMIN_BASE = '/admin/collections/tournaments';

const REGISTRATION_LABELS: Record<string, string> = {
  open: 'Регистрация открыта',
  suspended: 'Регистрация приостановлена',
  closed: 'Регистрация закрыта',
};

const imageUrl = (media: MediaRef) => {
  if (!media || typeof media !== 'object') return '';
  return media.url || (media.filename ? `/payload-api/media/file/${encodeURIComponent(media.filename)}` : '');
};

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};

const ChampionshipArchiveView = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | number | null>(null);

  const headers = useMemo<Record<string, string>>(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `JWT ${token}` } : {}),
  }), [token]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/payload-api/tournaments?limit=200&depth=1&sort=-updatedAt', {
        credentials: 'include',
        headers,
      });
      if (!res.ok) throw new Error(`Не удалось загрузить чемпионаты (${res.status})`);
      const json = await res.json();
      setItems((json.docs || []) as Championship[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    void load();
  }, [load]);

  const active = items.find((item) => item.isFeatured);
  const archive = items.filter((item) => !item.isFeatured);

  const activate = async (item: Championship) => {
    const current = active?.title ? `«${active.title}» уйдёт в архив.` : '';
    if (!window.confirm(`Сделать «${item.title || 'без названия'}» активным чемпионатом? Он появится на главной и на странице «Чемпионат». ${current}`)) return;
    setActivatingId(item.id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/payload-api/tournaments/${encodeURIComponent(String(item.id))}`, {
        method: 'PATCH',
        credentials: 'include',
        headers,
        body: JSON.stringify({ isFeatured: true }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const details = (json?.errors?.[0]?.data?.errors || json?.errors || [])
          .map((err: { message?: string; label?: string; path?: string }) => err.label || err.path || err.message)
          .filter(Boolean)
          .join(', ');
        throw new Error(details ? `Не удалось активировать: заполните обязательные поля (${details}).` : `Не удалось активировать (${res.status}).`);
      }
      setNotice(`«${item.title || 'Чемпионат'}» теперь активный. Предыдущий перенесён в архив.`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActivatingId(null);
    }
  };

  const card: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '120px minmax(0, 1fr) auto',
    gap: 16,
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    border: '1px solid var(--theme-elevation-150)',
    background: 'var(--theme-elevation-50)',
    marginBottom: 10,
  };
  const thumb: React.CSSProperties = {
    width: 120,
    height: 72,
    borderRadius: 6,
    objectFit: 'cover',
    background: 'var(--theme-elevation-150)',
    display: 'block',
  };
  const button: React.CSSProperties = {
    display: 'inline-block',
    padding: '7px 14px',
    borderRadius: 4,
    border: '1px solid var(--theme-elevation-250)',
    background: 'var(--theme-elevation-100)',
    color: 'var(--theme-text)',
    fontSize: 13,
    cursor: 'pointer',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
  const primary: React.CSSProperties = {
    ...button,
    background: 'var(--theme-elevation-800)',
    borderColor: 'var(--theme-elevation-800)',
    color: 'var(--theme-elevation-0)',
  };
  const badge = (color: string, background: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    color,
    background,
    marginRight: 6,
  });

  const renderRow = (item: Championship, isActive: boolean) => {
    const src = imageUrl(item.coverImage) || imageUrl(item.heroImage);
    const isPublished = item._status !== 'draft';
    return (
      <div key={item.id} style={card}>
        {src ? <img src={src} alt="" style={thumb} /> : <div style={thumb} />}
        <div style={{ minWidth: 0 }}>
          <div style={{ marginBottom: 4 }}>
            {isActive && <span style={badge('#067647', '#ecfdf3')}>Активный</span>}
            {!isPublished && <span style={badge('#b54708', '#fffae6')}>Черновик</span>}
            {item.registrationStatus && (
              <span style={{ fontSize: 12, color: 'var(--theme-elevation-600)' }}>{REGISTRATION_LABELS[item.registrationStatus]}</span>
            )}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.title || 'Без названия'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--theme-elevation-600)', marginTop: 2 }}>
            {[item.date, item.updatedAt ? `изменён ${formatDate(item.updatedAt)}` : ''].filter(Boolean).join(' · ')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <a href={`${ADMIN_BASE}/${item.id}`} style={button}>{isActive ? 'Редактировать' : 'Открыть'}</a>
          {!isActive && (
            <button
              type="button"
              style={{ ...primary, opacity: isPublished && activatingId == null ? 1 : 0.5 }}
              disabled={!isPublished || activatingId != null}
              title={isPublished ? '' : 'Сначала опубликуйте чемпионат'}
              onClick={() => activate(item)}
            >
              {activatingId === item.id ? 'Активация…' : 'Сделать активным'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto', color: 'var(--theme-text)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, margin: '0 0 6px' }}>Архив чемпионатов</h1>
          <p style={{ margin: 0, color: 'var(--theme-elevation-600)', maxWidth: 640 }}>
            На сайте всегда показывается один — активный — чемпионат. Здесь можно открыть прошлые чемпионаты
            и вернуть любой из них на сайт: текущий активный при этом автоматически уйдёт в архив.
          </p>
        </div>
        <a href={`${ADMIN_BASE}/create`} style={primary}>+ Новый чемпионат</a>
      </div>
      <p style={{ fontSize: 12, color: 'var(--theme-elevation-500)', margin: '8px 0 20px' }}>
        Новый чемпионат сначала сохраняется в архив (если активный уже есть) — подготовьте и опубликуйте его, затем нажмите «Сделать активным».
      </p>

      {notice && <div style={{ padding: 12, borderRadius: 6, background: '#ecfdf3', color: '#067647', marginBottom: 16 }}>{notice}</div>}
      {error && <div style={{ padding: 12, borderRadius: 6, background: '#fef3f2', color: '#b42318', marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div>Загрузка…</div>
      ) : (
        <>
          <h2 style={{ fontSize: 15, margin: '0 0 10px' }}>Сейчас на сайте</h2>
          {active ? renderRow(active, true) : (
            <div style={{ ...card, display: 'block', color: 'var(--theme-elevation-600)' }}>
              Активного чемпионата нет — сайт не показывает блок чемпионата. Выберите чемпионат ниже и нажмите «Сделать активным».
            </div>
          )}

          <h2 style={{ fontSize: 15, margin: '24px 0 10px' }}>Архив ({archive.length})</h2>
          {archive.length ? archive.map((item) => renderRow(item, false)) : (
            <div style={{ color: 'var(--theme-elevation-600)' }}>В архиве пока пусто.</div>
          )}
        </>
      )}
    </div>
  );
};

export default ChampionshipArchiveView;
