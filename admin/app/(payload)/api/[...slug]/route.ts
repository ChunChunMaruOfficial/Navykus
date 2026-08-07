import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes';
import { getPayload } from 'payload';

import config from '../../../../payload.config';
import { getAdminContentTypeByCollection } from '../../../../../src/content-admin-registry';
import {
  syncPublishedDraftData,
  syncTeamMemberPublicationData,
} from '../../../../../src/payload/fields';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ slug?: string[] }>;
};

const payloadId = (value: string) => (/^\d+$/.test(value) ? Number(value) : value);

const unpublishData = (collection: string, originalDoc: Record<string, unknown>) => {
  const data: Record<string, unknown> = { _status: 'draft' };
  if (collection === 'team-members') return syncTeamMemberPublicationData(data, originalDoc);
  return syncPublishedDraftData(data, originalDoc);
};

const REST_PATCH_HANDLER = REST_PATCH(config);

export const GET = REST_GET(config);
export const POST = REST_POST(config);
export const DELETE = REST_DELETE(config);
export const PATCH = async (request: Request, context: RouteContext) => {
  const url = new URL(request.url);
  if (url.searchParams.get('unpublishAllLocales') !== 'true') {
    return REST_PATCH_HANDLER(request, context);
  }

  const slug = (await context.params).slug || [];
  const [collection, id] = slug;
  const contentType = collection ? getAdminContentTypeByCollection(collection) : undefined;
  if (!collection || !id || !contentType?.supportsDraftStatus) {
    return REST_PATCH_HANDLER(request, context);
  }

  const payload = await getPayload({ config });
  const auth = await payload.auth({
    headers: request.headers,
  }).catch(() => undefined);
  const user = auth?.user as Record<string, unknown> | undefined;
  if (!user || !['admin', 'moderator'].includes(String(user.role || ''))) {
    return Response.json({ errors: [{ message: 'You are not allowed to perform this action.' }] }, { status: 403 });
  }

  const originalDoc = await payload.findByID({
    collection: collection as any,
    id: payloadId(id),
    depth: 0,
    overrideAccess: true,
  }) as Record<string, unknown>;
  const updated = await payload.update({
    collection: collection as any,
    id: payloadId(id),
    data: unpublishData(collection, originalDoc) as any,
    depth: Number(url.searchParams.get('depth') || 0),
    overrideAccess: true,
  });
  return Response.json(updated);
};
export const PUT = REST_PUT(config);
export const OPTIONS = REST_OPTIONS(config);

