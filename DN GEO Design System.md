# DN GEO Design System

> geo-v2-frontend 코드베이스 분석 기반 디자인 시스템 문서  
> FE Agent의 context로 사용하여 디자이너 없이도 일관된 UI 구현 가능

---

## 1. 색상 토큰 (Color Tokens)

### Primary
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--color-Main-Color-3` | `#0035DA` | 브랜드 Primary Blue. CTA 버튼, Active 상태, 링크 |
| `--color-primary` | `#0035DA` | (Main-Color-3 alias) |
| `--color-primary-light` | `#eff6ff` | Primary 배경 variant (Blue-50) |

### Semantic
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--color-page` | `#fcfcfc` | 페이지 배경 |
| `--color-card` | `#ffffff` | 카드 배경 |
| `--color-secondary` | `#64748b` | 보조 텍스트, 아이콘 (Slate-500) |

### 텍스트
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--color-content-main` | `#0f172a` | 주요 텍스트 (Slate-900) |
| `--color-content-sub` | `#64748b` | 보조 텍스트 (Slate-500) |
| `--color-content-tertiary` | `#94a3b8` | 3차 텍스트, 힌트 (Slate-400) |

### 보더
| 토큰 | 값 |
|------|-----|
| `--color-border-default` | `#e2e8f0` (Slate-200) |

### 상태 색상
| 상태 | 값 | Tailwind 클래스 |
|------|-----|----------------|
| Success | `#10b981` | `emerald-500` |
| Error / Negative | `#ef4444` | `red-500` |
| Warning | `#eab308` | `yellow-500` |

### Heatmap 컬러 스케일 (점수 기반 Blue gradient)
| 점수 범위 | 색상 | 텍스트 색상 |
|-----------|------|-------------|
| 90+ | `#1e3a8a` | White |
| 80–89 | `#1d4ed8` | White |
| 60–79 | `#3b82f6` | White |
| 40–59 | `#93c5fd` | `#0f172a` |
| 20–39 | `#dbeafe` | `#0f172a` |
| <20 | `#eff6ff` | `#0f172a` |

---

## 2. 타이포그래피 (Typography)

### 폰트 패밀리
| 변수 | 폰트 | 주 용도 |
|------|------|---------|
| `--font-playfair` | Playfair Display | 히어로/디스플레이 대형 텍스트 |
| `--font-inter` | Inter | UI 레이블, 섹션 타이틀, 버튼 |
| `--font-pretendard` | Pretendard | 본문, 한국어 콘텐츠 |
| `--font-geist-sans` | Geist Sans | 코드/시스템 텍스트 |

### 크기 & 굵기 체계
| 용도 | Size | Weight | 폰트 | 클래스 예시 |
|------|------|--------|------|-------------|
| Hero/Display | `text-4xl`–`text-7xl` | 700 | playfair | `text-6xl font-bold font-playfair` |
| Section Title | `text-3xl` | 600 | inter | `text-3xl font-semibold font-inter` |
| Card Title | `text-2xl` | 700 | inter/pretendard | `text-2xl font-bold` |
| Subsection | `text-xl` | 600–700 | inter | `text-xl font-semibold` |
| Body Large | `text-base` (16px) | 400–500 | pretendard | `text-base font-medium font-pretendard` |
| Body Default | `text-sm` (14px) | 400–500 | pretendard | `text-sm font-pretendard` |
| Label/Badge | `text-xs` (12px) | 500–600 | inter | `text-xs font-semibold font-inter` |
| Micro | 10–11px | 500–600 | inter | `text-[10px] font-semibold` |

### 라인 높이
| 용도 | 값 |
|------|----|
| Display/Hero | 1.15 |
| Body | 1.5–1.8 |
| Dense/Compact | 1.0 |
| 본문 (pretendard) | `leading-8` (2rem) |

---

## 3. 간격 & 레이아웃 (Spacing & Layout)

### 공통 Padding/Gap 값
```
p-1    = 4px    p-2    = 8px    p-3    = 12px
p-4    = 16px   p-5    = 20px   p-6    = 24px
p-8    = 32px   p-10   = 40px

gap-1  = 4px    gap-2  = 8px    gap-3  = 12px
gap-4  = 16px   gap-5  = 20px   gap-6  = 24px
```

