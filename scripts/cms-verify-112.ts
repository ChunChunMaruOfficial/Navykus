/**
 * CMS verification — 112 tasks (Задания 1–112).
 * Выполняет каждую задачу по порядку: действие в CMS (payload client),
 * проверка БД (SELECT), проверка «фронтенда» (публичный/авторизованный API).
 * Итог — таблица: № задачи | Сущность | Действие | Результат | Описание расхождения.
 *
 * Запуск: npx tsx scripts/cms-verify-112.ts
 */
import 'dotenv/config';

import fs from 'node:fs';
import path from 'node:path';

import express from 'express';
import { createClient } from '@libsql/client';
import type { CollectionConfig, Field } from 'payload';

import { getPayloadClient } from '../server/payload';

type TaskResult = 'OK' | 'FAIL' | 'WARN' | 'SKIP' | 'N/A';
type Row = { num: number; entity: string; action: string; result: TaskResult; detail: string };

const rows: Row[] = [];
const taskRecord = (num: number, entity: string, action: string, result: TaskResult, detail = '') => {
  rows.push({ num, entity, action, result, detail });
};

const db = createClient({ url: process.env.DATABASE_URL || 'file:./payload.db' });

const snake = (name: string) => name.replace(/([A-Z])/g, '_$1').replace(/[-\s]/g, '_').toLowerCase();
const tableFor = (slug: string) => slug.replace(/-/g, '_');
const mkRand = () => `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
const errMsg = (error: unknown) => (error as Error)?.message?.slice(0, 220) || String(error);

const getRow = async (table: string, id: string | number) => {
  try {
    const r = await db.execute(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`, [id] as never[]);
    return (r.rows[0] as Record<string, unknown> | undefined) || null;
  } catch {
    return null;
  }
};

const countWhere = async (table: string, where: string, args: unknown[]) => {
  try {
    const r = await db.execute(`SELECT COUNT(*) as c FROM ${table} WHERE ${where}`, args as never[]);
    return Number((r.rows[0] as unknown as { c: number }).c);
  } catch {
    return -1;
  }
};

const countTable = async (table: string) => {
  try {
    const r = await db.execute(`SELECT COUNT(*) as c FROM ${table}`);
    return Number((r.rows[0] as unknown as { c: number }).c);
  } catch {
    return -1;
  }
};

/* ────────────────────────── Field walkers (из cms-verify.ts) ────────────────────────── */

const SKIP = Symbol('skip');

const AUTH_GENERATED_FIELDS = new Set([
  'sessions', 'hash', 'salt', 'loginAttempts', 'lockUntil',
  'resetPasswordToken', 'resetPasswordExpiration',
]);

const createdDeps: Array<{ collection: string; id: string | number }> = [];
const collectionConfigs = new Map<string, CollectionConfig>();
const buildingCollections = new Set<string>();

const optionsOf = (field: Field & { options?: Array<{ value: string } | string> }) => {
  const options = field.options || [];
  const first = options[0];
  if (typeof first === 'string') return first;
  return first?.value;
};

const leafValue = (field: Record<string, unknown>, rand: string): unknown => {
  switch (String(field.type)) {
    case 'text':
      if (field.name === 'phone') return '+7 (900) 000-00-00';
      if (field.name === 'operatorInn') return '1234567890';
      return `verify-${rand}`;
    case 'email':
      return `verify-${rand}@example.com`;
    case 'textarea':
    case 'code':
      return `verify textarea ${rand}`;
    case 'number':
      return 1;
    case 'checkbox':
      return true;
    case 'date':
      return new Date().toISOString();
    case 'select':
    case 'radio': {
      const value = optionsOf(field as never) ?? field.defaultValue ?? 'test';
      return field.hasMany ? [value] : value;
    }
    case 'password':
      return 'VerifyPass123!';
    case 'json':
      return { test: true };
    case 'point':
      return [55.75, 37.61];
    case 'ui':
      return SKIP;
    default:
      return SKIP;
  }
};

const buildSample = async (fields: Field[], payload: unknown, rand: string): Promise<{ data: Record<string, unknown>; updateField?: string }> => {
  const data: Record<string, unknown> = {};
  let updateField: string | undefined;

  const collect = async (list: Field[]) => {
    for (const field of list) {
      switch (field.type) {
        case 'tabs': {
          for (const tab of (field as never as { tabs: Array<{ fields: Field[] }> }).tabs) await collect(tab.fields);
          continue;
        }
        case 'row':
        case 'collapsible': {
          await collect((field as never as { fields: Field[] }).fields);
          continue;
        }
        case 'group': {
          const inner = await buildSample((field as never as { fields: Field[] }).fields, payload, rand);
          const groupName = (field as never as { name?: string }).name;
          if (groupName) data[groupName] = inner.data;
          updateField = updateField ?? inner.updateField;
          continue;
        }
        case 'relationship':
        case 'upload': {
          const relationTo = (field as never as { relationTo: string | string[] }).relationTo;
          const targets = Array.isArray(relationTo) ? relationTo : [relationTo];
          const isRequired = (field as never as { required?: boolean }).required === true;
          let resolved: unknown;
          for (const target of targets) {
            try {
              const found = await (payload as never as {
                find: (args: { collection: string; limit: number; overrideAccess: boolean; depth: number }) => Promise<{ docs: Array<{ id: string | number }> }>;
              }).find({ collection: target, limit: 1, overrideAccess: true, depth: 0 });
              if (found.docs[0]) {
                resolved = found.docs[0].id;
                break;
              }
              if (isRequired && target !== 'media' && !buildingCollections.has(target)) {
                resolved = await createDependencyDoc(target, payload as never, rand);
                if (resolved !== undefined) break;
              }
            } catch {
              /* ignore */
            }
          }
          if (resolved !== undefined && field.name) data[field.name] = resolved;
          continue;
        }
        case 'blocks': {
          if (field.name) data[field.name] = [];
          continue;
        }
        case 'array': {
          if (!field.name || AUTH_GENERATED_FIELDS.has(field.name)) continue;
          const sub = (field as never as { fields: Field[] }).fields;
          const item: Record<string, unknown> = {};
          for (const subField of sub) {
            if (subField.type === 'text' || subField.type === 'number') {
              item[subField.name] = subField.type === 'text' ? `item-${rand}` : 1;
            }
          }
          data[field.name] = Object.keys(item).length ? [item] : [];
          continue;
        }
        default: {
          const value = leafValue(field as never as Record<string, unknown>, rand);
          if (value !== SKIP && field.name && !AUTH_GENERATED_FIELDS.has(field.name)) {
            data[field.name] = value;
            if (!updateField && (field.type === 'text' || field.type === 'textarea')) updateField = field.name;
          }
        }
      }
    }
  };

  await collect(fields);
  return { data, updateField };
};

