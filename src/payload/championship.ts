import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload';

// Navykus runs exactly one championship at a time. The «active» one (field `isFeatured`)
// is what the home page block and /championship show; every other record is the archive,
// managed from the «Архив чемпионатов» admin view.

const SKIP_CONTEXT_KEY = 'skipChampionshipActivation';

const hasActiveChampionship = async (req: PayloadRequest, exceptId?: string | number) => {
  const result = await req.payload.find({
    collection: 'tournaments' as any,
    where: {
      and: [
        { isFeatured: { equals: true } },
        ...(exceptId != null ? [{ id: { not_equals: exceptId } }] : []),
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  });
  return result.totalDocs > 0;
};

/** A new championship becomes active only when there is no active one yet; otherwise it starts in the archive. */
export const defaultIsActiveChampionship = async ({ req }: { req: PayloadRequest }) => {
  try {
    return !(await hasActiveChampionship(req));
  } catch {
    return false;
  }
};

/** Activating a championship sends the previously active one to the archive. */
export const archiveOtherChampionshipsAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req, context }) => {
  if (context?.[SKIP_CONTEXT_KEY]) return doc;
  const becameActive = Boolean(doc?.isFeatured) && !previousDoc?.isFeatured;
  if (!becameActive) return doc;

  await req.payload.update({
    collection: 'tournaments' as any,
    where: {
      and: [
        { isFeatured: { equals: true } },
        { id: { not_equals: doc.id } },
      ],
    },
    data: { isFeatured: false },
    overrideAccess: true,
    context: { [SKIP_CONTEXT_KEY]: true },
    req,
  });
  return doc;
};

/** Deleting the active championship promotes the most recently updated published one. */
export const promoteChampionshipAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  if (!doc?.isFeatured) return doc;
  if (await hasActiveChampionship(req, doc.id)) return doc;
  const candidates = await req.payload.find({
    collection: 'tournaments' as any,
    where: { _status: { equals: 'published' } },
    sort: '-updatedAt',
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  });
  const next = candidates.docs[0] as { id?: string | number } | undefined;
  if (next?.id == null) return doc;
  await req.payload.update({
    collection: 'tournaments' as any,
    id: next.id,
    data: { isFeatured: true },
    overrideAccess: true,
    context: { [SKIP_CONTEXT_KEY]: true },
    req,
  });
  return doc;
};
