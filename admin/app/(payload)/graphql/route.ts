import { GRAPHQL_POST } from '@payloadcms/next/routes';

import config from '../../../payload.config';

export const runtime = 'nodejs';

export const POST = GRAPHQL_POST(config);

