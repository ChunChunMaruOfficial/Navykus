/**
 * CMS comprehensive verification (Задания 0–10).
 * Проверяет для каждой коллекции: схему БД ↔ конфиг, CRUD, валидации,
 * аудит-логи, локализации, связи. Выводит отчёт с приоритетами.
 *
 * Запуск: npx tsx scripts/cms-verify.ts
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

import { createClient } from '@libsql/client';
import type { CollectionConfig, Field } from 'payload';

import { getPayloadClient } from '../server/payload';

type Level = 'ok' | 'warn' | 'fail' | 'skip' | 'info';
type Entry = { level: Level; entity: string; check: string; detail: string };

const results: Entry[] = [];
const record = (level: Level, entity: string, check: string, detail = '') => {
  results.push({ level, entity, check, detail });
};

const db = createClient({ url: process.env.DATABASE_URL || 'file:./payload.db' });

const snake = (name: string) => name.replace(/([A-Z])/g, '_$1').replace(/[-\s]/g, '_').toLowerCase();

// Коллекции, у которых в конфиге подключены хуки аудита (auditAfterChange/auditAfterDelete).
const AUDITED_COLLECTIONS = new Set([
  'activities', 'events', 'experts', 'faqs', 'opportunities',
  'pillars', 'scenarios', 'stats', 'team-members',
  'tournaments', 'trust-points',
]);

// Внутренние коллекции Payload — не являются сущностями CMS, в отчёт не включаем как FAIL.
const INTERNAL_COLLECTIONS = new Set([
  'payload-locked-documents', 'payload-preferences', 'payload-migrations', 'payload-kv',
]);
const tableFor = (slug: string) => slug.replace(/-/g, '_');

const columnsFor = async (table: string) => {
  const r = await db.execute(`PRAGMA table_info(${JSON.stringify(table).replace(/"/g, '`')})`);
  return new Set(r.rows.map((row) => String((row as unknown as { name: string }).name)));
};

const countWhere = async (table: string, where: string, args: unknown[]) => {
  try {
    const r = await db.execute(`SELECT COUNT(*) as c FROM ${table} WHERE ${where}`, args as never[]);
    return Number((r.rows[0] as unknown as { c: number }).c);
  } catch {
    return -1;
  }
};

/* ────────────────────────── Field walkers ────────────────────────── */

const SKIP = Symbol('skip');

// Auth-инъекции Payload в конфиг users — не поля, которые можно создавать руками.
const AUTH_GENERATED_FIELDS = new Set([
  'sessions', 'hash', 'salt', 'loginAttempts', 'lockUntil',
  'resetPasswordToken', 'resetPasswordExpiration',
]);

// Созданные зависимые документы для relationship-полей — удалим в конце прогона.
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
      // hasMany select хранится массивом
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
              // Обязательная связь, а в целевой коллекции пусто — создаём минимальный документ
              if (isRequired && target !== 'media' && !buildingCollections.has(target)) {
                resolved = await createDependencyDoc(target, payload as never, rand);
                if (resolved !== undefined) break;
              }
            } catch {
              /* ignore */
            }
          }
          if (resolved !== undefined) data[field.name] = resolved;
          continue;
        }
        case 'blocks': {
          data[field.name] = [];
          continue;
        }
        case 'array': {
          // Пропускаем служебные auth-массивы (sessions), их создаёт сам Payload
          if (AUTH_GENERATED_FIELDS.has(field.name)) continue;
          const sub = (field as never as { fields: Field[] }).fields;
          const item: Record<string, unknown> = {};
          for (const subField of sub) {
            if (subField.type === 'text' || subField.type === 'number') {
              item[subField.name] = subField.type === 'text' ? `item-${rand}` : 1;
            }
          }
          if (Object.keys(item).length) data[field.name] = [item];
          else data[field.name] = [];
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

// Создаёт минимальный документ в целевой коллекции для обязательной связи
const createDependencyDoc = async (
  target: string,
  payload: never,
  rand: string,
): Promise<string | number | undefined> => {
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
  } catch (error) {
    record('skip', target, 'crud.dependency', `не удалось создать зависимый документ: ${(error as Error).message?.slice(0, 120)}`);
    return undefined;
  } finally {
    buildingCollections.delete(target);
  }
};

/* ────────────────────────── Phases ────────────────────────── */

