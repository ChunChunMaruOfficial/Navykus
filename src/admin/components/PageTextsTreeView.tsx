'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@payloadcms/ui';

import { PAGE_TEXT_KEY_INFO, PAGE_TEXT_SOURCE_ORDER } from '../pageTextBlockMap';

type PageTextRecord = {
  id: string | number;
  page: string;
  blockName?: string | null;
  translationKey: string;
  label?: string | null;
  value: string;
  isPublished?: boolean | null;
};

const API_BASE = '';

const PAGE_LABELS: Record<string, string> = {
  global: 'Общие тексты',
  home: 'Главная',
  about: 'О проекте',
  championship: 'Чемпионат',
  activities: 'Активности',
  'find-team': 'Поиск команды',
  legal: 'Юридические страницы',
};

const FAVORITE_PAGES = ['global', 'home', 'about', 'championship', 'activities', 'find-team', 'legal'];

const PageTextsTreeView = () => {
  const { token } = useAuth();
  const [records, setRecords] = useState<PageTextRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [draftBlockName, setDraftBlockName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | number | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');

  const authHeaders = useMemo(() => (token ? { Authorization: `JWT ${token}` } : {}), [token]);

  const makeRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
        ...authHeaders,
        'Content-Type': 'application/json',
      },
    });
    return res;
  }, [authHeaders]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await makeRequest('/payload-api/page-texts?limit=1000&depth=0');
      if (!res.ok) throw new Error(`fetch failed ${res.status}`);
      const json = await res.json();
      const docs = (json.docs as PageTextRecord[]).filter((d) => Boolean(d.translationKey));
      setRecords(docs);
    } catch (e) {
      setError((e as Error).message || 'load error');
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const keyOrderIndex = useMemo(() => {
    const map = new Map<string, number>();
    for (const page of Object.keys(PAGE_TEXT_SOURCE_ORDER)) {
      PAGE_TEXT_SOURCE_ORDER[page].forEach((key, i) => {
        if (!map.has(key)) map.set(key, i);
      });
    }
    return map;
  }, []);

  const grouped = useMemo(() => {
    const byPageThenBlock: Record<string, Record<string, PageTextRecord[]>> = {};
    for (const r of records) {
      const page = r.page || 'global';
      const block = r.blockName || 'Прочее';
      byPageThenBlock[page] = byPageThenBlock[page] || {};
      byPageThenBlock[page][block] = byPageThenBlock[page][block] || [];
      byPageThenBlock[page][block].push(r);
    }
    for (const page of Object.keys(byPageThenBlock)) {
      for (const block of Object.keys(byPageThenBlock[page])) {
        byPageThenBlock[page][block].sort((a, b) => {
          const ai = keyOrderIndex.get(a.translationKey);
          const bi = keyOrderIndex.get(b.translationKey);
          if (ai !== undefined && bi !== undefined) return ai - bi;
          if (ai !== undefined) return -1;
          if (bi !== undefined) return 1;
          return String(a.translationKey).localeCompare(String(b.translationKey));
        });
      }
    }
    return byPageThenBlock;
  }, [records, keyOrderIndex]);

  const blockOrderForPage = useCallback((page: string): string[] => {
    const order: string[] = [];
    const seen = new Set<string>();
    for (const key of PAGE_TEXT_SOURCE_ORDER[page] || []) {
      const info = PAGE_TEXT_KEY_INFO[key];
      const blockName = info?.blockName || 'Прочее';
      if (!seen.has(blockName)) {
        seen.add(blockName);
        order.push(blockName);
      }
    }
    for (const block of Object.keys(grouped[page] || {})) {
      if (!seen.has(block)) {
        seen.add(block);
        order.push(block);
      }
    }
    return order;
  }, [grouped]);

  const normalizedQuery = query.trim().toLowerCase();
  const searchMatches = useMemo(() => {
    if (!normalizedQuery) return null;
    const matches = new Map<string, { page: string; block: string; record: PageTextRecord }>();
    for (const r of records) {
      const haystack = `${r.value || ''} ${r.translationKey || ''} ${r.label || ''} ${r.blockName || ''}`.toLowerCase();
      if (haystack.includes(normalizedQuery)) {
        const page = r.page || 'global';
        const block = r.blockName || 'Прочее';
        matches.set(String(r.id), { page, block, record: r });
      }
    }
    return matches;
  }, [records, normalizedQuery]);

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  const expandAll = useCallback(() => {
    const all: Record<string, boolean> = {};
    for (const page of Object.keys(grouped)) {
      all[`p:${page}`] = true;
      for (const block of Object.keys(grouped[page])) {
        all[`b:${page}:${block}`] = true;
      }
    }
    setExpanded(all);
  }, [grouped]);

  const expandToSearch = useCallback(() => {
    if (!searchMatches) return;
    const all: Record<string, boolean> = {};
    for (const [, { page, block }] of searchMatches) {
      all[`p:${page}`] = true;
      all[`b:${page}:${block}`] = true;
    }
    setExpanded((prev) => ({ ...prev, ...all }));
  }, [searchMatches]);

  useEffect(() => {
    if (normalizedQuery) expandToSearch();
  }, [normalizedQuery, expandToSearch]);

  const startEdit = (r: PageTextRecord) => {
    setEditingId(r.id);
    setDraftValue(r.value || '');
    setDraftBlockName(r.blockName || '');
  };
  const cancelEdit = () => {
    setEditingId(null);
    setDraftValue('');
    setDraftBlockName('');
  };

  const saveEdit = async (r: PageTextRecord) => {
    setSaving(true);
    try {
      const res = await makeRequest(`/payload-api/page-texts/${r.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ value: draftValue, blockName: draftBlockName || undefined }),
      });
      if (!res.ok) throw new Error(`save failed ${res.status}`);
      const json = await res.json();
      const updated = json.doc as PageTextRecord | undefined;
      setRecords((prev) => prev.map((p) => (p.id === r.id ? { ...p, value: draftValue, blockName: draftBlockName || p.blockName, ...updated } : p)));
      setEditingId(null);
      setDraftValue('');
      setDraftBlockName('');
    } catch (e) {
      setError((e as Error).message || 'save error');
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (id: string | number) => {
    if (!window.confirm('Удалить этот текст? Это действие необратимо.')) return;
    setDeleting(id);
    try {
      const res = await makeRequest(`/payload-api/page-texts/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`delete failed ${res.status}`);
      setRecords((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError((e as Error).message || 'delete error');
    } finally {
      setDeleting(null);
    }
  };

  const themeVars: React.CSSProperties = {
    background: 'var(--theme-bg)',
    color: 'var(--theme-text)',
  };
  const cardStyle: React.CSSProperties = {
    background: 'var(--theme-elevation-100)',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 8,
    padding: 10,
    margin: '6px 0',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%',
    fontFamily: 'inherit',
    fontSize: 14,
    padding: 8,
    boxSizing: 'border-box',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 4,
    background: 'var(--theme-input-bg, var(--theme-bg))',
    color: 'var(--theme-text)',
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

  if (loading) return <div style={{ padding: 24, ...themeVars }}>Загрузка…</div>;
  if (error)
    return (
      <div style={{ padding: 24, ...themeVars }}>
        <div style={{ color: 'var(--theme-error-500)' }}>Ошибка: {error}</div>
        <button onClick={loadAll} style={btnStyle}>Повторить</button>
      </div>
    );

  const searchResults = searchMatches ? Array.from(searchMatches.values()) : null;

  return (
    <div style={{ fontFamily: 'inherit', padding: 24, maxWidth: 1100, margin: '0 auto', ...themeVars }}>
      <h1 style={{ fontSize: 24, marginBottom: 8, marginTop: 0 }}>Тексты страниц</h1>
      <p style={{ color: 'var(--theme-elevation-600)', marginTop: 0, marginBottom: 16 }}>
        Иерархический редактор текстов: Страница → Блок → Текст. Все изменения вносятся на русском; переводы на другие языки создаются автоматически в очереди переводов.
      </p>

      <div style={{ marginBottom: 16 }}>
        <input
          type="search"
          placeholder="Поиск по русскому тексту, ключу или блоку…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ ...inputStyle, maxWidth: 480, marginBottom: 8, display: 'block' }}
        />
        {!normalizedQuery && (
          <div>
            <button onClick={expandAll} style={{ ...btnStyle, marginRight: 8 }}>Раскрыть все</button>
            <button onClick={() => setExpanded({})} style={btnStyle}>Свернуть все</button>
          </div>
        )}
        {normalizedQuery && (
          <div style={{ fontSize: 13, color: 'var(--theme-elevation-600)' }}>
            Найдено: <strong style={{ color: 'var(--theme-text)' }}>{searchResults?.length || 0}</strong>
          </div>
        )}
      </div>

      {normalizedQuery && searchResults && searchResults.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--theme-elevation-600)' }}>
          Ничего не найдено по запросу «{query}».
        </div>
      )}

      {normalizedQuery && searchResults && searchResults.length > 0 && (
        <div>
          {searchResults.map(({ page, block, record }) => {
            const editing = editingId === record.id;
            const label = (record.label || record.translationKey || '').slice(0, 120);
            return (
              <div key={record.id} style={cardStyle}>
                <div style={{ fontSize: 11, color: 'var(--theme-elevation-500)', marginBottom: 4, fontFamily: 'monospace' }}>
                  {PAGE_LABELS[page] || page} › {block} › {label}
                </div>
                {editing ? (
                  <div>
                    <textarea rows={5} value={draftValue} onChange={(e) => setDraftValue(e.target.value)} style={inputStyle} />
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--theme-elevation-600)', margin: '6px 0 2px' }}>
                      Название блока (для группировки)
                    </label>
                    <input value={draftBlockName} onChange={(e) => setDraftBlockName(e.target.value)} style={inputStyle} />
                    <div style={{ marginTop: 8 }}>
                      <button onClick={() => saveEdit(record)} disabled={saving} style={{ ...primaryBtnStyle, marginRight: 8 }}>Сохранить</button>
                      <button onClick={cancelEdit} style={btnStyle}>Отмена</button>
                    </div>
                  </div>
) : (
                      <div>
                        <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, color: 'var(--theme-text)' }}>
                          {record.value || <span style={{ color: 'var(--theme-error-500)' }}>(пусто — блок скрыт на сайте)</span>}
                        </div>
                        <div style={{ marginTop: 6 }}>
                          <button onClick={() => startEdit(record)} style={{ ...btnStyle, marginRight: 8 }}>Редактировать</button>
                          <button
                            onClick={() => deleteRecord(record.id)}
                            disabled={deleting === record.id}
                            style={{ ...btnStyle, marginRight: 8, background: 'var(--theme-error-100)', color: 'var(--theme-error-500)', borderColor: 'var(--theme-error-300)' }}
                          >
                            {deleting === record.id ? 'Удаление...' : 'Удалить'}
                          </button>
                          <span style={{ fontSize: 11, color: 'var(--theme-elevation-500)' }}>
                            {record.isPublished === false ? 'не опубликовано' : 'опубликовано'}
                          </span>
                        </div>
                      </div>
                    )}
              </div>
            );
          })}
        </div>
      )}

      {!normalizedQuery && (
        <>
          {FAVORITE_PAGES.map((page) => {
            const blocks = grouped[page];
            if (!blocks) return null;
            const pKey = `p:${page}`;
            const pOpen = expanded[pKey];
            const orderedBlocks = blockOrderForPage(page);
            return (
              <div
                key={page}
                style={{
                  border: '1px solid var(--theme-elevation-150)',
                  borderRadius: 8,
                  margin: '8px 0',
                  overflow: 'hidden',
                  background: 'var(--theme-bg)',
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
                    color: 'var(--theme-text)',
                  }}
                >
                  <span style={{ width: 16, display: 'inline-block' }}>{pOpen ? '▾' : '▸'}</span>
                  {PAGE_LABELS[page] || page}{' '}
                  <span style={{ color: 'var(--theme-elevation-500)', fontWeight: 400, fontSize: 13 }}>
                    ({orderedBlocks.length} блоков)
                  </span>
                </div>
                {pOpen && (
                  <div>
                    {orderedBlocks.map((block) => {
                      const blockRecords = blocks[block];
                      if (!blockRecords || blockRecords.length === 0) return null;
                      const bKey = `b:${page}:${block}`;
                      const bOpen = expanded[bKey];
                      return (
                        <div key={block} style={{ borderTop: '1px solid var(--theme-elevation-100)' }}>
                          <div
                            onClick={() => toggle(bKey)}
                            style={{
                              padding: '10px 32px',
                              cursor: 'pointer',
                              color: 'var(--theme-text)',
                              fontWeight: 500,
                              userSelect: 'none',
                            }}
                          >
                            <span style={{ width: 16, display: 'inline-block' }}>{bOpen ? '▾' : '▸'}</span>
                            {block}{' '}
                            <span style={{ color: 'var(--theme-elevation-500)', fontWeight: 400, fontSize: 12 }}>
                              ({blockRecords.length})
                            </span>
                          </div>
{bOpen && (
                            <div style={{ padding: '0 0 12px 48px' }}>
                              {blockRecords.map((r) => {
                                const editing = editingId === r.id;
                                const label = (r.label || r.translationKey || '').slice(0, 120);
                                return (
                                  <div key={r.id} style={cardStyle}>
                                    <div style={{ fontSize: 11, color: 'var(--theme-elevation-500)', marginBottom: 4, fontFamily: 'monospace' }}>
                                      {label}
                                    </div>
                                    {editing ? (
                                      <div>
                                        <textarea
                                          rows={5}
                                          value={draftValue}
                                          onChange={(e) => setDraftValue(e.target.value)}
                                          style={inputStyle}
                                        />
                                        <label style={{ display: 'block', fontSize: 12, color: 'var(--theme-elevation-600)', margin: '6px 0 2px' }}>
                                          Название блока (для группировки)
                                        </label>
                                        <input value={draftBlockName} onChange={(e) => setDraftBlockName(e.target.value)} style={inputStyle} />
                                        <div style={{ marginTop: 8 }}>
                                          <button onClick={() => saveEdit(r)} disabled={saving} style={{ ...primaryBtnStyle, marginRight: 8 }}>
                                            Сохранить
                                          </button>
                                          <button onClick={cancelEdit} style={btnStyle}>Отмена</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, color: 'var(--theme-text)' }}>
                                          {r.value || <span style={{ color: 'var(--theme-error-500)' }}>(пусто — блок скрыт на сайте)</span>}
                                        </div>
                                        <div style={{ marginTop: 6 }}>
                                          <button onClick={() => startEdit(r)} style={{ ...btnStyle, marginRight: 8 }}>Редактировать</button>
                                          <button
                                            onClick={() => deleteRecord(r.id)}
                                            disabled={deleting === r.id}
                                            style={{ ...btnStyle, marginRight: 8, background: 'var(--theme-error-100)', color: 'var(--theme-error-500)', borderColor: 'var(--theme-error-300)' }}
                                          >
                                            {deleting === r.id ? 'Удаление...' : 'Удалить'}
                                          </button>
                                          <span style={{ fontSize: 11, color: 'var(--theme-elevation-500)' }}>
                                            {r.isPublished === false ? 'не опубликовано' : 'опубликовано'}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {records.length === 0 && <div style={{ color: 'var(--theme-elevation-500)' }}>Нет записей.</div>}
    </div>
  );
};

export default PageTextsTreeView;
