import { parseHtml, fetchPage } from './page-fetcher';
import { createRateLimiter } from './rate-limiter';
import type { ParsedPage } from '@/types/check';

export async function crawlByLinks(
  startUrl: string,
  maxPages: number,
  maxDepth: number,
  onProgress?: (found: number, fetched: number) => void
): Promise<ParsedPage[]> {
  const baseOrigin = new URL(startUrl).origin;
  const visited = new Set<string>();
  const pages: ParsedPage[] = [];
  const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];
  const rateLimited = createRateLimiter(3, 200);

  while (queue.length > 0 && pages.length < maxPages) {
    const batch = queue.splice(0, Math.min(3, maxPages - pages.length));
    const promises = batch.map((item) =>
      rateLimited(async () => {
        const normalized = normalizeUrl(item.url);
        if (visited.has(normalized)) return null;
        visited.add(normalized);

        try {
          const page = await fetchPage(item.url);
          if (page.statusCode !== 200) return null;

          if (item.depth < maxDepth) {
            const $ = parseHtml(page.html);
            $('a[href]').each((_, el) => {
              const href = $(el).attr('href');
              if (!href) return;

              try {
                const absolute = new URL(href, page.url).href;
                const absNorm = normalizeUrl(absolute);
                if (
                  new URL(absolute).origin === baseOrigin &&
                  !visited.has(absNorm) &&
                  !absolute.includes('#') &&
                  !absolute.match(/\.(pdf|jpg|jpeg|png|gif|svg|css|js|zip|mp4|mp3)$/i)
                ) {
                  queue.push({ url: absolute, depth: item.depth + 1 });
                }
              } catch {
                // Invalid URL
              }
            });
          }

          return page;
        } catch {
          return null;
        }
      })
    );

    const results = await Promise.all(promises);
    for (const page of results) {
      if (page) {
        pages.push(page);
        onProgress?.(visited.size, pages.length);
      }
    }
  }

  return pages;
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    u.searchParams.sort();
    let path = u.pathname;
    if (path.endsWith('/') && path.length > 1) {
      path = path.slice(0, -1);
    }
    return `${u.origin}${path}${u.search}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}