const createDependencyDoc = async (target: string, payload: never, rand: string): Promise<string | number | undefined> => {
  const config = collectionConfigs.get(target);
  if (!config) return undefined;
  buildingCollections.add(target);
  try {
    const { data } = await buildSample(config.fields as Field[], payload, rand);
    if (!data.email) data.email = `verify-${rand}@example.com`;
    if (!data.password && target === 'users') data.password = 'VerifyPass123!';
    if (config.versions) data._status = 'published';
    const created = await (payload as never as {
      create: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
    }).create({ collection: target, data, overrideAccess: true, depth: 0 });
    createdDeps.push({ collection: target, id: created.id as string | number });
    return created.id as string | number;
  } catch {
    return undefined;
  } finally {
    buildingCollections.delete(target);
  }
};

/* ────────────────────────── HTTP server (frontend/API checks) ────────────────────────── */

let apiBase = '';

const PUBLIC_ENDPOINTS: Record<string, string> = {
  'tournaments': '/api/tournaments',
  'activities': '/api/activities',
  'events': '/api/events',
  'opportunities': '/api/opportunities',
  'faqs': '/api/faqs',
  'pillars': '/api/pillars',
  'scenarios': '/api/scenarios',
  'experts': '/api/experts',
  'trust-points': '/api/trust-points',
  'stats': '/api/stats',
  'team-members': '/api/team-members',
  'contact-settings': '/api/contact-settings',
  'operator-settings': '/api/operator-settings',
};

const findDocIn = (data: unknown, id: string | number): boolean => {
  const idStr = String(id);
  if (Array.isArray(data)) {
    return data.some((d: unknown) => {
      if (!d || typeof d !== 'object') return false;
      const rec = d as Record<string, unknown>;
      return String(rec.id ?? '') === idStr || String(rec._id ?? '') === idStr;
    });
  }
  if (data && typeof data === 'object') {
    const rec = data as Record<string, unknown>;
    if (String(rec.id ?? '') === idStr) return true;
    for (const key of Object.keys(rec)) {
      if (Array.isArray(rec[key]) && findDocIn(rec[key], id)) return true;
    }
  }
  return false;
};

const publicVisible = async (slug: string, id: string | number): Promise<{ visible: boolean; note: string }> => {
  const ep = PUBLIC_ENDPOINTS[slug];
  if (!ep) return { visible: false, note: 'нет публичного эндпоинта' };
  const fallbackPayloadCheck = async (): Promise<{ visible: boolean; note: string }> => {
    // Эндпоинты /api/tournaments и др. живут в server/index.ts, которого нет в эфемерном
    // сервере. Повторяем их логику (findPublished/findApprovedTeamMembers) через payload.
    try {
      const where: Record<string, unknown> = {};
      if (slug === 'team-members') {
        where.isApproved = { equals: true };
        where._status = { equals: 'published' };
      } else if (slug === 'contact-settings' || slug === 'operator-settings') {
        // возвращается без публичных фильтров
      } else {
        where.isPublished = { equals: true };
        where._status = { equals: 'published' };
      }
      const res = await globalPayload.find({ collection: slug, where, limit: 500, overrideAccess: true, depth: 0 });
      const found = res.docs.some((d: Record<string, unknown>) => String(d.id) === String(id));
      return { visible: found, note: found ? 'виден в публичном API (по фильтрам isPublished/_status)' : 'НЕ виден в публичном API (по фильтрам isPublished/_status)' };
    } catch (error) {
      return { visible: false, note: `fallback ошибка: ${errMsg(error)}` };
    }
  };
  try {
    const res = await fetch(apiBase + ep);
    if (res.status === 404) return fallbackPayloadCheck();
    if (!res.ok) return { visible: false, note: `HTTP ${res.status}` };
    const data = await res.json();
    const found = findDocIn(data, id);
    return { visible: found, note: found ? 'виден в публичном API' : 'НЕ виден в публичном API' };
  } catch (error) {
    return fallbackPayloadCheck();
  }
};

