import { parseHtml } from '../crawler/page-fetcher';
import type { CheckerDefinition } from './types';

export const metadataCheckers: CheckerDefinition[] = [
  {
    id: '3.1',
    title: 'Title 태그',
    category: 'metadata',
    severity: 'critical',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '3.1', status: 'info', severity: 'critical', title: 'Title 태그', description: '확인 불가', score: 0 };
      const $ = parseHtml(page.html);
      const title = $('title').text().trim();

      if (!title) return { id: '3.1', status: 'fail', severity: 'critical', title: 'Title 태그', description: 'title 태그 없음', score: 0 };
      if (title.length < 10) return { id: '3.1', status: 'warning', severity: 'critical', title: 'Title 태그', description: `title: '${title}' (${title.length}자, 권장 50-60자) — 너무 짧아 페이지 주제를 충분히 전달하지 못합니다`, details: title, score: 40 };
      if (title.length > 70) return { id: '3.1', status: 'warning', severity: 'critical', title: 'Title 태그', description: `title: '${title.slice(0, 60)}…' (${title.length}자, 권장 50-60자) — 너무 길어 검색결과에서 잘릴 수 있습니다`, details: title, score: 50 };

      return { id: '3.1', status: 'pass', severity: 'critical', title: 'Title 태그', description: `title: '${title}' (${title.length}자, 권장 50-60자) — 적정 길이`, details: title, score: 100 };
    },
  },
  {
    id: '3.2',
    title: 'Meta Description',
    category: 'metadata',
    severity: 'high',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '3.2', status: 'info', severity: 'high', title: 'Meta Description', description: '확인 불가', score: 0 };
      const $ = parseHtml(page.html);
      const desc = $('meta[name="description"]').attr('content')?.trim();

      const truncDesc = (d: string) => d.length > 80 ? d.slice(0, 80) + '…' : d;
      if (!desc) return { id: '3.2', status: 'fail', severity: 'high', title: 'Meta Description', description: 'meta description 없음', score: 0 };
      if (desc.length < 50) return { id: '3.2', status: 'warning', severity: 'high', title: 'Meta Description', description: `description: '${truncDesc(desc)}' (${desc.length}자, 권장 120-160자) — 너무 짧아 검색결과 노출 시 불리합니다`, details: desc, score: 40 };
      if (desc.length > 170) return { id: '3.2', status: 'warning', severity: 'high', title: 'Meta Description', description: `description: '${truncDesc(desc)}' (${desc.length}자, 권장 120-160자) — 너무 길어 검색결과에서 잘릴 수 있습니다`, details: desc, score: 60 };

      return { id: '3.2', status: 'pass', severity: 'high', title: 'Meta Description', description: `description: '${truncDesc(desc)}' (${desc.length}자, 권장 120-160자) — 적정 길이`, details: desc, score: 100 };
    },
  },
  {
    id: '3.3',
    title: 'OG 태그',
    category: 'metadata',
    severity: 'high',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '3.3', status: 'info', severity: 'high', title: 'OG 태그', description: '확인 불가', score: 0 };
      const $ = parseHtml(page.html);
      const required = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];
      const found = required.filter((tag) => $(`meta[property="${tag}"]`).attr('content'));
      const missing = required.filter((tag) => !$(`meta[property="${tag}"]`).attr('content'));

      const truncOg = (v: string) => v.length > 60 ? v.slice(0, 60) + '…' : v;
      const tagDetails = required.map((tag) => {
        const val = $(`meta[property="${tag}"]`).attr('content')?.trim();
        if (!val) return `${tag}: 없음`;
        if (tag === 'og:image') return `${tag}: 있음`;
        return `${tag}: '${truncOg(val)}'`;
      }).join(', ');

      const score = Math.round((found.length / required.length) * 100);
      return {
        id: '3.3',
        status: missing.length === 0 ? 'pass' : missing.length <= 2 ? 'warning' : 'fail',
        severity: 'high',
        title: 'OG 태그',
        description: `${found.length}/${required.length}개 OG 태그 존재`,
        details: tagDetails,
        score,
      };
    },
  },
  {
    id: '3.4',
    title: 'Canonical URL',
    category: 'metadata',
    severity: 'critical',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '3.4', status: 'info', severity: 'critical', title: 'Canonical URL', description: '확인 불가', score: 0 };
      const $ = parseHtml(page.html);
      const canonical = $('link[rel="canonical"]').attr('href');

      if (!canonical) return { id: '3.4', status: 'fail', severity: 'critical', title: 'Canonical URL', description: 'canonical 태그 없음 — 중복 페이지 문제가 발생할 수 있습니다', score: 0 };

      return { id: '3.4', status: 'pass', severity: 'critical', title: 'Canonical URL', description: `canonical: ${canonical}`, details: canonical, score: 100 };
    },
  },
  {
    id: '3.5',
    title: 'Hreflang',
    category: 'metadata',
    severity: 'medium',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '3.5', status: 'info', severity: 'medium', title: 'Hreflang', description: '확인 불가', score: 0 };
      const $ = parseHtml(page.html);
      const hreflangs = $('link[rel="alternate"][hreflang]');

      if (hreflangs.length === 0) {
        return { id: '3.5', status: 'na', severity: 'medium', title: 'Hreflang', description: 'hreflang 미사용 (단일 언어 사이트로 추정)', score: 100 };
      }

      return { id: '3.5', status: 'pass', severity: 'medium', title: 'Hreflang', description: `${hreflangs.length}개 hreflang 태그 존재`, score: 100 };
    },
  },
  {
    id: '3.6',
    title: 'Noscript 태그',
    category: 'metadata',
    severity: 'medium',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '3.6', status: 'info', severity: 'medium', title: 'Noscript', description: '확인 불가', score: 0 };
      const $ = parseHtml(page.html);
      const noscripts = $('noscript');
      const meaningful = noscripts.filter((_, el) => {
        const text = $(el).text().trim();
        return text.length > 20 && !text.includes('iframe'); // Exclude tracking pixels
      });

      if (meaningful.length > 0) {
        return { id: '3.6', status: 'pass', severity: 'medium', title: 'Noscript', description: `의미 있는 noscript 콘텐츠 ${meaningful.length}개 존재`, score: 100 };
      }

      return { id: '3.6', status: 'warning', severity: 'medium', title: 'Noscript', description: 'noscript 대체 콘텐츠 없음', score: 40 };
    },
  },
  {
    id: '3.7',
    title: 'Article Schema',
    category: 'metadata',
    severity: 'critical',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '3.7', status: 'info', severity: 'critical', title: 'Article Schema', description: '확인 불가', score: 0 };
      const schemas = extractJsonLd(page.html);
      const article = schemas.find((s) => {
        const t = s['@type'];
        const types = Array.isArray(t) ? t : [t];
        return types.some((v) => v === 'Article' || v === 'BlogPosting' || v === 'NewsArticle');
      });

      if (!article) return { id: '3.7', status: 'fail', severity: 'critical', title: 'Article Schema', description: 'Article 구조화 데이터 없음', score: 0 };

      const requiredFields = ['headline', 'author', 'datePublished', 'image'];
      const found = requiredFields.filter((f) => article[f]);
      const missing = requiredFields.filter((f) => !article[f]);
      const score = Math.round((found.length / requiredFields.length) * 100);

      const headline = typeof article.headline === 'string' ? article.headline : '';
      const authorRaw = article.author;
      const authorName = typeof authorRaw === 'string' ? authorRaw
        : (authorRaw as Record<string, unknown>)?.name as string ?? '';
      const fieldSummary = [
        headline ? `headline: '${headline.length > 50 ? headline.slice(0, 50) + '…' : headline}'` : null,
        authorName ? `author: '${authorName}'` : null,
      ].filter(Boolean).join(', ');

      return {
        id: '3.7',
        status: missing.length === 0 ? 'pass' : 'warning',
        severity: 'critical',
        title: 'Article Schema',
        description: `Article 스키마 존재, 필수 필드 ${found.length}/${requiredFields.length}`,
        details: [
          fieldSummary || undefined,
          missing.length > 0 ? `누락 필드: ${missing.join(', ')}` : undefined,
        ].filter(Boolean).join(' | ') || undefined,
        score,
      };
    },
  },
  {
    id: '3.8',
    title: 'FAQ Schema',
    category: 'metadata',
    severity: 'high',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '3.8', status: 'info', severity: 'high', title: 'FAQ Schema', description: '확인 불가', score: 0 };
      const schemas = extractJsonLd(page.html);
      const faq = schemas.find((s) => matchType(s, 'FAQPage'));

      if (!faq) {
        // Check if page has FAQ-like content but no schema
        const $ = parseHtml(page.html);
        const hasFaqContent = $('details, dl, .faq, #faq').length > 0 ||
          page.html.toLowerCase().includes('자주 묻는') ||
          page.html.toLowerCase().includes('faq');

        if (hasFaqContent) {
          return { id: '3.8', status: 'warning', severity: 'high', title: 'FAQ Schema', description: 'FAQ 콘텐츠는 있으나 FAQPage 스키마 없음', score: 30 };
        }
        return { id: '3.8', status: 'na', severity: 'high', title: 'FAQ Schema', description: 'FAQ 콘텐츠 없음', score: 100 };
      }

      return { id: '3.8', status: 'pass', severity: 'high', title: 'FAQ Schema', description: 'FAQPage 구조화 데이터 존재', score: 100 };
    },
  },
  {
    id: '3.9',
    title: 'Product Schema',
    category: 'metadata',
    severity: 'high',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '3.9', status: 'info', severity: 'high', title: 'Product Schema', description: '확인 불가', score: 0 };

      const isProductPage = /\/(product|shop|item|store|상품|제품)/i.test(page.url);
      const schemas = extractJsonLd(page.html);
      const product = schemas.find((s) => matchType(s, 'Product'));

      if (!isProductPage && !product) {
        return { id: '3.9', status: 'na', severity: 'high', title: 'Product Schema', description: '제품 페이지가 아닌 것으로 추정', score: 100 };
      }

      if (isProductPage && !product) {
        return { id: '3.9', status: 'fail', severity: 'high', title: 'Product Schema', description: '제품 페이지이나 Product 스키마 없음', score: 0 };
      }

      if (product) {
        const fields = ['name', 'description', 'brand', 'offers'];
        const found = fields.filter((f) => product[f]);
        return {
          id: '3.9',
          status: found.length >= 3 ? 'pass' : 'warning',
          severity: 'high',
          title: 'Product Schema',
          description: `Product 스키마 존재, ${found.length}/${fields.length} 필드`,
          score: Math.round((found.length / fields.length) * 100),
        };
      }

      return { id: '3.9', status: 'na', severity: 'high', title: 'Product Schema', description: '해당 없음', score: 100 };
    },
  },
  {
    id: '3.10',
    title: 'Author Schema',
    category: 'metadata',
    severity: 'high',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '3.10', status: 'info', severity: 'high', title: 'Author Schema', description: '확인 불가', score: 0 };
      const schemas = extractJsonLd(page.html);

      const person = schemas.find((s) => matchType(s, 'Person'));
      const org = schemas.find((s) => matchType(s, 'Organization'));
      const articleAuthor = schemas.find((s) => matchType(s, 'Article') || matchType(s, 'BlogPosting') || matchType(s, 'NewsArticle'))?.author;

      if (person || org || articleAuthor) {
        const parts: string[] = [];
        if (person) parts.push(`Person: '${(person.name as string) ?? '이름 없음'}'`);
        if (org) parts.push(`Organization: '${(org.name as string) ?? '이름 없음'}'`);
        if (articleAuthor && !person && !org) {
          const aName = typeof articleAuthor === 'string' ? articleAuthor
            : (articleAuthor as Record<string, unknown>)?.name as string ?? '이름 없음';
          const aType = typeof articleAuthor === 'string' ? '' : ` (${(articleAuthor as Record<string, unknown>)?.['@type'] ?? 'unknown'})`;
          parts.push(`author: '${aName}'${aType}`);
        }
        return { id: '3.10', status: 'pass', severity: 'high', title: 'Author Schema', description: `저자/조직 스키마 존재 — ${parts.join(', ')}`, score: 100 };
      }

      return { id: '3.10', status: 'fail', severity: 'high', title: 'Author Schema', description: '저자/조직 스키마 없음', score: 0 };
    },
  },
  {
    id: '3.11',
    title: '업데이트 날짜',
    category: 'metadata',
    severity: 'high',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '3.11', status: 'info', severity: 'high', title: '업데이트 날짜', description: '확인 불가', score: 0 };
      const schemas = extractJsonLd(page.html);
      const article = schemas.find((s) => matchType(s, 'Article') || matchType(s, 'BlogPosting') || matchType(s, 'NewsArticle'));
      const hasPublished = !!article?.datePublished;
      const hasModified = !!article?.dateModified;

      const dpVal = article?.datePublished as string | undefined;
      const dmVal = article?.dateModified as string | undefined;

      if (hasPublished && hasModified) {
        return { id: '3.11', status: 'pass', severity: 'high', title: '업데이트 날짜', description: `datePublished: ${dpVal}, dateModified: ${dmVal}`, score: 100 };
      }
      if (hasPublished) {
        return { id: '3.11', status: 'warning', severity: 'high', title: '업데이트 날짜', description: `datePublished: ${dpVal}, dateModified: 없음 — 마지막 수정일이 없어 AI가 콘텐츠 최신성을 판단할 수 없습니다`, score: 40 };
      }

      return { id: '3.11', status: 'fail', severity: 'high', title: '업데이트 날짜', description: '날짜 정보 없음 (Schema) — datePublished, dateModified 모두 없음', score: 0 };
    },
  },
  {
    id: '3.12',
    title: '페이지 중복 / URL 정규화',
    category: 'metadata',
    severity: 'high',
    scope: 'aggregate',
    checker: ({ allPages }) => {
      if (!allPages?.length) return { id: '3.12', status: 'info', severity: 'high', title: 'URL 정규화', description: '확인 불가', score: 0 };

      const normalized = new Map<string, string[]>();
      for (const page of allPages) {
        const key = normalizeForDuplicateCheck(page.url);
        if (!normalized.has(key)) normalized.set(key, []);
        normalized.get(key)!.push(page.url);
      }

      const duplicates = Array.from(normalized.values()).filter((urls) => urls.length > 1);

      if (duplicates.length === 0) {
        return { id: '3.12', status: 'pass', severity: 'high', title: 'URL 정규화', description: '중복 URL 없음', score: 100 };
      }

      return {
        id: '3.12',
        status: 'warning',
        severity: 'high',
        title: 'URL 정규화',
        description: `중복 URL 그룹 ${duplicates.length}건`,
        details: duplicates.slice(0, 3).map((urls) => urls.join(' ↔ ')).join('\n'),
        score: Math.max(0, 100 - duplicates.length * 20),
      };
    },
  },
  {
    id: '3.14',
    title: '엔티티 스키마 (sameAs)',
    category: 'metadata',
    severity: 'high',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '3.14', status: 'info', severity: 'high', title: '엔티티 스키마', description: '확인 불가', score: 0 };
      const schemas = extractJsonLd(page.html);
      const withSameAs = schemas.filter((s) => s.sameAs);

      if (withSameAs.length > 0) {
        const links = withSameAs.flatMap((s) =>
          Array.isArray(s.sameAs) ? s.sameAs : [s.sameAs]
        ).filter((l): l is string => typeof l === 'string');
        const sameAsScore = links.length >= 5 ? 100 : links.length >= 3 ? 90 : links.length >= 2 ? 70 : 50;
        return {
          id: '3.14',
          status: 'pass',
          severity: 'high',
          title: '엔티티 스키마 (sameAs)',
          description: `sameAs 속성 발견 (${links.length}개 외부 프로필): ${links.slice(0, 3).join(', ')}${links.length > 3 ? ` 외 ${links.length - 3}개` : ''}`,
          details: links.slice(0, 5).join('\n'),
          score: sameAsScore,
        };
      }

      return { id: '3.14', status: 'fail', severity: 'high', title: '엔티티 스키마 (sameAs)', description: 'sameAs 속성 없음', score: 0 };
    },
  },
];

function matchType(schema: Record<string, unknown>, type: string): boolean {
  const t = schema['@type'];
  if (Array.isArray(t)) return t.includes(type);
  return t === type;
}

function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const regex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        results.push(...parsed);
      } else if (parsed['@graph']) {
        results.push(...parsed['@graph']);
      } else {
        results.push(parsed);
      }
    } catch { /* invalid JSON-LD */ }
  }
  return results;
}

function normalizeForDuplicateCheck(url: string): string {
  try {
    const u = new URL(url);
    let path = u.pathname.toLowerCase();
    if (path.endsWith('/') && path.length > 1) path = path.slice(0, -1);
    return `${u.origin}${path}`;
  } catch {
    return url;
  }
}
