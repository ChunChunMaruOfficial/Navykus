import type { Payload } from 'payload';

const TRACKED_FIELD_LIMIT = 40;
const REDACTED_FIELDS = new Set(['password', 'hash', 'salt', 'token', 'resetPasswordToken', 'verificationCode']);

type Actor = {
  id?: string | number;
  email?: string | null;
};

const actorFrom = (user: unknown): Actor => {
  if (!user || typeof user !== 'object') return {};
  const record = user as Record<string, unknown>;
  return {
    id: record.id as string | number | undefined,
    email: typeof record.email === 'string' ? record.email : undefined,
  };
};

const scalar = (value: unknown) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object' && 'id' in value) return String((value as Record<string, unknown>).id || '');
  return '[object]';
};

const changedFields = (previous: Record<string, unknown> = {}, next: Record<string, unknown> = {}) => {
  const keys = Array.from(new Set([...Object.keys(previous), ...Object.keys(next)]))
    .filter((key) => !key.startsWith('_') && !REDACTED_FIELDS.has(key))
    .slice(0, TRACKED_FIELD_LIMIT);

  return keys.filter((key) => JSON.stringify(scalar(previous[key])) !== JSON.stringify(scalar(next[key])));
};

const writeAuditLog = async ({
  payload,
  action,
  collection,
  doc,
  previousDoc,
  actor,
}: {
  payload: Payload;
  action: string;
  collection: string;
  doc?: Record<string, unknown>;
  previousDoc?: Record<string, unknown>;
  actor?: Actor;
}) => {
  const source = doc || previousDoc || {};
  await payload.create({
    collection: 'audit-logs' as any,
    data: {
      action,
      collection,
      documentId: String(source.id || ''),
      actorId: actor?.id ? String(actor.id) : undefined,
      actorEmail: actor?.email || undefined,
      changedFields: changedFields(previousDoc, doc).map((field) => ({ value: field })),
      summary: `${action} ${collection}:${String(source.id || '')}`,
    },
    overrideAccess: true,
  }).catch((error) => {
    console.error(`[audit] ${action} ${collection} failed:`, error);
  });
};

export const auditAfterChange = (collection: string) =>
  ({ doc, previousDoc, operation, req }: {
    doc: Record<string, unknown>;
    previousDoc?: Record<string, unknown>;
    operation: 'create' | 'update';
    req: { payload: Payload; user?: unknown };
  }) => {
    void writeAuditLog({
      payload: req.payload,
      action: operation,
      collection,
      doc,
      previousDoc,
      actor: actorFrom(req.user),
    });
  };

export const auditAfterDelete = (collection: string) =>
  ({ doc, req }: {
    doc: Record<string, unknown>;
    req: { payload: Payload; user?: unknown };
  }) => {
    void writeAuditLog({
      payload: req.payload,
      action: 'delete',
      collection,
      previousDoc: doc,
      actor: actorFrom(req.user),
    });
  };
