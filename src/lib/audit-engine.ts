import { crawlSite } from './crawler';
import { siteCheckers, pageCheckers, aggregateCheckers } from './checkers';
import { runLighthouse } from './lighthouse';
import { runLlmChecks } from './llm/batch';
import { calculateReport } from './scoring/calculator';
import { updateAudit } from './audit-store';
import type { CheckResult, LighthouseData } from '@/types/check';
import type { AuditConfig, AuditProgress } from '@/types/audit';

type ProgressCallback = (progress: AuditProgress) => void;

const FRIENDLY_LABELS: Record<string, string> = {
  '1.1': '사이트 로딩이 사용자 기대에 부합하는지 확인하고 있어요',
  '1.2': '첫 화면이 얼마나 빨리 뜨는지 측정하고 있어요',
  '1.3': '페이지 로딩 중 콘텐츠가 밀리는 현상이 있는지 살피고 있어요',
  '1.4': '이미지가 최적화된 형태로 제공되고 있는지 확인 중이에요',
  '2.1': '제목 태그(H1~H6)가 논리적 순서로 구성되어 있는지 보고 있어요',
  '2.2': '의미 있는 HTML 태그를 잘 쓰고 있는지 분석 중이에요',
  '2.3': 'FAQ가 AI가 읽기 좋은 형태로 마크업되어 있는지 확인해요',
  '2.4': '표, 리스트 등 구조화된 마크업을 사용하는지 확인하고 있어요',
  '2.6': '링크 텍스트가 의미 있는 내용을 담고 있는지 분석 중이에요',
  '2.7': '이미지, 동영상에 대체 텍스트가 잘 달려있는지 확인해요',
  '3.1': '페이지 제목이 적절한 길이와 내용으로 설정되어 있는지 확인 중이에요',
  '3.2': '검색 결과에 표시될 설명문이 잘 작성되어 있는지 보고 있어요',
  '3.3': 'SNS 공유 시 미리보기가 제대로 나오는지 OG 태그를 확인해요',
  '3.4': '검색엔진이 정식 페이지를 올바르게 인식하는지 확인하고 있어요',
  '3.5': '다국어 사이트인 경우 언어별 연결이 잘 되어있는지 확인해요',
  '3.6': 'JavaScript 없이도 핵심 콘텐츠에 접근할 수 있는지 확인해요',
  '3.7': '기사 콘텐츠가 AI에게 구조화된 형태로 전달되는지 확인 중이에요',
  '3.8': 'FAQ 스키마가 올바르게 구현되어 있는지 검증해요',
  '3.9': '상품 정보가 AI/검색엔진에 구조화되어 노출되는지 확인해요',
  '3.10': '저자/기관 정보가 신뢰도 높은 형태로 제공되는지 확인해요',
  '3.11': '콘텐츠 발행일과 수정일이 명시되어 있는지 확인하고 있어요',
  '3.14': '브랜드/기관의 외부 프로필 연결이 설정되어 있는지 확인해요',
  '3.12': '동일한 콘텐츠가 다른 URL로 중복되어 있는지 확인 중이에요',
  '3.13': '전체 페이지의 메타 데이터 품질을 종합적으로 평가해요',
  '4.1': '검색 크롤러에게 적절한 안내를 주고 있는지 확인해요',
  '4.2': 'ChatGPT, Claude 등 AI 크롤러의 접근이 허용되어 있는지 확인해요',
  '4.3': '사이트맵이 잘 구성되어 모든 페이지를 안내하는지 확인 중이에요',
  '4.4': '주요 페이지가 검색엔진에 정상 색인되어 있는지 확인해요',
  '4.5': 'URL이 사람과 AI 모두 이해하기 쉬운 구조인지 분석해요',
  '4.6': 'AI 모델 전용 안내 파일(llms.txt)이 있는지 확인 중이에요',
  '4.7': 'RSS 등 AI가 구독할 수 있는 콘텐츠 피드가 있는지 확인해요',
  '4.8': '사이트맵의 최종 수정일이 실제와 일치하는지 검증해요',
  '4.9': 'AI가 이 브랜드를 인용할 가능성이 있는지 테스트해요',
  '5.1': '보안 연결(HTTPS)이 전체 페이지에 적용되어 있는지 확인해요',
  '5.2': '모든 페이지가 내부 링크로 잘 연결되어 있는지 분석해요',
  '5.3': '외부 링크가 깨지지 않고 정상 작동하는지 확인 중이에요',
  '5.4': '콘텐츠가 서버에서 바로 제공되는지, JS 로딩이 필요한지 확인해요',
  '5.5': '보안 헤더가 올바르게 설정되어 있는지 확인하고 있어요',
  '5.6': '비슷한 내용의 페이지가 너무 많지 않은지 분석해요',
  '2.8': '콘텐츠의 깊이와 정보 밀도를 측정하고 있어요',
  '2.9': '표, 통계 등 AI가 인용할 수 있는 구체적 데이터가 있는지 확인해요',
  '2.10': '용어 정의 마크업(dfn, abbr, dt)이 있는지 확인해요',
  '2.11': '이미지에 figure+figcaption 캡션이 제공되는지 확인해요',
  '4.10': 'AI 에이전트 연동 파일(ai-plugin.json, ai.txt)이 있는지 확인해요',
  '4.11': '콘텐츠 라이선스와 저작권 표시가 명확한지 확인해요',
  '4.12': '콘텐츠가 최근에 업데이트되었는지 신선도를 분석해요',
  '4.13': 'sitemap 기반으로 콘텐츠 발행 빈도를 분석해요',
  '4.14': '공개 API나 데이터 엔드포인트가 있는지 확인해요',
  '6.1': '회사소개, 팀 페이지 등 전문성을 보여주는 페이지가 있는지 확인해요',
  '6.2': '콘텐츠 저자의 프로필 링크가 제공되는지 확인해요',
  '6.3': '외부 권위 있는 소스를 인용하고 있는지 분석해요',
  '6.4': 'Organization 스키마가 완전하게 구현되어 있는지 확인해요',
  '6.5': '위키피디아 등 지식 그래프와의 연결이 있는지 확인해요',
};

