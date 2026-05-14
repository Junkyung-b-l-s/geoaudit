import type { CheckResult, CheckContext, CheckerFn } from '@/types/check';

export type { CheckResult, CheckContext, CheckerFn };

export interface CheckerDefinition {
  id: string;
  title: string;
  category: string;
  severity: 'critical' | 'high' | 'medium';
  scope: 'site' | 'page' | 'aggregate';
  checker: CheckerFn;
}