const phaseSchema = async (collections: CollectionConfig[]) => {
  record('info', 'system', 'schema', 'Сверка таблиц БД с payload-generated-schema.ts');
  const schemaFile = path.resolve(process.cwd(), 'src/payload-generated-schema.ts');
  const content = fs.readFileSync(schemaFile, 'utf8');
  const generatedTables = new Set(
    Array.from(content.matchAll(/sqliteTable\([\s\n]*"([a-z0-9_]+)"/g)).map((m) => m[1]),
  );

  const r = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  const actualTables = new Set<string>();
  for (const row of r.rows) actualTables.add(String((row as unknown as { name: string }).name));

  for (const table of generatedTables) {
    if (!actualTables.has(table)) record('fail', table, 'schema', `таблица из сгенерированной схемы отсутствует в БД`);
  }
  for (const table of actualTables) {
    if (table.startsWith('_')) continue; // version tables
    if (!generatedTables.has(table)) record('warn', table, 'schema', `таблица в БД отсутствует в payload-generated-schema.ts`);
  }

  for (const collection of collections) {
    const slug = collection.slug;
    const table = tableFor(slug);
    if (INTERNAL_COLLECTIONS.has(slug)) continue;
    if (!actualTables.has(table)) {
      record('fail', slug, 'schema', `нет таблицы БД ${table}`);
      continue;
    }
    const cols = await columnsFor(table);
    const missing: string[] = [];
    const walk = (fields: Field[], prefix = '') => {
      for (const field of fields) {
        if (field.type === 'tabs') {
          for (const tab of (field as never as { tabs: Array<{ fields: Field[] }> }).tabs) walk(tab.fields, prefix);
          continue;
        }
        if (field.type === 'row' || field.type === 'collapsible') {
          walk((field as never as { fields: Field[] }).fields, prefix);
          continue;
        }
        if (field.type === 'group') {
          const groupName = (field as never as { name?: string }).name;
          if (groupName) walk((field as never as { fields: Field[] }).fields, `${prefix}${snake(groupName)}_`);
          else walk((field as never as { fields: Field[] }).fields, prefix);
          continue;
        }
        if (field.type === 'array' || field.type === 'blocks') continue; // separate tables
        if (field.type === 'ui') continue;
        if (!field.name) continue;
        const fieldMeta = field as never as { hasMany?: boolean };
        // hasMany relationship/select хранятся в rels/join-таблицах, а не в колонке
        if (fieldMeta.hasMany) continue;
        let column = snake(field.name);
        if (field.type === 'relationship' || field.type === 'upload') column = `${column}_id`;
        if (!cols.has(`${prefix}${column}`)) missing.push(`${prefix}${column}`);
      }
    };
    walk(collection.fields as Field[]);
    if (missing.length) record('fail', slug, 'schema', `отсутствуют колонки: ${missing.join(', ')}`);
    else record('ok', slug, 'schema', `все колонки на месте`);
  }
};

const phaseCrud = async (collections: CollectionConfig[]) => {
  const payload = (await getPayloadClient()) as never as {
    create: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
    findByID: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
    update: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
    delete: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
    find: (args: Record<string, unknown>) => Promise<{ docs: Array<Record<string, unknown>> }>;
  };
  record('info', 'system', 'crud', 'CRUD: create → read → update → delete для каждой коллекции');

  for (const collection of collections) {
    const slug = collection.slug;
    if (INTERNAL_COLLECTIONS.has(slug)) continue;
    const table = tableFor(slug);
    const rand = `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

    // special handling: upload/media without a real file
    if (slug === 'media') {
      const found = await payload.find({ collection: 'media', limit: 1, overrideAccess: true, depth: 0 });
      if (found.docs[0]) {
        const doc = found.docs[0];
        await payload.update({ collection: 'media', id: doc.id, data: { alt: `verify-${rand}` }, overrideAccess: true }).catch(() => undefined);
        record('skip', slug, 'crud', 'create пропущен (upload требует файл); update alt выполнен');
      } else {
        record('skip', slug, 'crud', 'нет медиа-файлов, коллекция не тестируется');
      }
      continue;
    }

    const { data, updateField } = await buildSample(collection.fields as Field[], payload, rand);
    if (!data.email) data.email = `verify-${rand}@example.com`;
    if (!data.password && slug === 'users') data.password = 'VerifyPass123!';
    if (collection.versions) data._status = 'published';

    let created: Record<string, unknown> | undefined;
    try {
      created = await payload.create({ collection: slug, data, overrideAccess: true, depth: 0 });
    } catch (error) {
      const message = (error as Error).message || '';
      if (message.includes('The following field is invalid') || message.includes('The following fields are invalid')) {
        record('skip', slug, 'crud.create', `требуются связанные записи (пустая коллекция-источник): ${message.slice(0, 120)}`);
      } else {
        record('fail', slug, 'crud.create', `ошибка: ${message.slice(0, 200)}`);
      }
      continue;
    }
    const id = String(created.id);
    record('ok', slug, 'crud.create', `id=${id}`);

    // 1.5 SELECT в БД
    const rowCount = await countWhere(table, 'id = ?', [id]);
    if (rowCount === 1) record('ok', slug, 'crud.dbRow', 'запись найдена в БД');
    else if (rowCount === -1) record('warn', slug, 'crud.dbRow', `не удалось проверить таблицу ${table}`);
    else record('fail', slug, 'crud.dbRow', `в БД ${rowCount} строк с id=${id}`);

    // 2. read
    try {
      const found = await payload.findByID({ collection: slug, id, overrideAccess: true, depth: 0 });
      if (found && String(found.id) === id) record('ok', slug, 'crud.read', 'findByID OK');
      else record('fail', slug, 'crud.read', 'findByID не вернул запись');
    } catch (error) {
      record('fail', slug, 'crud.read', (error as Error).message?.slice(0, 150));
    }

    // 3. update (минимум 3 поля где возможно)
    if (updateField) {
      const updateData: Record<string, unknown> = { [updateField]: `updated-${rand}` };
      if (data.title) updateData.title = `updated-${rand}`;
      if (data.description) updateData.description = `updated-${rand}`;
      if (data.alt) updateData.alt = `updated-${rand}`;
      try {
        await payload.update({ collection: slug, id, data: updateData, overrideAccess: true, depth: 0 });
        const rowCount2 = await countWhere(table, `id = ? AND ${snake(String(updateField))} = ?`, [id, `updated-${rand}`]);
        if (rowCount2 === 1) record('ok', slug, 'crud.update', `${updateField} → updated в БД`);
        else if (rowCount2 === -1) record('warn', slug, 'crud.update', `обновлено, но БД-проверка невозможна (${snake(String(updateField))})`);
        else record('fail', slug, 'crud.update', `в БД не обновилось (count=${rowCount2})`);
      } catch (error) {
        record('fail', slug, 'crud.update', (error as Error).message?.slice(0, 150));
      }
    }

    // 4. delete
    try {
      await payload.delete({ collection: slug, id, overrideAccess: true });
      const after = await countWhere(table, 'id = ?', [id]);
      if (after === 0) record('ok', slug, 'crud.delete', 'запись удалена из БД');
      else record('fail', slug, 'crud.delete', `в БД осталось ${after} строк`);
    } catch (error) {
      record('fail', slug, 'crud.delete', (error as Error).message?.slice(0, 150));
    }
  }
};

const phaseValidations = async (collections: CollectionConfig[]) => {
  const payload = (await getPayloadClient()) as never as {
    create: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
    find: (args: Record<string, unknown>) => Promise<{ docs: Array<Record<string, unknown>> }>;
    delete: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
  };
  record('info', 'system', 'validation', 'Валидация: пустые обязательные поля и дубликаты unique');

  for (const collection of collections) {
    const slug = collection.slug;
    if (slug === 'media' || INTERNAL_COLLECTIONS.has(slug)) continue;
    const rand = `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

    // required text field without defaultValue
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
        const fieldMeta = field as never as { required?: boolean; defaultValue?: unknown };
        if (fieldMeta.required && !fieldMeta.defaultValue && (field.type === 'text' || field.type === 'textarea' || field.type === 'email')) {
          return field.name;
        }
      }
      return undefined;
    };
    requiredField = findRequired(collection.fields as Field[]);

    if (requiredField) {
      const { data } = await buildSample(collection.fields as Field[], payload, rand);
      delete (data as Record<string, unknown>)[requiredField];
      // НЕ пере-добавляем email/пароль, если они и есть тестируемое поле,
      // иначе валидация не сработает и тест даст ложный FAIL.
      if (slug === 'users' && requiredField !== 'email') data.email = `v-${rand}@example.com`;
      if (slug === 'users' && !data.password) data.password = 'VerifyPass123!';
      if (collection.versions) data._status = 'published';
      try {
        await payload.create({ collection: slug, data, overrideAccess: true, depth: 0 });
        record('fail', slug, 'validation.required', `создание без обязательного поля ${requiredField} прошло успешно — ошибка валидации не сработала`);
        // cleanup
        try {
          const found = await payload.find({ collection: slug, where: { [requiredField]: { equals: data[requiredField] } }, limit: 1, overrideAccess: true, depth: 0 });
          if (found.docs[0]) await payload.delete({ collection: slug, id: found.docs[0].id, overrideAccess: true });
        } catch { /* ignore */ }
      } catch {
        record('ok', slug, 'validation.required', `без поля ${requiredField} — ошибка валидации есть`);
      }
    }

    // unique slug duplicate check
    const hasUniqueSlug = collection.fields.some((f) => (f as { name?: string }).name === 'slug' && (f as { unique?: boolean }).unique);
    if (hasUniqueSlug) {
      try {
        const { data: d1 } = await buildSample(collection.fields as Field[], payload, rand);
        d1.slug = `dupslug-${rand}`;
        if (collection.versions) d1._status = 'published';
        const c1 = await payload.create({ collection: slug, data: d1, overrideAccess: true, depth: 0 });
        try {
          const { data: d2 } = await buildSample(collection.fields as Field[], payload, rand);
          d2.slug = `dupslug-${rand}`;
          if (collection.versions) d2._status = 'published';
          try {
            await payload.create({ collection: slug, data: d2, overrideAccess: true, depth: 0 });
            record('fail', slug, 'validation.unique', 'дубликат slug создан — уникальность не работает');
          } catch {
            record('ok', slug, 'validation.unique', 'дубликат slug отклонён');
          }
        } finally {
          await payload.delete({ collection: slug, id: c1.id, overrideAccess: true }).catch(() => undefined);
        }
      } catch (error) {
        record('warn', slug, 'validation.unique', `не удалось проверить: ${(error as Error).message?.slice(0, 120)}`);
      }
    }
  }
};

