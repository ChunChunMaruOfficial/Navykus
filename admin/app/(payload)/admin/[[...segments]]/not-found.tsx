import { NotFoundPage } from '@payloadcms/next/views';

import config from '../../../../payload.config';
import { importMap } from '../importMap.js';

type NotFoundProps = {
  params: Promise<{
    segments: string[];
  }>;
  searchParams: Promise<{
    [key: string]: string | string[];
  }>;
};

export default function NotFound(props: NotFoundProps) {
  return NotFoundPage({ config, importMap, ...props });
}
