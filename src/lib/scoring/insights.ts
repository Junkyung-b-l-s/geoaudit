import type { CheckResult } from '@/types/check';
import type { CategoryInsight } from '@/types/audit';

export function generateCategoryInsight(categoryId: string, items: CheckResult[], score: number): CategoryInsight {
  const fails = items.filter((i) => i.status === 'fail');
  const warns = items.filter((i) => i.status === 'warning');
  const passes = items.filter((i) => i.status === 'pass');

  const gen = INSIGHT_GENERATORS[categoryId];
  if (gen) return gen(items, fails, warns, passes, score);

  return fallbackInsight(fails, warns, passes, score);
}

type InsightGen = (all: CheckResult[], fails: CheckResult[], warns: CheckResult[], passes: CheckResult[], score: number) => CategoryInsight;

const INSIGHT_GENERATORS: Record<string, InsightGen> = {
  performance: (_all, fails, warns, passes, score) => {
    const suggestions: string[] = [];

    const cwv = _all.find((i) => i.id === '1.1');
    const loading = _all.find((i) => i.id === '1.2');
    const images = _all.find((i) => i.id === '1.4');

    let summary: string;
    if (score >= 80) {
      summary = '사이트 성능이 전반적으로 양호합니다. AI 크롤러가 페이지를 빠르게 수집할 수 있는 환경이에요.';
    } else if (score >= 50) {
      summary = '성능에 개선의 여지가 있습니다. 페이지 로딩 속도를 높이면 AI 크롤러의 수집 효율도 함께 올라갑니다.';
    } else {
      summary = '성능이 상당히 낮습니다. AI 크롤러가 타임아웃으로 페이지를 건너뛸 가능성이 높아요.';
    }

    if (cwv?.status === 'fail') suggestions.push('LCP를 2.5초 이내로 개선하면 AI가 콘텐츠를 더 안정적으로 수집할 수 있습니다.');
    if (loading?.status === 'fail') suggestions.push('서버 응답 시간(TTFB)을 줄이면 크롤링 효율이 크게 향상됩니다.');
    if (images?.status !== 'pass') suggestions.push('이미지를 WebP로 전환하고 lazy loading을 적용하면 전체 로딩이 빨라집니다.');
    if (suggestions.length === 0) suggestions.push('현재 성능을 유지하면서 주기적으로 Core Web Vitals를 모니터링하세요.');

    return { summary, suggestions };
  },

  content: (_all, fails, warns, passes, score) => {
    const suggestions: string[] = [];

    const heading = _all.find((i) => i.id === '2.1');
    const semantic = _all.find((i) => i.id === '2.2');
    const faq = _all.find((i) => i.id === '2.3');
    const alt = _all.find((i) => i.id === '2.7');

    let summary: string;
    if (score >= 80) {
      summary = '콘텐츠가 AI에게 잘 구조화된 형태로 전달되고 있습니다. 시맨틱 마크업을 적절히 활용하고 있어요.';
    } else if (score >= 50) {
      summary = '기본적인 구조는 갖추고 있지만, AI가 콘텐츠의 계층과 의미를 더 명확히 파악할 수 있도록 개선할 부분이 있어요.';
    } else {
      summary = '콘텐츠 구조가 AI 최적화에 많이 부족합니다. AI 모델은 구조가 불명확한 페이지에서 정보를 잘 추출하지 못해요.';
    }

    if (heading?.status !== 'pass') suggestions.push('H1 태그를 페이지당 하나만 사용하고, H2~H3로 논리적 계층을 만드세요.');
    if (semantic?.status !== 'pass') suggestions.push('div 대신 article, section, nav 등 시맨틱 태그를 활용하면 AI의 콘텐츠 이해도가 높아집니다.');
    if (faq?.status !== 'pass') suggestions.push('FAQ 콘텐츠가 있다면 FAQPage 스키마나 details/summary 태그로 마크업하세요.');
    if (alt?.status !== 'pass') suggestions.push('모든 이미지에 설명적인 alt 텍스트를 추가하면 멀티모달 AI도 콘텐츠를 이해할 수 있습니다.');
    if (suggestions.length === 0) suggestions.push('현재 수준을 유지하면서 새로운 콘텐츠도 동일한 마크업 기준을 적용하세요.');

    return { summary, suggestions };
  },

  metadata: (_all, fails, warns, passes, score) => {
    const suggestions: string[] = [];

    const title = _all.find((i) => i.id === '3.1');
    const desc = _all.find((i) => i.id === '3.2');
    const og = _all.find((i) => i.id === '3.3');
    const schema = _all.find((i) => i.id === '3.7');
    const author = _all.find((i) => i.id === '3.10');
    const sameAs = _all.find((i) => i.id === '3.14');

    let summary: string;
    if (score >= 80) {
      summary = '메타데이터가 풍부하게 설정되어 있어요. AI가 각 페이지의 주제와 맥락을 정확히 파악할 수 있는 상태입니다.';
    } else if (score >= 50) {
      summary = '기본 메타데이터는 있지만 구조화 데이터(Schema)가 부족합니다. AI 인용 시 브랜드 정보의 신뢰도를 높이려면 보강이 필요해요.';
    } else {
      summary = '메타데이터가 많이 부족합니다. AI 모델이 페이지의 주제, 저자, 발행일 등을 파악하기 어려운 상태예요.';
    }

    if (title?.status !== 'pass') suggestions.push('Title 태그를 50~60자로 맞추고 핵심 키워드를 포함하세요.');
    if (desc?.status !== 'pass') suggestions.push('Meta Description을 120~160자로 작성하여 AI가 페이지 요약을 정확히 인식하게 하세요.');
    if (og?.status !== 'pass') suggestions.push('OG 태그(title, description, image)를 완비하면 SNS 공유 시 미리보기가 정상 표시됩니다.');
    if (schema?.status !== 'pass') suggestions.push('JSON-LD Article 스키마를 추가하면 AI가 콘텐츠의 유형과 구조를 즉시 파악합니다.');
    if (author?.status !== 'pass') suggestions.push('Author 스키마에 sameAs로 공식 프로필을 연결하면 AI의 저자 신뢰도 판단이 강화됩니다.');
    if (sameAs?.status !== 'pass' && suggestions.length < 3) suggestions.push('Organization 스키마에 sameAs 속성을 추가해 브랜드의 공식 채널들을 연결하세요.');
    if (suggestions.length === 0) suggestions.push('메타데이터 관리를 자동화하여 새 콘텐츠에도 동일한 품질을 유지하세요.');

    return { summary, suggestions: suggestions.slice(0, 3) };
  },

  crawling: (_all, fails, warns, passes, score) => {
    const suggestions: string[] = [];

    const robots = _all.find((i) => i.id === '4.1');
    const aiBot = _all.find((i) => i.id === '4.2');
    const sitemap = _all.find((i) => i.id === '4.3');
    const llmsTxt = _all.find((i) => i.id === '4.6');
    const citation = _all.find((i) => i.id === '4.9');

    let summary: string;
    if (score >= 80) {
      summary = 'AI 크롤러가 사이트를 원활하게 탐색할 수 있는 환경입니다. 크롤링 정책과 사이트맵이 잘 갖추어져 있어요.';
    } else if (score >= 50) {
      summary = '기본적인 크롤링 환경은 갖추어져 있지만, AI 전용 설정이 부족해 인용 기회를 놓치고 있을 수 있어요.';
    } else {
      summary = '크롤링 환경에 개선이 필요합니다. AI 크롤러가 콘텐츠에 원활하게 접근할 수 있도록 설정을 점검해 보세요.';
    }

    if (aiBot?.status !== 'pass') suggestions.push('robots.txt에서 GPTBot, ClaudeBot 등 AI 크롤러를 명시적으로 허용하세요.');
    if (sitemap?.status !== 'pass') suggestions.push('유효한 sitemap.xml을 제공하면 AI 크롤러가 모든 중요 페이지를 빠짐없이 수집합니다.');
    if (llmsTxt?.status !== 'pass') suggestions.push('llms.txt 파일을 루트에 배치하면 AI 모델에게 브랜드와 콘텐츠를 직접 안내할 수 있습니다.');
    if (citation?.status !== 'pass') suggestions.push('핵심 콘텐츠에 구조화 데이터와 명확한 출처를 표기하면 AI 인용 가능성이 높아집니다.');
    if (robots?.status !== 'pass' && suggestions.length < 3) suggestions.push('robots.txt의 크롤링 규칙을 검토하여 중요한 페이지가 차단되어 있지 않은지 확인하세요.');
    if (suggestions.length === 0) suggestions.push('AI 크롤러 로그를 주기적으로 모니터링하여 접근 패턴을 파악하세요.');

    return { summary, suggestions: suggestions.slice(0, 3) };
  },

  authority: (_all, fails, warns, passes, score) => {
    const suggestions: string[] = [];

    const about = _all.find((i) => i.id === '6.1');
    const authorProfile = _all.find((i) => i.id === '6.2');
    const citations = _all.find((i) => i.id === '6.3');
    const orgSchema = _all.find((i) => i.id === '6.4');
    const knowledgePanel = _all.find((i) => i.id === '6.5');

    let summary: string;
    if (score >= 80) {
      summary = 'E-E-A-T 신호가 잘 갖춰져 있어요. AI가 이 사이트를 신뢰할 수 있는 출처로 판단할 가능성이 높습니다.';
    } else if (score >= 50) {
      summary = '기본적인 신뢰 신호가 있으나 보강이 필요합니다. 조직 정보와 전문성 증거를 추가하면 AI 인용 가능성이 크게 높아져요.';
    } else {
      summary = 'E-E-A-T 신호가 많이 부족합니다. AI 모델은 신뢰도를 판단할 수 없는 사이트를 인용하지 않는 경향이 있어요.';
    }

    if (orgSchema?.status !== 'pass') suggestions.push('Organization Schema에 name, url, logo, description, sameAs를 모두 포함하세요.');
    if (about?.status !== 'pass') suggestions.push('About/Team 페이지를 만들어 조직의 전문성과 경험을 소개하세요.');
    if (citations?.status !== 'pass') suggestions.push('콘텐츠에 위키피디아, 학술 논문 등 권위 있는 외부 소스를 인용하면 신뢰도가 높아집니다.');
    if (knowledgePanel?.status !== 'pass') suggestions.push('sameAs에 위키피디아/위키데이터 링크를 추가하면 AI가 브랜드를 공인 엔티티로 인식합니다.');
    if (authorProfile?.status !== 'pass') suggestions.push('저자 바이라인에 프로필 링크를 추가하고 JSON-LD author.sameAs를 설정하세요.');
    if (suggestions.length === 0) suggestions.push('현재의 E-E-A-T 수준을 유지하면서 새 콘텐츠에도 동일한 기준을 적용하세요.');

    return { summary, suggestions: suggestions.slice(0, 3) };
  },

  structure: (_all, fails, warns, passes, score) => {
    const suggestions: string[] = [];

    const https = _all.find((i) => i.id === '5.1');
    const internal = _all.find((i) => i.id === '5.2');
    const external = _all.find((i) => i.id === '5.3');
    const rendering = _all.find((i) => i.id === '5.4');
    const security = _all.find((i) => i.id === '5.5');
    const duplication = _all.find((i) => i.id === '5.6');

    let summary: string;
    if (score >= 80) {
      summary = '사이트 구조와 보안이 안정적입니다. 내부 링크가 잘 연결되어 있고 보안 설정도 양호해요.';
    } else if (score >= 50) {
      summary = '구조적으로 개선할 부분이 있습니다. 내부 링크 연결과 보안 설정을 점검하면 AI 크롤링 효율이 올라갑니다.';
    } else {
      summary = '사이트 구조와 보안에 상당한 개선이 필요합니다. 이 상태로는 AI가 사이트를 신뢰하기 어려워요.';
    }

    if (https?.status !== 'pass') suggestions.push('전체 페이지에 HTTPS를 적용하고 Mixed Content를 제거하세요. 보안은 AI 신뢰도의 기본입니다.');
    if (internal?.status !== 'pass') suggestions.push('고아 페이지를 내부 링크로 연결하면 AI 크롤러가 모든 콘텐츠를 발견할 수 있습니다.');
    if (rendering?.status !== 'pass') suggestions.push('CSR 의존도를 줄이고 SSR/SSG를 적용하면 AI 크롤러가 콘텐츠를 바로 읽을 수 있어요.');
    if (security?.status !== 'pass') suggestions.push('HSTS, CSP 등 보안 헤더를 추가하면 사이트 신뢰도가 전반적으로 높아집니다.');
    if (duplication?.status !== 'pass') suggestions.push('유사한 콘텐츠의 페이지들을 통합하거나 canonical로 정리하면 AI가 핵심 콘텐츠에 집중합니다.');
    if (external?.status !== 'pass' && suggestions.length < 3) suggestions.push('깨진 외부 링크를 수정하면 사이트 전체의 품질 신호가 개선됩니다.');
    if (suggestions.length === 0) suggestions.push('현재 구조를 유지하면서 새 페이지 추가 시 내부 링크 연결을 잊지 마세요.');

    return { summary, suggestions: suggestions.slice(0, 3) };
  },
};

function fallbackInsight(fails: CheckResult[], warns: CheckResult[], passes: CheckResult[], score: number): CategoryInsight {
  let summary: string;
  if (score >= 80) summary = `전체 ${passes.length + fails.length + warns.length}개 항목 중 대부분이 양호합니다.`;
  else if (score >= 50) summary = `${fails.length}개 항목이 미충족, ${warns.length}개 항목이 주의 상태입니다.`;
  else summary = `${fails.length}개 항목이 미충족 상태입니다. 우선순위가 높은 항목부터 개선해 보세요.`;

  const suggestions = fails.slice(0, 3).map((f) => `${f.title}: ${f.description}`);
  if (suggestions.length === 0 && warns.length > 0) {
    suggestions.push(...warns.slice(0, 2).map((w) => `${w.title}: ${w.description}`));
  }
  return { summary, suggestions };
}