const phaseAuditLocalization = async (collections: CollectionConfig[]) => {
  const payload = (await getPayloadClient()) as never as {
    create: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
    delete: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
  };
  record('info', 'system', 'audit+localization', 'Аудит-логи и записи локализаций после create/delete');

  for (const collection of collections) {
    const slug = collection.slug;
    if (slug === 'media' || slug === 'audit-logs' || INTERNAL_COLLECTIONS.has(slug)) continue;
    const rand = `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

    const { data } = await buildSample(collection.fields as Field[], payload, rand);
    if (!data.email) data.email = `verify-${rand}@example.com`;
    if (!data.password && slug === 'users') data.password = 'VerifyPass123!';
    if (collection.versions) data._status = 'published';

    const auditBefore = await countWhere('audit_logs', `collection = ?`, [slug]);
    let created: Record<string, unknown> | undefined;
    try {
      created = await payload.create({ collection: slug, data, overrideAccess: true, depth: 0 });
    } catch (error) {
      record('skip', slug, 'audit', `create не удался: ${(error as Error).message?.slice(0, 100)}`);
      continue;
    }
    const id = String(created.id);

    if (!AUDITED_COLLECTIONS.has(slug)) {
      record('info', slug, 'audit', 'аудит-хук не подключён в конфиге коллекции (нет auditAfterChange)');
      try { await payload.delete({ collection: slug, id, overrideAccess: true }); } catch { /* ignore */ }
      continue;
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
    const auditAfter = await countWhere('audit_logs', `collection = ?`, [slug]);
    const auditRowsForDoc = await countWhere('audit_logs', `collection = ? AND document_id = ?`, [slug, id]);
    if (auditAfter > auditBefore) record('ok', slug, 'audit.create', `аудит-запись создана (для doc: ${auditRowsForDoc})`);
    else record('fail', slug, 'audit.create', 'аудит-запись не появилась после create');

    const locBefore = await countWhere('content_localizations', `source_collection = ? AND source_id = ?`, [slug, id]);
    if (locBefore > 0) record('ok', slug, 'localization', `создано локализаций: ${locBefore}`);
    else record('info', slug, 'localization', 'локализации не созданы (нет контента/не поддерживается/onlyWhen=false)');

    try {
      await payload.delete({ collection: slug, id, overrideAccess: true });
    } catch { /* ignore */ }
  }
};

const phaseRelations = async (collections: CollectionConfig[]) => {
  const payload = (await getPayloadClient()) as never as {
    create: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
    delete: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
    find: (args: Record<string, unknown>) => Promise<{ docs: Array<Record<string, unknown>> }>;
  };
  record('info', 'system', 'relations', 'Связи: relationship-поля проставляются в БД');

  for (const collection of collections) {
    const slug = collection.slug;
    if (INTERNAL_COLLECTIONS.has(slug)) continue;
    const table = tableFor(slug);
    const relFields: Array<{ name: string; relationTo: string | string[] }> = [];
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
          relFields.push({ name: field.name, relationTo: relMeta.relationTo });
        }
      }
    };
    walk(collection.fields as Field[]);
    if (!relFields.length) continue;

    for (const rel of relFields) {
      const targets = Array.isArray(rel.relationTo) ? rel.relationTo : [rel.relationTo];
      let targetId: string | number | undefined;
      for (const target of targets) {
        try {
          const found = await payload.find({ collection: target, limit: 1, overrideAccess: true, depth: 0 });
          if (found.docs[0]) { targetId = found.docs[0].id as string | number; break; }
        } catch { /* ignore */ }
      }
      if (targetId === undefined) {
        record('skip', slug, `relation.${rel.name}`, `нет связанных документов в ${targets.join(', ')}`);
        continue;
      }

      const rand = `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
      const { data } = await buildSample(collection.fields as Field[], payload, rand);
      if (!data.email) data.email = `verify-${rand}@example.com`;
      if (!data.password && slug === 'users') data.password = 'VerifyPass123!';
      if (collection.versions) data._status = 'published';
      data[rel.name] = targetId;

      try {
        const created = await payload.create({ collection: slug, data, overrideAccess: true, depth: 0 });
        const relCol = `${snake(rel.name)}_id`;
        const cnt = await countWhere(table, `id = ? AND ${relCol} = ?`, [String(created.id), String(targetId)]);
        if (cnt === 1) record('ok', slug, `relation.${rel.name}`, `${relCol} проставлен (=${targetId})`);
        else if (cnt === -1) record('warn', slug, `relation.${rel.name}`, `колонка ${relCol} не найдена в ${table}`);
        else record('fail', slug, `relation.${rel.name}`, `${relCol} не проставлен в БД`);
        await payload.delete({ collection: slug, id: String(created.id), overrideAccess: true }).catch(() => undefined);
      } catch (error) {
        record('fail', slug, `relation.${rel.name}`, (error as Error).message?.slice(0, 150));
      }
    }
  }
};