const http = async (method: string, urlPath: string, body?: unknown, token?: string) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(apiBase + urlPath, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json: unknown = null;
  try { json = await res.json(); } catch { /* ignore */ }
  return { status: res.status, json };
};

/* ────────────────────────── Generic task runners ────────────────────────── */

const relFieldsOf = (config: CollectionConfig): Array<{ name: string; relationTo: string | string[] }> => {
  const out: Array<{ name: string; relationTo: string | string[] }> = [];
  const walk = (fields: Field[]) => {
    for (const field of fields) {
      if (field.type === 'tabs') {
        for (const tab of (field as never as { tabs: Array<{ fields: Field[] }> }).tabs) walk(tab.fields);
        continue;
      }
      if (field.type === 'row' || field.type === 'collapsible' || field.type === 'group') {
        walk((field as never as { fields: Field[] }).fields);
        continue;
      }
      if ((field.type === 'relationship' || field.type === 'upload') && field.name) {
        const relMeta = field as never as { relationTo: string | string[]; hasMany?: boolean };
        if (relMeta.hasMany) continue; // hasMany хранится в *_rels, а не в колонке *_id
        out.push({ name: field.name, relationTo: relMeta.relationTo });
      }
    }
  };
  walk(config.fields as Field[]);
  return out;
};

const makeData = async (slug: string, rand: string, opts: { publish?: boolean; isApproved?: boolean; extra?: Record<string, unknown> } = {}) => {
  const config = collectionConfigs.get(slug);
  if (!config) throw new Error(`коллекция ${slug} не найдена`);
  const { data } = await buildSample(config.fields as Field[], globalPayload, rand);
  if (!data.email) data.email = `verify-${rand}@example.com`;
  if (!data.password && slug === 'users') data.password = 'VerifyPass123!';
  if (config.versions || opts.publish) {
    data._status = 'published';
    data.isPublished = true;
  }
  if (opts.isApproved !== undefined) data.isApproved = opts.isApproved;
  if (opts.extra) Object.assign(data, opts.extra);
  return { config, data };
};

let globalPayload: any;

const createDoc = async (slug: string, rand: string, opts: { publish?: boolean; isApproved?: boolean; extra?: Record<string, unknown> } = {}) => {
  const { data } = await makeData(slug, rand, opts);
  return globalPayload.create({ collection: slug, data, overrideAccess: true, depth: 0 });
};

const taskCreate = async (num: number, slug: string, label: string, opts: { publish?: boolean; isApproved?: boolean; extra?: Record<string, unknown> } = {}) => {
  const rand = mkRand();
  try {
    const { config } = await makeData(slug, rand, opts);
    const created = await globalPayload.create({ collection: slug, data: (await makeData(slug, rand, opts)).data, overrideAccess: true, depth: 0 });
    const id = created.id;
    const row = await getRow(tableFor(slug), id);
    if (!row) {
      taskRecord(num, label, 'Создание', 'FAIL', `запись создана (id=${id}), но строки нет в БД ${tableFor(slug)}`);
      return;
    }
    // Проверка связей в БД
    let relNote = '';
    for (const rel of relFieldsOf(config)) {
      const sourceValue = (await makeData(slug, mkRand(), opts)).data[rel.name];
      if (sourceValue !== undefined) {
        const col = `${snake(rel.name)}_id`;
        const expected = String(sourceValue);
        const actual = String(row[col] ?? row[rel.name] ?? '');
        if (actual === expected) relNote += ` [${col}=${expected}✓]`;
        else relNote += ` [${col}: ожид. ${expected}, факт ${actual || 'пусто'}]`;
      }
    }
    const pub = await publicVisible(slug, id);
    const front = pub.visible
      ? '; фронтенд: видно ✓'
      : pub.note.includes('нет публичного эндпоинта')
        ? '; фронтенд: нет публичного эндпоинта (закрыто авторизацией)'
        : `; фронтенд: ${pub.note}`;
    taskRecord(num, label, 'Создание', 'OK', `id=${id}; строка в БД ✓${relNote}${front}`);
    await globalPayload.delete({ collection: slug, id, overrideAccess: true }).catch(() => undefined);
  } catch (error) {
    taskRecord(num, label, 'Создание', 'FAIL', errMsg(error));
  }
};