### 컨테이너
| 용도 | 클래스 |
|------|--------|
| 메인 콘텐츠 영역 | `max-w-400 w-full mx-auto p-8` |
| 사이드바 너비 | `w-64` (256px) |
| 섹션 간격 | `space-y-16` |

### 보더 & 라운드
| 용도 | 클래스 |
|------|--------|
| 기본 카드 | `rounded-lg` (8px) |
| 대형 카드 | `rounded-2xl` (16px) |
| 버튼 | `rounded-md` (6px) |
| 칩/배지 | `rounded-full` |
| 보더 색상 (기본) | `border-slate-100` / `border-slate-200` |

### 섀도우 패턴
| 용도 | 값 |
|------|----|
| 카드 기본 | `shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)]` |
| Primary 글로우 | `shadow-[0px_0px_30px_0px_rgba(0,53,218,0.30)]` |
| 드롭다운/툴팁 | `shadow-[0px_4px_30px_0px_rgba(0,0,0,0.25)]` |
| 미니멀 | `shadow-sm` |

---

## 4. 컴포넌트 (Components)

### Button

```tsx
// Variants
primary   → bg-blue-600 text-white hover:bg-blue-700
secondary → bg-gray-100 text-gray-900 hover:bg-gray-200
outline   → border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700
ghost     → bg-transparent hover:bg-gray-100 text-gray-700
white     → bg-white hover:bg-slate-50
slate     → bg-slate-100 hover:bg-slate-200

// Sizes
sm → h-8 px-3 text-xs
md → h-10 px-4 text-sm   (기본)
lg → h-12 px-6 text-base

// Base classes
inline-flex items-center justify-center gap-2 rounded-md font-medium
transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
```

**앱 내 공통 버튼 패턴:**
```tsx
inline-flex w-fit items-center justify-center gap-2 rounded-md
px-4 py-2 outline outline-1 outline-slate-300 cursor-pointer
font-inter text-sm font-semibold
```

---

### Card

```tsx
// 기본
bg-white rounded-lg border border-gray-200 shadow-sm

// 대형 (페이지 내 주요 카드)
rounded-2xl border border-slate-200 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)]

// Padding 옵션
sm → p-3
md → p-5   (기본)
lg → p-8
```

---

### Badge

```tsx
// Variants
default → bg-blue-100 text-blue-800
success → bg-green-100 text-green-800
warning → bg-yellow-100 text-yellow-800
error   → bg-red-100 text-red-800
neutral → bg-gray-100 text-gray-800
outline → bg-transparent border border-slate-200 text-slate-600

// Base classes
inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
```

---

### Input / SearchInput

```tsx
// Search Input
border border-slate-200 rounded-lg pl-9 pr-4 py-2 w-64 bg-white text-sm
focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500

// Primary Input (Freemium)
px-5 md:px-6 py-4 md:py-5
text-base md:text-lg font-semibold text-Main-Color-3 font-playfair
outline-none placeholder:text-slate-300 bg-transparent
focus-within:ring-2 focus-within:ring-Main-Color-3/30
```

---

### Tabs

```tsx
// Active tab
text-blue-600 font-bold
+ 하단 인디케이터: h-[2px] bg-blue-600 (absolute 포지션)

// Inactive tab
text-slate-500 hover:text-slate-700

// Separator between tabs
h-5 w-px bg-slate-200 mx-6

// Base
pb-3 font-medium transition-colors relative cursor-pointer text-left
```

---

### Section Title (SectionTitle.tsx)

```tsx
// 타이틀
text-black text-3xl font-semibold font-inter capitalize

// 서브타이틀
text-neutral-400 text-sm font-medium font-inter

// 구조
<div class="flex flex-col gap-2.5">
  <h2>{title}</h2>
  <p>{subtitle}</p>
  {rightContent}
</div>
```

---

### Subsection Title (SubsectionTitle.tsx)

```tsx
// 상단 라벨
text-xs text-slate-500 uppercase tracking-wider font-semibold

// 메인 타이틀
text-2xl font-bold text-slate-900
```

