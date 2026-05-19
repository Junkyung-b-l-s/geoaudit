export type CheckStatus = 'pass' | 'fail' | 'warning' | 'info' | 'na';
export type Severity = 'critical' | 'high' | 'medium';

export type CheckLayer = 'seo' | 'geo' | 'both';

export interface CheckResult {
  id: string;
  status: CheckStatus;
  severity: Severity;
  title: string;
  description: string;
  details?: string;
  score: number | null; // 0-100 또는 측정 불가/해당 없음(na/info) 시 null
  llmUsed?: boolean;
  layer?: CheckLayer;
  pageUrl?: string;
}

export interface ParsedPage {
  url: string;
  html: string;
  statusCode: number;
  headers: Record<string, string>;
  responseTime: number;
}

export interface SiteInfo {
  baseUrl: string;
  robotsTxt: string | null;
  sitemapXml: string | null;
  llmsTxt: string | null;
  llmsFullTxt: string | null;
  homepageHeaders: Record<string, string>;
}

export interface CheckContext {
  page?: ParsedPage;
  allPages?: ParsedPage[];
  siteInfo?: SiteInfo;
  lighthouseData?: LighthouseData;
}

export interface CruxMetric {
  p75: number;
  category: 'FAST' | 'AVERAGE' | 'SLOW' | 'NONE';
}

export interface CruxData {
  lcp?: CruxMetric;
  inp?: CruxMetric;
  cls?: CruxMetric;
  fcp?: CruxMetric;
  ttfb?: CruxMetric;
  overallCategory?: string;
}

export interface PsiDiagnostic {
  id: string;
  title: string;
  description: string;
  score: number | null;
  savings?: string;
}

export interface LighthouseData {
  lcp: number;
  inp: number | null;
  inpNote?: string;
  cls: number;
  ttfb: number;
  tti: number;
  fcp: number;
  tbt: number;
  si: number;
  clsElements: string[];
  usesWebp: boolean;
  usesResponsiveImages: boolean;
  performanceScore: number;
  accessibilityScore: number;
  seoScore: number;
  bestPracticesScore: number;
  crux?: CruxData;
  diagnostics: PsiDiagnostic[];
}

export type CheckerFn = (context: CheckContext) => Promise<CheckResult> | CheckResult;