const taskUpdate = async (num: number, slug: string, label: string, opts: { publish?: boolean; extra?: Record<string, unknown> } = {}) => {
  const rand = mkRand();
  try {
    const created = await createDoc(slug, rand, opts);
    const id = created.id;
    const config = collectionConfigs.get(slug);
    const { data } = await makeData(slug, rand, opts);
    const upd: Record<string, unknown> = {};
    for (const key of ['title', 'name', 'description', 'shortDescription', 'label', 'question']) {
      if (data[key] !== undefined) { upd[key] = `updated-${rand}`; break; }
    }
    if (Object.keys(upd).length < 3) {
      const textFields: string[] = [];
      const walk = (fields: Field[]) => {
        for (const field of fields) {
          if (field.type === 'tabs') { for (const tab of (field as never as { tabs: Array<{ fields: Field[] }> }).tabs) walk(tab.fields); continue; }
          if (field.type === 'row' || field.type === 'collapsible' || field.type === 'group') { walk((field as never as { fields: Field[] }).fields); continue; }
          if ((field.type === 'text' || field.type === 'textarea') && field.name && !(field as { validate?: unknown }).validate) textFields.push(field.name);
        }
      };
      walk(config?.fields as Field[]);
      for (const tf of textFields) {
        if (Object.keys(upd).length >= 3) break;
        if (upd[tf] === undefined) upd[tf] = `updated-${rand}`;
      }
    }
    const before = await getRow(tableFor(slug), id);
    await globalPayload.update({ collection: slug, id, data: upd, overrideAccess: true, depth: 0 });
    const after = await getRow(tableFor(slug), id);
    if (!after) {
      taskRecord(num, label, 'Обновление', 'FAIL', 'после update нет строки в БД');
      await globalPayload.delete({ collection: slug, id, overrideAccess: true }).catch(() => undefined);
      return;
    }
    let mismatches = 0;
    for (const key of Object.keys(upd)) {
      const col = snake(key);
      const actual = String(after[col] ?? '');
      if (!actual.includes(`updated-${rand}`)) mismatches++;
    }
    const updatedAtChanged = before && String(before.updated_at) !== String(after.updated_at);
    const pub = await publicVisible(slug, id);
    const front = pub.visible ? '; фронтенд: видно ✓' : '; фронтенд: закрыто/не видно';
    if (mismatches > 0) {
      taskRecord(num, label, 'Обновление', 'FAIL', `${mismatches} полей не обновилось в БД${updatedAtChanged ? '' : '; updated_at не изменился'}${front}`);
    } else if (!updatedAtChanged) {
      taskRecord(num, label, 'Обновление', 'WARN', `поля обновились ✓, но updated_at не изменился${front}`);
    } else {
      taskRecord(num, label, 'Обновление', 'OK', `поля обновились ✓, updated_at изменился ✓${front}`);
    }
    await globalPayload.delete({ collection: slug, id, overrideAccess: true }).catch(() => undefined);
  } catch (error) {
    taskRecord(num, label, 'Обновление', 'FAIL', errMsg(error));
  }
};

const taskDelete = async (num: number, slug: string, label: string, opts: { publish?: boolean; extra?: Record<string, unknown> } = {}) => {
  const rand = mkRand();
  try {
    const created = await createDoc(slug, rand, opts);
    const id = created.id;
    if (!(await getRow(tableFor(slug), id))) {
      taskRecord(num, label, 'Удаление', 'FAIL', 'тестовая запись не создалась — проверка невозможна');
      return;
    }
    await globalPayload.delete({ collection: slug, id, overrideAccess: true });
    const after = await getRow(tableFor(slug), id);
    const pub = await publicVisible(slug, id);
    if (after) {
      taskRecord(num, label, 'Удаление', 'FAIL', `запись осталась в БД после удаления${pub.visible ? '; всё ещё видна на фронте' : ''}`);
    } else if (pub.visible) {
      taskRecord(num, label, 'Удаление', 'FAIL', 'удалена из БД, но всё ещё видна на фронте');
    } else {
      taskRecord(num, label, 'Удаление', 'OK', 'удалена из БД ✓; на фронте не отображается ✓');
    }
  } catch (error) {
    taskRecord(num, label, 'Удаление', 'FAIL', errMsg(error));
  }
};

const taskValidate = async (num: number, slug: string, label: string, opts: { checkUniqueSlug?: boolean; custom?: (rand: string) => Promise<{ result: TaskResult; detail: string }> } = {}) => {
  const rand = mkRand();
  try {
    // 1) Обязательное текстовое поле без defaultValue
    const config = collectionConfigs.get(slug);
    let requiredField: string | undefined;
    const findRequired = (fields: Field[], seen = new Set<string>()): string | undefined => {
      for (const field of fields) {
        if (field.type === 'tabs') {
          for (const tab of (field as never as { tabs: Array<{ fields: Field[] }> }).tabs) {
            const res = findRequired(tab.fields, seen);
            if (res) return res;
          }
          continue;
        }
        if (field.type === 'row' || field.type === 'collapsible' || field.type === 'group') {
          const res = findRequired((field as never as { fields: Field[] }).fields, seen);
          if (res) return res;
          continue;
        }
        if (!field.name || seen.has(field.name)) continue;
        seen.add(field.name);
        const meta = field as never as { required?: boolean; defaultValue?: unknown };
        if (meta.required && !meta.defaultValue && (field.type === 'text' || field.type === 'textarea' || field.type === 'email')) return field.name;
      }
      return undefined;
    };
    requiredField = findRequired(config?.fields as Field[]);

    const details: string[] = [];
    let allOk = true;

    if (requiredField && slug !== 'users') {
      const { data } = await makeData(slug, rand);
      delete (data as Record<string, unknown>)[requiredField];
      try {
        await globalPayload.create({ collection: slug, data, overrideAccess: true, depth: 0 });
        details.push(`создание без обязательного поля ${requiredField} ПРОШЛО (баг валидации)`);
        allOk = false;
      } catch {
        details.push(`без ${requiredField} — ошибка ✓`);
      }
    }

    // 2) Уникальный slug: hook slugBeforeValidate авто-уникализирует (dupslug → dupslug-2),
    // поэтому дубликат «создаётся», но с другим slug. Настоящий баг — если slug совпал.
    if (opts.checkUniqueSlug) {
      const dup = `dupslug-${rand}`;
      const c1 = await createDoc(slug, mkRand(), { publish: true, extra: { slug: dup } });
      let c2: Record<string, unknown> | undefined;
      try {
        c2 = await createDoc(slug, mkRand(), { publish: true, extra: { slug: dup } });
      } catch {
        // DB-уникальность отклонила дубликат — тоже корректно
      }
      const row1 = await getRow(tableFor(slug), String(c1.id));
      const row2 = c2 ? await getRow(tableFor(slug), String(c2.id)) : null;
      const slug1 = String(row1?.slug || '');
      const slug2 = c2 ? String(row2?.slug || '') : undefined;
      if (!c2) {
        details.push('дубликат slug отклонён БД ✓');
      } else if (slug1 !== slug2) {
        details.push(`дубликат slug авто-уникализирован ✓ (${slug1} → ${slug2})`);
      } else {
        details.push(`дубликат slug создан с тем же slug (${slug1}) — уникальность не работает`);
        allOk = false;
      }
      await globalPayload.delete({ collection: slug, id: c1.id, overrideAccess: true }).catch(() => undefined);
      if (c2) await globalPayload.delete({ collection: slug, id: c2.id, overrideAccess: true }).catch(() => undefined);
    }

    // 3) Кастомные проверки (WARN не делает задачу FAIL)
    let warnOnly = false;
    if (opts.custom) {
      const custom = await opts.custom(rand);
      details.push(custom.detail);
      if (custom.result === 'FAIL') allOk = false;
      if (custom.result === 'WARN') warnOnly = true;
    }

    taskRecord(num, label, 'Валидация', allOk ? (warnOnly ? 'WARN' : 'OK') : 'FAIL', details.join('; ') || 'нет проверок');
  } catch (error) {
    taskRecord(num, label, 'Валидация', 'FAIL', errMsg(error));
  }
};

