import { parseSitemap } from './sitemap-parser';
import { crawlByLinks } from './link-crawler';
import { fetchPage } from './page-fetcher';
import { createRateLimiter } from './rate-limiter';
import { USER_AGENT } from './user-agent';
import type { ParsedPage, SiteInfo } from '@/types/check';

interface CrawlResult {
  siteInfo: SiteInfo;
  pages: ParsedPage[];
}

export async function crawlSite(
  url: string,
  maxPages = 50,
  maxDepth = 3,
  onProgress?: (stage: string, found: number, fetched: number) => void
): Promise<CrawlResult> {
  const baseUrl = new URL(url).origin;

  // 1. Fetch site-level resources
  onProgress?.('site-fetch', 0, 0);
  const [robotsTxt, sitemapXml, llmsTxt, llmsFullTxt, homepage] =
    await Promise.all([
      fetchText(`${baseUrl}/robots.txt`),
      fetchText(`${baseUrl}/sitemap.xml`),
      fetchText(`${baseUrl}/llms.txt`),
      fetchText(`${baseUrl}/llms-full.txt`),
      fetchPage(url),
    ]);

  const siteInfo: SiteInfo = {
    baseUrl,
    robotsTxt,
    sitemapXml,
    llmsTxt,
    llmsFullTxt,
    homepageHeaders: homepage.headers,
  };

  // 2. Try sitemap first
  onProgress?.('crawling', 0, 0);
  const sitemapUrls = await parseSitemap(baseUrl, sitemapXml);
  let pages: ParsedPage[] = [homepage];

  if (sitemapUrls.length > 0) {
    const rateLimited = createRateLimiter(3, 200);
    const urlsToFetch = sitemapUrls
      .map((s) => s.loc)
      .filter((u) => u !== url && u !== homepage.url)
      .slice(0, maxPages - 1);

    let fetched = 1;
    const seenUrls = new Set<string>([url, homepage.url]);
    const fetchPromises = urlsToFetch.map((u) =>
      rateLimited(async () => {
        try {
          const page = await fetchPage(u);
          fetched++;
          onProgress?.('crawling', sitemapUrls.length, fetched);
          if (page.statusCode !== 200 || seenUrls.has(page.url)) return null;
          seenUrls.add(page.url);
          return page;
        } catch {
          return null;
        }
      })
    );

    const results = await Promise.all(fetchPromises);
    pages.push(...results.filter((p): p is ParsedPage => p !== null));
  }

  // 3. Fallback to link crawling if sitemap yielded few pages
  if (pages.length < 5) {
    onProgress?.('crawling-links', pages.length, pages.length);
    const crawled = await crawlByLinks(url, maxPages, maxDepth, (found, fetched) => {
      onProgress?.('crawling-links', found, fetched);
    });
    const existingUrls = new Set(pages.map((p) => p.url));
    for (const page of crawled) {
      if (!existingUrls.has(page.url)) {
        pages.push(page);
      }
    }
  }

  return { siteInfo, pages };
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}
