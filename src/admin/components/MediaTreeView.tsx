'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@payloadcms/ui';

import { PAGE_MEDIA_SLOTS, type PageImageSlot } from '../../page-media';

type SlotRow = {
  id: string | number;
  slotKey: string;
  page?: string | null;
  blockName?: string | null;
  label?: string | null;
  hidden?: boolean | null;
  image?:
    | {
        id: string | number;
        url?: string | null;
        filename?: string | null;
        alt?: string | null;
        mimeType?: string | null;
      }
    | string
    | number
    | null;
};

const PAGE_LABELS: Record<string, string> = {
  global: 'Общие медиа',
  home: 'Главная',
  about: 'О проекте',
  championship: 'Чемпионат',
  activities: 'Активности',
  'find-team': 'Поиск команды',
  legal: 'Юридические страницы',
};

const PAGE_ORDER = ['home', 'about', 'championship', 'activities', 'find-team', 'legal', 'global'];

const mediaFileUrl = (image: SlotRow['image']): string | null => {
  if (!image || typeof image !== 'object') return null;
  // Payload's own URL is served by the admin app; fall back to the site's
  // static /media mount only when it is missing.
  if (image.url) return image.url;
  if (image.filename) return `/media/${image.filename}`;
  return null;
};

const MediaTreeView = () => {
  const { token } = useAuth();
  const [rows, setRows] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const authHeaders = useMemo(() => (token ? { Authorization: `JWT ${token}` } : {}), [token]);

  const jsonRequest = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const res = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: { ...options.headers, ...authHeaders, 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        let message = `${options.method || 'GET'} ${url} → ${res.status}`;
        try {
          const body = await res.json();
          if (body?.errors?.[0]?.message) message = body.errors[0].message;
          else if (body?.message) message = body.message;
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }
      return res.json();
    },
    [authHeaders],
  );

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await jsonRequest('/payload-api/page-media-slots?limit=500&depth=1');
      setRows((json.docs as SlotRow[]) || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [jsonRequest]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const rowBySlot = useMemo(() => {
    const map = new Map<string, SlotRow>();
    for (const row of rows) map.set(row.slotKey, row);
    return map;
  }, [rows]);

  const grouped = useMemo(() => {
    const byPage: Record<string, Record<string, PageImageSlot[]>> = {};
    for (const slot of PAGE_MEDIA_SLOTS) {
      byPage[slot.page] = byPage[slot.page] || {};
      byPage[slot.page][slot.blockName] = byPage[slot.page][slot.blockName] || [];
      byPage[slot.page][slot.blockName].push(slot);
    }
    return byPage;
  }, []);

  const orphanRows = useMemo(() => {
    const known = new Set(PAGE_MEDIA_SLOTS.map((s) => s.slotKey));
    return rows.filter((r) => !known.has(r.slotKey));
  }, [rows]);

  const pages = useMemo(
    () => PAGE_ORDER.filter((p) => grouped[p]),
    [grouped],
  );

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const upsertRow = useCallback(
    async (slot: PageImageSlot, patch: Record<string, unknown>) => {
      const existing = rowBySlot.get(slot.slotKey);
      if (existing) {
        await jsonRequest(`/payload-api/page-media-slots/${existing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        });
      } else {
        await jsonRequest('/payload-api/page-media-slots', {
          method: 'POST',
          body: JSON.stringify({
            slotKey: slot.slotKey,
            page: slot.page,
            blockName: slot.blockName,
            label: slot.label,
            hidden: false,
            ...patch,
          }),
        });
      }
    },
    [jsonRequest, rowBySlot],
  );

  const handleReplace = useCallback(
    async (slot: PageImageSlot, file: File) => {
      setBusySlot(slot.slotKey);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('alt', slot.label);
        formData.append('page', slot.page);
        formData.append('blockName', slot.blockName);
        const uploadRes = await fetch('/payload-api/media', {
          method: 'POST',
          credentials: 'include',
          headers: { ...authHeaders },
          body: formData,
        });
        if (!uploadRes.ok) {
          const body = await uploadRes.json().catch(() => ({}));
          throw new Error(body?.errors?.[0]?.message || body?.message || `upload → ${uploadRes.status}`);
        }
        const uploaded = await uploadRes.json();
        const mediaId = uploaded?.doc?.id ?? uploaded?.id;
        if (!mediaId) throw new Error('Не удалось получить ID загруженного файла');
        await upsertRow(slot, { image: mediaId, hidden: false });
        await loadRows();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusySlot(null);
      }
    },
    [authHeaders, upsertRow, loadRows],
  );

  const handleToggleHidden = useCallback(
    async (slot: PageImageSlot, hidden: boolean) => {
      setBusySlot(slot.slotKey);
      setError(null);
      try {
        await upsertRow(slot, { hidden });
        await loadRows();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusySlot(null);
      }
    },
    [upsertRow, loadRows],
  );

  const handleResetToOriginal = useCallback(
    async (slot: PageImageSlot) => {
      const existing = rowBySlot.get(slot.slotKey);
      if (!existing) return;
      if (!window.confirm('Вернуть стандартное изображение для этого блока?')) return;
      setBusySlot(slot.slotKey);
      setError(null);
      try {
        await jsonRequest(`/payload-api/page-media-slots/${existing.id}`, { method: 'DELETE' });
        await loadRows();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusySlot(null);
      }
    },
    [jsonRequest, loadRows, rowBySlot],
  );

  const deleteOrphan = useCallback(
    async (row: SlotRow) => {
      if (!window.confirm(`Удалить запись «${row.slotKey}»?`)) return;
      setError(null);
      try {
        await jsonRequest(`/payload-api/page-media-slots/${row.id}`, { method: 'DELETE' });
        await loadRows();
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [jsonRequest, loadRows],
  );

  const themeVars: React.CSSProperties = { background: 'var(--theme-bg)', color: 'var(--theme-text)' };
  const cardStyle: React.CSSProperties = {
    background: 'var(--theme-elevation-100)',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 8,
    padding: 12,
    margin: '8px 0',
  };
  const btnStyle: React.CSSProperties = {
    background: 'var(--theme-elevation-150)',
    color: 'var(--theme-text)',
    border: '1px solid var(--theme-elevation-200)',
    padding: '6px 12px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
  };
  const primaryBtnStyle: React.CSSProperties = {
    ...btnStyle,
    background: 'var(--theme-elevation-700)',
    color: 'var(--theme-elevation-0)',
    borderColor: 'var(--theme-elevation-700)',
  };
  const dangerBtnStyle: React.CSSProperties = {
    ...btnStyle,
    background: 'var(--theme-error-100)',
    color: 'var(--theme-error-500)',
    borderColor: 'var(--theme-error-300)',
  };
  const previewStyle: React.CSSProperties = {
    width: 140,
    height: 88,
    objectFit: 'cover',
    borderRadius: 6,
    border: '1px solid var(--theme-elevation-150)',
    background: 'var(--theme-elevation-50)',
    flexShrink: 0,
  };

  if (loading) return <div style={{ padding: 24, ...themeVars }}>Загрузка…</div>;

  const renderSlotCard = (slot: PageImageSlot) => {
    const row = rowBySlot.get(slot.slotKey);
    const image = row && typeof row.image === 'object' ? row.image : null;
    const overrideUrl = mediaFileUrl(row?.image ?? null);
    const isHidden = Boolean(row?.hidden);
    const isReplaced = Boolean(overrideUrl) && !isHidden;
    const previewUrl = isHidden ? null : overrideUrl || slot.fallbackSrc;
    const busy = busySlot === slot.slotKey;

    let status = 'Стандартное изображение';
    let statusColor = 'var(--theme-elevation-500)';
    if (isHidden) {
      status = 'Скрыто на сайте';
      statusColor = 'var(--theme-error-500)';
    } else if (isReplaced) {
      status = 'Заменено администратором';
      statusColor = 'var(--theme-success-500)';
    }

    return (
      <div key={slot.slotKey} style={cardStyle}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {previewUrl ? (
            <img src={previewUrl} alt={slot.label} style={previewStyle} />
          ) : (
            <div
              style={{
                ...previewStyle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: 'var(--theme-elevation-500)',
              }}
            >
              нет изображения
            </div>
          )}
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{slot.label}</div>
            <div style={{ fontSize: 12, color: statusColor, marginTop: 2 }}>{status}</div>
            <div style={{ fontSize: 11, color: 'var(--theme-elevation-400)', fontFamily: 'monospace', marginTop: 4 }}>
              {slot.slotKey}
              {image?.filename ? ` · ${image.filename}` : ''}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              <input
                ref={(el) => {
                  fileInputs.current[slot.slotKey] = el;
                }}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleReplace(slot, file);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                style={primaryBtnStyle}
                disabled={busy}
                onClick={() => fileInputs.current[slot.slotKey]?.click()}
              >
                {busy ? 'Загрузка…' : isReplaced ? 'Загрузить другое' : 'Заменить изображение'}
              </button>

              {isHidden ? (
                <button type="button" style={btnStyle} disabled={busy} onClick={() => handleToggleHidden(slot, false)}>
                  Показать на сайте
                </button>
              ) : (
                <button type="button" style={btnStyle} disabled={busy} onClick={() => handleToggleHidden(slot, true)}>
                  Убрать с сайта
                </button>
              )}

              {row && (
                <button
                  type="button"
                  style={dangerBtnStyle}
                  disabled={busy}
                  onClick={() => handleResetToOriginal(slot)}
                >
                  Вернуть стандартное
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: 'inherit', padding: 24, maxWidth: 1100, margin: '0 auto', ...themeVars }}>
      <h1 style={{ fontSize: 24, marginBottom: 8, marginTop: 0 }}>Дерево медиа</h1>
      <p style={{ color: 'var(--theme-elevation-600)', marginTop: 0, marginBottom: 16 }}>
        Изображения страниц сайта: Страница → Блок → Изображение. Замените картинку своим файлом,
        уберите её с сайта или верните стандартную.
      </p>

      {error && (
        <div
          style={{
            padding: '10px 14px',
            marginBottom: 16,
            borderRadius: 6,
            background: 'var(--theme-error-100)',
            color: 'var(--theme-error-500)',
            border: '1px solid var(--theme-error-300)',
          }}
        >
          {error}
        </div>
      )}

      {pages.map((page) => {
        const blocks = grouped[page];
        const pKey = `p:${page}`;
        const pOpen = expanded[pKey] ?? true;
        const blockNames = Object.keys(blocks);
        const slotCount = blockNames.reduce((n, b) => n + blocks[b].length, 0);
        return (
          <div
            key={page}
            style={{
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: 8,
              margin: '10px 0',
              overflow: 'hidden',
            }}
          >
            <div
              onClick={() => toggle(pKey)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                background: 'var(--theme-elevation-100)',
                fontWeight: 600,
                userSelect: 'none',
              }}
            >
              <span style={{ width: 16, display: 'inline-block' }}>{pOpen ? '▾' : '▸'}</span>
              {PAGE_LABELS[page] || page}{' '}
              <span style={{ color: 'var(--theme-elevation-500)', fontWeight: 400, fontSize: 13 }}>
                ({slotCount})
              </span>
            </div>
            {pOpen && (
              <div style={{ padding: '4px 16px 12px' }}>
                {blockNames.map((blockName) => (
                  <div key={blockName} style={{ marginTop: 10 }}>
                    <div
                      style={{
                        fontSize: 12,
                        textTransform: 'uppercase',
                        letterSpacing: 0.4,
                        color: 'var(--theme-elevation-500)',
                        fontWeight: 600,
                      }}
                    >
                      {blockName}
                    </div>
                    {blocks[blockName].map(renderSlotCard)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {orphanRows.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16 }}>Прочие записи</h3>
          <p style={{ fontSize: 12, color: 'var(--theme-elevation-500)', marginTop: 0 }}>
            Эти слоты больше не используются на сайте — их можно удалить.
          </p>
          {orphanRows.map((row) => (
            <div key={row.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{row.slotKey}</span>
                <button type="button" style={dangerBtnStyle} onClick={() => deleteOrphan(row)}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaTreeView;
