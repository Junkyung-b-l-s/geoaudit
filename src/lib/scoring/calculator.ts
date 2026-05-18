import type { CheckResult, LighthouseData } from '@/types/check';
import type { AuditReport, CategoryScore, PageScore } from '@/types/audit';
import { SEVERITY_WEIGHT, CATEGORY_NAMES, CHECK_LAYER } from './weights';
import { generateCategoryInsight } from './insights';
import { generateStrategies } from './strategies';

export function calculateReport(
  auditId: string,
  url: string,
  results: CheckResult[],
  pageUrls: string[],
  lighthouseData?: LighthouseData,
): AuditReport {
  const categories = buildCategoryScores(results);
  const pageScores = buildPageScores(results, pageUrls);
  const overallScore = calculateOverallScore(categories);
  const allDeduped = categories.flatMap((c) => c.items);
  const strategies = generateStrategies(allDeduped);

  return {
    auditId,
    url,
    createdAt: new Date().toISOString(),
    overallScore,
    categories,
    strategies,
    pageScores,
    lighthouseData,
    totalPages: pageUrls.length,
    totalChecks: results.length,
  };
}

function buildCategoryScores(results: CheckResult[]): CategoryScore[] {
  const grouped = new Map<string, CheckResult[]>();

  for (const r of results) {
    const cat = getCategoryFromId(r.id);
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(r);
  }

  return Array.from(grouped.entries()).map(([cat, items]) => {
    const dedupItems = deduplicateById(items);
    for (const item of dedupItems) {
      item.layer = CHECK_LAYER[item.id] || 'both';
    }
    const score = weightedAverage(dedupItems);
    return {
      id: cat,
      name: CATEGORY_NAMES[cat] || cat,
      score,
      items: dedupItems,
      insight: generateCategoryInsight(cat, dedupItems, score),
    };
  });
}

function buildPageScores(results: CheckResult[], pageUrls: string[]): PageScore[] {
  return pageUrls.map((url) => {
    const pageResults = results.filter((r) => r.pageUrl === url);
    return {
      url,
      score: pageResults.length > 0 ? weightedAverage(pageResults) : 0,
      items: pageResults,
    };
  });
}

function calculateOverallScore(categories: CategoryScore[]): number {
  if (categories.length === 0) return 0;
  return Math.round(categories.reduce((sum, c) => sum + c.score, 0) / categories.length);
}

function weightedAverage(results: CheckResult[]): number {
  const active = results.filter((r) => r.status !== 'na' && r.status !== 'info');
  if (active.length === 0) return 100;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const r of active) {
    const w = SEVERITY_WEIGHT[r.severity];
    weightedSum += r.score * w;
    totalWeight += w;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

function getCategoryFromId(id: string): string {
  const num = parseFloat(id);
  if (num < 2) return 'performance';
  if (num < 3) return 'content';
  if (num < 4) return 'metadata';
  if (num < 5) return 'crawling';
  if (num < 6) return 'structure';
  return 'authority';
}

function deduplicateById(results: CheckResult[]): CheckResult[] {
  const grouped = new Map<string, CheckResult[]>();
  for (const r of results) {
    if (!grouped.has(r.id)) grouped.set(r.id, []);
    grouped.get(r.id)!.push(r);
  }

  return Array.from(grouped.entries()).map(([, items]) => {
    if (items.length === 1) return items[0];
    const avgScore = Math.round(items.reduce((s, r) => s + r.score, 0) / items.length);
    const worst = items.reduce((w, r) => (r.score < w.score ? r : w));
    return { ...worst, score: avgScore };
  });
}
