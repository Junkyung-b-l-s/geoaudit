import { XMLParser } from 'fast-xml-parser';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
}

export async function parseSitemap(baseUrl: string): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = [];
  const sitemapUrl = new URL('/sitemap.xml', baseUrl).href;

  try {
    const res = await fetch(sitemapUrl, {
      headers: { 'User-Agent': 'GEO-Audit-Bot/1.0' },
    });
    if (!res.ok) return urls;

    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);

    // Handle sitemap index
    if (parsed.sitemapindex?.sitemap) {
      const sitemaps = Array.isArray(parsed.sitemapindex.sitemap)
        ? parsed.sitemapindex.sitemap
        : [parsed.sitemapindex.sitemap];

      for (const sm of sitemaps) {
        const loc = sm.loc || sm;
        if (typeof loc === 'string') {
          const subUrls = await parseSitemapFile(loc);
          urls.push(...subUrls);
        }
      }
    }

    // Handle regular sitemap
    if (parsed.urlset?.url) {
      const entries = Array.isArray(parsed.urlset.url)
        ? parsed.urlset.url
        : [parsed.urlset.url];

      for (const entry of entries) {
        const loc = entry.loc || entry;
        if (typeof loc === 'string') {
          urls.push({ loc, lastmod: entry.lastmod });
        }
      }
    }
  } catch {
    // Sitemap not available
  }

  return urls;
}

async function parseSitemapFile(url: string): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = [];
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'GEO-Audit-Bot/1.0' },
    });
    if (!res.ok) return urls;

    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);

    if (parsed.urlset?.url) {
      const entries = Array.isArray(parsed.urlset.url)
        ? parsed.urlset.url
        : [parsed.urlset.url];

      for (const entry of entries) {
        const loc = entry.loc || entry;
        if (typeof loc === 'string') {
          urls.push({ loc, lastmod: entry.lastmod });
        }
      }
    }
  } catch {
    // Sub-sitemap not available
  }
  return urls;
}