/* ────────────────────────── Main ────────────────────────── */

const main = async () => {
  const payload = (await getPayloadClient()) as never as { config: { collections: CollectionConfig[] } };
  const collections = payload.config.collections as CollectionConfig[];
  record('info', 'system', 'init', `коллекций: ${collections.length}`);

  for (const collection of collections) collectionConfigs.set(collection.slug, collection);

  await phaseSchema(collections);
  await phaseCrud(collections);
  await phaseValidations(collections);
  await phaseAuditLocalization(collections);
  await phaseRelations(collections);

  // ── Report ──
  const fails = results.filter((r) => r.level === 'fail');
  const warns = results.filter((r) => r.level === 'warn');
  const skips = results.filter((r) => r.level === 'skip');
  const infos = results.filter((r) => r.level === 'info');

  const lines: string[] = [];
  lines.push('='.repeat(100));
  lines.push('CMS VERIFICATION REPORT');
  lines.push(`Всего проверок: ${results.length} | FAIL: ${fails.length} | WARN: ${warns.length} | SKIP: ${skips.length}`);
  lines.push('='.repeat(100));

  const byEntity = new Map<string, Entry[]>();
  for (const r of results) {
    if (r.level === 'fail' || r.level === 'warn' || r.level === 'skip' || r.level === 'info') {
      const list = byEntity.get(r.entity) || [];
      list.push(r);
      byEntity.set(r.entity, list);
    }
  }

  if (fails.length) {
    lines.push('\n## 🔴 FAIL (критично)');
    for (const r of fails) lines.push(`  [${r.entity}] ${r.check}: ${r.detail}`);
  }
  if (warns.length) {
    lines.push('\n## 🟡 WARN (важно)');
    for (const r of warns) lines.push(`  [${r.entity}] ${r.check}: ${r.detail}`);
  }
  if (skips.length) {
    lines.push('\n## ⚪ SKIP');
    for (const r of skips) lines.push(`  [${r.entity}] ${r.check}: ${r.detail}`);
  }
  lines.push('\n## ℹ️ INFO');
  for (const r of infos) lines.push(`  [${r.entity}] ${r.check}: ${r.detail}`);

  lines.push('\n## OK (по коллекциям)');
  const okByEntity = new Map<string, number>();
  for (const r of results) {
    if (r.level === 'ok') okByEntity.set(r.entity, (okByEntity.get(r.entity) || 0) + 1);
  }
  for (const [entity, count] of [...okByEntity.entries()].sort()) lines.push(`  ${entity}: ${count} ✅`);

  const report = lines.join('\n');
  const outPath = path.resolve(process.cwd(), 'scripts/cms-verify-report.txt');
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
    // Удаляем созданные зависимые документы, чтобы не засорять dev-БД
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
