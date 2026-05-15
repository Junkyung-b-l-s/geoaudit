import { parseHtml } from '../crawler/page-fetcher';
import type { CheckerDefinition } from './types';

export const performanceCheckers: CheckerDefinition[] = [
  {
    id: '1.1',
    title: 'Core Web Vitals',
    category: 'performance',
    severity: 'high',
    scope: 'site',
    checker: ({ lighthouseData }) => {
      if (!lighthouseData) {
        return { id: '1.1', status: 'info', severity: 'high', title: 'Core Web Vitals', description: 'Lighthouse 데이터 없음', score: 0 };
      }

      const { lcp, cls, inp } = lighthouseData;
      const issues: string[] = [];
      let score = 100;

      if (lcp > 4000) { issues.push(`LCP ${(lcp / 1000).toFixed(1)}초로 Google 권장(4초) 대폭 초과 — AI 크롤러 타임아웃 및 이탈률 급증 위험`); score -= 50; }
      else if (lcp > 2500) { issues.push(`LCP ${(lcp / 1000).toFixed(1)}초로 Google 권장(2.5초) 초과 — AI 크롤러 타임아웃 위험`); score -= 30; }

      if (cls > 0.25) { issues.push(`CLS ${cls.toFixed(3)}로 Google 권장(0.25) 초과 — 레이아웃 불안정으로 UX 저하`); score -= 40; }
      else if (cls > 0.1) { issues.push(`CLS ${cls.toFixed(3)}로 Google 권장(0.1) 초과 — 레이아웃 시프트 개선 필요`); score -= 20; }

      if (inp > 500) { issues.push(`INP ${inp}ms로 Google 권장(500ms) 초과 — 인터랙션 심각하게 느림`); score -= 40; }
      else if (inp > 200) { issues.push(`INP ${inp}ms로 Google 권장(200ms) 초과 — 인터랙션 응답 개선 필요`); score -= 20; }

      return {
        id: '1.1',
        status: issues.length === 0 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        severity: 'high',
        title: 'Core Web Vitals',
        description: issues.length === 0 ? `LCP ${(lcp / 1000).toFixed(1)}초(기준 2.5초), CLS ${cls.toFixed(3)}(기준 0.1), INP ${inp}ms(기준 200ms) 모두 양호` : issues.join(', '),
        details: `LCP: ${(lcp / 1000).toFixed(1)}초 (기준: 2.5초), CLS: ${cls.toFixed(3)} (기준: 0.1), INP: ${inp}ms (기준: 200ms)`,
        score: Math.max(0, score),
      };
    },
  },
  {
    id: '1.2',
    title: '페이지 로딩 속도',
    category: 'performance',
    severity: 'high',
    scope: 'site',
    checker: ({ lighthouseData }) => {
      if (!lighthouseData) {
        return { id: '1.2', status: 'info', severity: 'high', title: '로딩 속도', description: 'Lighthouse 데이터 없음', score: 0 };
      }

      const { ttfb, tti } = lighthouseData;
      const issues: string[] = [];
      let score = 100;

      if (ttfb > 1800) { issues.push(`TTFB ${ttfb}ms로 권장(1800ms)보다 ${Math.round((ttfb - 1800) / 1800 * 100)}% 느림 — 서버 응답 심각하게 지연`); score -= 50; }
      else if (ttfb > 800) { issues.push(`TTFB ${ttfb}ms로 권장(800ms)보다 ${Math.round((ttfb - 800) / 800 * 100)}% 느림 — 서버 응답 최적화 필요`); score -= 25; }

      if (tti > 7300) { issues.push(`TTI ${(tti / 1000).toFixed(1)}초로 권장(7.3초)보다 ${Math.round((tti - 7300) / 7300 * 100)}% 느림 — 페이지 인터랙션 심각하게 지연`); score -= 50; }
      else if (tti > 3800) { issues.push(`TTI ${(tti / 1000).toFixed(1)}초로 권장(3.8초)보다 ${Math.round((tti - 3800) / 3800 * 100)}% 느림 — 인터랙션 가능 시점 개선 필요`); score -= 25; }

      return {
        id: '1.2',
        status: issues.length === 0 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        severity: 'high',
        title: '페이지 로딩 속도',
        description: issues.length === 0 ? `TTFB ${ttfb}ms(기준 800ms), TTI ${(tti / 1000).toFixed(1)}초(기준 3.8초) — 빠른 응답` : issues.join(', '),
        details: `TTFB: ${ttfb}ms (기준: 800ms), TTI: ${(tti / 1000).toFixed(1)}초 (기준: 3.8초)`,
        score: Math.max(0, score),
      };
    },
  },
  {
    id: '1.3',
    title: 'CLS 유발 요소',
    category: 'performance',
    severity: 'medium',
    scope: 'site',
    checker: ({ lighthouseData }) => {
      if (!lighthouseData) {
        return { id: '1.3', status: 'info', severity: 'medium', title: 'CLS 유발 요소', description: 'Lighthouse 데이터 없음', score: 0 };
      }

      const { clsElements } = lighthouseData;
      if (clsElements.length === 0) {
        return { id: '1.3', status: 'pass', severity: 'medium', title: 'CLS 유발 요소', description: '레이아웃 시프트 유발 요소 없음', score: 100 };
      }

      const elementSummary = clsElements.slice(0, 3).join(', ');
      const moreText = clsElements.length > 3 ? ` 외 ${clsElements.length - 3}건` : '';

      return {
        id: '1.3',
        status: 'warning',
        severity: 'medium',
        title: 'CLS 유발 요소',
        description: `레이아웃 시프트 유발 요소 ${clsElements.length}건 발견: ${elementSummary}${moreText}`,
        details: clsElements.map((el, i) => `${i + 1}. ${el}`).join('\n'),
        score: Math.max(0, 100 - clsElements.length * 20),
      };
    },
  },
  {
    id: '1.4',
    title: '이미지 최적화',
    category: 'performance',
    severity: 'medium',
    scope: 'site',
    checker: ({ lighthouseData, page }) => {
      if (!page) return { id: '1.4', status: 'info', severity: 'medium', title: '이미지 최적화', description: '확인 불가', score: 0 };

      const issues: string[] = [];
      let score = 100;

      if (lighthouseData) {
        if (!lighthouseData.usesWebp) { issues.push('차세대 이미지 포맷(WebP/AVIF) 미사용'); score -= 20; }
        if (!lighthouseData.usesResponsiveImages) { issues.push('반응형 이미지 미적용'); score -= 20; }
      }

      const $ = parseHtml(page.html);
      let lazyCount = 0;
      let totalImgs = 0;
      const nonLazySrcs: string[] = [];
      $('img').each((_: number, el: unknown) => {
        totalImgs++;
        if ($(el as never).attr('loading') === 'lazy') {
          lazyCount++;
        } else {
          const src = $(el as never).attr('src') || $(el as never).attr('data-src') || '(src 없음)';
          nonLazySrcs.push(src);
        }
      });

      if (totalImgs > 3) {
        const lazyRate = lazyCount / totalImgs;
        if (lazyRate === 0) {
          issues.push(`lazy loading 적용률 ${lazyCount}/${totalImgs}개(0%) — 미적용 이미지 ${totalImgs - lazyCount}개`);
          score -= 40;
        } else if (lazyRate < 0.3) {
          issues.push(`lazy loading 적용률 ${lazyCount}/${totalImgs}개(${Math.round(lazyRate * 100)}%) — 미적용 이미지 ${totalImgs - lazyCount}개`);
          score -= 30;
        } else if (lazyRate < 0.5) {
          issues.push(`lazy loading 적용률 ${lazyCount}/${totalImgs}개(${Math.round(lazyRate * 100)}%) — 미적용 이미지 ${totalImgs - lazyCount}개`);
          score -= 20;
        }
      }

      const detailParts: string[] = [];
      detailParts.push(`총 이미지: ${totalImgs}개, lazy loading 적용: ${lazyCount}/${totalImgs}개`);
      if (nonLazySrcs.length > 0) {
        const samples = nonLazySrcs.slice(0, 5);
        detailParts.push(`lazy loading 미적용 이미지 예시:\n${samples.map(s => `  - ${s}`).join('\n')}${nonLazySrcs.length > 5 ? `\n  ... 외 ${nonLazySrcs.length - 5}개` : ''}`);
      }

      return {
        id: '1.4',
        status: issues.length === 0 ? 'pass' : 'warning',
        severity: 'medium',
        title: '이미지 최적화',
        description: issues.length === 0 ? `이미지 ${totalImgs}개 중 lazy loading ${lazyCount}/${totalImgs}개 적용 — 최적화 양호` : issues.join(', '),
        details: detailParts.join('\n'),
        score: Math.max(0, score),
      };
    },
  },
];
