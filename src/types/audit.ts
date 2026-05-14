import type { CheckResult, LighthouseData, ParsedPage, SiteInfo } from './check';

export type AuditStage =
  | 'init'
  | 'site-fetch'
  | 'crawling'
  | 'lighthouse'
  | 'page-checks'
  | 'llm-judgment'
  | 'scoring'
  | 'done'
  | 'error';

export interface AuditProgress {
  stage: AuditStage;
  progress: number; // 0-100
  message: string;
}

export interface AuditConfig {
  url: string;
  maxPages: number;
  maxDepth: number;
}

export interface AuditState {
  id: string;
  config: AuditConfig;
  stage: AuditStage;
  progress: number;
  message: string;
  createdAt: number;
  siteInfo?: SiteInfo;
  pages?: ParsedPage[];
  lighthouseData?: LighthouseData;
  results?: CheckResult[];
  report?: AuditReport;
  error?: string;
}

export interface CategoryInsight {
  summary: string;
  suggestions: string[];
}

export interface CategoryScore {
  id: string;
  name: string;
  score: number;
  items: CheckResult[];
  insight?: CategoryInsight;
}

export interface PageScore {
  url: string;
  score: number;
  items: CheckResult[];
}

export interface GeoStrategy {
  id: string;
  name: string;
  rationale: string;
  method: string;
  priority: 'critical' | 'high' | 'medium';
  relatedChecks: string[];
}

export interface AuditReport {
  auditId: string;
  url: string;
  createdAt: string;
  overallScore: number;
  categories: CategoryScore[];
  strategies: GeoStrategy[];
  pageScores: PageScore[];
  lighthouseData?: import('@/types/check').LighthouseData;
  totalPages: number;
  totalChecks: number;
}
