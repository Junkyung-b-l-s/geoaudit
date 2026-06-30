import { parseHtml } from '../crawler/page-fetcher';
import { askClaudeJson } from './client';
import {
  KEYWORD_ALIGNMENT_SYSTEM, keywordAlignmentBatchUser,
  META_QUALITY_SYSTEM, metaQualityUser,
  URL_STRUCTURE_SYSTEM, urlStructureUser,
  AI_CITATION_SYSTEM, aiCitationUser,
  type SiteContext,
} from './prompts';
import type { CheckResult, ParsedPage, SiteInfo } from '@/types/check';

// LLM checks evaluate a subset of pages to keep token cost flat regardless of
// crawl size. Sizes are small (only metadata is sent per page), so the absolute
// cost stays low even as maxPages grows.
const LLM_SAMPLE = { keyword: 50, meta: 50, url: 50, citation: 12 };

// Spread the sample evenly across ALL crawled pages instead of taking the first
// N. The first crawled pages skew toward the homepage and top nav, so a stride
// sample better represents the whole site (including the long tail).
function samplePages<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  const step = items.length / n;
  return Array.from({ length: n }, (_, i) => items[Math.floor(i * step)]);
}

function runKeywordAlignment(pages: ParsedPage[]): Promise<CheckResult[]> {
  const batchPages = samplePages(pages, LLM_SAMPLE.keyword).map((page) => {
    const $ = parseHtml(page.html);
    return {
      url: page.url,
      title: $('title').text().trim(),
      h1: $('h1').first().text().trim(),
      metaDesc: $('meta[name="description"]').attr('content')?.trim() || '',
    };
  }).filter((p) => p.title || p.h1);

  if (batchPages.length === 0) {
    return Promise.resolve([{
      id: '2.5', status: 'fail', severity: 'high', title: '키워드-타이틀-H1 정합성',
      description: '분석 가능한 페이지 없음', score: 0, llmUsed: false,
    }]);
  }

  return askClaudeJson<{ results: { url: string; score: number; reason: string }[] }>(
    KEYWORD_ALIGNMENT_SYSTEM,
    keywordAlignmentBatchUser(batchPages)
  ).then((resp) => {
    return resp.results.map((r) => ({
      id: '2.5' as const,
      status: (r.score >= 70 ? 'pass' : r.score >= 40 ? 'warning' : 'fail') as CheckResult['status'],
      severity: 'high' as const,
      title: '키워드-타이틀-H1 정합성',
      description: r.reason,
      details: `URL: ${r.url}`,
      score: r.score,
      llmUsed: true,
    }));
  }).catch(() => [{
    id: '2.5', status: 'info' as const, severity: 'high' as const, title: '키워드-타이틀-H1 정합성',
    description: 'LLM 판정 실패', score: null, llmUsed: true,
  }]);
}

function runMetaQuality(pages: ParsedPage[]): Promise<CheckResult[]> {
  const metaPages = samplePages(pages, LLM_SAMPLE.meta).map((page) => {
    const $ = parseHtml(page.html);
    return {
      url: page.url,
      title: $('title').text().trim(),
      metaDesc: $('meta[name="description"]').attr('content')?.trim() || '',
      firstParagraph: $('p').first().text().trim().slice(0, 200),
    };
  });

  return askClaudeJson<{ results: { url: string; score: number; issue: string }[] }>(
    META_QUALITY_SYSTEM,
    metaQualityUser(metaPages)
  ).then((resp) => {
    const avgScore = resp.results.reduce((sum, r) => sum + r.score, 0) / resp.results.length;
    const issues = resp.results.filter((r) => r.score < 60);
    return [{
      id: '3.13', status: (avgScore >= 70 ? 'pass' : avgScore >= 40 ? 'warning' : 'fail') as CheckResult['status'],
      severity: 'medium' as const, title: '메타 정보 품질 일괄 점검',
      description: `평균 메타 품질 ${avgScore.toFixed(0)}점, 문제 페이지 ${issues.length}건`,
      details: issues.slice(0, 5).map((i) => `${i.url}: ${i.issue}`).join('\n'),
      score: Math.round(avgScore), llmUsed: true,
    }];
  }).catch(() => [{
    id: '3.13', status: 'info' as const, severity: 'medium' as const, title: '메타 정보 품질',
    description: 'LLM 판정 실패', score: null, llmUsed: true,
  }]);
}

function runUrlStructure(pages: ParsedPage[]): Promise<CheckResult[]> {
  const urls = samplePages(pages, LLM_SAMPLE.url).map((p) => p.url);
  return askClaudeJson<{ score: number; issues: string[]; good: string[] }>(
    URL_STRUCTURE_SYSTEM,
    urlStructureUser(urls)
  ).then((resp) => [{
    id: '4.5', status: (resp.score >= 70 ? 'pass' : resp.score >= 40 ? 'warning' : 'fail') as CheckResult['status'],
    severity: 'high' as const, title: 'URL 구조 명확성',
    description: `URL 의미성 ${resp.score}점`,
    details: [...resp.issues.map((i) => `⚠ ${i}`), ...resp.good.map((g) => `✓ ${g}`)].join('\n'),
    score: resp.score, llmUsed: true,
  }]).catch(() => [{
    id: '4.5', status: 'info' as const, severity: 'high' as const, title: 'URL 구조 명확성',
    description: 'LLM 판정 실패', score: null, llmUsed: true,
  }]);
}

function runAiCitation(pages: ParsedPage[], siteInfo: SiteInfo, siteContext?: SiteContext): Promise<CheckResult[]> {
  const $ = parseHtml(pages[0].html);
  const brandName = $('meta[property="og:site_name"]').attr('content') ||
    $('title').text().split(/[-|–]/).pop()?.trim() ||
    new URL(siteInfo.baseUrl).hostname;
  const topics = samplePages(pages, LLM_SAMPLE.citation).map((p) => {
    const $p = parseHtml(p.html);
    return $p('title').text().trim();
  }).filter(Boolean);

  return askClaudeJson<{ score: number; question: string; likelihood: string }>(
    AI_CITATION_SYSTEM,
    aiCitationUser(brandName, siteInfo.baseUrl, topics, siteContext)
  ).then((resp) => [{
    id: '4.9', status: (resp.score >= 70 ? 'pass' : resp.score >= 40 ? 'warning' : 'fail') as CheckResult['status'],
    severity: 'medium' as const, title: 'AI 인용 가능성 진단',
    description: resp.likelihood,
    details: `테스트 질문: "${resp.question}"`,
    score: resp.score, llmUsed: true,
  }]).catch(() => [{
    id: '4.9', status: 'info' as const, severity: 'medium' as const, title: 'AI 인용 가능성',
    description: 'LLM 판정 실패', score: null, llmUsed: true,
  }]);
}

export async function runLlmChecks(
  pages: ParsedPage[],
  siteInfo: SiteInfo,
  onProgress?: (done: number, total: number) => void,
  siteContext?: SiteContext,
): Promise<CheckResult[]> {
  let done = 0;
  onProgress?.(0, 4);
  const tick = <T>(r: T): T => { onProgress?.(++done, 4); return r; };

  const [kwResults, metaResults, urlResults, citationResults] = await Promise.all([
    runKeywordAlignment(pages).then(tick),
    runMetaQuality(pages).then(tick),
    runUrlStructure(pages).then(tick),
    runAiCitation(pages, siteInfo, siteContext).then(tick),
  ]);

  return [...kwResults, ...metaResults, ...urlResults, ...citationResults];
}