---

### AppSidebar

```tsx
// 컨테이너
w-64 h-full border-r border-slate-100 bg-white

// 섹션 제목
text-[10px] font-semibold text-slate-400

// 메뉴 아이템
gap-[5px] px-[5px] py-2 rounded
// Active: bg-slate-100
// Hover: bg-slate-50

// 브랜드 셀렉터
h-10 flex items-center gap-3 px-2 rounded-lg
```

---

### AppHeader

```tsx
border-b border-slate-100 bg-white px-5 py-5

// 좌측: 로고(w-5 h-5) + 브랜드명(text-xl uppercase)
// 구분선: h-6 w-px bg-slate-200
// 우측: Quarter/Category 드롭다운 (gap-4)
```

---

### Loader

```tsx
// Sizes
sm → w-4 h-4
md → w-8 h-8   (기본)
lg → w-12 h-12
xl → w-16 h-16

// 클래스: animate-spin text-primary

// Freemium 전용 (ldrs/react Bouncy)
size={60} speed={1.2} color="#0035DA"
```

---

### RightSheet (Slide-out Panel)

```tsx
// 컨테이너
fixed right-0 top-0 h-full max-w-md bg-white
transform transition-transform duration-700 ease-in-out
// 열릴 때: translate-x-0  닫힐 때: translate-x-full

// 백드롭
fixed inset-0 z-40 bg-black/30
transition-opacity duration-700

// 헤더
border-b border-slate-100 px-6 pb-4 pt-6 bg-white
```

---

### BVI Chart (Radial Bar)

```tsx
// 컨테이너
rounded-2xl bg-white p-5 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)]

// 차트
height: 250px
각도: -120° ~ +120°
Fill: #0A33E5 (primary blue)
Track: #E5EAF1

// 값 표시
font-size: 64px, bold, #0B0B0B

// 트렌드 배지 (차트 하단)
Emerald 배경(상승) / Red(하락) / Gray(중립)
text-sm font-medium, rounded-full
```

---

### Heatmap Table

```tsx
// 테이블
text-sm border-collapse table-fixed min-w-[480px]

// 헤더 행
bg-slate-50

// 행 hover
hover:bg-slate-50/50 transition-colors

// 셀 색상
점수 기반 Blue gradient (Section 1 Heatmap 색상 참고)
// 60+ → White text, <60 → #0f172a text

// 리더 배지
Trophy 아이콘 (yellow) - 각 행의 최고 점수 브랜드
```

---

### BrandRankTable

```tsx
// 행 스타일
Top 3: bg-slate-50 border-b border-slate-200
선택됨: bg-blue-50
나머지: hover:bg-gray-50/50

// 셀 패딩: py-6 px-4
// 점수 셀: text-slate-600 text-lg font-medium

// 헤더: sticky top-0 z-10 bg-white
// 정렬 아이콘: ▼▲ (Unicode)
```

---

### InsightCard

```tsx
// 컨테이너
bg-white rounded-2xl shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)]
px-6 py-7 flex flex-col gap-5 h-94

// 컨텐츠 영역
rounded-lg p-5 flex-1 overflow-y-auto

// 텍스트
text-slate-600 text-left font-pretendard text-base leading-8
```

---

## 5. 특수 패턴 (Special Patterns)

### Gradient Backgrounds

```css
/* Freemium Result 헤더 */
linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #ede9fe 100%)

/* Radial 글로우 (히어로 섹션) */
bg-[radial-gradient(ellipse_80%_60%_at_50%_75%,
  rgba(55,104,255,0.13) 0%,
  rgba(55,104,255,0.05) 45%,
  transparent 75%)]
```

### Insight 해석 카드 배경

```css
background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #ede9fe 100%);
border: 1px solid rgba(226, 232, 240, 0.6);
box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,53,218,0.08);
```

### Dropdown/Select 패턴

```tsx
// 기본
bg-white border border-slate-200 rounded-lg text-sm outline-none

// Focus
focus:border-primary focus:ring-2 focus:ring-primary/20

// Hover
hover:bg-slate-50
```

### Modal/Overlay 패턴

