import { parseHtml } from '../crawler/page-fetcher';
import type { CheckerDefinition } from './types';

export const contentStructureCheckers: CheckerDefinition[] = [
  {
    id: '2.1',
    title: '헤딩 계층 구조',
    category: 'content',
    severity: 'critical',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '2.1', status: 'info', severity: 'critical', title: '헤딩 계층 구조', description: '확인 불가', score: 0 };
      const $ = parseHtml(page.html);

      const h1Count = $('h1').length;
      const headings: { level: number; text: string }[] = [];
      $('h1, h2, h3, h4, h5, h6').each((_, el) => {
        const tag = $(el).prop('tagName')?.toLowerCase() || '';
        headings.push({ level: parseInt(tag.charAt(1)), text: $(el).text().trim().slice(0, 80) });
      });

      if (h1Count === 0) {
        return { id: '2.1', status: 'fail', severity: 'critical', title: '헤딩 계층 구조', description: 'H1 태그 없음', score: 0 };
      }

      if (h1Count > 1) {
        return {
          id: '2.1', status: 'warning', severity: 'critical', title: '헤딩 계층 구조',
          description: `H1 ${h1Count}개 — 페이지당 1개 권장`,
          details: headings.filter((h) => h.level === 1).map((h) => `H1: ${h.text}`).join('\n'),
          score: 40,
        };
      }

      // Check hierarchy gaps
      let hasGap = false;
      for (let i = 1; i < headings.length; i++) {
        if (headings[i].level - headings[i - 1].level > 1) {
          hasGap = true;
          break;
        }
      }

      if (hasGap) {
        return {
          id: '2.1', status: 'warning', severity: 'critical', title: '헤딩 계층 구조',
          description: '헤딩 레벨 건너뛰기 발견 (예: H1→H3)',
          details: headings.map((h) => `${'  '.repeat(h.level - 1)}H${h.level}: ${h.text}`).join('\n'),
          score: 60,
        };
      }

      const h1Text = headings.find((h) => h.level === 1)?.text || '';
      return {
        id: '2.1', status: 'pass', severity: 'critical', title: '헤딩 계층 구조',
        description: `H1: '${h1Text}', 총 헤딩 ${headings.length}개, 계층 구조 정상`,
        details: headings.map((h) => `${'  '.repeat(h.level - 1)}H${h.level}: ${h.text}`).join('\n'),
        score: 100,
      };
    },
  },
  {
    id: '2.2',
    title: '본문 시맨틱 구조',
    category: 'content',
    severity: 'high',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '2.2', status: 'info', severity: 'high', title: '시맨틱 구조', description: '확인 불가', score: 0 };
      const $ = parseHtml(page.html);

      const semanticTags = ['article', 'section', 'nav', 'aside', 'main', 'header', 'footer'];
      const counts: Record<string, number> = {};
      let total = 0;
      for (const tag of semanticTags) {
        const count = $(tag).length;
        if (count > 0) counts[tag] = count;
        total += count;
      }
      const divCount = $('div').length;
      const ratio = divCount > 0 ? total / divCount : total > 0 ? 1 : 0;

      if (total === 0) {
        return { id: '2.2', status: 'fail', severity: 'high', title: '시맨틱 구조', description: '시맨틱 HTML 태그 없음 (div만 사용)', score: 0 };
      }

      const tagSummary = Object.entries(counts).map(([tag, count]) => `${tag} ${count}`).join(', ');
      const ratioPercent = (ratio * 100).toFixed(1);
      const score = ratio >= 0.2 ? 100 : ratio >= 0.1 ? 70 : ratio >= 0.05 ? 50 : 30;
      const ratingLabel = ratio >= 0.2 ? '우수' : ratio >= 0.1 ? '양호' : ratio >= 0.05 ? '미흡' : '부족';
      const ratingThreshold = '기준 10% 이상';

      return {
        id: '2.2', status: score >= 70 ? 'pass' : 'warning', severity: 'high', title: '시맨틱 구조',
        description: `시맨틱 태그 ${total}개(${tagSummary}) vs div ${divCount}개 — 비율 ${ratioPercent}%(${ratingLabel}, ${ratingThreshold})`,
        details: Object.entries(counts).map(([tag, count]) => `<${tag}>: ${count}`).join(', '),
        score,
      };
    },
  },
  {
    id: '2.3',
    title: 'FAQ 마크업 구조',
    category: 'content',
    severity: 'high',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '2.3', status: 'info', severity: 'high', title: 'FAQ 마크업', description: '확인 불가', score: 0 };
      const $ = parseHtml(page.html);

      const hasDl = $('dl').length > 0;
      const hasDetails = $('details').length > 0;
      const hasFaqSchema = page.html.includes('"FAQPage"');
      const hasFaqContent = page.html.toLowerCase().includes('faq') ||
        page.html.includes('자주 묻는') ||
        $('[class*="faq"], [id*="faq"]').length > 0;

      if (!hasFaqContent) {
        return { id: '2.3', status: 'na', severity: 'high', title: 'FAQ 마크업', description: 'FAQ 콘텐츠 없음', score: 100 };
      }

      if (hasFaqSchema && (hasDl || hasDetails)) {
        return { id: '2.3', status: 'pass', severity: 'high', title: 'FAQ 마크업', description: 'FAQ 콘텐츠가 구조화된 HTML + Schema로 마크업됨', score: 100 };
      }

      if (hasFaqSchema) {
        return { id: '2.3', status: 'pass', severity: 'high', title: 'FAQ 마크업', description: 'FAQ Schema 존재', score: 80 };
      }

      if (hasDl || hasDetails) {
        return { id: '2.3', status: 'warning', severity: 'high', title: 'FAQ 마크업', description: 'HTML 구조화됨, Schema 미적용', score: 50 };
      }

      return { id: '2.3', status: 'warning', severity: 'high', title: 'FAQ 마크업', description: 'FAQ 콘텐츠 있으나 구조화 마크업 없음', score: 20 };
    },
  },
  {
    id: '2.4',
    title: 'AI 가독 마크업',
    category: 'content',
    severity: 'high',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '2.4', status: 'info', severity: 'high', title: 'AI 가독 마크업', description: '확인 불가', score: 0 };
      const $ = parseHtml(page.html);

      const tables = $('table').length;
      const uls = $('ul').length;
      const ols = $('ol').length;
      const dls = $('dl').length;
      const total = tables + uls + ols + dls;

      if (total === 0) {
        return { id: '2.4', status: 'fail', severity: 'high', title: 'AI 가독 마크업', description: '구조화된 HTML 태그(table, ul, ol, dl) 없음', score: 0 };
      }

      const detailParts = [
        tables > 0 && `table ${tables}개`,
        uls > 0 && `ul ${uls}개`,
        ols > 0 && `ol ${ols}개`,
        dls > 0 && `dl ${dls}개`,
      ].filter(Boolean).join(', ');

      return {
        id: '2.4', status: 'pass', severity: 'high', title: 'AI 가독 마크업',
        description: `${detailParts} — 데이터가 구조화되어 AI가 정보를 정확히 추출할 수 있습니다`,
        details: detailParts,
        score: total >= 3 ? 100 : total >= 1 ? 70 : 40,
      };
    },
  },
  {
    id: '2.6',
    title: '내부 링크 앵커 텍스트',
    category: 'content',
    severity: 'medium',
    scope: 'page',
    checker: ({ page, siteInfo }) => {
      if (!page || !siteInfo) return { id: '2.6', status: 'info', severity: 'medium', title: '앵커 텍스트', description: '확인 불가', score: 0 };
      const $ = parseHtml(page.html);
      const origin = new URL(siteInfo.baseUrl).origin;

      const genericPatterns = /^(여기|클릭|더보기|더 보기|here|click|click here|read more|more|learn more|view|link|보기|바로가기)$/i;
      let total = 0;
      let generic = 0;
      let empty = 0;
      const genericSamples: string[] = [];
      const emptySamples: string[] = [];

      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';
        try {
          const abs = new URL(href, page.url).href;
          if (!abs.startsWith(origin)) return;
        } catch { return; }

        total++;
        const text = $(el).text().trim();
        if (!text) {
          empty++;
          if (emptySamples.length < 3) emptySamples.push(href.slice(0, 80));
          return;
        }
        if (genericPatterns.test(text)) {
          generic++;
          if (genericSamples.length < 5) genericSamples.push(`"${text}" → ${href.slice(0, 80)}`);
        }
      });

      if (total === 0) {
        return { id: '2.6', status: 'na', severity: 'medium', title: '앵커 텍스트', description: '내부 링크 없음', score: 100 };
      }

      const badRate = (generic + empty) / total;
      const score = badRate === 0 ? 100 : badRate < 0.1 ? 80 : badRate < 0.3 ? 50 : 20;

      const detailLines: string[] = [];
      if (genericSamples.length > 0) detailLines.push(`무의미 앵커 예시:\n${genericSamples.map((s) => `  - ${s}`).join('\n')}`);
      if (emptySamples.length > 0) detailLines.push(`빈 텍스트 링크 예시:\n${emptySamples.map((s) => `  - ${s}`).join('\n')}`);

      return {
        id: '2.6', status: badRate < 0.1 ? 'pass' : 'warning', severity: 'medium', title: '앵커 텍스트',
        description: `내부 링크 ${total}개 중 무의미 앵커 ${generic}개, 빈 텍스트 ${empty}개`,
        details: detailLines.length > 0 ? detailLines.join('\n') : undefined,
        score,
      };
    },
  },
  {
    id: '2.7',
    title: '멀티모달 텍스트 대체',
    category: 'content',
    severity: 'high',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '2.7', status: 'info', severity: 'high', title: '멀티모달 대체', description: '확인 불가', score: 0 };
      const $ = parseHtml(page.html);

      const imgs = $('img');
      let total = 0;
      let withAlt = 0;
      let meaningfulAlt = 0;
      const missingAltSamples: string[] = [];

      imgs.each((_, el) => {
        total++;
        const alt = $(el).attr('alt');
        if (alt !== undefined) withAlt++;
        if (alt && alt.trim().length > 2) {
          meaningfulAlt++;
        } else if (missingAltSamples.length < 5) {
          const src = $(el).attr('src') || '(no src)';
          const altVal = alt !== undefined ? `alt="${alt}"` : 'alt 없음';
          missingAltSamples.push(`${src.slice(0, 80)} — ${altVal}`);
        }
      });

      const videos = $('video');
      const videoWithTrack = videos.filter((_, el) => $(el).find('track').length > 0);

      if (total === 0 && videos.length === 0) {
        return { id: '2.7', status: 'na', severity: 'high', title: '멀티모달 대체', description: '이미지/비디오 없음', score: 100 };
      }

      const altRate = total > 0 ? meaningfulAlt / total : 1;
      const score = altRate >= 0.9 ? 100 : altRate >= 0.7 ? 70 : altRate >= 0.5 ? 50 : 20;

      let desc = `이미지 ${total}개 중 의미 있는 alt ${meaningfulAlt}개 (${(altRate * 100).toFixed(0)}%)`;
      if (videos.length > 0) {
        desc += `, 비디오 ${videos.length}개 중 transcript ${videoWithTrack.length}개`;
      }

      const details = missingAltSamples.length > 0
        ? `alt 누락/부실 이미지 예시:\n${missingAltSamples.map((s) => `  - ${s}`).join('\n')}`
        : undefined;

      return {
        id: '2.7', status: altRate >= 0.7 ? 'pass' : 'warning', severity: 'high',
        title: '멀티모달 텍스트 대체', description: desc, details, score,
      };
    },
  },
  {
    id: '2.8',
    title: '콘텐츠 깊이/밀도',
    category: 'content',
    severity: 'high',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '2.8', status: 'info', severity: 'high', title: '콘텐츠 깊이/밀도', description: '확인 불가', score: 0 };
      const $ = parseHtml(page.html);

      const bodyText = $('main, article, [role="main"], .content, #content').first().text().trim()
        || $('body').text().trim();
      const textLength = bodyText.length;
      const htmlLength = page.html.length;
      const textRatio = htmlLength > 0 ? textLength / htmlLength : 0;

      const wordCount = bodyText.split(/\s+/).filter((w) => w.length > 0).length;
      const paragraphs = $('p').length;

      if (textLength < 300) {
        return {
          id: '2.8', status: 'fail', severity: 'high', title: '콘텐츠 깊이/밀도',
          description: '콘텐츠가 매우 짧습니다. AI가 인용할 만한 정보 밀도가 부족합니다.',
          details: `텍스트: ${textLength}자, 단어: ${wordCount}개, 문단: ${paragraphs}개, 텍스트/HTML 비율: ${(textRatio * 100).toFixed(1)}%`,
          score: 10,
        };
      }

      if (textLength < 1000) {
        return {
          id: '2.8', status: 'warning', severity: 'high', title: '콘텐츠 깊이/밀도',
          description: '콘텐츠 길이가 다소 짧아 AI 인용 경쟁력이 낮을 수 있습니다.',
          details: `텍스트: ${textLength}자, 단어: ${wordCount}개, 문단: ${paragraphs}개, 텍스트/HTML 비율: ${(textRatio * 100).toFixed(1)}%`,
          score: 50,
        };
      }

      const score = textRatio >= 0.15 ? 100 : textRatio >= 0.08 ? 80 : 60;

      const ratioPercent = (textRatio * 100).toFixed(1);
      const ratioLabel = textRatio >= 0.15 ? '양호' : '다소 낮음';

      return {
        id: '2.8', status: score >= 80 ? 'pass' : 'warning', severity: 'high', title: '콘텐츠 깊이/밀도',
        description: `텍스트 ${textLength.toLocaleString()}자(권장 1,000자 이상), 문단 ${paragraphs}개, 텍스트/HTML 비율 ${ratioPercent}%(권장 15% 이상, ${ratioLabel}) — AI 인용에 충분한 정보량`,
        details: `텍스트: ${textLength.toLocaleString()}자, 단어: ${wordCount}개, 문단: ${paragraphs}개, 텍스트/HTML 비율: ${ratioPercent}%`,
        score,
      };
    },
  },
  {
    id: '2.9',
    title: '인용 가능 데이터',
    category: 'content',
    severity: 'medium',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '2.9', status: 'info', severity: 'medium', title: '인용 가능 데이터', description: '확인 불가', score: 0 };
      const $ = parseHtml(page.html);

      const tables = $('table').length;
      const figureWithCaption = $('figure:has(figcaption)').length;
      const bodyText = $('body').text();
      const numberPatterns = bodyText.match(/\d+(\.\d+)?(%|원|달러|건|명|개|회|배|점|위|kg|km|m²|㎡|억|만)/g);
      const statCount = numberPatterns ? numberPatterns.length : 0;
      const dataAttrs = $('[data-value], [data-count], [data-stat]').length;

      // Collect sample numbers for evidence
      const numberSamples = numberPatterns ? [...new Set(numberPatterns)].slice(0, 5) : [];
      const sampleText = numberSamples.length > 0 ? `발견된 수치 예시: ${numberSamples.join(', ')}` : '';

      const signals = tables + figureWithCaption + Math.min(statCount, 10) + dataAttrs;

      if (signals >= 5) {
        const detailLines = [`표: ${tables}개, figure+caption: ${figureWithCaption}개, 수치 데이터: ${statCount}건, data 속성: ${dataAttrs}개`];
        if (sampleText) detailLines.push(sampleText);
        return {
          id: '2.9', status: 'pass', severity: 'medium', title: '인용 가능 데이터',
          description: `AI가 인용할 수 있는 구체적 데이터가 풍부합니다`,
          details: detailLines.join('\n'),
          score: 100,
        };
      }

      if (signals >= 2) {
        const detailLines = [`표: ${tables}개, figure+caption: ${figureWithCaption}개, 수치 데이터: ${statCount}건`];
        if (sampleText) detailLines.push(sampleText);
        return {
          id: '2.9', status: 'warning', severity: 'medium', title: '인용 가능 데이터',
          description: '일부 구체적 데이터가 있으나 보강하면 AI 인용 가능성이 높아집니다',
          details: detailLines.join('\n'),
          score: 50,
        };
      }

      return {
        id: '2.9', status: 'fail', severity: 'medium', title: '인용 가능 데이터',
        description: '구체적 수치, 통계, 표 등 인용 가능한 데이터가 부족합니다',
        score: 10,
      };
    },
  },
  {
    id: '2.10',
    title: '정의/용어 마크업',
    category: 'content',
    severity: 'medium',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '2.10', status: 'info', severity: 'medium', title: '정의/용어 마크업', description: '확인 불가', score: 0 };
      const $ = parseHtml(page.html);

      const dfn = $('dfn').length;
      const abbr = $('abbr').length;
      const dt = $('dt').length;
      const total = dfn + abbr + dt;

      if (total === 0) {
        return {
          id: '2.10', status: 'warning', severity: 'medium', title: '정의/용어 마크업',
          description: 'dfn, abbr, dt 등 정의 마크업이 없습니다. "X란 무엇인가" 류의 AI 질문에 인용되기 어렵습니다.',
          score: 30,
        };
      }

      return {
        id: '2.10', status: 'pass', severity: 'medium', title: '정의/용어 마크업',
        description: `정의/용어 마크업 ${total}개 발견`,
        details: [dfn > 0 && `dfn: ${dfn}`, abbr > 0 && `abbr: ${abbr}`, dt > 0 && `dt: ${dt}`].filter(Boolean).join(', '),
        score: total >= 3 ? 100 : 60,
      };
    },
  },
  {
    id: '2.11',
    title: '이미지 캡션',
    category: 'content',
    severity: 'medium',
    scope: 'page',
    checker: ({ page }) => {
      if (!page) return { id: '2.11', status: 'info', severity: 'medium', title: '이미지 캡션', description: '확인 불가', score: 0 };
      const $ = parseHtml(page.html);

      const totalImages = $('img').length;
      if (totalImages === 0) {
        return { id: '2.11', status: 'na', severity: 'medium', title: '이미지 캡션', description: '이미지 없음', score: 100 };
      }

      const figureImages = $('figure img').length;
      const figcaptions = $('figure figcaption').length;
      const captionRate = totalImages > 0 ? figcaptions / totalImages : 0;

      if (captionRate >= 0.5) {
        return {
          id: '2.11', status: 'pass', severity: 'medium', title: '이미지 캡션',
          description: `이미지의 ${(captionRate * 100).toFixed(0)}%가 figure+figcaption으로 캡션 제공`,
          details: `전체 이미지: ${totalImages}개, figure 내 이미지: ${figureImages}개, figcaption: ${figcaptions}개`,
          score: 100,
        };
      }

      if (figcaptions > 0) {
        return {
          id: '2.11', status: 'warning', severity: 'medium', title: '이미지 캡션',
          description: `일부 이미지만 캡션 제공 (${figcaptions}/${totalImages}개)`,
          details: `전체 이미지: ${totalImages}개, figcaption: ${figcaptions}개`,
          score: 40,
        };
      }

      return {
        id: '2.11', status: 'fail', severity: 'medium', title: '이미지 캡션',
        description: 'figure+figcaption을 사용한 이미지 캡션이 없습니다. 멀티모달 AI의 맥락 이해에 도움이 됩니다.',
        details: `전체 이미지: ${totalImages}개`,
        score: 0,
      };
    },
  },
];
