import { parseHtml } from '../crawler/page-fetcher';
import type { CheckerDefinition } from './types';

function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const regex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) results.push(...parsed);
      else if (parsed['@graph']) results.push(...parsed['@graph']);
      else results.push(parsed);
    } catch { /* invalid JSON-LD */ }
  }
  return results;
}

export const authorityCheckers: CheckerDefinition[] = [
  {
    id: '6.1',
    title: 'About/Team 페이지',
    category: 'authority',
    severity: 'high',
    scope: 'site',
    checker: async ({ siteInfo, allPages }) => {
      if (!siteInfo) return { id: '6.1', status: 'info', severity: 'high', title: 'About/Team 페이지', description: '확인 불가', score: 0 };

      const aboutPaths = ['/about', '/about-us', '/team', '/company', '/소개', '/회사소개', '/about/', '/team/'];
      const found: string[] = [];

      for (const path of aboutPaths) {
        try {
          const res = await fetch(`${siteInfo.baseUrl}${path}`, {
            method: 'HEAD',
            headers: { 'User-Agent': 'GEO-Audit-Bot/1.0' },
            redirect: 'follow',
            signal: AbortSignal.timeout(5000),
          });
          if (res.ok) found.push(path);
        } catch { /* not available */ }
      }

      if (allPages) {
        for (const page of allPages) {
          const $ = parseHtml(page.html);
          $('a[href]').each((_, el) => {
            const href = $(el).attr('href') || '';
            const text = $(el).text().trim().toLowerCase();
            if (/about|team|회사|소개|조직/.test(text) || /about|team|company/i.test(href)) {
              try {
                const abs = new URL(href, page.url).pathname;
                if (!found.includes(abs)) found.push(abs);
              } catch { /* invalid */ }
            }
          });
        }
      }

      if (found.length > 0) {
        return {
          id: '6.1', status: 'pass', severity: 'high', title: 'About/Team 페이지',
          description: `전문성/신뢰 페이지 발견: ${found.slice(0, 3).join(', ')}`,
          details: `발견 경로: ${found.join(', ')}`,
          score: 100,
        };
      }

      return {
        id: '6.1', status: 'fail', severity: 'high', title: 'About/Team 페이지',
        description: 'About/Team/회사소개 페이지를 찾을 수 없습니다. AI가 조직의 전문성을 판단할 근거가 부족합니다.',
        score: 0,
      };
    },
  },
  {
    id: '6.2',
    title: '저자 프로필 링크',
    category: 'authority',
    severity: 'medium',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '6.2', status: 'info', severity: 'medium', title: '저자 프로필 링크', description: '확인 불가', score: 0 };
      const $ = parseHtml(page.html);

      let authorLinks = 0;
      const indicators: string[] = [];

      // rel="author" links
      const relAuthor = $('a[rel="author"], link[rel="author"]');
      if (relAuthor.length > 0) { authorLinks += relAuthor.length; indicators.push(`rel="author": ${relAuthor.length}개`); }

      // Links containing "author" in href
      $('a[href*="author"], a[href*="writer"], a[href*="profile"]').each(() => { authorLinks++; });

      // Author byline patterns
      const bylineSelectors = ['.author', '.byline', '[class*="author"]', '[class*="writer"]', '[itemprop="author"]'];
      for (const sel of bylineSelectors) {
        const els = $(sel);
        if (els.length > 0) { indicators.push(`${sel}: ${els.length}개`); authorLinks += els.length; }
      }

      // JSON-LD author with url
      const schemas = extractJsonLd(page.html);
      for (const s of schemas) {
        const author = s.author as Record<string, unknown> | undefined;
        if (author?.url) { authorLinks++; indicators.push('JSON-LD author.url 존재'); }
        if (author?.sameAs) { authorLinks++; indicators.push('JSON-LD author.sameAs 존재'); }
      }

      if (authorLinks >= 2) {
        return {
          id: '6.2', status: 'pass', severity: 'medium', title: '저자 프로필 링크',
          description: `저자 프로필 연결 ${authorLinks}건 발견`,
          details: indicators.join(', '),
          score: 100,
        };
      }

      if (authorLinks === 1) {
        return {
          id: '6.2', status: 'warning', severity: 'medium', title: '저자 프로필 링크',
          description: '저자 프로필 연결이 최소한만 존재합니다',
          details: indicators.join(', '),
          score: 50,
        };
      }

      return {
        id: '6.2', status: 'fail', severity: 'medium', title: '저자 프로필 링크',
        description: '저자 프로필 링크 없음 — AI가 콘텐츠 작성자의 전문성을 판단할 수 없습니다',
        score: 0,
      };
    },
  },
  {
    id: '6.3',
    title: '외부 권위 인용',
    category: 'authority',
    severity: 'high',
    scope: 'page',
    checker: ({ page, siteInfo }) => {
      if (!page || !siteInfo) return { id: '6.3', status: 'info', severity: 'high', title: '외부 권위 인용', description: '확인 불가', score: 0 };
      const $ = parseHtml(page.html);
      const origin = new URL(siteInfo.baseUrl).origin;

      const authorityDomains = /wikipedia\.org|scholar\.google|pubmed|arxiv\.org|doi\.org|gov\.|ac\.kr|edu|\.go\.kr|reuters|bbc\.com|nytimes/i;
      const domains = new Set<string>();
      let totalExternal = 0;
      let authorityCount = 0;

      $('a[href^="http"]').each((_, el) => {
        const href = $(el).attr('href') || '';
        try {
          const u = new URL(href);
          if (u.origin === origin) return;
          totalExternal++;
          domains.add(u.hostname);
          if (authorityDomains.test(u.hostname)) authorityCount++;
        } catch { /* invalid */ }
      });

      // Check for <cite> tags
      const citeCount = $('cite').length;
      // Check for <blockquote> with cite attribute
      const blockquoteCite = $('blockquote[cite]').length;

      const citationSignals = authorityCount + citeCount + blockquoteCite;

      if (citationSignals >= 3) {
        return {
          id: '6.3', status: 'pass', severity: 'high', title: '외부 권위 인용',
          description: `권위 있는 외부 인용 ${citationSignals}건 발견`,
          details: `외부 링크 도메인: ${domains.size}개, 권위 도메인: ${authorityCount}개, cite 태그: ${citeCount}개, blockquote[cite]: ${blockquoteCite}개`,
          score: 100,
        };
      }

      if (citationSignals >= 1) {
        return {
          id: '6.3', status: 'warning', severity: 'high', title: '외부 권위 인용',
          description: `외부 인용이 있으나 보강이 필요합니다 (${citationSignals}건)`,
          details: `외부 링크 도메인: ${domains.size}개, 권위 도메인: ${authorityCount}개`,
          score: 50,
        };
      }

      if (totalExternal > 0) {
        return {
          id: '6.3', status: 'warning', severity: 'high', title: '외부 권위 인용',
          description: `외부 링크 ${totalExternal}개 있으나 권위 있는 소스 인용 없음`,
          details: `링크된 도메인: ${Array.from(domains).slice(0, 5).join(', ')}`,
          score: 30,
        };
      }

      return {
        id: '6.3', status: 'fail', severity: 'high', title: '외부 권위 인용',
        description: '외부 인용이 전혀 없습니다. 권위 있는 소스를 인용하면 AI의 신뢰도 평가가 향상됩니다.',
        score: 0,
      };
    },
  },
  {
    id: '6.4',
    title: 'Organization Schema 완비',
    category: 'authority',
    severity: 'critical',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '6.4', status: 'info', severity: 'critical', title: 'Organization Schema 완비', description: '확인 불가', score: 0 };
      const schemas = extractJsonLd(page.html);
      const org = schemas.find((s) => s['@type'] === 'Organization' || s['@type'] === 'Corporation' || s['@type'] === 'LocalBusiness');

      if (!org) {
        return {
          id: '6.4', status: 'fail', severity: 'critical', title: 'Organization Schema 완비',
          description: 'Organization 구조화 데이터가 없습니다. AI가 브랜드를 엔티티로 인식하기 어렵습니다.',
          score: 0,
        };
      }

      const requiredFields = ['name', 'url', 'logo', 'description', 'sameAs'];
      const found = requiredFields.filter((f) => {
        const val = org[f];
        return val !== undefined && val !== null && val !== '';
      });
      const missing = requiredFields.filter((f) => !found.includes(f));
      const score = Math.round((found.length / requiredFields.length) * 100);

      // Build field value summary
      const truncate = (val: unknown, maxLen = 80): string => {
        if (val === undefined || val === null) return '(없음)';
        const s = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return s.length > maxLen ? s.slice(0, maxLen) + '...' : s;
      };
      const fieldValues = [
        `name: ${truncate(org.name)}`,
        `url: ${truncate(org.url)}`,
        `logo: ${truncate(typeof org.logo === 'object' ? (org.logo as Record<string, unknown>)?.url || org.logo : org.logo)}`,
        `description: ${truncate(org.description)}`,
        `sameAs: ${truncate(org.sameAs, 120)}`,
      ].join('\n');

      if (missing.length === 0) {
        return {
          id: '6.4', status: 'pass', severity: 'critical', title: 'Organization Schema 완비',
          description: `Organization 스키마 완비 (${found.length}/${requiredFields.length} 필드)`,
          details: `필드 값:\n${fieldValues}`,
          score: 100,
        };
      }

      return {
        id: '6.4', status: 'warning', severity: 'critical', title: 'Organization Schema 완비',
        description: `Organization 스키마 불완전 (${found.length}/${requiredFields.length} 필드)`,
        details: `누락: ${missing.join(', ')}\n\n필드 값:\n${fieldValues}`,
        score,
      };
    },
  },
  {
    id: '6.5',
    title: 'Knowledge Panel 연결',
    category: 'authority',
    severity: 'high',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '6.5', status: 'info', severity: 'high', title: 'Knowledge Panel 연결', description: '확인 불가', score: 0 };
      const schemas = extractJsonLd(page.html);

      const knowledgeDomains = /wikipedia\.org|wikidata\.org|dbpedia\.org|crunchbase\.com/i;
      const sameAsLinks: string[] = [];
      let hasKnowledgeLink = false;

      for (const schema of schemas) {
        const sameAs = schema.sameAs;
        if (!sameAs) continue;
        const links = Array.isArray(sameAs) ? sameAs : [sameAs];
        for (const link of links) {
          if (typeof link !== 'string') continue;
          sameAsLinks.push(link);
          if (knowledgeDomains.test(link)) hasKnowledgeLink = true;
        }
      }

      if (hasKnowledgeLink) {
        const knowledgeLinks = sameAsLinks.filter((l) => knowledgeDomains.test(l));
        const socialLinks = sameAsLinks.filter((l) => !knowledgeDomains.test(l));
        return {
          id: '6.5', status: 'pass', severity: 'high', title: 'Knowledge Panel 연결',
          description: '위키피디아/위키데이터 등 지식 그래프 연결 확인됨',
          details: `지식 그래프 링크:\n${knowledgeLinks.map((l) => `  • ${l}`).join('\n')}${socialLinks.length > 0 ? `\n소셜/기타 링크:\n${socialLinks.slice(0, 5).map((l) => `  • ${l}`).join('\n')}` : ''}`,
          score: 100,
        };
      }

      if (sameAsLinks.length > 0) {
        return {
          id: '6.5', status: 'warning', severity: 'high', title: 'Knowledge Panel 연결',
          description: `sameAs 링크 ${sameAsLinks.length}개 있으나 지식 그래프(위키피디아/위키데이터) 연결 없음`,
          details: `sameAs 링크:\n${sameAsLinks.slice(0, 8).map((l) => `  • ${l}`).join('\n')}`,
          score: 40,
        };
      }

      return {
        id: '6.5', status: 'fail', severity: 'high', title: 'Knowledge Panel 연결',
        description: '지식 그래프 연결 없음 — 위키피디아, 위키데이터 등의 sameAs 링크를 추가하면 AI가 브랜드를 공인 엔티티로 인식합니다.',
        score: 0,
      };
    },
  },
];
