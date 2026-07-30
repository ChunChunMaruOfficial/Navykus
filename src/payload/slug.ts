import type { Payload } from 'payload';

const MAX_SLUG_LENGTH = 80;

export const slugify = (value: unknown, fallbackPrefix = 'item') => {
  const input = String(value || '').trim().toLowerCase();
  const slug = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '');

  return slug || `${fallbackPrefix}-${Date.now()}`;
};

const payloadId = (value: unknown) => {
  if (typeof value === 'number') return value;
  const text = String(value || '');
  return /^\d+$/.test(text) ? Number(text) : text;
};

export const uniqueSlug = async ({
  payload,
  collection,
  value,
  currentId,
  fallbackPrefix,
}: {
  payload: Payload;
  collection: string;
  value: unknown;
  currentId?: string | number;
  fallbackPrefix?: string;
}) => {
  const base = slugify(value, fallbackPrefix);
  let candidate = base;
  let suffix = 2;

  for (;;) {
    const and: Array<Record<string, unknown>> = [{ slug: { equals: candidate } }];
    if (currentId) and.push({ id: { not_equals: payloadId(currentId) } });

    const existing = await payload.find({
      collection: collection as any,
      where: { and },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });

    if (existing.totalDocs === 0) return candidate;

    const suffixText = `-${suffix}`;
    candidate = `${base.slice(0, MAX_SLUG_LENGTH - suffixText.length)}${suffixText}`;
    suffix += 1;
  }
};

export const slugBeforeValidate = (collection: string, sourceField = 'title') =>
  async ({ data, originalDoc, operation, req }: {
    data?: Record<string, unknown>;
    originalDoc?: Record<string, unknown>;
    operation: 'create' | 'update';
    req: { payload: Payload };
  }) => {
    if (!data) return data;
    const currentSlug = typeof data.slug === 'string' ? data.slug.trim() : '';
    const sourceChanged = data[sourceField] !== undefined && data[sourceField] !== originalDoc?.[sourceField];

    if (currentSlug && operation !== 'create') {
      data.slug = slugify(currentSlug, collection.slice(0, -1) || 'item');
      return data;
    }

    if (!currentSlug || sourceChanged) {
      data.slug = await uniqueSlug({
        payload: req.payload,
        collection,
        value: currentSlug || data[sourceField] || originalDoc?.[sourceField],
        currentId: originalDoc?.id as string | number | undefined,
        fallbackPrefix: collection.slice(0, -1) || 'item',
      });
    }

    return data;
  };
