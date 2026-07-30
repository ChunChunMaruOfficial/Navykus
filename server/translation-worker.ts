import type { Payload } from 'payload';

import { processPendingContentLocalizations } from '../src/payload/localization';

type WorkerState = {
  timer?: NodeJS.Timeout;
  running: boolean;
};

const state: WorkerState = { running: false };

export const startTranslationWorker = (getPayload: () => Promise<Payload>) => {
  if (process.env.TRANSLATION_WORKER_ENABLED === 'false') return;
  if (state.timer) return;

  const intervalMs = Math.max(10_000, Number(process.env.TRANSLATION_WORKER_INTERVAL_MS || 30_000));

  const tick = async () => {
    if (state.running) return;
    state.running = true;
    try {
      const payload = await getPayload();
      const result = await processPendingContentLocalizations(payload);
      if (result.processed > 0) {
        console.log(`[translation-worker] processed=${result.processed} remaining=${result.remaining}`);
      }
    } catch (error) {
      console.error('[translation-worker] failed:', error);
    } finally {
      state.running = false;
    }
  };

  state.timer = setInterval(() => {
    void tick();
  }, intervalMs);

  void tick();
};
