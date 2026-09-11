'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth, useDocumentInfo } from '@payloadcms/ui';

type LocalizationRecord = {
  language: string;
  translationStatus: 'pending' | 'in_progress' | 'ready' | 'failed';
  errorMessage?: string | null;
};

const LANGUAGES: Array<{ code: string; label: string }> = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
  { code: 'kk', label: 'Қазақша' },
  { code: 'uz', label: 'O‘zbekcha' },
  { code: 'ar', label: 'العربية' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'tr', label: 'Türkçe' },
];

const STATUS: Record<string, { text: string; color: string }> = {
  ready: { text: 'готово', color: '#067647' },
  pending: { text: 'в очереди', color: '#b54708' },
  in_progress: { text: 'переводится…', color: '#175cd3' },
  failed: { text: 'ошибка — показывается оригинал', color: '#b42318' },
  missing: { text: 'нет перевода', color: '#b42318' },
};

const POLL_MS = 3000;
const MAX_POLLS = 60;

/**
 * Sidebar panel «Переводы»: shows, per site language, whether the automatic translation of
 * this document is ready, and lets the editor re-run all translations right away.
 */
export const TranslationStatusField = () => {
  const { id, collectionSlug, lastUpdateTime } = useDocumentInfo();
  const { token } = useAuth();
  const [records, setRecords] = useState<LocalizationRecord[] | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState<string>('ru');
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const polls = useRef(0);

  const headers = useMemo<Record<string, string>>(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `JWT ${token}` } : {}),
  }), [token]);

  const load = useCallback(async () => {
    if (!id || !collectionSlug) return;
    const params = new URLSearchParams({
      'where[sourceCollection][equals]': collectionSlug,
      'where[sourceId][equals]': String(id),
      limit: '20',
      depth: '0',
    });
    const [localizationsRes, sourceRes] = await Promise.all([
      fetch(`/payload-api/content-localizations?${params.toString()}`, { credentials: 'include', headers }),
      fetch(`/payload-api/${collectionSlug}/${encodeURIComponent(String(id))}?depth=0&draft=true`, { credentials: 'include', headers }),
    ]);
    if (localizationsRes.ok) {
      const json = await localizationsRes.json();
      setRecords((json.docs || []) as LocalizationRecord[]);
    }
    if (sourceRes.ok) {
      const doc = await sourceRes.json();
      if (typeof doc?.originalLanguage === 'string') setSourceLanguage(doc.originalLanguage);
    }
  }, [collectionSlug, headers, id]);

  const hasWork = (records || []).some((record) => record.translationStatus === 'pending' || record.translationStatus === 'in_progress');

  // Reload after every save; keep polling while translations are running.
  useEffect(() => {
    polls.current = 0;
    void load();
  }, [load, lastUpdateTime]);

  useEffect(() => {
    if (!hasWork || polls.current >= MAX_POLLS) return undefined;
    const timer = window.setTimeout(() => {
      polls.current += 1;
      void load();
    }, POLL_MS);
    return () => window.clearTimeout(timer);
  }, [hasWork, load, records]);

  const translateNow = async () => {
    if (!id || !collectionSlug) return;
    setRequesting(true);
    setError(null);
    try {
      const res = await fetch('/payload-api/content-localizations/translate-now', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ collection: collectionSlug, id }),
      });
      if (!res.ok) throw new Error(`Не удалось запустить перевод (${res.status})`);
      polls.current = 0;
      setRecords((current) => (current || []).map((record) => ({ ...record, translationStatus: 'pending' })));
      window.setTimeout(() => void load(), 1000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRequesting(false);
    }
  };

  const box: React.CSSProperties = {
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
    fontSize: 13,
  };

  if (!id) {
    return (
      <div style={box}>
        <strong>Переводы</strong>
        <div style={{ color: 'var(--theme-elevation-600)', marginTop: 6 }}>
          После сохранения текст автоматически переведётся на все языки сайта.
        </div>
      </div>
    );
  }

  const byLanguage = new Map((records || []).map((record) => [record.language, record]));

  return (
    <div style={box}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>Переводы</strong>
        <button
          type="button"
          onClick={translateNow}
          disabled={requesting}
          style={{
            fontSize: 12,
            padding: '4px 10px',
            borderRadius: 4,
            border: '1px solid var(--theme-elevation-250)',
            background: 'var(--theme-elevation-100)',
            color: 'var(--theme-text)',
            cursor: 'pointer',
          }}
        >
          {requesting ? 'Запуск…' : 'Перевести заново'}
        </button>
      </div>
      {records === null ? (
        <div style={{ color: 'var(--theme-elevation-600)' }}>Загрузка…</div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {LANGUAGES.map(({ code, label }) => {
            if (code === sourceLanguage) {
              return (
                <li key={code} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span>{label}</span>
                  <span style={{ color: 'var(--theme-elevation-600)' }}>оригинал</span>
                </li>
              );
            }
            const record = byLanguage.get(code);
            const throttled = record?.translationStatus === 'failed' && /429|rate limit|quota/i.test(record.errorMessage || '');
            const status = throttled
              ? STATUS.pending
              : STATUS[record?.translationStatus || 'missing'];
            return (
              <li
                key={code}
                title={record?.errorMessage || ''}
                style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '2px 0' }}
              >
                <span>{label}</span>
                <span style={{ color: status.color, textAlign: 'right' }}>{status.text}</span>
              </li>
            );
          })}
        </ul>
      )}
      {error && <div style={{ color: '#b42318', marginTop: 8 }}>{error}</div>}
      <div style={{ color: 'var(--theme-elevation-500)', marginTop: 8, fontSize: 11, lineHeight: 1.4 }}>
        Пишите на исходном языке — переводы на остальные языки создаются автоматически сразу после сохранения.
      </div>
    </div>
  );
};

export default TranslationStatusField;