```tsx
// 백드롭
fixed inset-0 z-50 bg-black/40

// 콘텐츠
bg-white rounded-xl p-6 shadow-xl max-w-lg
```

---

## 6. 애니메이션 (Animations)

### Keyframes

```css
@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes mesh-drift {
  0%, 100% { transform: translate3d(0, 0, 0); }
  25%       { transform: translate3d(2.8%, -2.5%, 0); }
  50%       { transform: translate3d(-2.5%, 2.2%, 0); }
  75%       { transform: translate3d(1.5%, 3%, 0); }
}
```

### 공통 Transition 클래스

| 클래스 | 용도 |
|--------|------|
| `transition-colors` | 색상 변경 (hover, active) |
| `transition-opacity duration-200` | 빠른 페이드 |
| `transition-opacity duration-700` | 슬로우 페이드 (RightSheet) |
| `transition-transform duration-700 ease-in-out` | 패널 슬라이드 |
| `transition-shadow` | hover 섀도우 변경 |
| `animate-spin` | 로딩 스피너 |
| `animate-pulse` | 스켈레톤/로딩 텍스트 |

---

## 7. 반응형 설계 (Responsive Design)

### 브레이크포인트
- `md`: 768px
- `lg`: 1024px

### 공통 반응형 패턴

```tsx
// 표시/숨김
hidden md:block   /   md:hidden

// Flex 방향
flex-col md:flex-row

// Grid 컬럼
grid-cols-1 md:grid-cols-2

// 간격
px-6 md:px-12
py-12 md:py-20

// 폰트 크기
text-sm md:text-base
text-4xl md:text-6xl lg:text-7xl
```

---

## 8. 페이지 구조 (Page Structure)

### 레이아웃 그룹

| 레이아웃 | 경로 | 구성요소 |
|----------|------|---------|
| `(main)` | 인증된 앱 | AppSidebar + AppHeader |
| `(freemium)` | 무료 분석 페이지 | FreemiumSidebar |
| `(auth)` | 로그인/인증 | 심플 레이아웃 |
| `(public)` | 공개 랜딩 | 풀페이지 |

### 주요 페이지 목록

**인증 필요 (Main App):**
- `/overview` — 브랜드 BVI 점수 + 시계열 차트 + 브랜드 랭킹
- `/category` — 카테고리별 시장 인사이트
- `/insights` — Index 상세 분석
- `/events` — 이벤트 리스트 & 트렌드
- `/opportunities` — 전략적 기회 발굴
- `/content` — 콘텐츠 관리/생성
- `/brand-hub` — 브랜드 키트
- `/brand` — 브랜드 디렉토리

**공개 (Freemium):**
- `/` — 공개 랜딩 페이지
- `/home` — 무료 BVI 분석 입력
- `/result` — 분석 결과 대시보드

---

## 9. FE Agent 사용 가이드

### 새 컴포넌트 구현 시 체크리스트

1. **색상**: Primary blue `#0035DA`, 텍스트는 Slate 스케일 사용
2. **폰트**: 한국어 콘텐츠 → Pretendard, UI 레이블 → Inter, 디스플레이 → Playfair
3. **카드**: `rounded-2xl + shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)]` 패턴
4. **버튼**: 기존 variant 중 선택, 새 variant 생성 금지
5. **간격**: Tailwind 기본 스케일 (p-2, p-4, p-6, p-8) 준수
6. **보더**: `border-slate-100` 또는 `border-slate-200` 사용
7. **애니메이션**: `transition-colors`, `transition-opacity` 등 기존 패턴 활용
8. **반응형**: Mobile-first, `md:` 브레이크포인트 기준

### 패턴 위반 금지 목록

- 임의의 HEX 색상 직접 입력 금지 (정의된 토큰 사용)
- `rounded-3xl` 이상 금지 (최대 `rounded-2xl`)
- `font-bold` + `font-playfair` 조합은 Hero 영역 전용
- 인라인 `style={}` 사용 금지 (그라디언트 배경 제외)
- Tailwind `arbitrary value`는 기존 코드에 있는 패턴만 허용

---

*생성일: 2026-05-04 | 기반 브랜치: geo-v2-frontend (현재 로컬 브랜치)*
