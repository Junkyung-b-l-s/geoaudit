import type { Severity, CheckLayer } from '@/types/check';

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 3,
  high: 2,
  medium: 1,
};

export const CATEGORY_NAMES: Record<string, string> = {
  performance: '1. 성능 점검',
  content: '2. 콘텐츠 구조 점검',
  metadata: '3. 메타데이터 점검',
  crawling: '4. 크롤링/색인 점검',
  structure: '5. 사이트 구조/보안',
  authority: '6. E-E-A-T/신뢰도',
};

export const CHECK_LAYER: Record<string, CheckLayer> = {
  // Pure SEO
  '1.3': 'seo', '2.6': 'seo', '3.1': 'seo', '3.2': 'seo', '3.3': 'seo',
  '3.4': 'seo', '3.5': 'seo', '3.12': 'seo', '4.4': 'seo', '5.1': 'seo',
  '5.3': 'seo', '5.5': 'seo',
  // Pure GEO
  '2.3': 'geo', '2.4': 'geo', '2.7': 'geo', '2.8': 'geo', '2.9': 'geo',
  '2.10': 'geo', '2.11': 'geo', '3.6': 'geo', '3.10': 'geo', '3.14': 'geo',
  '4.2': 'geo', '4.6': 'geo', '4.7': 'geo', '4.9': 'geo', '4.10': 'geo',
  '4.11': 'geo', '4.14': 'geo', '6.1': 'geo', '6.2': 'geo', '6.3': 'geo',
  '6.5': 'geo',
  // Both
  '1.1': 'both', '1.2': 'both', '1.4': 'both', '2.1': 'both', '2.2': 'both',
  '2.5': 'both', '3.7': 'both', '3.8': 'both', '3.9': 'both', '3.11': 'both',
  '3.13': 'both', '4.1': 'both', '4.3': 'both', '4.5': 'both', '4.8': 'both',
  '4.12': 'both', '4.13': 'both', '5.2': 'both', '5.4': 'both', '5.6': 'both',
  '6.4': 'both',
};
