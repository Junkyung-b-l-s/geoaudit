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

  // 1. Fetch site-level resources. The auxiliary files (robots/sitemap/llms)
  //    already degrade to null on failure; guard the homepage the same way so
  //    a single blocked or timed-out request can't reject the whole audit.
  onProgress?.('site-fetch', 0, 0);
  const [robotsTxt, sitemapXml, llmsTxt, llmsFullTxt, homepageResult] =
    await Promise.all([
      fetchText(`${baseUrl}/robots.txt`),
      fetchText(`${baseUrl}/sitemap.xml`),
      fetchText(`${baseUrl}/llms.txt`),
      fetchText(`${baseUrl}/llms-full.txt`),
      fetchHomepage(url),
    ]);
  const homepage = homepageResult.page;

  // 2. Try sitemap first
  onProgress?.('crawling', 0, 0);
  const sitemapUrls = await parseSitemap(baseUrl, sitemapXml);
  const pages: ParsedPage[] = homepage ? [homepage] : [];

  if (sitemapUrls.length > 0) {
    const rateLimited = createRateLimiter(3, 200);
    const seenUrls = new Set<string>([url]);
    if (homepage) seenUrls.add(homepage.url);
    const urlsToFetch = sitemapUrls
      .map((s) => s.loc)
      .filter((u) => !seenUrls.has(u))
      .slice(0, maxPages - 1);

    let fetched = pages.length;
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

  // If we couldn't fetch a single page, the site is unreachable or actively
  // blocking us — surface a clear reason instead of an opaque crawl failure.
  if (pages.length === 0) {
    throw new Error(unreachableMessage(url, homepageResult.error));
  }

  const siteInfo: SiteInfo = {
    baseUrl,
    robotsTxt,
    sitemapXml,
    llmsTxt,
    llmsFullTxt,
    // Header-based checks target the homepage; fall back to the first reachable
    // page's headers when the homepage itself couldn't be fetched.
    homepageHeaders: homepage?.headers ?? pages[0].headers,
  };

  return { siteInfo, pages };
}

interface HomepageResult {
  page: ParsedPage | null;
  error?: string;
}

async function fetchHomepage(url: string): Promise<HomepageResult> {
  try {
    return { page: await fetchPage(url) };
  } catch (err) {
    const isTimeout =
      err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError');
    const reason = isTimeout
      ? '응답 시간 초과 (15초)'
      : err instanceof Error
        ? err.message
        : '네트워크 오류';
    return { page: null, error: reason };
  }
}

function unreachableMessage(url: string, reason?: string): string {
  const base = `${url} 의 페이지를 하나도 불러오지 못했어요. 사이트가 자동 분석 도구의 접근을 차단했거나(WAF/방화벽) 일시적으로 응답하지 않을 수 있어요.`;
  return reason ? `${base} (원인: ${reason})` : base;
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
