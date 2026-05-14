import type { LighthouseData, CruxData, CruxMetric, PsiDiagnostic } from '@/types/check';

const PSI_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

export async function runLighthouse(url: string): Promise<LighthouseData> {
  const apiUrl = `${PSI_API}?url=${encodeURIComponent(url)}&strategy=desktop&category=performance&category=accessibility&category=best-practices&category=seo`;

  const res = await fetch(apiUrl, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PSI API ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();

  const crux = parseCrux(data.loadingExperience);
  const lhr = data.lighthouseResult;
  const audits = lhr?.audits ?? {};
  const categories = lhr?.categories ?? {};

  const lcp = audits['largest-contentful-paint']?.numericValue ?? 0;
  const cls = audits['cumulative-layout-shift']?.numericValue ?? 0;
  const inp = audits['interaction-to-next-paint']?.numericValue ?? 0;
  const ttfb = audits['server-response-time']?.numericValue ?? 0;
  const tti = audits['interactive']?.numericValue ?? 0;
  const fcp = audits['first-contentful-paint']?.numericValue ?? 0;
  const tbt = audits['total-blocking-time']?.numericValue ?? 0;
  const si = audits['speed-index']?.numericValue ?? 0;

  const clsElements: string[] = [];
  const shiftItems = audits['layout-shift-elements']?.details;
  if (shiftItems?.items) {
    for (const item of shiftItems.items) {
      if (item.node?.snippet) clsElements.push(item.node.snippet);
    }
  }

  const usesWebp = (audits['modern-image-formats']?.score ?? 1) >= 0.9;
  const usesResponsiveImages = (audits['uses-responsive-images']?.score ?? 1) >= 0.9;

  const performanceScore = Math.round((categories.performance?.score ?? 0) * 100);
  const accessibilityScore = Math.round((categories.accessibility?.score ?? 0) * 100);
  const seoScore = Math.round((categories.seo?.score ?? 0) * 100);
  const bestPracticesScore = Math.round((categories['best-practices']?.score ?? 0) * 100);

  const diagnostics = parseDiagnostics(audits);

  return {
    lcp, inp, cls, ttfb, tti, fcp, tbt, si,
    clsElements, usesWebp, usesResponsiveImages,
    performanceScore, accessibilityScore, seoScore, bestPracticesScore,
    crux, diagnostics,
  };
}

function parseCrux(loading: Record<string, unknown> | undefined): CruxData | undefined {
  if (!loading) return undefined;
  const metrics = loading.metrics as Record<string, unknown> | undefined;
  if (!metrics) return undefined;

  const parse = (key: string): CruxMetric | undefined => {
    const m = metrics[key] as { percentile?: number; category?: string } | undefined;
    if (!m) return undefined;
    return {
      p75: m.percentile ?? 0,
      category: (m.category as CruxMetric['category']) ?? 'NONE',
    };
  };

  return {
    lcp: parse('LARGEST_CONTENTFUL_PAINT_MS'),
    inp: parse('INTERACTION_TO_NEXT_PAINT'),
    cls: parse('CUMULATIVE_LAYOUT_SHIFT_SCORE'),
    fcp: parse('FIRST_CONTENTFUL_PAINT_MS'),
    ttfb: parse('EXPERIMENTAL_TIME_TO_FIRST_BYTE'),
    overallCategory: (loading as { overall_category?: string }).overall_category,
  };
}

function parseDiagnostics(audits: Record<string, unknown>): PsiDiagnostic[] {
  const diagnosticIds = [
    'unused-javascript',
    'unused-css-rules',
    'modern-image-formats',
    'uses-responsive-images',
    'render-blocking-resources',
    'efficient-animated-content',
    'uses-long-cache-ttl',
    'total-byte-weight',
    'dom-size',
    'font-display',
    'unminified-css',
    'unminified-javascript',
    'legacy-javascript',
    'uses-text-compression',
    'uses-rel-preconnect',
    'server-response-time',
    'redirects',
    'mainthread-work-breakdown',
    'bootup-time',
    'third-party-summary',
  ];

  const results: PsiDiagnostic[] = [];

  for (const id of diagnosticIds) {
    const audit = audits[id] as {
      title?: string;
      description?: string;
      score?: number | null;
      details?: { overallSavingsMs?: number; overallSavingsBytes?: number };
    } | undefined;
    if (!audit) continue;
    if (audit.score === 1 || audit.score === null) continue;

    let savings: string | undefined;
    const d = audit.details;
    if (d?.overallSavingsMs) savings = `${Math.round(d.overallSavingsMs)}ms 절감 가능`;
    else if (d?.overallSavingsBytes) savings = `${Math.round(d.overallSavingsBytes / 1024)}KB 절감 가능`;

    results.push({
      id,
      title: audit.title ?? id,
      description: (audit.description ?? '').replace(/\[.*?\]\(.*?\)/g, '').trim(),
      score: audit.score ?? null,
      savings,
    });
  }

  return results.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
}
