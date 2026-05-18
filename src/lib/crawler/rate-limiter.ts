import pLimit from 'p-limit';

export function createRateLimiter(concurrency = 3, delayMs = 200) {
  const limit = pLimit(concurrency);
  let nextSlot = 0;

  return async function <T>(fn: () => Promise<T>): Promise<T> {
    return limit(async () => {
      const now = Date.now();
      const waitUntil = nextSlot;
      nextSlot = Math.max(now, waitUntil) + delayMs;
      if (waitUntil > now) {
        await new Promise((r) => setTimeout(r, waitUntil - now));
      }
      return fn();
    });
  };
}
