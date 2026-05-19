import type { CheckResult, LighthouseData } from '@/types/check';

export interface GeoStrategy {
  id: string;
  name: string;
  rationale: string;
  method: string;
  priority: 'critical' | 'high' | 'medium';
  relatedChecks: string[];
}

export function generateStrategies(items: CheckResult[], lighthouseData?: LighthouseData): GeoStrategy[] {
  const byId = new Map<string, CheckResult>();
  for (const item of items) {
    const existing = byId.get(item.id);
    // score가 null이면 측정 불가 — 비교 대상에서 제외 (existing 우선 유지)
    if (item.score === null) continue;
    if (!existing || existing.score === null || item.score < existing.score) byId.set(item.id, item);
  }

  const get = (id: string) => byId.get(id);
  const isBad = (id: string) => {
    const r = get(id);
    return r && (r.status === 'fail' || r.status === 'warning');
  };
  const statusOf = (id: string) => get(id)?.status;

  const strategies: GeoStrategy[] = [];

  // ── structured-data ──
  if (isBad('3.7') || isBad('3.8') || isBad('3.10') || isBad('3.14')) {
    const missing: string[] = [];
    if (isBad('3.7')) missing.push('Article Schema(JSON-LD)');
    if (isBad('3.8')) missing.push('FAQ Schema');
    if (isBad('3.10')) missing.push('Organization/Person Schema');
    if (isBad('3.14')) missing.push('sameAs 외부 프로필 연결');

    const missingLabel = missing.join(', ');
    const first = missing[0];
    const rest = missing.slice(1);

    strategies.push({
      id: 'structured-data',
      name: '구조화 데이터 강화',
      rationale: `현재 ${missingLabel}이(가) 누락되어 있습니다. AI 모델은 JSON-LD 스키마를 통해 콘텐츠의 유형, 저자, 기관 정보를 즉시 파악하며, 구조화 데이터가 풍부한 사이트는 AI 응답에서 인용될 확률이 2~3배 높습니다.`,
      method: `우선 ${first}부터 구현하세요.${rest.length > 0 ? ` 이후 ${rest.join(', ')}을(를) 순차적으로 추가하면 AI의 엔티티 인식이 단계적으로 강화됩니다.` : ''} ${isBad('3.10') ? '저자 정보(Person)에 credentials와 sameAs를 추가하면 E-E-A-T 신호가 함께 강화됩니다.' : ''}`.trim(),
      priority: isBad('3.7') || isBad('3.10') ? 'critical' : 'high',
      relatedChecks: ['3.7', '3.8', '3.10', '3.14'].filter((id) => isBad(id)),
    });
  }

  // ── ai-crawler-access ──
  if (isBad('4.2') || isBad('4.6')) {
    const robotsBad = isBad('4.2');
    const llmsBad = isBad('4.6');

    let rationale: string;
    let method: string;

    if (robotsBad && llmsBad) {
      rationale = 'robots.txt에서 AI 크롤러(GPTBot, ClaudeBot 등)가 차단되어 있고, llms.txt도 제공되지 않습니다. AI 크롤러가 콘텐츠에 전혀 접근할 수 없어 AI 모델의 학습 데이터에서 완전히 제외됩니다.';
      method = '먼저 robots.txt에서 GPTBot, ClaudeBot 등 AI 크롤러를 명시적으로 Allow하세요. 이후 루트 경로에 llms.txt를 배치하여 브랜드 소개, 핵심 콘텐츠 URL, 연락처 정보를 AI에게 직접 안내하세요.';
    } else if (robotsBad) {
      rationale = 'robots.txt에서 AI 크롤러(GPTBot, ClaudeBot 등)가 차단되어 있습니다. llms.txt는 존재하지만, 크롤러 자체가 접근할 수 없으면 무의미합니다.';
      method = 'robots.txt를 수정하여 GPTBot, ClaudeBot, anthropic-ai 등 주요 AI 크롤러에 대해 Allow 규칙을 추가하세요. User-Agent별로 세분화하여 허용 범위를 관리할 수 있습니다.';
    } else {
      // 4.2가 pass면 명시적 Allow 확인, info면 robots.txt 자체가 없어 차단 미확인 — 단정 표현 회피
      const robotsConfirmedAllow = statusOf('4.2') === 'pass';
      const accessPhrase = robotsConfirmedAllow
        ? 'AI 크롤러 접근이 robots.txt에서 명시적으로 허용되어 있으나'
        : 'AI 크롤러 차단은 확인되지 않았으나 (robots.txt 자체 부재 가능)';
      rationale = `${accessPhrase} llms.txt가 없습니다. llms.txt는 AI에게 브랜드를 직접 소개하는 전용 채널로, 이를 통해 AI 모델이 정확한 브랜드 정보를 학습할 수 있습니다.`;
      method = '루트 경로(/)에 llms.txt를 생성하세요. 브랜드명, 핵심 서비스 설명, 주요 콘텐츠 URL, 연락처 정보를 포함하세요. llms-full.txt로 상세 버전도 제공하면 더 효과적입니다.';
    }

    strategies.push({
      id: 'ai-crawler-access',
      name: 'AI 크롤러 접근 최적화',
      rationale,
      method,
      priority: 'critical',
      relatedChecks: ['4.2', '4.6'].filter((id) => isBad(id)),
    });
  }

  // ── semantic-structure ──
  if (isBad('2.1') || isBad('2.2') || isBad('2.4')) {
    const issues: string[] = [];
    if (isBad('2.1')) issues.push('헤딩 계층 구조(H1~H3)');
    if (isBad('2.2')) issues.push('시맨틱 HTML 태그 활용');
    if (isBad('2.4')) issues.push('데이터 테이블/리스트 마크업');

    const issueLabel = issues.join(', ');

    let methodDetail = '';
    if (isBad('2.1')) methodDetail += 'H1은 페이지당 1개로 제한하고 H2~H3로 논리적 계층을 구성하세요. ';
    if (isBad('2.2')) methodDetail += 'article, section, nav, aside 등 시맨틱 태그로 콘텐츠 영역을 구분하세요. ';
    if (isBad('2.4')) methodDetail += '데이터는 table, 목록은 ul/ol, 정의는 dl 태그로 마크업하면 AI가 구조를 즉시 파악합니다. ';

    strategies.push({
      id: 'semantic-structure',
      name: '시맨틱 콘텐츠 구조화',
      rationale: `${issueLabel}에 문제가 발견되었습니다. AI 모델은 HTML 태그의 의미를 이해하므로, 올바른 시맨틱 구조를 갖춘 페이지에서 핵심 정보를 정확히 추출하고 인용합니다.`,
      method: methodDetail.trim(),
      priority: 'high',
      relatedChecks: ['2.1', '2.2', '2.4'].filter((id) => isBad(id)),
    });
  }

  // ── freshness-signals ──
  // 4.8 상태 구분: 'na' = sitemap 자체가 없음 (선행 조건 미충족), 'warning' = sitemap은 있으나 lastmod 누락, 'info' = lastmod 존재(정확성 미검증)
  // sitemap이 없으면 lastmod 정정은 의미 없음 — 먼저 sitemap 발행이 필요
  {
    const schemaBad = isBad('3.11');
    const sitemap48Status = statusOf('4.8');
    const sitemapMissing = sitemap48Status === 'na';
    const lastmodMissing = sitemap48Status === 'warning';

    if (schemaBad || sitemapMissing || lastmodMissing) {
      const clauses: string[] = [];
      const methods: string[] = [];
      const related: string[] = [];

      if (schemaBad) {
        clauses.push('JSON-LD에 dateModified가 누락되어 있습니다');
        methods.push('JSON-LD에 datePublished와 dateModified를 추가하고, 콘텐츠 업데이트 시 dateModified도 함께 갱신하세요.');
        related.push('3.11');
      }
      if (sitemapMissing) {
        clauses.push('sitemap.xml 자체가 발행되지 않아 lastmod로 최신성 신호를 보낼 수 없습니다');
        methods.push('먼저 sitemap.xml을 발행하여 robots.txt에 위치를 명시하세요. 그 다음 단계로 각 URL의 lastmod를 실제 수정일과 일치시키세요.');
        related.push('4.8');
      } else if (lastmodMissing) {
        clauses.push('sitemap은 존재하나 lastmod 정보가 비어 있습니다');
        methods.push('sitemap의 각 URL에 lastmod를 추가하고 실제 콘텐츠 수정일과 일치시키세요. 일괄적으로 현재 날짜를 넣는 것은 오히려 신뢰도를 떨어뜨립니다.');
        related.push('4.8');
      }

      strategies.push({
        id: 'freshness-signals',
        name: '콘텐츠 최신성 신호 확보',
        rationale: `${clauses.join('. ')}. AI 모델은 dateModified와 sitemap lastmod를 기반으로 콘텐츠의 최신성과 재크롤링 우선순위를 판단합니다.`,
        method: methods.join(' '),
        priority: 'high',
        relatedChecks: related,
      });
    }
  }

  // ── performance-rendering ──
  // 1.2는 TTFB+TTI를 함께 보는 ID이므로 실제 측정값을 확인해 해당 절만 조립
  if (isBad('1.1') || isBad('1.2') || isBad('5.4')) {
    const issues: string[] = [];
    const methods: string[] = [];
    const related: string[] = [];

    if (isBad('1.1')) {
      const lcpSec = lighthouseData ? (lighthouseData.lcp / 1000).toFixed(1) : null;
      issues.push(lcpSec ? `페이지 로딩 속도(LCP ${lcpSec}초)` : '페이지 로딩 속도(LCP)');
      methods.push('LCP 2.5초 이내를 목표로 이미지 최적화, 리소스 프리로드, 불필요한 스크립트 제거를 진행하세요.');
      related.push('1.1');
    }

    if (isBad('1.2')) {
      // 1.2 안에서 TTFB·TTI 각각 임계 초과 여부 확인. 측정값 없으면 두 항목 모두 안내.
      const ttfb = lighthouseData?.ttfb;
      const tti = lighthouseData?.tti;
      const ttfbBad = typeof ttfb === 'number' ? ttfb > 800 : true;
      const ttiBad = typeof tti === 'number' ? tti > 3800 : true;

      if (ttfbBad) {
        const label = typeof ttfb === 'number' ? `TTFB ${ttfb}ms` : '서버 응답 시간(TTFB)';
        issues.push(`서버 응답 시간(${label})`);
        methods.push('TTFB 800ms 이내를 목표로 서버 응답을 최적화하고, CDN 적용을 검토하세요.');
      }
      if (ttiBad) {
        const label = typeof tti === 'number' ? `TTI ${(tti / 1000).toFixed(1)}초` : 'TTI';
        issues.push(`인터랙션 가능 시점(${label})`);
        methods.push('TTI 3.8초 이내를 목표로 JavaScript 번들 크기 축소, 메인 스레드 차단 작업 분할을 진행하세요.');
      }
      related.push('1.2');
    }

    if (isBad('5.4')) {
      issues.push('JavaScript 렌더링 의존도');
      methods.push('CSR 의존도를 줄이고 SSR/SSG를 적용하면 AI 크롤러가 JavaScript 실행 없이도 콘텐츠를 즉시 읽을 수 있습니다.');
      related.push('5.4');
    }

    strategies.push({
      id: 'performance-rendering',
      name: '성능 및 렌더링 최적화',
      rationale: `${issues.join(', ')}에 문제가 있습니다. AI 크롤러는 느린 페이지를 타임아웃 처리하고, JavaScript 렌더링이 필요한 페이지는 콘텐츠를 수집하지 못할 수 있습니다.`,
      method: methods.join(' '),
      priority: isBad('1.1') ? 'critical' : 'high',
      relatedChecks: related,
    });
  }

  // ── meta-quality ──
  if (isBad('3.1') || isBad('3.2') || isBad('3.3')) {
    const issues: string[] = [];
    if (isBad('3.1')) issues.push('Title 태그');
    if (isBad('3.2')) issues.push('Meta Description');
    if (isBad('3.3')) issues.push('OG(Open Graph) 태그');

    const issueLabel = issues.join(', ');

    let methodDetail = '';
    if (isBad('3.1')) methodDetail += 'Title을 50~60자로 핵심 키워드 포함하여 고유하게 작성하세요. ';
    if (isBad('3.2')) methodDetail += 'Meta Description을 120~160자로 페이지 내용을 정확히 요약하세요. ';
    if (isBad('3.3')) methodDetail += 'og:title, og:description, og:image를 완비하여 SNS 공유 시에도 일관된 브랜드 메시지가 전달되도록 하세요. ';

    strategies.push({
      id: 'meta-quality',
      name: '메타데이터 품질 일관성 확보',
      rationale: `${issueLabel}에 문제가 발견되었습니다. AI는 Title과 Meta Description을 페이지의 핵심 요약으로 활용하며, 이 정보가 부정확하거나 누락되면 AI가 페이지의 주제를 오해하거나 무시할 수 있습니다.`,
      method: methodDetail.trim(),
      priority: 'high',
      relatedChecks: ['3.1', '3.2', '3.3'].filter((id) => isBad(id)),
    });
  }

  // ── discoverability ──
  if (isBad('4.3') || isBad('4.7')) {
    const issues: string[] = [];
    if (isBad('4.3')) issues.push('Sitemap');
    if (isBad('4.7')) issues.push('RSS/Atom 피드');

    const issueLabel = issues.join(', ');

    let methodDetail = '';
    if (isBad('4.3')) methodDetail += 'sitemap.xml에 모든 중요 페이지를 포함하고 robots.txt에서 Sitemap 위치를 명시하세요. ';
    if (isBad('4.7')) methodDetail += 'RSS 또는 Atom 피드를 제공하여 AI 크롤러가 새 콘텐츠를 즉시 발견할 수 있도록 하세요. ';

    strategies.push({
      id: 'discoverability',
      name: '콘텐츠 발견 경로 확대',
      rationale: `${issueLabel}에 문제가 있습니다. 사이트맵과 피드는 AI 크롤러가 콘텐츠를 발견하는 핵심 경로이며, 누락 시 중요한 콘텐츠가 AI의 시야에서 사라질 수 있습니다.`,
      method: methodDetail.trim(),
      priority: 'medium',
      relatedChecks: ['4.3', '4.7'].filter((id) => isBad(id)),
    });
  }

  // ── multimodal-ready ──
  if (isBad('2.7') || isBad('1.4')) {
    const altBad = isBad('2.7');
    const imgOptBad = isBad('1.4');

    let rationale: string;
    let method: string;

    if (altBad && imgOptBad) {
      rationale = '이미지 alt 텍스트가 누락되어 있고, 이미지 최적화도 부족합니다. 최신 AI 모델은 이미지와 텍스트를 함께 이해하므로, 두 가지 모두 개선이 필요합니다.';
      method = '모든 의미 있는 이미지에 콘텐츠를 설명하는 alt 텍스트를 작성하세요. 동시에 이미지를 WebP/AVIF로 변환하고 적절한 크기로 리사이징하여 로딩 성능도 개선하세요.';
    } else if (altBad) {
      rationale = '이미지 alt 텍스트가 누락되어 있습니다. 멀티모달 AI가 시각 콘텐츠를 이해하고 인용하려면 설명적인 alt 텍스트가 필수입니다.';
      method = '모든 의미 있는 이미지에 콘텐츠를 정확히 설명하는 alt 텍스트를 작성하세요. 장식용 이미지는 빈 alt=""로 구분하세요.';
    } else {
      rationale = '이미지 최적화가 부족합니다. 과도한 이미지 용량은 페이지 로딩을 지연시켜 AI 크롤러의 콘텐츠 수집에 영향을 줄 수 있습니다.';
      method = '이미지를 WebP/AVIF 포맷으로 변환하고, srcset을 활용하여 디바이스별 적절한 크기를 제공하세요. lazy loading도 적용하면 초기 로딩 성능이 개선됩니다.';
    }

    strategies.push({
      id: 'multimodal-ready',
      name: '멀티모달 AI 대응',
      rationale,
      method,
      priority: 'medium',
      relatedChecks: ['2.7', '1.4'].filter((id) => isBad(id)),
    });
  }

  // ── eeat-authority ──
  if (isBad('6.1') || isBad('6.2') || isBad('6.3') || isBad('6.4') || isBad('6.5')) {
    const issues: string[] = [];
    if (isBad('6.1')) issues.push('About/Team 페이지');
    if (isBad('6.2')) issues.push('저자 정보 표시');
    if (isBad('6.3')) issues.push('외부 권위 인용');
    if (isBad('6.4')) issues.push('브랜드 엔티티 인식');
    if (isBad('6.5')) issues.push('고객 리뷰/증언');

    const issueLabel = issues.join(', ');

    let methodDetail = '';
    if (isBad('6.1')) methodDetail += 'About/Team 페이지를 만들어 조직의 전문성과 연혁을 소개하세요. ';
    if (isBad('6.2')) methodDetail += '콘텐츠에 저자 이름, 직책, 프로필 링크를 명시하세요. ';
    if (isBad('6.3')) methodDetail += '콘텐츠 내에 학술 논문, 정부 통계 등 권위 있는 외부 소스를 인용하세요. ';
    if (isBad('6.4')) methodDetail += 'Organization Schema를 완비하고, sameAs로 위키피디아/위키데이터와 연결하여 AI의 엔티티 인식을 강화하세요. ';
    if (isBad('6.5')) methodDetail += '고객 리뷰나 사례 연구를 구조화 데이터(Review Schema)와 함께 게시하세요. ';

    strategies.push({
      id: 'eeat-authority',
      name: 'E-E-A-T 신뢰도 강화',
      rationale: `${issueLabel}이(가) 부족합니다. AI 모델은 인용 소스를 선택할 때 전문성(Expertise), 권위(Authority), 신뢰(Trust)를 평가하며, 이 요소들이 갖춰지지 않으면 인용 후보에서 제외됩니다.`,
      method: methodDetail.trim(),
      priority: isBad('6.4') ? 'critical' : 'high',
      relatedChecks: ['6.1', '6.2', '6.3', '6.4', '6.5'].filter((id) => isBad(id)),
    });
  }

  // ── content-depth ──
  if (isBad('2.8') || isBad('2.9') || isBad('2.10')) {
    const issues: string[] = [];
    if (isBad('2.8')) issues.push('콘텐츠 길이 부족');
    if (isBad('2.9')) issues.push('구체적 수치/통계 부재');
    if (isBad('2.10')) issues.push('전문 용어 정의(dfn/abbr) 미사용');

    const issueLabel = issues.join(', ');

    let methodDetail = '';
    if (isBad('2.8')) methodDetail += '핵심 페이지의 콘텐츠를 1000자 이상으로 확보하여 정보 밀도를 높이세요. ';
    if (isBad('2.9')) methodDetail += '구체적 수치, 통계, 사례를 표(table)나 리스트로 구조화하여 AI가 인용하기 쉬운 형태로 제공하세요. ';
    if (isBad('2.10')) methodDetail += 'dfn, abbr 태그로 전문 용어를 명시적으로 정의하면 "X란 무엇인가" 류의 AI 질문에 인용될 확률이 높아집니다. ';

    strategies.push({
      id: 'content-depth',
      name: '콘텐츠 깊이 및 인용 가능성 강화',
      rationale: `${issueLabel} 문제가 발견되었습니다. AI는 구체적인 수치, 정의, 통계가 포함된 깊이 있는 콘텐츠를 선호하며, 정보 밀도가 높은 페이지를 우선 인용합니다.`,
      method: methodDetail.trim(),
      priority: isBad('2.8') ? 'high' : 'medium',
      relatedChecks: ['2.8', '2.9', '2.10'].filter((id) => isBad(id)),
    });
  }

  // ── content-freshness ──
  if (isBad('4.12') || isBad('4.13')) {
    const updateBad = isBad('4.12');
    const publishBad = isBad('4.13');

    let rationale: string;
    let method: string;

    if (updateBad && publishBad) {
      rationale = '기존 콘텐츠 업데이트가 부족하고, 새로운 콘텐츠 발행 빈도도 낮습니다. AI 모델은 최신 정보를 강하게 선호하므로, 활동이 없는 사이트는 인용 우선순위에서 점차 밀려납니다.';
      method = '핵심 콘텐츠를 우선적으로 최신 데이터로 업데이트하고, 최소 월 1회 이상 새로운 콘텐츠를 발행하세요. 업데이트 시 dateModified를 반드시 갱신하세요.';
    } else if (updateBad) {
      rationale = '기존 콘텐츠의 업데이트가 부족합니다. 새 콘텐츠는 발행되고 있으나, 기존 핵심 콘텐츠가 오래된 채로 방치되면 AI가 해당 정보를 구식으로 판단합니다.';
      method = '트래픽이 높은 핵심 페이지부터 최신 정보로 업데이트하세요. 업데이트 시 dateModified를 갱신하고, 변경 이력을 명시하면 AI의 신뢰도 평가에 도움이 됩니다.';
    } else {
      rationale = '새로운 콘텐츠 발행 빈도가 낮습니다. 기존 콘텐츠는 관리되고 있으나, 신규 콘텐츠 발행이 없으면 사이트의 전문 영역 커버리지가 제한됩니다.';
      method = '최소 월 1회 이상 새로운 콘텐츠를 발행하여 사이트의 활성도를 AI에게 보여주세요. 업계 트렌드, FAQ, 사례 연구 등 AI가 자주 참조하는 형식을 활용하세요.';
    }

    strategies.push({
      id: 'content-freshness',
      name: '콘텐츠 신선도 관리',
      rationale,
      method,
      priority: updateBad ? 'high' : 'medium',
      relatedChecks: ['4.12', '4.13'].filter((id) => isBad(id)),
    });
  }

  // ── url-technical-hygiene (NEW) ──
  if (isBad('3.12') || isBad('4.5') || isBad('5.1')) {
    const issues: string[] = [];
    if (isBad('3.12')) issues.push('URL 정규화(canonical)');
    if (isBad('4.5')) issues.push('URL 구조');
    if (isBad('5.1')) issues.push('HTTPS 보안');

    const issueLabel = issues.join(', ');

    let methodDetail = '';
    if (isBad('3.12')) methodDetail += 'canonical 태그를 모든 페이지에 설정하여 중복 URL로 인한 AI 크롤러의 혼란을 방지하세요. ';
    if (isBad('4.5')) methodDetail += 'URL을 짧고 의미 있는 키워드 기반 구조로 개선하세요. AI는 URL 경로에서도 페이지 주제를 추론합니다. ';
    if (isBad('5.1')) methodDetail += 'HTTPS를 적용하고 HTTP→HTTPS 리디렉트를 설정하세요. AI 모델은 보안되지 않은 사이트의 신뢰도를 낮게 평가합니다. ';

    strategies.push({
      id: 'url-technical-hygiene',
      name: 'URL 및 기술 위생 개선',
      rationale: `${issueLabel}에 문제가 있습니다. URL 구조와 보안은 AI 크롤러가 사이트를 신뢰하고 효율적으로 크롤링하기 위한 기본 조건이며, 이 기반이 불안정하면 다른 GEO 최적화의 효과도 반감됩니다.`,
      method: methodDetail.trim(),
      priority: isBad('5.1') ? 'critical' : 'high',
      relatedChecks: ['3.12', '4.5', '5.1'].filter((id) => isBad(id)),
    });
  }

  // ── internal-linking (NEW) ──
  if (isBad('5.2')) {
    const linkResult = get('5.2');
    const hasOrphanDetail = linkResult?.details && typeof linkResult.details === 'string' && linkResult.details.length > 0;

    strategies.push({
      id: 'internal-linking',
      name: '내부 링크 구조 최적화',
      rationale: `내부 링크 구조에 문제가 발견되었습니다.${hasOrphanDetail ? ` (${linkResult!.details})` : ' 고아 페이지(다른 페이지에서 링크되지 않는 페이지)가 존재할 수 있습니다.'} AI 크롤러는 내부 링크를 따라 콘텐츠를 발견하므로, 링크가 없는 페이지는 크롤링되지 않을 수 있습니다.`,
      method: '모든 중요 페이지가 최소 하나의 내부 링크로 연결되도록 하세요. 주요 카테고리 페이지에서 하위 콘텐츠로의 허브-스포크 구조를 구축하고, 관련 콘텐츠 간 상호 링크를 추가하면 AI 크롤러의 전체 사이트 이해도가 향상됩니다.',
      priority: 'high',
      relatedChecks: ['5.2'],
    });
  }

  // Always include if nothing else: general best practice
  if (strategies.length === 0) {
    strategies.push({
      id: 'maintain-excellence',
      name: '지속적 GEO 모니터링',
      rationale: 'AI 생태계는 빠르게 변화합니다. 현재 양호한 상태를 유지하려면 주기적인 점검과 새로운 AI 표준의 조기 도입이 중요합니다.',
      method: '월 1회 이상 Technical GEO 감사를 실시하고, AI 크롤러 로그를 분석하세요. llms.txt, 스키마 마크업 등 새로운 AI 표준이 등장하면 빠르게 적용하세요.',
      priority: 'medium',
      relatedChecks: [],
    });
  }

  return strategies.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2 };
    return order[a.priority] - order[b.priority];
  });
}