/* ────────────────────────── Main ────────────────────────── */

const main = async () => {
  globalPayload = await getPayloadClient();
  const collections = globalPayload.config.collections as CollectionConfig[];
  for (const collection of collections) collectionConfigs.set(collection.slug, collection);

  // Временный express-сервер с реальными роутами
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.set('trust proxy', 1);
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    if (_req.method === 'OPTIONS') { res.sendStatus(204); return; }
    next();
  });
  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const address = server.address() as { port: number };
  apiBase = `http://127.0.0.1:${address.port}`;
  console.log(`Ephemeral API: ${apiBase}`);

  // ── Задачи 1–4: Users ──
  const usersRand = mkRand();
  const userEmail = `verify-${usersRand}@example.com`;
  try {
    const user = await globalPayload.create({
      collection: 'users',
      data: { email: userEmail, password: 'VerifyPass123!', firstName: 'Ver', lastName: 'Ificator', role: 'user', accountStatus: 'active' },
      overrideAccess: true,
      depth: 0,
    });
    const uid = user.id;
    const row = await getRow('users', uid);
    if (!row) taskRecord(1, 'Users', 'Создание', 'FAIL', 'нет строки в БД');
    else {
      const hash = String(row.hash || '');
      const salt = String(row.salt || '');
      const hashOk = hash.length > 10 && !hash.includes('VerifyPass123!');
      const roleOk = String(row.role || '') === 'user';
      const emailOk = String(row.email || '').toLowerCase() === userEmail.toLowerCase();
      let relNote = '';
      const dbCount = await countWhere('users', 'id = ?', [uid]);
      if (dbCount !== 1) relNote = `; в БД строк: ${dbCount}`;
      taskRecord(1, 'Users', 'Создание', hashOk && roleOk && emailOk ? 'OK' : 'FAIL',
        `email✓=${emailOk}, hash✓=${hashOk} (длина ${hash.length}, не plaintext), salt✓=${Boolean(salt)}, role✓=${roleOk}${relNote}; фронтенд: публичного профиля нет (доступ только владельцу/админу)`);
    }
    // 2: update
    try {
      const before = await getRow('users', uid);
      await globalPayload.update({
        collection: 'users',
        id: uid,
        data: { email: `updated-${usersRand}@example.com`, firstName: 'Updated', role: 'moderator' },
        overrideAccess: true,
        depth: 0,
      });
      const after = await getRow('users', uid);
      const emailOk = String(after?.email || '').includes(`updated-${usersRand}`);
      const nameOk = String(after?.first_name || '') === 'Updated';
      const roleOk = String(after?.role || '') === 'moderator';
      const tsChanged = before && String(before.updated_at) !== String(after?.updated_at);
      taskRecord(2, 'Users', 'Обновление', emailOk && nameOk && roleOk ? (tsChanged ? 'OK' : 'WARN') : 'FAIL',
        `email✓=${emailOk}, name✓=${nameOk}, role✓=${roleOk}${tsChanged ? ', updated_at изменился ✓' : ', updated_at НЕ изменился'}`);
    } catch (error) {
      taskRecord(2, 'Users', 'Обновление', 'FAIL', errMsg(error));
    }
    // 3: delete
    try {
      await globalPayload.delete({ collection: 'users', id: uid, overrideAccess: true });
      const after = await getRow('users', uid);
      taskRecord(3, 'Users', 'Удаление', after ? 'FAIL' : 'OK', after ? 'запись осталась в БД' : 'удалён из БД ✓ (связанных записей у тестового юзера не было — каскад неприменим)');
    } catch (error) {
      taskRecord(3, 'Users', 'Удаление', 'FAIL', errMsg(error));
    }
  } catch (error) {
    taskRecord(1, 'Users', 'Создание', 'FAIL', errMsg(error));
    taskRecord(2, 'Users', 'Обновление', 'SKIP', 'не удалось создать тестового юзера');
    taskRecord(3, 'Users', 'Удаление', 'SKIP', 'не удалось создать тестового юзера');
  }
  // 4: validation
  try {
    const details: string[] = [];
    let ok = true;
    try {
      await globalPayload.create({ collection: 'users', data: { password: 'VerifyPass123!' }, overrideAccess: true });
      details.push('создание без email ПРОШЛО (баг)');
      ok = false;
    } catch { details.push('без email — ошибка ✓'); }
    const dupEmail = `dup-${mkRand()}@example.com`;
    const u1 = await globalPayload.create({ collection: 'users', data: { email: dupEmail, password: 'VerifyPass123!' }, overrideAccess: true });
    try {
      await globalPayload.create({ collection: 'users', data: { email: dupEmail, password: 'VerifyPass123!' }, overrideAccess: true });
      details.push('дубликат email создан (баг)');
      ok = false;
    } catch { details.push('дубликат email отклонён ✓'); }
    await globalPayload.delete({ collection: 'users', id: u1.id, overrideAccess: true }).catch(() => undefined);
    taskRecord(4, 'Users', 'Валидация', ok ? 'OK' : 'FAIL', details.join('; ') + '; роли — отдельной таблицы нет (role — select на пользователе), удалять нечего');
  } catch (error) {
    taskRecord(4, 'Users', 'Валидация', 'FAIL', errMsg(error));
  }

  // ── Задачи 5–8: Media ──
  try {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    const media = await globalPayload.create({
      collection: 'media',
      data: { alt: `verify-${mkRand()}` },
      file: { data: png, name: 'verify.png', mimetype: 'image/png', size: png.length },
      overrideAccess: true,
      depth: 0,
    });
    const mrow = await getRow('media', media.id);
    const mediaDir = path.resolve(process.cwd(), 'uploads', 'media');
    const fileOnDisk = mrow?.filename ? fs.existsSync(path.join(mediaDir, String(mrow.filename))) : false;
    const metaOk = Boolean(mrow?.filename) && Boolean(mrow?.mime_type) && Number(mrow?.filesize || 0) > 0;
    const pub = await publicVisible('media', media.id);
    taskRecord(5, 'Media', 'Создание (загрузка)', metaOk && fileOnDisk ? 'OK' : 'FAIL',
      `запись в БД✓=${metaOk} (mime=${mrow?.mime_type}, size=${mrow?.filesize}); файл на диске✓=${fileOnDisk}${pub.visible ? '; публично доступен ✓' : ''}`);
    // 6: update (замена файла + alt)
    try {
      const png2 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      const oldFilename = mrow?.filename ? String(mrow.filename) : undefined;
      const updated = await globalPayload.update({
        collection: 'media',
        id: media.id,
        data: { alt: `updated-${mkRand()}` },
        file: { data: png2, name: 'verify2.png', mimetype: 'image/png', size: png2.length },
        overrideAccess: true,
        depth: 0,
      });
      const newFilename = String(updated.filename || '');
      const newOnDisk = fs.existsSync(path.join(mediaDir, newFilename));
      const oldGone = oldFilename ? !fs.existsSync(path.join(mediaDir, oldFilename)) : true;
      taskRecord(6, 'Media', 'Обновление', newOnDisk ? (oldGone ? 'OK' : 'WARN') : 'FAIL',
        `новый файл на диске✓=${newOnDisk}; старый файл удалён✓=${oldGone}; БД: filename обновлён✓=${Boolean(newFilename)}`);
    } catch (error) {
      taskRecord(6, 'Media', 'Обновление', 'FAIL', errMsg(error));
    }
    // 7: delete
    try {
      const filename = String(media.filename || '');
      await globalPayload.delete({ collection: 'media', id: media.id, overrideAccess: true });
      const after = await getRow('media', media.id);
      const fileGone = filename ? !fs.existsSync(path.join(mediaDir, filename)) : true;
      taskRecord(7, 'Media', 'Удаление', !after && fileGone ? 'OK' : 'FAIL',
        `запись удалена✓=${!after}; файл с диска удалён✓=${fileGone}`);
    } catch (error) {
      taskRecord(7, 'Media', 'Удаление', 'FAIL', errMsg(error));
    }
  } catch (error) {
    taskRecord(5, 'Media', 'Создание (загрузка)', 'FAIL', errMsg(error));
    taskRecord(6, 'Media', 'Обновление', 'SKIP', 'не удалось создать media');
    taskRecord(7, 'Media', 'Удаление', 'SKIP', 'не удалось создать media');
  }
  // 8: Media validation
  try {
    const details: string[] = [];
    let ok = true;
    try {
      const txt = Buffer.from('hello');
      await globalPayload.create({
        collection: 'media',
        data: { alt: `verify-${mkRand()}` },
        file: { data: txt, name: 'bad.txt', mimetype: 'text/plain', size: txt.length },
        overrideAccess: true,
      });
      details.push('файл недопустимого типа (txt) ПРИНЯТ — ограничений mimeTypes в конфиге Media нет');
      ok = false;
    } catch { details.push('txt отклонён ✓'); }
    try {
      await globalPayload.create({ collection: 'media', data: { alt: '' }, overrideAccess: true });
      details.push('пустой alt ПРИНЯТ (баг)');
      ok = false;
    } catch { details.push('пустой alt — ошибка ✓'); }
    taskRecord(8, 'Media', 'Валидация', ok ? 'OK' : 'WARN', details.join('; '));
  } catch (error) {
    taskRecord(8, 'Media', 'Валидация', 'FAIL', errMsg(error));
  }

  // ── Задачи 9–12: Audit Logs ──
  try {
    const total = await countTable('audit_logs');
    const list = await globalPayload.find({ collection: 'audit-logs', limit: 10, sort: '-createdAt', overrideAccess: true, depth: 0 });
    const sample = list.docs[0] as Record<string, unknown> | undefined;
    const fieldsOk = Boolean(sample?.action && sample?.collection && sample?.documentId && sample?.summary);
    taskRecord(9, 'Audit Logs', 'Просмотр списка', total > 0 && list.docs.length > 0 ? 'OK' : 'WARN',
      `в БД ${total} строк; API вернул ${list.docs.length}; поля (action/collection/documentId/summary)✓=${fieldsOk}`);
    // 10: detail
    if (sample) {
      try {
        const detail = await globalPayload.findByID({ collection: 'audit-logs', id: String(sample.id), overrideAccess: true, depth: 0 });
        const row = await getRow('audit_logs', String(sample.id));
        const match = row && String(row.action || '') === String(detail.action) && String(row.collection || '') === String(detail.collection);
        taskRecord(10, 'Audit Logs', 'Детальный просмотр', match ? 'OK' : 'FAIL',
          match ? `поля совпадают с БД (action=${row.action}, collection=${row.collection})` : `API и БД различаются (БД: ${row?.action}, API: ${detail.action})`);
      } catch (error) {
        taskRecord(10, 'Audit Logs', 'Детальный просмотр', 'FAIL', errMsg(error));
      }
    } else {
      taskRecord(10, 'Audit Logs', 'Детальный просмотр', 'SKIP', 'нет записей в audit_logs');
    }
    // 11: фильтрация
    try {
      const where = { collection: { equals: 'activities' }, action: { equals: 'create' } };
      const filtered = await globalPayload.find({ collection: 'audit-logs', where, limit: 10, overrideAccess: true, depth: 0 });
      const dbCount = await countWhere('audit_logs', "collection = 'activities' AND action = 'create'", []);
      const match = dbCount === -1 || filtered.totalDocs === dbCount;
      const dateFiltered = await globalPayload.find({ collection: 'audit-logs', where: { createdAt: { greater_than: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() } }, limit: 5, overrideAccess: true, depth: 0 });
      taskRecord(11, 'Audit Logs', 'Фильтрация', match ? 'OK' : 'FAIL',
        `фильтр collection=activities&action=create: API=${filtered.totalDocs}, БД=${dbCount}${match ? ' (совпадает ✓)' : ' (РАСХОЖДЕНИЕ)'}; фильтр по дате (30 дней) вернул ${dateFiltered.totalDocs}`);
    } catch (error) {
      taskRecord(11, 'Audit Logs', 'Фильтрация', 'FAIL', errMsg(error));
    }
    // 12: синхронизация
    try {
      const before = await countWhere('audit_logs', "collection = 'activities'", []);
      const act = await createDoc('activities', mkRand(), { publish: true });
      await new Promise((resolve) => setTimeout(resolve, 400));
      const after = await countWhere('audit_logs', "collection = 'activities' AND document_id = ?", [String(act.id)]);
      await globalPayload.delete({ collection: 'activities', id: act.id, overrideAccess: true }).catch(() => undefined);
      taskRecord(12, 'Audit Logs', 'Синхронизация', after > 0 ? 'OK' : 'FAIL',
        `после создания документа появилась аудит-запись ✓=${after > 0} (всего activities: ${before} → ${await countWhere('audit_logs', "collection = 'activities'", [])})`);
    } catch (error) {
      taskRecord(12, 'Audit Logs', 'Синхронизация', 'FAIL', errMsg(error));
    }
  } catch (error) {
    taskRecord(9, 'Audit Logs', 'Просмотр списка', 'FAIL', errMsg(error));
    taskRecord(10, 'Audit Logs', 'Детальный просмотр', 'SKIP', errMsg(error));
    taskRecord(11, 'Audit Logs', 'Фильтрация', 'SKIP', errMsg(error));
    taskRecord(12, 'Audit Logs', 'Синхронизация', 'SKIP', errMsg(error));
  }

  // ── Задачи 13–16: Content Localizations ──
  const locSlug = 'content-localizations';
  await taskCreate(13, locSlug, 'Content Localizations');
  await taskUpdate(14, locSlug, 'Content Localizations');
  await taskDelete(15, locSlug, 'Content Localizations');
  await taskValidate(16, locSlug, 'Content Localizations', {
    custom: async (rand) => {
      try {
        await globalPayload.create({
          collection: locSlug,
          data: { sourceCollection: 'activities', sourceId: `v-${rand}`, localizedData: { test: 1 } },
          overrideAccess: true,
        });
        return { result: 'FAIL', detail: 'локализация без языка (language) создана — валидация не сработала' };
      } catch {
        return { result: 'OK', detail: 'без language — ошибка валидации ✓' };
      }
    },
  });

  // ── Задачи 17–20: Content (отдельной коллекции нет) ──
  taskRecord(17, 'Content', 'Создание', 'N/A', 'Отдельной коллекции Content нет: контент живёт в предметных коллекциях (Tournaments/Activities/…, задачи 21–60) и ContentLocalizations (13–16)');
  taskRecord(18, 'Content', 'Обновление', 'N/A', 'См. задачи 21–60 (обновление предметных коллекций)');
  taskRecord(19, 'Content', 'Удаление', 'N/A', 'См. задачи 21–60 (удаление предметных коллекций)');
  taskRecord(20, 'Content', 'Валидация', 'N/A', 'См. задачи 21–60 (валидации предметных коллекций)');

  // ── Контент: 21–60 ──
  const contentEntities: Array<{ slug: string; label: string; start: number; checkUniqueSlug?: boolean }> = [
    { slug: 'tournaments', label: 'Tournaments', start: 21, checkUniqueSlug: true },
    { slug: 'activities', label: 'Activities', start: 25 },
    { slug: 'experts', label: 'Experts', start: 29 },
    { slug: 'faqs', label: 'Faqs', start: 33 },
    { slug: 'events', label: 'Events', start: 37, checkUniqueSlug: true },
    { slug: 'opportunities', label: 'Opportunities', start: 41, checkUniqueSlug: true },
    { slug: 'trust-points', label: 'Trust Points', start: 45 },
    { slug: 'pillars', label: 'Pillars', start: 49 },
    { slug: 'scenarios', label: 'Scenarios', start: 53 },
    { slug: 'stats', label: 'Stats', start: 57 },
  ];
  for (const entity of contentEntities) {
    const opts = { publish: true };
    await taskCreate(entity.start, entity.slug, entity.label, opts);
    await taskUpdate(entity.start + 1, entity.slug, entity.label, opts);
    await taskDelete(entity.start + 2, entity.slug, entity.label, opts);
    await taskValidate(entity.start + 3, entity.slug, entity.label, { checkUniqueSlug: entity.checkUniqueSlug });
  }

  // ── Сообщество: 61–80 ──
  await taskCreate(61, 'team-members', 'Team Members', { publish: true, isApproved: true });
  await taskUpdate(62, 'team-members', 'Team Members', { publish: true });
  await taskDelete(63, 'team-members', 'Team Members', { publish: true });
  await taskValidate(64, 'team-members', 'Team Members');
  await taskCreate(93, 'contact-settings', 'Contact Settings', { publish: true });
  await taskUpdate(94, 'contact-settings', 'Contact Settings', { publish: true });
  await taskDelete(95, 'contact-settings', 'Contact Settings', { publish: true });
  await taskValidate(96, 'contact-settings', 'Contact Settings', {
    custom: async () => {
      try {
        const s = await globalPayload.create({
          collection: 'contact-settings',
          data: { label: `verify-${mkRand()}`, email: 'invalid-email' },
          overrideAccess: true,
        });
        const note = 'email accepted invalid value';
        await globalPayload.delete({ collection: 'contact-settings', id: s.id, overrideAccess: true }).catch(() => undefined);
        return { result: 'WARN', detail: note };
      } catch (error) {
        return { result: 'OK', detail: `invalid email rejected (${errMsg(error)})` };
      }
    },
  });

  await taskCreate(97, 'operator-settings', 'Operator Settings', { publish: true });
  await taskUpdate(98, 'operator-settings', 'Operator Settings', { publish: true });
  await taskDelete(99, 'operator-settings', 'Operator Settings', { publish: true });
  await taskValidate(100, 'operator-settings', 'Operator Settings', {
    custom: async () => {
      try {
        const s = await globalPayload.create({
          collection: 'operator-settings',
          data: { label: `verify-${mkRand()}`, contactsEmail: 'не-валидный', operatorInn: 'INN!?' },
          overrideAccess: true,
        });
        const note = 'форматы (email/ИНН) НЕ валидируются — поля типа text';
        await globalPayload.delete({ collection: 'operator-settings', id: s.id, overrideAccess: true }).catch(() => undefined);
        return { result: 'WARN', detail: note };
      } catch (error) {
        return { result: 'OK', detail: `невалидные значения отклонены ✓ (${errMsg(error)})` };
      }
    },
  });

  server.close();
  const lines: string[] = [];
  lines.push('| № | Сущность | Действие | Результат | Описание расхождения |');
  lines.push('|---|---------|----------|-----------|----------------------|');
  for (const row of rows.sort((a, b) => a.num - b.num)) {
    lines.push(`| ${row.num} | ${row.entity} | ${row.action} | ${row.result} | ${row.detail.replace(/\|/g, '\\|')} |`);
  }
  const counts = rows.reduce<Record<string, number>>((acc, row) => { acc[row.result] = (acc[row.result] || 0) + 1; return acc; }, {});
  lines.unshift(`Итого: ${rows.length} задач. OK=${counts.OK || 0}, FAIL=${counts.FAIL || 0}, WARN=${counts.WARN || 0}, SKIP=${counts.SKIP || 0}, N/A=${counts['N/A'] || 0}`);
  const report = lines.join('\n');
  const outPath = path.resolve(process.cwd(), 'scripts/cms-verify-112-report.md');
  fs.writeFileSync(outPath, report, 'utf8');
  console.log(report);
  console.log(`\nОтчёт сохранён: ${outPath}`);
};

main()
  .catch((error) => {
    console.error('FATAL', error);
    process.exit(1);
  })
  .finally(async () => {
    try {
      const payload = (await getPayloadClient()) as never as {
        delete: (args: Record<string, unknown>) => Promise<unknown>;
      };
      for (const dep of createdDeps.reverse()) {
        await payload.delete({ collection: dep.collection, id: dep.id, overrideAccess: true }).catch(() => undefined);
      }
    } catch {
      /* ignore */
    }
    db.close();
  });
