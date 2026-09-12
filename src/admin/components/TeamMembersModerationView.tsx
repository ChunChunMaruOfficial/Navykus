'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@payloadcms/ui';

type ListValue = { value?: string } | string;

type ModerationItem = {
  id: string | number;
  name: string;
  email: string;
  age?: number | null;
  country?: string | null;
  city?: string | null;
  shortBio?: string | null;
  whyLooking?: string | null;
  contact?: string | null;
  contactType?: string | null;
  skills?: ListValue[] | null;
  interests?: ListValue[] | null;
  targetRoles?: string[] | null;
  targetProject?: string | null;
  portfolioLink?: string | null;
  sourceType?: string | null;
  sourceContext?: string | null;
  championshipDirection?: string | null;
  originalLanguage?: string | null;
  moderationStatus?: string | null;
  moderationComment?: string | null;
  reviewedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

const STATUS_META: Record<string, { text: string; bg: string; color: string }> = {
  pending: { text: 'Новая', bg: '#fffae6', color: '#b54708' },
  approved: { text: 'Одобрена', bg: '#ecfdf3', color: '#067647' },
  rejected: { text: 'Отклонена', bg: '#fef3f2', color: '#b42318' },
  needs_edit: { text: 'Нужны правки', bg: '#eff8ff', color: '#175cd3' },
};

const ROLE_LABELS: Record<string, string> = {
  developer: 'Разработчик',
  designer: 'Дизайнер',
  researcher: 'Исследователь',
  product_manager: 'Продакт-менеджер',
  marketer: 'Маркетолог',
  team_lead: 'Тимлид',
  analyst: 'Аналитик',
  other: 'Другое',
};

const LANGUAGE_LABELS: Record<string, string> = {
  ru: 'Русский',
  en: 'English',
  kk: 'Қазақша',
  uz: 'O‘zbekcha',
  ar: 'العربية',
  de: 'Deutsch',
  es: 'Español',
  tr: 'Türkçe',
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  modal: 'Модальное окно',
  championship: 'Чемпионат',
  event: 'Событие',
  opportunity: 'Возможность',
  'find-team': 'Страница «Найти команду»',
  home: 'Главная',
  about: 'О проекте',
  activities: 'Активности',
  api: 'API',
};

const FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'queue', label: 'Непроверенные' },
  { value: 'pending', label: 'Новые' },
  { value: 'needs_edit', label: 'Нужны правки' },
  { value: 'rejected', label: 'Отклонённые' },
  { value: 'approved', label: 'Одобренные' },
  { value: 'all', label: 'Все' },
];

const listValues = (items?: ListValue[] | null): string[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => (typeof item === 'string' ? item : String(item?.value || '')))
    .filter(Boolean);
};

const formatDate = (value?: string | null) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return value;
  }
};

const chip = (text: string, bg: string, color: string) => (
  <span
    key={text}
    style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 999,
      background: bg,
      color,
      fontSize: 11,
      fontWeight: 600,
      lineHeight: 1.4,
    }}
  >
    {text}
  </span>
);

