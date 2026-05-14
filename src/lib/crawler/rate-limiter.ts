import pLimit from 'p-limit';

export function createRateLimiter(concurrency = 3, delayMs = 200) {
  const limit = pLimit(concurrency);
  let lastRequest = 0;

  return async function <T>(fn: () => Promise<T>): Promise<T> {
    return limit(async () => {
      const now = Date.now();
      const elapsed = now - lastRequest;
      if (elapsed < delayMs) {
        await new Promise((r) => setTimeout(r, delayMs - elapsed));
      }
      lastRequest = Date.now();
      return fn();
    });
  };
}
