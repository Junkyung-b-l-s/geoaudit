# GEO Audit 코드 개선 작업 계획

- **작성일**: 2026-05-19
- **배경**: 현대이지웰 보고서(`uVaWcGlpWv8J`) 검토에서 Tier 1·2 이슈 8건 발견. 본 문서는 그 근본 원인을 코드 레벨로 정리하고 처리 범위를 확정한다.
- **연관 문서**:
  - [top-mgmt-decision-memo-hyundaiezwel.md](top-mgmt-decision-memo-hyundaiezwel.md) — 정정 항목 Tier 분류
  - [audit-report-review-uVaWcGlpWv8J.md](audit-report-review-uVaWcGlpWv8J.md) — 코드/내부 정합성 검토
  - [hyundaiezwel-audit-result-review.md](hyundaiezwel-audit-result-review.md) — 외부 사실/해석 정합성 검토

---

## 1. 문제 정리 — 5개 근본 원인

원인 분석은 두 갈래(파이프라인 단계별 / 데이터 흐름별)에서 진행했고, 공통되는 3개와 비공통 항목 일부를 합쳐 **5개 근본 원인**으로 확정했다.

### P1. 상태 타입이 의미를 충분히 구분하지 못함 *(공통)*

- 현재 [src/types/check.ts:1](../src/types/check.ts#L1)의 `CheckStatus = 'pass' | 'fail' | 'warning' | 'info' | 'na'`
- 같은 `na`라도 점수가 0 / 50 / 70 / 100으로 흩어져 있음 → 집계가 항목별로 달라짐
- "측정 불가"와 "측정 통과"가 같은 status로 표현됨 → INP null, robots.txt 부재가 자동으로 좋은 결과로 승격
- 발생 증상: T1-1(자동 승격), T2-1(INP 0ms 표기), T3-2(na 점수 비일관)

### P2. 전략 생성이 측정값 무관 템플릿 *(공통)*

- [src/lib/scoring/strategies.ts:20-23](../src/lib/scoring/strategies.ts#L20-L23)의 `isBad = status === 'fail' || 'warning'` 단일 조건
- 체크 결과 객체 전체가 아닌 ID만 받아 분기 → 측정값(TTFB ms, sitemap 존재 여부)이 rationale에 반영 안 됨
- 같은 ID 안에 여러 지표가 묶여 있어도 (`1.2` = TTFB + TTI) 어느 쪽이 문제인지 구분 못 함
- 발생 증상: T1-2("TTFB 문제"인데 실제는 TTI), T1-3("sitemap lastmod 존재" 전제인데 sitemap 자체가 없음)

### P3. LLM 호출에 컨텍스트·사실 가드 부재 *(공통 + 비공통 부분)*

- [src/lib/llm/batch.ts:96-118](../src/lib/llm/batch.ts#L96-L118) `runAiCitation`은 도메인 + 페이지 제목만 LLM에 넘김
- 회사 정체성(브랜드명, 그룹 소속, 업종)이 입력에 없고, 응답은 JSON 파싱만 거쳐 그대로 description으로 저장
- 발생 증상: T1-1(현대백화점그룹을 현대자동차그룹으로 환각)

### P4. 집계 단계에서 N/A를 늦게 제거 *(비공통, 즉시 처리)*

- [src/lib/scoring/calculator.ts:75-89](../src/lib/scoring/calculator.ts#L75-L89) `weightedAverage`는 `na`·`info` 제외 (정상)
- 그러나 [src/lib/scoring/calculator.ts:101-114](../src/lib/scoring/calculator.ts#L101-L114) `deduplicateById`는 같은 ID 평균 계산 시 `na`·`info` 점수를 그대로 합산
- 결과: FAQ Schema(3.8)가 적용 6개 + na 4개 → 평균 58점으로 부풀려짐 (영향 페이지만 보면 30점)
- 발생 증상: T2-2

### P5. HTTP 외부 요청이 HEAD 단독, 상태코드 의미 미구분 *(비공통, 즉시 처리)*

- [src/lib/checkers/site-structure.ts:161-177](../src/lib/checkers/site-structure.ts#L161-L177) `5.3 외부 링크 구조` 등 5곳에서 HEAD만 사용
- `status >= 400`을 모두 broken으로 카운트 → 405(메서드 미지원), 404(리소스 없음), 5xx, 타임아웃이 동일 취급
- 발생 증상: T1-4 (외부 링크 6건 중 4건 이상 오탐 — GET으로는 200)

### 처리 보류 (이번 라운드 제외)

- **PageContext/SiteContext 풀 파이프라인**: 풀 도입은 비용 대비 ROI 낮음. P3 안에서 SiteContext의 LLM 주입만 좁게 처리하고, 페이지 타입 분류는 3.7 체커 휴리스틱으로 흡수.
- **체커 ID 분리** (`1.2` → `1.2a`/`1.2b`): weights/UI/스코어 호환성 영향 큼. P2 작업으로 "전략이 결과 객체 받아 조건절 조립"하면 ID 그대로 두고도 해결됨.

---

## 2. 해결 방안 — 작업 단위

각 작업은 독립 실행 가능. 보고서 메모의 Phase 0(0.5~1일 문장 패치)과 별개로, 다음 audit 재실행 시 동일 이슈 재발을 막는 코드 트랙.

### W1. 집계 N/A 타이밍 수정 *(P4, 최우선·최소)*

- **파일**: [src/lib/scoring/calculator.ts:101-114](../src/lib/scoring/calculator.ts#L101-L114)
- **변경**: `deduplicateById` 평균 계산에서 `na`·`info` 제외. 같은 ID의 모든 항목이 `na`면 단일 `na` 결과 유지.

```ts
// before
const avgScore = Math.round(items.reduce((s, r) => s + r.score, 0) / items.length);

// after
const active = items.filter(r => r.status !== 'na' && r.status !== 'info');
if (active.length === 0) return items[0]; // 전부 na/info면 그대로
const avgScore = Math.round(active.reduce((s, r) => s + r.score, 0) / active.length);
const worst = active.reduce((w, r) => (r.score < w.score ? r : w));
```

- **검증**: 현대이지웰 JSON 재실행 시 FAQ Schema(3.8) 점수가 58 → 30 근방으로 떨어져야 함
- **규모**: ~10 LOC, 단일 함수

### W2. HTTP probe helper 도입 *(P5)*

- **새 파일**: `src/lib/crawler/http-probe.ts` — `probeUrl(url, opts?)` 헬퍼
  - HEAD 시도 → `405` / `501`이면 `GET Range: bytes=0-0` 폴백
  - 반환: `{ ok: boolean, status: number, reason: 'ok' | 'not_found' | 'server_error' | 'timeout' | 'network' }`
- **호출부 교체** (5곳):
  - [src/lib/checkers/site-structure.ts:163](../src/lib/checkers/site-structure.ts#L163) — 5.3 외부 링크 (T1-4 직접 원인, **필수**)
  - [src/lib/checkers/authority.ts:35](../src/lib/checkers/authority.ts#L35) — 6.1 About 페이지
  - [src/lib/checkers/crawling-indexing.ts:297](../src/lib/checkers/crawling-indexing.ts#L297) — 4.7 피드
  - [src/lib/checkers/crawling-indexing.ts:408](../src/lib/checkers/crawling-indexing.ts#L408) — 4.10 AI 에이전트 파일
  - [src/lib/checkers/crawling-indexing.ts:640](../src/lib/checkers/crawling-indexing.ts#L640) — 4.14 API 엔드포인트
- **broken 판정 정책**: `4xx`(404 외) 또는 `5xx` 또는 `timeout`/`network`만 broken. `200~399`, `405 + GET 200`은 살아있음.
- **검증**: 부록 B에 나열된 4개 URL이 broken에서 빠져야 함
- **규모**: helper ~50 LOC + 호출부 5곳 교체

### W3. LLM SiteContext 주입 + 사실 가드 *(P3)*

- **파일**: [src/lib/llm/prompts.ts](../src/lib/llm/prompts.ts), [src/lib/llm/batch.ts:96-118](../src/lib/llm/batch.ts#L96-L118)
- **변경**:
  1. `aiCitationUser(brandName, siteUrl, topics)` 시그니처에 `siteContext: { confirmedGroup?, industry?, knownAliases? }` 추가. 호출부에서 확인 가능한 값만 채워 넘김 (대부분 비어 있음).
  2. `AI_CITATION_SYSTEM` 프롬프트에 "siteContext에 명시된 사실만 사용. 그룹/계열/모회사 추측 금지. 모르면 '확인되지 않음'으로 답하라" 지시 추가.
  3. 응답 description을 그대로 저장하기 전, `siteContext.confirmedGroup`이 비어있는데 응답에 "그룹" 단어가 들어오면 톤다운(`status: 'info'`, 추측 제거).
- **검증**: 빈 siteContext로 현대이지웰 URL 재실행 시 "현대자동차그룹" 환각 재발하지 않음
- **규모**: 프롬프트 + 검증 후처리, ~40 LOC. siteContext 자동 추론은 이번 라운드 제외 (수동 입력 슬롯만 마련).

### W4. 상태 타입 보강 *(P1)*

- **파일**: [src/types/check.ts:1](../src/types/check.ts#L1)
- **변경**: `CheckStatus`에 의미를 분리하는 대신, **기존 5개는 유지하되 `score` 의미를 명확히** 함. 풀 5상태 타입(`unmeasured` 등) 도입은 마이그레이션 비용이 커서 보류.
  - 새 규칙: `status === 'na'` 또는 `'info'`인 결과는 `score`를 `null`로 통일 (현재 0 / 50 / 70 / 100 혼재)
  - `CheckResult.score: number | null`로 타입 확장
  - W1 집계 로직에서 `score === null`은 자동 제외 (W1과 정합)
- **호출부 영향**: 체커 ~10곳 (`na` / `info` 반환 시 `score: 0` → `score: null`)
- **검증**: 카테고리 평균에 변화 없음 (이미 W1에서 제외 처리하므로)
- **규모**: 타입 1줄 + 체커 호출부 일괄 수정. **W1 직후 진행 권고** (W1·W4 합쳐서 N/A 의미 일관성 완성)

### W5. 전략 생성기 측정값 반영 *(P2)*

- **파일**: [src/lib/scoring/strategies.ts](../src/lib/scoring/strategies.ts), [src/lib/scoring/calculator.ts:18](../src/lib/scoring/calculator.ts#L18)
- **변경**:
  1. `generateStrategies(items, lighthouseData?)`로 시그니처 확장. 현재 인자는 `CheckResult[]`만 → `lighthouseData` 추가.
  2. `performance-rendering` 절([strategies.ts:131-153](../src/lib/scoring/strategies.ts#L131-L153)): 1.2가 warning일 때 TTFB·TTI 각각 임계 초과 여부를 확인해 해당 절(clause)만 포함. TTFB 양호하면 TTFB 문구 생략.
  3. `freshness-signals` 절([strategies.ts:102-129](../src/lib/scoring/strategies.ts#L102-L129)): 4.8 결과의 `status === 'na'`(sitemap 없음)와 `status === 'warning'`(lastmod 없음)을 구분. sitemap 자체가 없으면 "sitemap lastmod 존재" 전제 문구 금지, "sitemap 발행 후 lastmod 추가" 순서로 안내.
- **검증**: 현대이지웰 재실행 시 T1-2(TTFB 오기)와 T1-3(sitemap 자기 모순) 모두 사라져야 함
- **규모**: ~80 LOC 수정 (10개 절 중 측정값 의존 절 4~5개)

---

## 3. 작업 순서 · 의존성

```
W1 (calculator N/A) ──┐
                      ├──> W4 (status score null)
                      │
W2 (HTTP probe) ──────┤
                      ├──> [재실행 검증]
W3 (LLM siteContext)──┤
                      │
W5 (strategies) ──────┘
```

- W1·W2·W3는 독립. 병렬 진행 가능.
- W4는 W1 직후 (집계에서 null score 제외 로직이 먼저 들어가야 안전).
- W5는 W4 이후 (status semantic 안정화 후).
- 전 작업 합산 예상 규모: ~250 LOC, 1~2일 분량.

---

## 4. 보고서 메모 Phase와의 매핑

| 메모 Tier | 메모 권고 | 본 코드 트랙 | 비고 |
|---|---|---|---|
| T1-1 | LLM 사실 sweep | **W3** | 문장 정정과 별개로 재발 방지 |
| T1-2 | TTFB 표현 삭제 | **W5** | 전략 절 분기 |
| T1-3 | freshness 두 전략 재작성 | **W5** | 전략 절 분기 |
| T1-4 | 6개 URL GET 재확인 | **W2** | 호출부 5.3 |
| T2-1 | INP "데이터 없음" | (이미 처리됨) | [lighthouse.ts:26-29](../src/lib/lighthouse.ts#L26-L29)에서 null 보존 중 |
| T2-2 | FAQ footnote | **W1** | 코드 차원에서 점수 자체 보정 |
| T2-3 | "허용되어 있으나" 정정 | **W5** | 4.2/4.6 절 표현 정정 |
| T2-4 | Article → Org/WebSite 교체 | (별도) | 본 라운드 보류, 3.7 체커 휴리스틱 추가는 후속 |

> 메모의 Phase 0(문장 패치)은 즉시 발송 가능, 본 코드 트랙은 다음 audit 재실행을 안전하게 만드는 트랙으로 병행.

---

## 5. 보류 항목 (별도 백로그)

- **PageContext/SiteContext 풀 파이프라인**: 페이지 타입 자동 분류 + 모든 체커 시그니처 확장. 본 라운드 비용 대비 ROI 낮음. Phase 2 운영형 제안 시 재검토.
- **체커 ID 입도 분리** (`1.2a` TTFB / `1.2b` TTI 등): W5로 동일 효과 달성하므로 우선순위 낮음.
- **3.7 Article Schema 체커 페이지 타입 휴리스틱**: T2-4 직접 대응. W5 다음 라운드에서 처리 권고 (URL 패턴 + H1 기반 보수적 판정).
- **풀 5상태 타입 (`unmeasured` / `not_applicable` / `missing_prerequisite` / ...)**: W4로 부분 해소. 본격 도입은 타 마이그레이션과 묶어 별도 트랙.
