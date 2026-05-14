import { parseHtml } from '../crawler/page-fetcher';
import { askClaudeJson } from './client';
import {
  KEYWORD_ALIGNMENT_SYSTEM, keywordAlignmentUser,
  META_QUALITY_SYSTEM, metaQualityUser,
  URL_STRUCTURE_SYSTEM, urlStructureUser,
  AI_CITATION_SYSTEM, aiCitationUser,
} from './prompts';
import type { CheckResult, ParsedPage, SiteInfo } from '@/types/check';

export async function runLlmChecks(
  pages: ParsedPage[],
  siteInfo: SiteInfo,
  onProgress?: (done: number, total: number) => void
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const totalTasks = 4;
  let done = 0;

  // 2.5 Keyword-Title-H1 alignment (batch pages in groups of 5)
  for (let i = 0; i < pages.length; i += 5) {
    const batch = pages.slice(i, i + 5);
    for (const page of batch) {
      try {
        const $ = parseHtml(page.html);
        const title = $('title').text().trim();
        const h1 = $('h1').first().text().trim();
        const metaDesc = $('meta[name="description"]').attr('content')?.trim() || '';

        if (!title && !h1) {
          results.push({ id: '2.5', status: 'fail', severity: 'high', title: '키워드-타이틀-H1 정합성', description: 'title과 H1 모두 없음', score: 0, llmUsed: false });
          continue;
        }

        const resp = await askClaudeJson<{ score: number; reason: string }>(
          KEYWORD_ALIGNMENT_SYSTEM,
          keywordAlignmentUser(title, h1, metaDesc)
        );

        results.push({
          id: '2.5', status: resp.score >= 70 ? 'pass' : resp.score >= 40 ? 'warning' : 'fail',
          severity: 'high', title: '키워드-타이틀-H1 정합성',
          description: resp.reason, details: `URL: ${page.url}`, score: resp.score, llmUsed: true,
        });
      } catch {
        results.push({ id: '2.5', status: 'info', severity: 'high', title: '키워드-타이틀-H1 정합성', description: 'LLM 판정 실패', score: 50, llmUsed: true });
      }
    }
  }
  done++;
  onProgress?.(done, totalTasks);

  // 3.13 Meta quality batch
  const metaPages = pages.slice(0, 20).map((page) => {
    const $ = parseHtml(page.html);
    return {
      url: page.url,
      title: $('title').text().trim(),
      metaDesc: $('meta[name="description"]').attr('content')?.trim() || '',
      firstParagraph: $('p').first().text().trim().slice(0, 200),
    };
  });

  try {
    const resp = await askClaudeJson<{ results: { url: string; score: number; issue: string }[] }>(
      META_QUALITY_SYSTEM,
      metaQualityUser(metaPages)
    );

    const avgScore = resp.results.reduce((sum, r) => sum + r.score, 0) / resp.results.length;
    const issues = resp.results.filter((r) => r.score < 60);

    results.push({
      id: '3.13', status: avgScore >= 70 ? 'pass' : avgScore >= 40 ? 'warning' : 'fail',
      severity: 'medium', title: '메타 정보 품질 일괄 점검',
      description: `평균 메타 품질 ${avgScore.toFixed(0)}점, 문제 페이지 ${issues.length}건`,
      details: issues.slice(0, 5).map((i) => `${i.url}: ${i.issue}`).join('\n'),
      score: Math.round(avgScore), llmUsed: true,
    });
  } catch {
    results.push({ id: '3.13', status: 'info', severity: 'medium', title: '메타 정보 품질', description: 'LLM 판정 실패', score: 50, llmUsed: true });
  }
  done++;
  onProgress?.(done, totalTasks);

  // 4.5 URL structure
  try {
    const urls = pages.map((p) => p.url);
    const resp = await askClaudeJson<{ score: number; issues: string[]; good: string[] }>(
      URL_STRUCTURE_SYSTEM,
      urlStructureUser(urls.slice(0, 30))
    );

    results.push({
      id: '4.5', status: resp.score >= 70 ? 'pass' : resp.score >= 40 ? 'warning' : 'fail',
      severity: 'high', title: 'URL 구조 명확성',
      description: `URL 의미성 ${resp.score}점`,
      details: [...resp.issues.map((i) => `⚠ ${i}`), ...resp.good.map((g) => `✓ ${g}`)].join('\n'),
      score: resp.score, llmUsed: true,
    });
  } catch {
    results.push({ id: '4.5', status: 'info', severity: 'high', title: 'URL 구조 명확성', description: 'LLM 판정 실패', score: 50, llmUsed: true });
  }
  done++;
  onProgress?.(done, totalTasks);

  // 4.9 AI citation test
  try {
    const $ = parseHtml(pages[0].html);
    const brandName = $('meta[property="og:site_name"]').attr('content') ||
      $('title').text().split(/[-|–]/).pop()?.trim() ||
      new URL(siteInfo.baseUrl).hostname;
    const topics = pages.slice(0, 10).map((p) => {
      const $p = parseHtml(p.html);
      return $p('title').text().trim();
    }).filter(Boolean);

    const resp = await askClaudeJson<{ score: number; question: string; likelihood: string }>(
      AI_CITATION_SYSTEM,
      aiCitationUser(brandName, siteInfo.baseUrl, topics)
    );

    results.push({
      id: '4.9', status: resp.score >= 70 ? 'pass' : resp.score >= 40 ? 'warning' : 'fail',
      severity: 'medium', title: 'AI 인용 가능성 진단',
      description: resp.likelihood,
      details: `테스트 질문: "${resp.question}"`,
      score: resp.score, llmUsed: true,
    });
  } catch {
    results.push({ id: '4.9', status: 'info', severity: 'medium', title: 'AI 인용 가능성', description: 'LLM 판정 실패', score: 50, llmUsed: true });
  }
  done++;
  onProgress?.(done, totalTasks);

  return results;
}
