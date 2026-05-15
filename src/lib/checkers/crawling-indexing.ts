import robotsParser from 'robots-parser';
import { parseHtml } from '../crawler/page-fetcher';
import type { CheckerDefinition } from './types';

const AI_BOTS = [
  'GPTBot',
  'ClaudeBot',
  'PerplexityBot',
  'Google-Extended',
  'OAI-SearchBot',
  'Applebot-Extended',
  'CCBot',
  'Claude-SearchBot',
];

export const crawlingCheckers: CheckerDefinition[] = [
  {
    id: '4.1',
    title: 'Robots.txt',
    category: 'crawling',
    severity: 'critical',
    scope: 'site',
    checker: ({ siteInfo }) => {
      if (!siteInfo?.robotsTxt) {
        return {
          id: '4.1',
          status: 'warning',
          severity: 'critical',
          title: 'Robots.txt',
          description: 'robots.txt 파일이 존재하지 않습니다.',
          score: 30,
        };
      }

      const robots = robotsParser(`${siteInfo.baseUrl}/robots.txt`, siteInfo.robotsTxt);
      const blockedPaths: string[] = [];
      const testPaths = ['/', '/blog/', '/products/', '/about/'];
      for (const path of testPaths) {
        const url = `${siteInfo.baseUrl}${path}`;
        if (!robots.isAllowed(url)) {
          blockedPaths.push(path);
        }
      }

      // Extract User-agent rules for details
      const uaRules: string[] = [];
      const uaRegex = /User-agent:\s*(.+)/gi;
      let uaMatch;
      while ((uaMatch = uaRegex.exec(siteInfo.robotsTxt)) !== null) {
        const agent = uaMatch[1].trim();
        // Grab the directives following this User-agent until next User-agent or end
        const startIdx = uaMatch.index + uaMatch[0].length;
        const nextUa = siteInfo.robotsTxt.indexOf('User-agent:', startIdx);
        const block = siteInfo.robotsTxt.slice(startIdx, nextUa === -1 ? undefined : nextUa).trim();
        const directives = block.split('\n').filter((l: string) => /^\s*(Allow|Disallow|Crawl-delay|Sitemap):/i.test(l)).map((l: string) => l.trim()).slice(0, 5);
        if (directives.length > 0) {
          uaRules.push(`[${agent}] ${directives.join('; ')}`);
        }
      }
      const rulesDetail = uaRules.length > 0 ? `규칙:\n${uaRules.slice(0, 8).join('\n')}` : '';

      if (blockedPaths.includes('/')) {
        return {
          id: '4.1',
          status: 'fail',
          severity: 'critical',
          title: 'Robots.txt',
          description: '루트 경로(/)가 차단되어 있습니다.',
          details: `차단된 경로: ${blockedPaths.join(', ')}\n${rulesDetail}`,
          score: 10,
        };
      }

      return {
        id: '4.1',
        status: blockedPaths.length > 0 ? 'warning' : 'pass',
        severity: 'critical',
        title: 'Robots.txt',
        description: blockedPaths.length > 0
          ? `일부 주요 경로가 차단됨: ${blockedPaths.join(', ')}`
          : 'robots.txt 정상 — 주요 경로 접근 허용됨',
        details: rulesDetail || undefined,
        score: blockedPaths.length > 0 ? 60 : 100,
      };
    },
  },
  {
    id: '4.2',
    title: 'AI 크롤러 허용 여부',
    category: 'crawling',
    severity: 'critical',
    scope: 'site',
    checker: ({ siteInfo }) => {
      if (!siteInfo?.robotsTxt) {
        return {
          id: '4.2',
          status: 'info',
          severity: 'critical',
          title: 'AI 크롤러 허용 여부',
          description: 'robots.txt 없음 — AI 크롤러 차단 여부 확인 불가 (기본 허용)',
          score: 60,
        };
      }

      const blockedBots: string[] = [];
      const allowedBots: string[] = [];
      const txt = siteInfo.robotsTxt;

      for (const bot of AI_BOTS) {
        const regex = new RegExp(
          `User-agent:\\s*${bot.replace('-', '\\-')}[\\s\\S]*?Disallow:\\s*/`,
          'i'
        );
        if (regex.test(txt)) {
          blockedBots.push(bot);
        } else {
          allowedBots.push(bot);
        }
      }

      const botStatusList = AI_BOTS.map((bot) =>
        `• ${bot}: ${blockedBots.includes(bot) ? '❌ 차단' : '✅ 허용'}`
      ).join('\n');

      if (blockedBots.length === AI_BOTS.length) {
        return {
          id: '4.2',
          status: 'fail',
          severity: 'critical',
          title: 'AI 크롤러 허용 여부',
          description: '모든 AI 크롤러가 차단되어 있습니다. AI 검색 노출 불가.',
          details: botStatusList,
          score: 0,
        };
      }

      if (blockedBots.length > 0) {
        return {
          id: '4.2',
          status: 'warning',
          severity: 'critical',
          title: 'AI 크롤러 허용 여부',
          description: `일부 AI 크롤러 차단됨 (${blockedBots.length}/${AI_BOTS.length})`,
          details: botStatusList,
          score: Math.round((allowedBots.length / AI_BOTS.length) * 100),
        };
      }

      return {
        id: '4.2',
        status: 'pass',
        severity: 'critical',
        title: 'AI 크롤러 허용 여부',
        description: '모든 주요 AI 크롤러 접근 허용됨',
        details: botStatusList,
        score: 100,
      };
    },
  },
  {
    id: '4.3',
    title: 'Sitemap.xml',
    category: 'crawling',
    severity: 'high',
    scope: 'site',
    checker: ({ siteInfo }) => {
      if (!siteInfo?.sitemapXml) {
        return {
          id: '4.3',
          status: 'fail',
          severity: 'high',
          title: 'Sitemap.xml',
          description: 'sitemap.xml이 존재하지 않습니다.',
          score: 0,
        };
      }

      const hasUrls = siteInfo.sitemapXml.includes('<loc>');
      if (!hasUrls) {
        return {
          id: '4.3',
          status: 'warning',
          severity: 'high',
          title: 'Sitemap.xml',
          description: 'sitemap.xml이 존재하나 URL이 포함되어 있지 않습니다.',
          score: 30,
        };
      }

      const locMatches = siteInfo.sitemapXml.match(/<loc>([^<]+)<\/loc>/g) || [];
      const urlCount = locMatches.length;
      const sampleUrls = locMatches.slice(0, 5).map((m: string) => m.replace(/<\/?loc>/g, ''));
      const hasLastmod = siteInfo.sitemapXml.includes('<lastmod>');
      const hasChangefreq = siteInfo.sitemapXml.includes('<changefreq>');
      const hasPriority = siteInfo.sitemapXml.includes('<priority>');
      const metaInfo = [hasLastmod ? 'lastmod' : null, hasChangefreq ? 'changefreq' : null, hasPriority ? 'priority' : null].filter(Boolean).join(', ');

      return {
        id: '4.3',
        status: 'pass',
        severity: 'high',
        title: 'Sitemap.xml',
        description: `sitemap.xml 정상 — ${urlCount}개 URL 포함`,
        details: `포함 메타: ${metaInfo || '없음'}\n샘플 URL:\n${sampleUrls.map((u: string) => `  • ${u}`).join('\n')}`,
        score: 100,
      };
    },
  },
  {
    id: '4.4',
    title: '색인 상태',
    category: 'crawling',
    severity: 'high',
    scope: 'site',
    checker: ({ siteInfo }) => ({
      id: '4.4',
      status: 'info',
      severity: 'high',
      title: '색인 상태',
      description: 'Google Search Console API 연결 필요. site: 검색으로 대략적 확인 가능.',
      details: siteInfo ? `확인 URL: site:${new URL(siteInfo.baseUrl).hostname}` : undefined,
      score: 50,
    }),
  },
  {
    id: '4.6',
    title: 'llms.txt 제공',
    category: 'crawling',
    severity: 'critical',
    scope: 'site',
    checker: ({ siteInfo }) => {
      const hasLlms = !!siteInfo?.llmsTxt;
      const hasLlmsFull = !!siteInfo?.llmsFullTxt;

      const llmsPreview = siteInfo?.llmsTxt ? siteInfo.llmsTxt.slice(0, 200).replace(/\n/g, ' ') : '';
      const llmsFullPreview = siteInfo?.llmsFullTxt ? siteInfo.llmsFullTxt.slice(0, 200).replace(/\n/g, ' ') : '';

      if (hasLlms && hasLlmsFull) {
        return {
          id: '4.6',
          status: 'pass',
          severity: 'critical',
          title: 'llms.txt 제공',
          description: 'llms.txt와 llms-full.txt 모두 존재',
          details: `llms.txt 내용 (앞 200자):\n${llmsPreview}${siteInfo!.llmsTxt!.length > 200 ? '...' : ''}\n\nllms-full.txt 내용 (앞 200자):\n${llmsFullPreview}${siteInfo!.llmsFullTxt!.length > 200 ? '...' : ''}`,
          score: 100,
        };
      }

      if (hasLlms) {
        return {
          id: '4.6',
          status: 'warning',
          severity: 'critical',
          title: 'llms.txt 제공',
          description: 'llms.txt 존재, llms-full.txt 미존재',
          details: `llms.txt 내용 (앞 200자):\n${llmsPreview}${siteInfo!.llmsTxt!.length > 200 ? '...' : ''}`,
          score: 70,
        };
      }

      return {
        id: '4.6',
        status: 'fail',
        severity: 'critical',
        title: 'llms.txt 제공',
        description: 'llms.txt 미존재 — AI 봇을 위한 사이트 안내 없음',
        score: 0,
      };
    },
  },
  {
    id: '4.7',
    title: 'AI 콘텐츠 피드',
    category: 'crawling',
    severity: 'medium',
    scope: 'site',
    checker: async ({ siteInfo, page }) => {
      if (!siteInfo) {
        return { id: '4.7', status: 'info', severity: 'medium', title: 'AI 콘텐츠 피드', description: '확인 불가', score: 0 };
      }

      const feedPaths = ['/feed', '/feed.xml', '/rss', '/rss.xml', '/atom.xml', '/feed.json'];
      const feeds: { url: string; type: string }[] = [];

      // Check link tags in homepage
      if (page) {
        const { parseHtml } = await import('../crawler/page-fetcher');
        const $ = parseHtml(page.html);
        $('link[rel="alternate"][type*="rss"], link[rel="alternate"][type*="atom"], link[rel="alternate"][type*="json"]').each((_, el) => {
          const href = $(el).attr('href');
          const type = $(el).attr('type') || 'unknown';
          if (href) feeds.push({ url: href, type });
        });
      }

      // Probe common paths
      for (const path of feedPaths) {
        try {
          const res = await fetch(`${siteInfo.baseUrl}${path}`, {
            method: 'HEAD',
            headers: { 'User-Agent': 'GEO-Audit-Bot/1.0' },
          });
          if (res.ok) {
            const ct = res.headers.get('content-type') || '';
            const feedType = ct.includes('json') ? 'JSON Feed' : ct.includes('atom') ? 'Atom' : ct.includes('rss') || ct.includes('xml') ? 'RSS' : 'unknown';
            feeds.push({ url: path, type: feedType });
          }
        } catch {
          // Not available
        }
      }

      if (feeds.length > 0) {
        const feedDetails = feeds.map((f) => `• ${f.url} (${f.type})`).join('\n');
        return {
          id: '4.7',
          status: 'pass',
          severity: 'medium',
          title: 'AI 콘텐츠 피드',
          description: `콘텐츠 피드 ${feeds.length}개 발견`,
          details: feedDetails,
          score: 100,
        };
      }

      return {
        id: '4.7',
        status: 'fail',
        severity: 'medium',
        title: 'AI 콘텐츠 피드',
        description: 'RSS/Atom/JSON Feed 없음',
        score: 0,
      };
    },
  },
  {
    id: '4.8',
    title: 'Sitemap lastmod 정확성',
    category: 'crawling',
    severity: 'high',
    scope: 'aggregate',
    checker: ({ siteInfo, allPages }) => {
      if (!siteInfo?.sitemapXml || !allPages?.length) {
        return {
          id: '4.8',
          status: 'na',
          severity: 'high',
          title: 'Sitemap lastmod 정확성',
          description: 'sitemap 또는 크롤링 데이터 없음',
          score: 0,
        };
      }

      const lastmodRegex = /<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g;
      const mismatches: string[] = [];
      const sampleEntries: { url: string; lastmod: string }[] = [];
      let matches = 0;
      let match;

      while ((match = lastmodRegex.exec(siteInfo.sitemapXml)) !== null) {
        matches++;
        if (sampleEntries.length < 8) {
          sampleEntries.push({ url: match[1], lastmod: match[2] });
        }
        // Basic check — more detailed comparison would need page dateModified
      }

      if (matches === 0) {
        return {
          id: '4.8',
          status: 'warning',
          severity: 'high',
          title: 'Sitemap lastmod 정확성',
          description: 'sitemap에 lastmod 정보가 없습니다.',
          score: 30,
        };
      }

      const sampleDetail = sampleEntries.map((e) => `• ${e.lastmod} — ${e.url}`).join('\n');

      return {
        id: '4.8',
        status: 'info',
        severity: 'high',
        title: 'Sitemap lastmod 정확성',
        description: `sitemap에 ${matches}개 URL의 lastmod 존재 확인됨 (정확성 미검증)`,
        details: `샘플 lastmod:\n${sampleDetail}`,
        score: 70,
      };
    },
  },
  {
    id: '4.10',
    title: 'AI 에이전트 연동 파일',
    category: 'crawling',
    severity: 'high',
    scope: 'site',
    checker: async ({ siteInfo }) => {
      if (!siteInfo) return { id: '4.10', status: 'info', severity: 'high', title: 'AI 에이전트 연동 파일', description: '확인 불가', score: 0 };

      const paths = [
        { path: '/.well-known/ai-plugin.json', label: 'ChatGPT Plugin manifest' },
        { path: '/ai.txt', label: 'ai.txt' },
        { path: '/.well-known/agent.json', label: 'Agent manifest' },
      ];
      const found: string[] = [];

      for (const { path, label } of paths) {
        try {
          const res = await fetch(`${siteInfo.baseUrl}${path}`, {
            method: 'HEAD',
            headers: { 'User-Agent': 'GEO-Audit-Bot/1.0' },
            signal: AbortSignal.timeout(5000),
          });
          if (res.ok) found.push(label);
        } catch { /* not available */ }
      }

      if (found.length > 0) {
        return {
          id: '4.10', status: 'pass', severity: 'high', title: 'AI 에이전트 연동 파일',
          description: `AI 에이전트 연동 파일 발견: ${found.join(', ')}`,
          score: 100,
        };
      }

      return {
        id: '4.10', status: 'info', severity: 'high', title: 'AI 에이전트 연동 파일',
        description: 'ai-plugin.json, ai.txt 등 AI 에이전트 연동 파일이 없습니다. 아직 표준화되지 않은 영역입니다.',
        score: 50,
      };
    },
  },
  {
    id: '4.11',
    title: '콘텐츠 라이선스 명시',
    category: 'crawling',
    severity: 'medium',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '4.11', status: 'info', severity: 'medium', title: '콘텐츠 라이선스 명시', description: '확인 불가', score: 0 };

      const $ = parseHtml(page.html);

      const signals: string[] = [];

      // TDM (Text and Data Mining) headers
      if (page.headers['tdm-reservation']) signals.push(`TDM-Reservation: ${page.headers['tdm-reservation']}`);

      // robots meta with AI directives
      const robotsMeta = $('meta[name="robots"]').attr('content') || '';
      if (/noai|noimageai/i.test(robotsMeta)) {
        signals.push(`robots meta: ${robotsMeta}`);
        return {
          id: '4.11', status: 'warning', severity: 'medium', title: '콘텐츠 라이선스 명시',
          description: 'AI 학습/인용이 명시적으로 제한되어 있습니다',
          details: signals.join(', '),
          score: 30,
        };
      }

      // Creative Commons or license links
      const licenseLinks = $('a[rel="license"], link[rel="license"]');
      if (licenseLinks.length > 0) signals.push(`라이선스 링크: ${licenseLinks.length}개`);

      // Schema license property
      const html = page.html;
      if (html.includes('"license"') || html.includes('"copyrightHolder"')) signals.push('JSON-LD license/copyright 존재');

      // Footer copyright
      const footer = $('footer').text();
      if (/©|copyright|저작권/i.test(footer)) signals.push('푸터 저작권 표시');

      if (signals.length >= 2) {
        return {
          id: '4.11', status: 'pass', severity: 'medium', title: '콘텐츠 라이선스 명시',
          description: '콘텐츠 라이선스가 명확히 표시되어 있습니다',
          details: signals.join(', '),
          score: 100,
        };
      }

      if (signals.length === 1) {
        return {
          id: '4.11', status: 'warning', severity: 'medium', title: '콘텐츠 라이선스 명시',
          description: '기본적인 저작권 표시만 존재합니다',
          details: signals.join(', '),
          score: 50,
        };
      }

      return {
        id: '4.11', status: 'warning', severity: 'medium', title: '콘텐츠 라이선스 명시',
        description: '콘텐츠 라이선스/저작권 표시가 없습니다',
        score: 20,
      };
    },
  },
  {
    id: '4.12',
    title: '콘텐츠 신선도',
    category: 'crawling',
    severity: 'high',
    scope: 'aggregate',
    checker: ({ allPages }) => {
      if (!allPages?.length) return { id: '4.12', status: 'info', severity: 'high', title: '콘텐츠 신선도', description: '확인 불가', score: 0 };

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      let withDate = 0;
      let recentCount = 0;
      let staleCount = 0;
      const dates: { url: string; date: string }[] = [];

      for (const page of allPages) {
        const $ = parseHtml(page.html);
        // Look for dateModified or datePublished in JSON-LD
        const ldMatch = page.html.match(/"date(?:Modified|Published)"\s*:\s*"([^"]+)"/);
        // Also check <time> elements
        const timeEl = $('time[datetime]').first().attr('datetime');
        const dateStr = ldMatch?.[1] || timeEl;

        if (dateStr) {
          withDate++;
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            dates.push({ url: page.url, date: dateStr });
            if (d >= sixMonthsAgo) recentCount++;
            else if (d < oneYearAgo) staleCount++;
          }
        }
      }

      if (withDate === 0) {
        return {
          id: '4.12', status: 'fail', severity: 'high', title: '콘텐츠 신선도',
          description: '날짜 정보가 있는 페이지가 없습니다. AI는 최신성을 판단할 수 없습니다.',
          details: `분석 페이지: ${allPages.length}개`,
          score: 0,
        };
      }

      const recentRate = recentCount / withDate;
      const score = recentRate >= 0.5 ? 100 : recentRate >= 0.3 ? 70 : recentRate >= 0.1 ? 40 : 20;

      // Build sample dates per URL for details
      const sortedDates = dates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const sampleLines = sortedDates.slice(0, 10).map((d) => `• ${d.date} — ${d.url}`).join('\n');

      return {
        id: '4.12',
        status: recentRate >= 0.3 ? 'pass' : 'warning',
        severity: 'high',
        title: '콘텐츠 신선도',
        description: `날짜 있는 페이지 ${withDate}개 중 최근 6개월 이내 ${recentCount}개 (${(recentRate * 100).toFixed(0)}%)`,
        details: `최근 6개월: ${recentCount}개, 1년 이상 경과: ${staleCount}개, 날짜 없음: ${allPages.length - withDate}개\n\n페이지별 날짜 (최신순):\n${sampleLines}`,
        score,
      };
    },
  },
  {
    id: '4.13',
    title: '발행 빈도',
    category: 'crawling',
    severity: 'medium',
    scope: 'aggregate',
    checker: ({ siteInfo }) => {
      if (!siteInfo?.sitemapXml) {
        return { id: '4.13', status: 'info', severity: 'medium', title: '발행 빈도', description: 'sitemap 없어 분석 불가', score: 0 };
      }

      const lastmodRegex = /<lastmod>([^<]+)<\/lastmod>/g;
      const dates: Date[] = [];
      let match;

      while ((match = lastmodRegex.exec(siteInfo.sitemapXml)) !== null) {
        const d = new Date(match[1]);
        if (!isNaN(d.getTime())) dates.push(d);
      }

      if (dates.length < 2) {
        return {
          id: '4.13', status: 'warning', severity: 'medium', title: '발행 빈도',
          description: 'sitemap에 날짜 데이터가 부족하여 발행 빈도를 분석할 수 없습니다',
          details: `lastmod 항목: ${dates.length}개`,
          score: 30,
        };
      }

      dates.sort((a, b) => b.getTime() - a.getTime());

      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const recentDates = dates.filter((d) => d >= threeMonthsAgo);
      const mostRecent = dates[0];
      const daysSinceLastUpdate = Math.round((Date.now() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));

      if (recentDates.length >= 5 && daysSinceLastUpdate <= 30) {
        return {
          id: '4.13', status: 'pass', severity: 'medium', title: '발행 빈도',
          description: '활발한 콘텐츠 발행이 확인됩니다',
          details: `최근 3개월 업데이트: ${recentDates.length}건, 마지막 업데이트: ${daysSinceLastUpdate}일 전`,
          score: 100,
        };
      }

      if (daysSinceLastUpdate <= 90) {
        return {
          id: '4.13', status: 'warning', severity: 'medium', title: '발행 빈도',
          description: '콘텐츠 업데이트가 있으나 빈도가 낮습니다',
          details: `최근 3개월 업데이트: ${recentDates.length}건, 마지막 업데이트: ${daysSinceLastUpdate}일 전`,
          score: 50,
        };
      }

      return {
        id: '4.13', status: 'fail', severity: 'medium', title: '발행 빈도',
        description: `마지막 업데이트가 ${daysSinceLastUpdate}일 전입니다. AI는 오래된 사이트의 인용 우선순위를 낮춥니다.`,
        details: `전체 lastmod: ${dates.length}개, 최근 3개월: ${recentDates.length}건`,
        score: 10,
      };
    },
  },
  {
    id: '4.14',
    title: 'API/데이터 엔드포인트',
    category: 'crawling',
    severity: 'medium',
    scope: 'site',
    checker: async ({ siteInfo, allPages }) => {
      if (!siteInfo) return { id: '4.14', status: 'info', severity: 'medium', title: 'API/데이터 엔드포인트', description: '확인 불가', score: 0 };

      const found: string[] = [];

      // Check for OpenAPI/Swagger
      const apiPaths = ['/openapi.json', '/swagger.json', '/api-docs', '/.well-known/openapi.yaml'];
      for (const path of apiPaths) {
        try {
          const res = await fetch(`${siteInfo.baseUrl}${path}`, {
            method: 'HEAD',
            headers: { 'User-Agent': 'GEO-Audit-Bot/1.0' },
            signal: AbortSignal.timeout(5000),
          });
          if (res.ok) found.push(path);
        } catch { /* not available */ }
      }

      // Check link tags in pages
      if (allPages) {
        const { parseHtml } = await import('../crawler/page-fetcher');
        for (const page of allPages.slice(0, 3)) {
          const $ = parseHtml(page.html);
          $('link[rel="api"], link[type="application/json"], link[type="application/ld+json"]').each((_, el) => {
            const href = $(el).attr('href');
            if (href && !found.includes(href)) found.push(href);
          });
        }
      }

      if (found.length > 0) {
        return {
          id: '4.14', status: 'pass', severity: 'medium', title: 'API/데이터 엔드포인트',
          description: `공개 API/데이터 엔드포인트 발견: ${found.join(', ')}`,
          score: 100,
        };
      }

      return {
        id: '4.14', status: 'na', severity: 'medium', title: 'API/데이터 엔드포인트',
        description: '공개 API 엔드포인트가 발견되지 않았습니다. 필수 사항은 아니지만 AI 에이전트 연동에 유리합니다.',
        score: 50,
      };
    },
  },
];
