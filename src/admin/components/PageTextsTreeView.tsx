'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

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

const fetchCsrf = () => fetch(`${API_BASE}/payload-api/access`, { credentials: 'include' }).catch(() => null);

const PageTextsTreeView = () => {
  const [records, setRecords] = useState<PageTextRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [draftBlockName, setDraftBlockName] = useState('');
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchCsrf();
      const res = await fetch(`${API_BASE}/payload-api/page-texts?limit=1000&depth=0`, { credentials: 'include' });
      if (!res.ok) throw new Error(`fetch failed ${res.status}`);
      const json = await res.json();
      const docs = (json.docs as PageTextRecord[]).filter((d) => Boolean(d.translationKey));
      setRecords(docs);
    } catch (e) {
      setError((e as Error).message || 'load error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

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
        byPageThenBlock[page][block].sort((a, b) => String(a.translationKey).localeCompare(String(b.translationKey)));
      }
    }
    return byPageThenBlock;
  }, [records]);

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

  const startEdit = (r: PageTextRecord) => {
    setEditingId(r.id);
    setDraftValue(r.value || '');
    setDraftBlockName(r.blockName || '');
  };
  const cancelEdit = () => { setEditingId(null); setDraftValue(''); setDraftBlockName(''); };

  const saveEdit = async (r: PageTextRecord) => {
    setSaving(true);
    try {
      await fetchCsrf();
      const res = await fetch(`${API_BASE}/payload-api/page-texts/${r.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: draftValue, blockName: draftBlockName || undefined }),
      });
      if (!res.ok) throw new Error(`save failed ${res.status}`);
      const json = await res.json();
      const updated = json.doc as PageTextRecord | undefined;
      setRecords((prev) => prev.map((p) => p.id === r.id ? { ...p, value: draftValue, blockName: draftBlockName || p.blockName, ...updated } : p));
      setEditingId(null);
      setDraftValue('');
      setDraftBlockName('');
    } catch (e) {
      setError((e as Error).message || 'save error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Загрузка…</div>;
  if (error) return <div style={{ padding: 24, color: 'crimson' }}>Ошибка: {error}<br /><button onClick={loadAll}>Повторить</button></div>;

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif', padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Тексты страниц</h1>
      <p style={{ color: '#666', marginTop: 0 }}>
        Иерархический редактор текстов: Страница → Блок → Текст. Все изменения вносятся на русском; переводы на другие языки создаются автоматически в очереди переводов.
      </p>
      <div style={{ marginBottom: 12 }}>
        <button onClick={expandAll} style={{ marginRight: 8 }}>Раскрыть все</button>
        <button onClick={() => setExpanded({})}>Свернуть все</button>
      </div>

      {FAVORITE_PAGES.map((page) => {
        const blocks = grouped[page];
        if (!blocks) return null;
        const pKey = `p:${page}`;
        const pOpen = expanded[pKey];
        return (
          <div key={page} style={{ border: '1px solid #e5e7eb', borderRadius: 8, margin: '8px 0', overflow: 'hidden' }}>
            <div
              onClick={() => toggle(pKey)}
              style={{ padding: '12px 16px', cursor: 'pointer', background: '#f9fafb', fontWeight: 600, userSelect: 'none' }}
            >
              <span style={{ width: 16, display: 'inline-block' }}>{pOpen ? '▾' : '▸'}</span>
              {PAGE_LABELS[page] || page} <span style={{ color: '#999', fontWeight: 400, fontSize: 13 }}>({Object.keys(blocks).length} блоков)</span>
            </div>
            {pOpen && (
              <div>
                {Object.keys(blocks).sort().map((block) => {
                  const bKey = `b:${page}:${block}`;
                  const bOpen = expanded[bKey];
                  return (
                    <div key={block} style={{ borderTop: '1px solid #f0f0f0' }}>
                      <div
                        onClick={() => toggle(bKey)}
                        style={{ padding: '10px 32px', cursor: 'pointer', color: '#374151', fontWeight: 500, userSelect: 'none' }}
                      >
                        <span style={{ width: 16, display: 'inline-block' }}>{bOpen ? '▾' : '▸'}</span>
                        {block} <span style={{ color: '#999', fontWeight: 400, fontSize: 12 }}>({blocks[block].length})</span>
                      </div>
                      {bOpen && (
                        <div style={{ padding: '0 0 12px 48px' }}>
                          {blocks[block].map((r) => {
                            const editing = editingId === r.id;
                            const label = (r.label || r.translationKey || '').slice(0, 100);
                            return (
                              <div key={r.id} style={{ margin: '6px 0', padding: 8, background: '#fff', borderRadius: 6, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                                <div style={{ fontSize: 11, color: '#999', marginBottom: 4, fontFamily: 'monospace' }}>{label}</div>
                                {editing ? (
                                  <div>
                                    <textarea
                                      rows={5}
                                      value={draftValue}
                                      onChange={(e) => setDraftValue(e.target.value)}
                                      style={{ width: '100%', fontFamily: 'inherit', fontSize: 14, padding: 8, boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: 4 }}
                                    />
                                    <label style={{ display: 'block', fontSize: 12, color: '#666', margin: '6px 0 2px' }}>Название блока (для группировки)</label>
                                    <input
                                      value={draftBlockName}
                                      onChange={(e) => setDraftBlockName(e.target.value)}
                                      style={{ width: '100%', fontFamily: 'inherit', fontSize: 14, padding: 6, boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: 4 }}
                                    />
                                    <div style={{ marginTop: 8 }}>
                                      <button onClick={() => saveEdit(r)} disabled={saving} style={{ marginRight: 8 }}>Сохранить</button>
                                      <button onClick={cancelEdit}>Отмена</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, color: '#111827' }}>
                                      {r.value || <span style={{ color: 'crimson' }}>(пусто — блок скрыт на сайте)</span>}
                                    </div>
                                    <div style={{ marginTop: 6 }}>
                                      <button onClick={() => startEdit(r)} style={{ marginRight: 8 }}>Редактировать</button>
                                      <span style={{ fontSize: 11, color: '#aaa' }}>{r.isPublished === false ? 'не опубликовано' : 'опубликовано'}</span>
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

      {records.length === 0 && <div>Нет записей.</div>}
    </div>
  );
};

export default PageTextsTreeView;