export async function runAudit(auditId: string, config: AuditConfig, onProgress: ProgressCallback) {
  const emit = (stage: AuditProgress['stage'], progress: number, message: string) => {
    updateAudit(auditId, { stage, progress, message });
    onProgress({ stage, progress, message });
  };

  try {
    emit('site-fetch', 3, '사이트의 기본 설정 파일들을 확인하고 있어요');
    const { siteInfo, pages } = await crawlSite(config.url, config.maxPages, config.maxDepth, (stage, found, fetched) => {
      const progress = Math.min(40, 5 + Math.round((fetched / config.maxPages) * 35));
      if (stage === 'sitemap') {
        emit('crawling', progress, `사이트맵에서 ${found}개 페이지를 발견했어요. ${fetched}개째 내용을 읽고 있어요`);
      } else {
        emit('crawling', progress, `링크를 따라가며 페이지를 탐색하고 있어요 (${fetched}/${found}개 완료)`);
      }
    });

    updateAudit(auditId, { siteInfo, pages });
    emit('crawling', 40, `총 ${pages.length}개 페이지를 수집했어요. 이제 본격적인 진단을 시작합니다`);

    emit('lighthouse', 42, 'Google PageSpeed Insights API로 성능을 분석하고 있어요 (실사용자 데이터 + Lighthouse)');
    let lighthouseData: LighthouseData | undefined;
    try {
      lighthouseData = await runLighthouse(config.url);
      updateAudit(auditId, { lighthouseData });
      const lcpSec = (lighthouseData.lcp / 1000).toFixed(1);
      const cruxMsg = lighthouseData.crux ? ` · CrUX 실사용자 데이터 포함` : '';
      emit('lighthouse', 50, `PSI 분석 완료! 성능 ${lighthouseData.performanceScore}점, LCP ${lcpSec}초${cruxMsg}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PSI API error';
      emit('lighthouse', 50, `PSI 분석을 건너뛰었어요 (${msg}). 나머지 항목은 정상 진행됩니다`);
    }

    emit('page-checks', 52, '사이트 전체에 적용되는 기본 설정들을 점검하고 있어요');
    const results: CheckResult[] = [];

    for (const checker of siteCheckers) {
      const label = FRIENDLY_LABELS[checker.id] || checker.title;
      emit('page-checks', 52, label);
      const result = await checker.checker({ siteInfo, page: pages[0], allPages: pages, lighthouseData });
      results.push(result);
    }

    for (let i = 0; i < pages.length; i++) {
      const pageUrl = new URL(pages[i].url).pathname || '/';
      const progress = 52 + Math.round((i / pages.length) * 20);
      emit('page-checks', progress, `${i + 1}번째 페이지를 점검하고 있어요 — ${pageUrl}`);

      for (const checker of pageCheckers) {
        const label = FRIENDLY_LABELS[checker.id] || checker.title;
        emit('page-checks', progress, label);
        const result = await checker.checker({ page: pages[i], siteInfo, allPages: pages, lighthouseData });
        results.push(result);
      }
    }

    emit('page-checks', 72, '전체 페이지를 종합해서 패턴을 분석하고 있어요');
    for (const checker of aggregateCheckers) {
      const label = FRIENDLY_LABELS[checker.id] || checker.title;
      emit('page-checks', 72, label);
      const result = await checker.checker({ allPages: pages, siteInfo });
      results.push(result);
    }

    emit('llm-judgment', 75, 'AI가 이 사이트를 어떻게 이해하는지 직접 테스트하고 있어요');
    const llmResults = await runLlmChecks(pages, siteInfo, (done, total) => {
      const progress = 75 + Math.round((done / total) * 15);
      const messages = [
        '페이지 제목과 본문이 일관된 주제를 다루는지 AI에게 물어보고 있어요',
        '메타 데이터의 전반적인 품질을 AI가 평가하고 있어요',
        'URL만 보고 페이지 내용을 예측할 수 있는지 AI가 판단하고 있어요',
        '이 브랜드에 대해 AI에게 질문했을 때 인용될 가능성을 테스트해요',
      ];
      emit('llm-judgment', progress, messages[Math.min(done, messages.length - 1)]);
    });
    results.push(...llmResults);

    emit('scoring', 95, '모든 점검이 끝났어요. 중요도에 따라 종합 점수를 계산하고 있어요');
    const report = calculateReport(auditId, config.url, results, pages.map((p) => p.url), lighthouseData);

    updateAudit(auditId, { results, report, stage: 'done', progress: 100, message: '감사 완료' });
    emit('done', 100, `진단 완료! 종합 ${report.overallScore}점 — ${report.totalChecks}개 항목을 점검했어요`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    updateAudit(auditId, { stage: 'error', error: message });
    emit('error', 0, message);
  }
}
