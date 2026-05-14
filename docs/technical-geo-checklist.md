# Technical GEO 평가 항목

AI 인용에 최적화된 웹사이트 기술 환경을 진단하기 위한 점검 항목.
각 항목은 중요도(Critical / High / Medium / Low)로 구분한다.

---

## 1. 성능 점검

| # | 항목 | 설명 | 중요도 |
|---|------|------|--------|
| 1.1 | Core Web Vitals | LCP(최대 콘텐츠 페인트), INP(다음 페인트 상호작용), CLS(누적 레이아웃 이동) — Google Lighthouse 기준 측정 | High |
| 1.2 | 페이지 로딩 속도 | TTFB(첫 바이트 도달 시간), Time to Interactive. AI 크롤러도 느린 페이지는 수집을 포기할 수 있음 | High |
| 1.3 | CLS 유발 요소 식별 | 광고, 이미지, 폰트 로딩 등으로 인한 레이아웃 시프트 요소를 특정하고 제거 | Medium |
| 1.4 | 이미지 최적화 | lazy loading 적용, WebP/AVIF 포맷, 적정 사이즈 제공, srcset 반응형 대응 | Medium |

---

## 2. 콘텐츠 구조 점검 (기술적 마크업 관점)

| # | 항목 | 설명 | 중요도 |
|---|------|------|--------|
| 2.1 | 헤딩 계층 구조 (H1→H6) | H1은 페이지당 1개, H2/H3로 위계적 논리 구조 형성. AI는 H태그 계층으로 콘텐츠 품질과 구조를 판단하며, 부재 시 인용 우선순위에서 제외할 수 있음 | Critical |
| 2.2 | 본문 시맨틱 구조 | div/span 남용 대신 article, section, nav, aside 등 시맨틱 HTML 태그 사용. 의미 단위 문단 구성 | High |
| 2.3 | FAQ 마크업 구조 | FAQ 콘텐츠가 FAQPage Schema와 함께 구조화된 HTML(dl/details 등)로 마크업되어 있는지 | High |
| 2.4 | AI 가독 마크업 | 정보가 table, ul/ol, dl 등 구조화된 HTML 태그로 마크업되어 있는지. AI가 정보를 추출·파싱하기 쉬운 형태 | High |
| 2.5 | 키워드-타이틀-H1 정합성 | 타겟 키워드 ↔ Title ↔ H1 ↔ Meta Description이 일관된 주제로 정렬되어 있는지 | High |
| 2.6 | 내부 링크 앵커 텍스트 품질 | "여기 클릭", "더보기" 등 무의미한 앵커 대신 목적지 페이지를 설명하는 서술형 앵커 텍스트 사용 | Medium |
| 2.7 | 멀티모달 텍스트 대체 | 이미지 alt 속성 충실도, 차트/인포그래픽의 핵심 정보 텍스트 마크업 존재, 비디오 트랜스크립트 제공 여부. AI는 이미지/영상을 직접 읽지 못하므로 텍스트 대체가 필수 | High |

---

## 3. 메타데이터 점검

| # | 항목 | 설명 | 중요도 |
|---|------|------|--------|
| 3.1 | Title 태그 | 존재 여부, 길이(50~60자), 키워드 포함, 페이지 간 중복 여부 | Critical |
| 3.2 | Meta Description | 존재 여부, 길이(120~160자), 페이지 내용 요약 정확성, 중복 여부 | High |
| 3.3 | OG 태그 | og:title, og:description, og:image, og:url, og:type 완비 여부. 소셜 공유 및 AI 크롤러 참조 | High |
| 3.4 | Canonical URL | 대표 URL 지정으로 중복 페이지 신호 통합. 부재 시 동일 콘텐츠가 여러 URL로 분산되어 랭킹 신호 희석 | Critical |
| 3.5 | Hreflang | 다국어/다지역 사이트에서 언어별 대응 페이지 명시. 단일 언어 사이트는 해당 없음 | Medium |
| 3.6 | Noscript 태그 | JavaScript 비활성 환경(일부 크롤러 포함)에서도 핵심 콘텐츠 접근 가능하도록 대체 콘텐츠 제공 | Medium |
| 3.7 | Article Schema (구조화 데이터) | JSON-LD 또는 Microdata로 Article 마크업. headline, author, datePublished, dateModified, image 포함 | Critical |
| 3.8 | FAQ Schema | FAQPage + Question/Answer 구조화 데이터. AI가 FAQ를 직접 인용할 확률을 높임 | High |
| 3.9 | Product Schema | 제품 페이지에 JSON-LD로 name, description, brand, offers, aggregateRating 등 마크업 | High |
| 3.10 | Author Schema (저자 프로필) | Person 또는 Organization 스키마로 저자 정보 명시. 이름, 경력, 전문 분야, 프로필 사진 포함. AI가 콘텐츠 신뢰도를 판단하는 핵심 신호 | High |
| 3.11 | 업데이트 날짜 | datePublished + dateModified를 콘텐츠 상단 및 Schema에 명시. AI는 최신 정보를 우선 인용 | High |
| 3.12 | 페이지 중복 / URL 정규화 | 파라미터(?sort=, ?page=), 대소문자 혼용, trailing slash 차이로 인한 중복 페이지 식별 및 통합 | High |
| 3.13 | 메타 정보 품질 일괄 점검 | 전체 페이지 대상으로 메타 정보 부족·중복·짧은 텍스트를 일괄 스캔 | Medium |
| 3.14 | 엔티티 스키마 (sameAs) | Schema.org sameAs 속성으로 공식 SNS, Wikipedia, Wikidata 등 외부 프로필 연결. AI가 브랜드/인물 엔티티를 식별하고 Knowledge Graph에 매핑하는 데 사용 | High |

