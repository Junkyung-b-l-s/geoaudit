import UrlInputForm from '@/components/UrlInputForm';
import AuditHistory from '@/components/AuditHistory';

const CATEGORIES = [
  { label: '성능', count: 4 },
  { label: '콘텐츠 구조', count: 11 },
  { label: '메타데이터', count: 14 },
  { label: '크롤링/색인', count: 14 },
  { label: '구조/보안', count: 6 },
  { label: 'E-E-A-T/신뢰도', count: 5 },
];

export default function Home() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/images/home_hero_bg.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            backgroundRepeat: 'no-repeat',
            opacity: 0.3,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(0,53,218,0.04) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="w-full max-w-xl mx-auto relative z-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest mb-6"
            style={{
              fontFamily: 'var(--font-inter)',
              color: 'var(--color-primary)',
              background: 'rgba(0,53,218,0.08)',
              border: '1px solid rgba(0,53,218,0.15)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse-glow" />
            Generative Engine Optimization
          </div>

          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{
              fontFamily: 'var(--font-playfair)',
              color: 'var(--color-text-primary)',
              lineHeight: 1.15,
            }}
          >
            Technical GEO
            <br />
            <span style={{ color: 'var(--color-primary)' }}>Audit</span>
          </h1>

          <p
            className="text-sm md:text-base max-w-md mx-auto leading-relaxed"
            style={{
              fontFamily: 'var(--font-pretendard)',
              color: 'var(--color-text-secondary)',
            }}
          >
            AI 인용 최적화를 위한 웹사이트 기술 환경 자동 진단.
            <br />
            URL 하나로 54개 항목을 전수 점검합니다.
          </p>
        </div>

        {/* Form */}
        <UrlInputForm />

        {/* Category chips */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <span
              key={cat.label}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                fontFamily: 'var(--font-inter)',
                color: 'var(--color-text-tertiary)',
                border: '1px solid var(--color-border)',
              }}
            >
              {cat.label}
              <span className="opacity-50">{cat.count}</span>
            </span>
          ))}
        </div>

        {/* History */}
        <AuditHistory />
      </div>
    </div>
  );
}
