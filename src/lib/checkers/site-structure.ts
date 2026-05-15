import { parseHtml } from '../crawler/page-fetcher';
import type { CheckerDefinition } from './types';

export const siteStructureCheckers: CheckerDefinition[] = [
  {
    id: '5.1',
    title: 'HTTPS',
    category: 'structure',
    severity: 'critical',
    scope: 'site',
    checker: async ({ siteInfo, allPages }) => {
      if (!siteInfo) {
        return { id: '5.1', status: 'info', severity: 'critical', title: 'HTTPS', description: '확인 불가', score: 0 };
      }

      const isHttps = siteInfo.baseUrl.startsWith('https://');
      if (!isHttps) {
        return {
          id: '5.1',
          status: 'fail',
          severity: 'critical',
          title: 'HTTPS',
          description: '사이트가 HTTPS를 사용하지 않습니다.',
          score: 0,
        };
      }

      // Check for mixed content
      let mixedContentCount = 0;
      const mixedContentUrls: string[] = [];
      for (const page of allPages || []) {
        const $ = parseHtml(page.html);
        $('img[src^="http://"], script[src^="http://"], link[href^="http://"]').each((_, el) => {
          const src = $(el).attr('src') || $(el).attr('href') || '';
          if (src && mixedContentUrls.length < 15) {
            mixedContentUrls.push(`${src} (on ${page.url})`);
          }
          mixedContentCount++;
        });
      }

      if (mixedContentCount > 0) {
        return {
          id: '5.1',
          status: 'warning',
          severity: 'critical',
          title: 'HTTPS',
          description: `HTTPS 적용됨, mixed content ${mixedContentCount}건 발견`,
          details: `Mixed content URLs:\n${mixedContentUrls.map((u) => `• ${u}`).join('\n')}`,
          score: 70,
        };
      }

      return {
        id: '5.1',
        status: 'pass',
        severity: 'critical',
        title: 'HTTPS',
        description: 'HTTPS 정상 적용, mixed content 없음',
        score: 100,
      };
    },
  },
  {
    id: '5.2',
    title: '내부 링크 구조',
    category: 'structure',
    severity: 'high',
    scope: 'aggregate',
    checker: ({ allPages, siteInfo }) => {
      if (!allPages?.length || !siteInfo) {
        return { id: '5.2', status: 'info', severity: 'high', title: '내부 링크 구조', description: '확인 불가', score: 0 };
      }

      const origin = new URL(siteInfo.baseUrl).origin;
      const linkedUrls = new Set<string>();
      let totalInternalLinks = 0;
      const perPageCounts: { url: string; count: number }[] = [];

      for (const page of allPages) {
        const $ = parseHtml(page.html);
        let pageLinks = 0;
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          if (!href) return;
          try {
            const abs = new URL(href, page.url).href;
            if (abs.startsWith(origin)) {
              linkedUrls.add(abs);
              totalInternalLinks++;
              pageLinks++;
            }
          } catch { /* invalid URL */ }
        });
        perPageCounts.push({ url: page.url, count: pageLinks });
      }

      const crawledUrls = new Set(allPages.map((p) => p.url));
      const orphans = allPages.filter((p) => !linkedUrls.has(p.url) && p.url !== siteInfo.baseUrl);
      const avgLinks = totalInternalLinks / allPages.length;

      const counts = perPageCounts.map((p) => p.count);
      const minLinks = Math.min(...counts);
      const maxLinks = Math.max(...counts);
      const minPage = perPageCounts.find((p) => p.count === minLinks);
      const maxPage = perPageCounts.find((p) => p.count === maxLinks);

      const score = orphans.length === 0 && avgLinks >= 3 ? 100
        : orphans.length === 0 ? 60
        : orphans.length <= 3 ? 60
        : 30;

      const statsDetail = `내부 링크 통계: min=${minLinks} (${minPage?.url}), max=${maxLinks} (${maxPage?.url}), avg=${avgLinks.toFixed(1)}`;
      const orphanDetail = orphans.length > 0
        ? `\n고아 페이지:\n${orphans.map((p) => `  - ${p.url}`).join('\n')}`
        : '';

      return {
        id: '5.2',
        status: orphans.length === 0 ? 'pass' : 'warning',
        severity: 'high',
        title: '내부 링크 구조',
        description: `평균 내부 링크 ${avgLinks.toFixed(1)}개/페이지, 고아 페이지 ${orphans.length}개`,
        details: `${statsDetail}${orphanDetail}`,
        score,
      };
    },
  },
  {
    id: '5.3',
    title: '외부 링크 구조',
    category: 'structure',
    severity: 'medium',
    scope: 'aggregate',
    checker: async ({ allPages, siteInfo }) => {
      if (!allPages?.length || !siteInfo) {
        return { id: '5.3', status: 'info', severity: 'medium', title: '외부 링크 구조', description: '확인 불가', score: 0 };
      }

      const origin = new URL(siteInfo.baseUrl).origin;
      const externalLinks = new Set<string>();

      for (const page of allPages) {
        const $ = parseHtml(page.html);
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          if (!href) return;
          try {
            const abs = new URL(href, page.url).href;
            if (!abs.startsWith(origin) && abs.startsWith('http')) {
              externalLinks.add(abs);
            }
          } catch { /* invalid URL */ }
        });
      }

      // Check a sample of external links (max 20)
      const sample = Array.from(externalLinks).slice(0, 20);
      let broken = 0;
      const brokenUrls: { url: string; status: string }[] = [];
      for (const url of sample) {
        try {
          const res = await fetch(url, {
            method: 'HEAD',
            headers: { 'User-Agent': 'GEO-Audit-Bot/1.0' },
            redirect: 'follow',
          });
          if (res.status >= 400) {
            broken++;
            brokenUrls.push({ url, status: `HTTP ${res.status}` });
          }
        } catch (e) {
          broken++;
          brokenUrls.push({ url, status: 'connection error' });
        }
      }

      const brokenRate = sample.length > 0 ? broken / sample.length : 0;
      const score = brokenRate === 0 ? 100 : brokenRate < 0.1 ? 80 : brokenRate < 0.3 ? 50 : 20;

      const brokenDetail = brokenUrls.length > 0
        ? `깨진 링크:\n${brokenUrls.map((b) => `• ${b.url} — ${b.status}`).join('\n')}`
        : undefined;

      return {
        id: '5.3',
        status: broken === 0 ? 'pass' : 'warning',
        severity: 'medium',
        title: '외부 링크 구조',
        description: `외부 링크 ${externalLinks.size}개, 샘플 ${sample.length}개 중 깨진 링크 ${broken}개`,
        details: brokenDetail,
        score,
      };
    },
  },
  {
    id: '5.4',
    title: '렌더링 방식',
    category: 'structure',
    severity: 'critical',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) {
        return { id: '5.4', status: 'info', severity: 'critical', title: '렌더링 방식', description: '확인 불가', score: 0 };
      }

      const $ = parseHtml(page.html);
      const bodyText = $('body').text().trim();
      const hasIframe = $('iframe').length > 0;
      const hasReactRoot = page.html.includes('__NEXT_DATA__') || page.html.includes('data-reactroot');
      const hasNuxt = page.html.includes('__nuxt') || page.html.includes('__NUXT__');
      const hasAngular = page.html.includes('ng-app') || page.html.includes('ng-version');

      // Detect if page relies heavily on JS rendering
      const mainContentLength = $('main, article, [role="main"], .content, #content').text().trim().length;
      const totalScripts = $('script[src]').length;
      const isLikelySPA = mainContentLength < 100 && totalScripts > 5;

      if (hasIframe && bodyText.length < 200) {
        return {
          id: '5.4',
          status: 'fail',
          severity: 'critical',
          title: '렌더링 방식',
          description: 'iframe 기반 렌더링 — AI 크롤러 접근 불가',
          score: 10,
        };
      }

      const framework = hasReactRoot ? 'Next.js/React' : hasNuxt ? 'Nuxt/Vue' : hasAngular ? 'Angular' : 'SSR/정적';
      const bodyTextLength = bodyText.length;
      const inlineScripts = $('script:not([src])').length;
      const renderDetail = `프레임워크: ${framework}\n메인 콘텐츠: ${mainContentLength}자, body 전체: ${bodyTextLength}자\n외부 스크립트: ${totalScripts}개, 인라인 스크립트: ${inlineScripts}개\niframe: ${hasIframe ? '있음' : '없음'}`;

      if (isLikelySPA) {
        return {
          id: '5.4',
          status: 'warning',
          severity: 'critical',
          title: '렌더링 방식',
          description: `CSR(클라이언트사이드 렌더링) 의존 가능성 높음 — ${framework}`,
          details: renderDetail,
          score: 40,
        };
      }

      return {
        id: '5.4',
        status: 'pass',
        severity: 'critical',
        title: '렌더링 방식',
        description: `서버사이드 렌더링 확인됨 (${framework})`,
        details: renderDetail,
        score: 100,
      };
    },
  },
  {
    id: '5.5',
    title: '보안 헤더',
    category: 'structure',
    severity: 'medium',
    scope: 'site',
    checker: ({ siteInfo }) => {
      if (!siteInfo) {
        return { id: '5.5', status: 'info', severity: 'medium', title: '보안 헤더', description: '확인 불가', score: 0 };
      }

      const headers = siteInfo.homepageHeaders;
      const required = [
        'strict-transport-security',
        'x-frame-options',
        'content-security-policy',
        'x-content-type-options',
        'referrer-policy',
      ];

      const present = required.filter((h) => headers[h]);
      const missing = required.filter((h) => !headers[h]);
      const score = Math.round((present.length / required.length) * 100);

      const headerValues = present.map((h) => {
        const val = String(headers[h]);
        const truncated = val.length > 80 ? val.slice(0, 80) + '...' : val;
        return `• ${h}: ${truncated}`;
      }).join('\n');
      const missingList = missing.length > 0 ? `\n미적용:\n${missing.map((h) => `• ${h}`).join('\n')}` : '';

      return {
        id: '5.5',
        status: missing.length === 0 ? 'pass' : missing.length <= 2 ? 'warning' : 'fail',
        severity: 'medium',
        title: '보안 헤더',
        description: `${present.length}/${required.length}개 보안 헤더 적용됨`,
        details: `적용된 헤더:\n${headerValues || '(없음)'}${missingList}`,
        score,
      };
    },
  },
  {
    id: '5.6',
    title: '페이지 간 콘텐츠 공동화',
    category: 'structure',
    severity: 'medium',
    scope: 'aggregate',
    checker: ({ allPages }) => {
      if (!allPages || allPages.length < 2) {
        return { id: '5.6', status: 'na', severity: 'medium', title: '페이지 간 콘텐츠 공동화', description: '비교 대상 부족', score: 100 };
      }

      // Simple Jaccard similarity on word sets
      const pageWords = allPages.map((p) => {
        const $ = parseHtml(p.html);
        const text = $('main, article, [role="main"], .content, #content, body').first().text();
        return new Set(text.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
      });

      const duplicatePairs: string[] = [];
      for (let i = 0; i < pageWords.length; i++) {
        for (let j = i + 1; j < pageWords.length; j++) {
          const intersection = new Set([...pageWords[i]].filter((w) => pageWords[j].has(w)));
          const union = new Set([...pageWords[i], ...pageWords[j]]);
          const similarity = union.size > 0 ? intersection.size / union.size : 0;
          if (similarity > 0.8) {
            duplicatePairs.push(`${allPages[i].url} ↔ ${allPages[j].url}`);
          }
        }
      }

      if (duplicatePairs.length === 0) {
        return {
          id: '5.6',
          status: 'pass',
          severity: 'medium',
          title: '페이지 간 콘텐츠 공동화',
          description: '유사/중복 콘텐츠 페이지 미발견',
          score: 100,
        };
      }

      return {
        id: '5.6',
        status: 'warning',
        severity: 'medium',
        title: '페이지 간 콘텐츠 공동화',
        description: `유사 콘텐츠 페이지 쌍 ${duplicatePairs.length}건 발견`,
        details: duplicatePairs.slice(0, 5).join('\n'),
        score: Math.max(0, 100 - duplicatePairs.length * 20),
      };
    },
  },
];
