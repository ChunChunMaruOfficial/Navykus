import { getPayload } from 'payload';

import config from '../src/payload.config';

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>;

let payloadPromise: Promise<PayloadInstance> | undefined;

export const getPayloadClient = () => {
  if (!payloadPromise) {
    payloadPromise = getPayload({ config });
  }

  return payloadPromise;
};