---

## 4. 크롤링/색인 점검

| # | 항목 | 설명 | 중요도 |
|---|------|------|--------|
| 4.1 | Robots.txt | 허용/차단 규칙 확인. 의도치 않은 주요 페이지 차단 여부 | Critical |
| 4.2 | AI 크롤러 허용 여부 | GPTBot, ClaudeBot, PerplexityBot, Google-Extended, OAI-SearchBot 등 AI 전용 크롤러의 명시적 차단 여부. 차단 시 AI 검색 노출 원천 불가 | Critical |
| 4.3 | Sitemap.xml | 존재 여부, 최신성, Google Search Console 등록 상태, 모든 주요 페이지 포함 여부 | High |
| 4.4 | 색인 상태 | Google Search Console 기준 색인된 페이지 수, 색인 제외 사유 확인 | High |
| 4.5 | URL 구조 명확성 | 카테고리/상품별 의미 있는 URL 경로 분리. 파라미터 기반 URL 지양. AI가 URL만으로 페이지 내 정보를 유추할 수 있어야 함 | High |
| 4.6 | llms.txt 제공 | 사이트 루트에 llms.txt(요약)와 llms-full.txt(상세)를 배치하여 AI 봇에게 사이트 구조·핵심 콘텐츠·연락처 등을 안내. robots.txt의 AI 버전 | Critical |
| 4.7 | AI 콘텐츠 피드 | RSS, JSON Feed, 또는 구조화된 API endpoint로 콘텐츠를 제공. AI가 크롤링 없이도 최신 콘텐츠에 접근 가능 | Medium |
| 4.8 | Sitemap lastmod 정확성 | sitemap.xml의 lastmod가 실제 콘텐츠 수정일과 일치하는지. 불일치 시 크롤러가 sitemap 자체를 불신 | High |
| 4.9 | AI 인용 가능성 진단 | 실제 AI 엔진(ChatGPT, Perplexity, Claude 등)에 관련 질문을 했을 때 해당 페이지가 인용되는지 테스트 | Medium |

---

## 5. 사이트 구조 / 보안

| # | 항목 | 설명 | 중요도 |
|---|------|------|--------|
| 5.1 | HTTPS | 전체 페이지 HTTPS 적용, mixed content 없음 확인 | Critical |
| 5.2 | 내부 링크 구조 | 주요 페이지 간 상호 링크, 고아 페이지(어디서도 링크되지 않는 페이지) 식별 | High |
| 5.3 | 외부 링크 구조 | 깨진 외부 링크, nofollow 적절성, 신뢰할 수 있는 외부 출처 링크 | Medium |
| 5.4 | 렌더링 방식 | SSR(서버사이드) vs CSR(클라이언트사이드) vs iframe. CSR/iframe 의존 시 AI 크롤러 접근성 저하 | Critical |
| 5.5 | 보안 헤더 | HSTS, X-Frame-Options, Content-Security-Policy, X-Content-Type-Options 등 주요 보안 헤더 적용 여부 | Medium |
| 5.6 | 페이지 간 콘텐츠 공동화 | 유사/중복 콘텐츠를 가진 페이지 식별. thin content 페이지가 많으면 사이트 전체 신뢰도 하락 | Medium |

---

## 중요도 기준

| 등급 | 의미 | AI 인용 영향 |
|------|------|-------------|
| **Critical** | 미충족 시 AI 인용 자체가 불가능하거나 심각하게 제한됨 | 차단/제외 수준 |
| **High** | AI 인용 품질과 빈도에 직접적 영향 | 순위 하락 |
| **Medium** | 개선 시 AI 인용 가능성을 높이는 보완 요소 | 경쟁력 강화 |
| **Low** | 직접적 AI 인용 영향은 낮으나 전환율 등 비즈니스 지표에 기여 | 간접 효과 |

---

## 프로세스 프레임워크

```
STEP 1. 현황진단 / 문제정의   →  위 전체 항목 점검, 점수화
STEP 2. 기술/환경 최적화      →  메타데이터·스키마·URL·보안헤더 개선
STEP 3. 콘텐츠 최적화         →  H태그·FAQ·저자·출처·AI가독구조 개선
STEP 4. 성과 모니터링         →  AI 인용 추적, 색인 상태, 스키마 유효성 정기 점검
```