const TeamMembersModerationView = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('queue');
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [rejectingId, setRejectingId] = useState<string | number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [testingMail, setTestingMail] = useState(false);

  const authHeaders = useMemo(() => (token ? { Authorization: `JWT ${token}` } : {}), [token]);

  const makeRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, {
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

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await makeRequest('/payload-api/team-members?limit=200&depth=0&sort=-createdAt');
      if (!res.ok) throw new Error(`Не удалось загрузить анкеты (${res.status})`);
      const json = await res.json();
      setItems((json.docs || []) as ModerationItem[]);
    } catch (e) {
      setError((e as Error).message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'queue') return items.filter((item) => item.moderationStatus !== 'approved');
    return items.filter((item) => item.moderationStatus === filter);
  }, [items, filter]);

  const counts = useMemo(() => ({
    queue: items.filter((item) => item.moderationStatus !== 'approved').length,
    pending: items.filter((item) => item.moderationStatus === 'pending').length,
    needs_edit: items.filter((item) => item.moderationStatus === 'needs_edit').length,
    rejected: items.filter((item) => item.moderationStatus === 'rejected').length,
    approved: items.filter((item) => item.moderationStatus === 'approved').length,
    all: items.length,
  }), [items]);

  // Sends a test letter to the signed-in moderator and shows the real SMTP result.
  const testMail = async () => {
    clearFeedback();
    setTestingMail(true);
    try {
      const res = await makeRequest('/payload-api/users/test-email', { method: 'POST', body: JSON.stringify({}) });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setNotice(`Тестовое письмо отправлено с ${json.from} на ${json.to}. Если его нет во «Входящих», проверьте «Спам».`);
      } else {
        setError(`Письмо не отправлено: ${json.error || `ошибка ${res.status}`}`);
      }
    } catch (e) {
      setError(`Письмо не отправлено: ${(e as Error).message}`);
    } finally {
      setTestingMail(false);
    }
  };

  const clearFeedback = () => {
    setNotice(null);
    setError(null);
  };

  const approve = async (item: ModerationItem) => {
    clearFeedback();
    setBusyId(item.id);
    try {
      const res = await makeRequest(`/payload-api/team-members/${encodeURIComponent(String(item.id))}`, {
        method: 'PATCH',
        body: JSON.stringify({
          moderationStatus: 'approved',
          isApproved: true,
          _status: 'published',
          reviewedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(`Не удалось одобрить анкету (${res.status})`);
      setNotice(`Анкета «${item.name}» одобрена и опубликована в разделе «Найти команду». Письмо-подтверждение отправляется на ${item.email}.`);
      setExpandedId(null);
      await loadItems();
    } catch (e) {
      setError((e as Error).message || 'Ошибка одобрения');
    } finally {
      setBusyId(null);
    }
  };

  const startReject = (item: ModerationItem) => {
    clearFeedback();
    setRejectingId(item.id);
    setRejectReason(item.moderationComment || '');
    setRejectError(null);
    setExpandedId(item.id);
  };

  const cancelReject = () => {
    setRejectingId(null);
    setRejectReason('');
    setRejectError(null);
  };

  const confirmReject = async (item: ModerationItem) => {
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError('Укажите причину отказа — она будет включена в письмо участнику.');
      return;
    }
    clearFeedback();
    setRejectError(null);
    setBusyId(item.id);
    try {
      const res = await makeRequest(`/payload-api/team-members/${encodeURIComponent(String(item.id))}`, {
        method: 'PATCH',
        body: JSON.stringify({
          moderationStatus: 'rejected',
          isApproved: false,
          _status: 'draft',
          moderationComment: reason,
          reviewedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(`Не удалось отклонить анкету (${res.status})`);
      setNotice(`Анкета «${item.name}» отклонена. Письмо с причиной отправляется на ${item.email}.`);
      cancelReject();
      await loadItems();
    } catch (e) {
      setRejectError((e as Error).message || 'Ошибка отклонения');
    } finally {
      setBusyId(null);
    }
  };

  const renderItem = (item: ModerationItem) => {
    const status = STATUS_META[item.moderationStatus || 'pending'] || STATUS_META.pending;
    const expanded = expandedId === item.id;
    const busy = busyId === item.id;
    const rejecting = rejectingId === item.id;
    const roles = (item.targetRoles || []).map((role) => ROLE_LABELS[role] || role);
    const skills = listValues(item.skills);
    const interests = listValues(item.interests);
    const language = LANGUAGE_LABELS[item.originalLanguage || ''] || item.originalLanguage || '—';
    const source = SOURCE_TYPE_LABELS[item.sourceType || ''] || item.sourceType || '—';

    return (
      <div
        key={String(item.id)}
        style={{
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 10,
          background: 'var(--theme-elevation-0)',
          marginBottom: 12,
          overflow: 'hidden',
        }}
      >
        <button
          type="button"
          onClick={() => setExpandedId(expanded ? null : item.id)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <strong style={{ fontSize: 14, color: 'var(--theme-text)' }}>{item.name}</strong>
          <span style={{ fontSize: 12, color: 'var(--theme-elevation-500)' }}>{item.email}</span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            {chip(language, 'var(--theme-elevation-100)', 'var(--theme-elevation-700)')}
            {chip(status.text, status.bg, status.color)}
          </span>
        </button>

        {expanded && (
          <div style={{ padding: '0 16px 16px', fontSize: 13, color: 'var(--theme-text)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginBottom: 12 }}>
              <div>Возраст: <strong>{item.age ?? '—'}</strong></div>
              <div>Страна: <strong>{item.country || '—'}</strong></div>
              <div>Город: <strong>{item.city || '—'}</strong></div>
              <div>Контакт: <strong>{item.contact || '—'}</strong> ({item.contactType || '—'})</div>
              <div>Источник: <strong>{source}</strong>{item.sourceContext ? ` — ${item.sourceContext}` : ''}</div>
              {item.championshipDirection && <div>Направление: <strong>{item.championshipDirection}</strong></div>}
              <div>Создана: <strong>{formatDate(item.createdAt)}</strong></div>
              {item.reviewedAt && <div>Проверена: <strong>{formatDate(item.reviewedAt)}</strong></div>}
            </div>

            <div style={{ marginBottom: 8 }}>
              <strong>Коротко о себе:</strong>
              <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{item.shortBio || '—'}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Почему ищет команду:</strong>
              <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{item.whyLooking || '—'}</div>
            </div>
            {roles.length > 0 && (
              <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <strong>Роли:</strong>
                {roles.map((role) => chip(role, 'var(--theme-elevation-100)', 'var(--theme-elevation-700)'))}
              </div>
            )}
            {skills.length > 0 && (
              <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <strong>Навыки:</strong>
                {skills.map((skill) => chip(skill, 'var(--theme-success-100, #ecfdf3)', '#067647'))}
              </div>
            )}
            {interests.length > 0 && (
              <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <strong>Интересы:</strong>
                {interests.map((interest) => chip(interest, 'var(--theme-elevation-100)', 'var(--theme-elevation-700)'))}
              </div>
            )}
            {item.targetProject && <div style={{ marginBottom: 8 }}>Целевой проект: <strong>{item.targetProject}</strong></div>}
            {item.portfolioLink && (
              <div style={{ marginBottom: 8 }}>
                Портфолио:{' '}
                <a href={item.portfolioLink} target="_blank" rel="noreferrer noopener">{item.portfolioLink}</a>
              </div>
            )}
            {item.moderationComment && (
              <div style={{ marginBottom: 8 }}>
                <strong>Комментарий модератора:</strong>
                <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{item.moderationComment}</div>
              </div>
            )}

            {rejecting && (
              <div style={{ margin: '12px 0', padding: 12, border: '1px solid var(--theme-elevation-150)', borderRadius: 8, background: 'var(--theme-elevation-50, #fafafa)' }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Причина отказа (войдёт в письмо участнику):</div>
                <textarea
                  value={rejectReason}
                  onChange={(event) => { setRejectReason(event.target.value); setRejectError(null); }}
                  rows={3}
                  placeholder="Например: в анкете недостаточно информации о навыках"
                  style={{
                    width: '100%',
                    minHeight: 70,
                    padding: 8,
                    borderRadius: 6,
                    border: '1px solid var(--theme-elevation-200)',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
                {rejectError && <div style={{ color: '#b42318', marginTop: 6, fontSize: 12 }}>{rejectError}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => confirmReject(item)}
                    disabled={busy}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      border: '1px solid #b42318',
                      background: '#b42318',
                      color: '#fff',
                      fontWeight: 600,
                      cursor: busy ? 'default' : 'pointer',
                      opacity: busy ? 0.7 : 1,
                    }}
                  >
                    {busy ? 'Отправляем...' : 'Отклонить и отправить письмо'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelReject}
                    disabled={busy}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      border: '1px solid var(--theme-elevation-200)',
                      background: 'transparent',
                      color: 'var(--theme-text)',
                      cursor: 'pointer',
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}

            {!rejecting && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => approve(item)}
                  disabled={busy || item.moderationStatus === 'approved'}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: '1px solid #067647',
                    background: item.moderationStatus === 'approved' ? '#f2f4f7' : '#ecfdf3',
                    color: item.moderationStatus === 'approved' ? '#667085' : '#067647',
                    fontWeight: 600,
                    cursor: busy || item.moderationStatus === 'approved' ? 'default' : 'pointer',
                    opacity: busy ? 0.7 : 1,
                  }}
                >
                  {busy ? 'Сохраняем...' : item.moderationStatus === 'approved' ? 'Одобрена и опубликована' : 'Одобрить и опубликовать'}
                </button>
                <button
                  type="button"
                  onClick={() => startReject(item)}
                  disabled={busy}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: '1px solid #b42318',
                    background: '#fef3f2',
                    color: '#b42318',
                    fontWeight: 600,
                    cursor: busy ? 'default' : 'pointer',
                  }}
                >
                  Отклонить с письмом
                </button>
                <button
                  type="button"
                  onClick={() => makeRequest(`/payload-api/team-members/${encodeURIComponent(String(item.id))}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                      moderationStatus: 'needs_edit',
                      isApproved: false,
                      _status: 'draft',
                      reviewedAt: new Date().toISOString(),
                    }),
                  }).then(async (res) => {
                    if (!res.ok) {
                      setError(`Не удалось сохранить статус «Нужны правки» (${res.status})`);
                      return;
                    }
                    setNotice(`Анкета «${item.name}» помечена как «Нужны правки».`);
                    await loadItems();
                  }).catch((e) => setError((e as Error).message || 'Ошибка'))}
                  disabled={busy}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: '1px solid var(--theme-elevation-200)',
                    background: 'transparent',
                    color: 'var(--theme-text)',
                    cursor: 'pointer',
                  }}
                >
                  Запросить правки
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: 980, margin: '0 auto' }}>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Модерация анкет</h1>
      <p style={{ marginTop: 8, color: 'var(--theme-elevation-500)', fontSize: 13 }}>
        Непроверенные анкеты участников. Одобрение публикует анкету в разделе «Найти команду»,
        отклонение отправляет участнику письмо с причиной от info@navykus.tech.
      </p>
      <button
        type="button"
        onClick={testMail}
        disabled={testingMail}
        style={{
          marginTop: 4,
          padding: '6px 12px',
          borderRadius: 6,
          border: '1px solid var(--theme-elevation-250)',
          background: 'var(--theme-elevation-50)',
          color: 'var(--theme-text)',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        {testingMail ? 'Отправка…' : 'Проверить отправку писем (тест на мой email)'}
      </button>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => { setFilter(option.value); clearFeedback(); }}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              border: '1px solid ' + (filter === option.value ? 'var(--theme-elevation-500)' : 'var(--theme-elevation-150)'),
              background: filter === option.value ? 'var(--theme-elevation-100)' : 'transparent',
              color: 'var(--theme-text)',
              fontWeight: filter === option.value ? 600 : 400,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {option.label} ({counts[option.value as keyof typeof counts] ?? 0})
          </button>
        ))}
        <button
          type="button"
          onClick={loadItems}
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid var(--theme-elevation-150)',
            background: 'transparent',
            color: 'var(--theme-text)',
            cursor: 'pointer',
            fontSize: 12,
            marginLeft: 'auto',
          }}
        >
          Обновить
        </button>
      </div>

      {notice && (
        <div style={{ margin: '12px 0', padding: '10px 14px', borderRadius: 8, background: '#ecfdf3', color: '#067647', fontSize: 13 }}>
          {notice}
        </div>
      )}
      {error && (
        <div style={{ margin: '12px 0', padding: '10px 14px', borderRadius: 8, background: '#fef3f2', color: '#b42318', fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 24, color: 'var(--theme-elevation-500)' }}>Загрузка анкет...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 24, color: 'var(--theme-elevation-500)' }}>В этой категории анкет нет.</div>
      ) : (
        filtered.map(renderItem)
      )}
    </div>
  );
};

export default TeamMembersModerationView;
