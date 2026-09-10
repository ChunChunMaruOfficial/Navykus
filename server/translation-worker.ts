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

  const intervalMs = Math.max(10_000, Number(process.env.TRANSLATION_WORKER_INTERVAL_MS || 15_000));
  // Upper bound of batches per tick, so one tick cannot run forever.
  const maxBatchesPerTick = 25;

  const tick = async () => {
    if (state.running) return;
    state.running = true;
    try {
      const payload = await getPayload();
      // Drain the queue instead of taking a single small batch per interval.
      for (let batch = 0; batch < maxBatchesPerTick; batch += 1) {
        const result = await processPendingContentLocalizations(payload);
        if (result.processed > 0) {
          console.log(`[translation-worker] processed=${result.processed} remaining=${result.remaining}`);
        }
        if (result.processed === 0 || result.remaining === 0) break;
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
