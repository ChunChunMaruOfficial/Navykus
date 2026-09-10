import { redirect } from 'next/navigation';

import type { Payload } from 'payload';

// Replaces the list view of `tournaments`: there is only one current championship, so the
// sidebar entry «Чемпионат» opens it directly. Without an active one it goes to the archive
// (to activate an old one) or, on an empty site, straight to the creation form.
const ChampionshipRedirect = async ({ payload }: { payload: Payload }) => {
  const adminRoute = payload.config.routes.admin;
  const active = await payload.find({
    collection: 'tournaments' as any,
    where: { isFeatured: { equals: true } },
    sort: '-updatedAt',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const activeId = (active.docs[0] as { id?: string | number } | undefined)?.id;
  if (activeId != null) redirect(`${adminRoute}/collections/tournaments/${activeId}`);

  const any = await payload.count({ collection: 'tournaments' as any, overrideAccess: true });
  redirect(any.totalDocs > 0 ? `${adminRoute}/championship-archive` : `${adminRoute}/collections/tournaments/create`);
};

export default ChampionshipRedirect;
