'use client';

import { useEffect, useRef, useState } from 'react';

interface ProgressData {
  stage: string;
  progress: number;
  message: string;
  reportReady?: boolean;
  error?: string;
}

interface LogEntry {
  id: number;
  stage: string;
  message: string;
  timestamp: number;
}

const STAGE_META: Record<string, { label: string; icon: string; desc: string }> = {
  init: { label: '초기화', icon: '◈', desc: '감사 환경을 준비하고 있습니다' },
  'site-fetch': { label: '사이트 정보 수집', icon: '◉', desc: 'robots.txt, sitemap, llms.txt 등 사이트 기본 설정을 확인합니다' },
  crawling: { label: '페이지 크롤링', icon: '◎', desc: 'Sitemap과 링크를 따라 페이지를 수집합니다' },
  'crawling-links': { label: '링크 크롤링', icon: '◎', desc: 'BFS 방식으로 내부 링크를 탐색합니다' },
  lighthouse: { label: 'Lighthouse 분석', icon: '◆', desc: 'Core Web Vitals, 로딩 속도, 이미지 최적화를 측정합니다' },
  'page-checks': { label: '페이지별 점검', icon: '◇', desc: '메타데이터, 스키마, 콘텐츠 구조를 항목별로 검사합니다' },
  'llm-judgment': { label: 'AI 판정', icon: '◈', desc: 'Claude가 키워드 정합성, URL 구조, 인용 가능성을 판정합니다' },
  scoring: { label: '점수 계산', icon: '▣', desc: '가중치 기반 종합 점수를 산출합니다' },
  done: { label: '완료', icon: '✦', desc: '감사가 완료되었습니다' },
  error: { label: '오류', icon: '✕', desc: '오류가 발생했습니다' },
};

const STAGE_ORDER = ['site-fetch', 'crawling', 'lighthouse', 'page-checks', 'llm-judgment', 'scoring', 'done'];

function getStageIndex(stage: string): number {
  if (stage === 'crawling-links') return STAGE_ORDER.indexOf('crawling');
  return STAGE_ORDER.indexOf(stage);
}

export default function AuditProgress({
  auditId,
  onComplete,
}: {
  auditId: string;
  onComplete: () => void;
}) {
  const [data, setData] = useState<ProgressData>({ stage: 'init', progress: 0, message: '연결 중...' });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);
  const logEndRef = useRef<HTMLDivElement>(null);
  const prevMsgRef = useRef('');

  useEffect(() => {
    const eventSource = new EventSource(`/api/audit/stream/${auditId}`);

    eventSource.onmessage = (event) => {
      try {
        const parsed: ProgressData = JSON.parse(event.data);
        setData(parsed);

        if (parsed.message && parsed.message !== prevMsgRef.current) {
          prevMsgRef.current = parsed.message;
          const id = ++logIdRef.current;
          setLogs((prev) => [...prev.slice(-30), { id, stage: parsed.stage, message: parsed.message, timestamp: Date.now() }]);
        }

        if (parsed.stage === 'done' || parsed.reportReady) {
          eventSource.close();
          setTimeout(onComplete, 800);
        }
        if (parsed.error || parsed.stage === 'error') {
          eventSource.close();
        }
      } catch { /* ignore */ }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [auditId, onComplete]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const stageMeta = STAGE_META[data.stage] || STAGE_META.init;
  const currentStageIdx = getStageIndex(data.stage);
  const isError = data.stage === 'error' || !!data.error;

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      {/* Stage header */}
      <div className="text-center space-y-3">
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest"
          style={{
            fontFamily: 'var(--font-inter)',
            color: isError ? 'var(--color-error)' : 'var(--color-primary)',
            background: isError ? 'rgba(239,68,68,0.08)' : 'rgba(0,53,218,0.08)',
            border: `1px solid ${isError ? 'rgba(239,68,68,0.15)' : 'rgba(0,53,218,0.15)'}`,
          }}
        >
          <span className="animate-pulse-glow">{stageMeta.icon}</span>
          {stageMeta.label}
        </div>

        <div
          className="text-5xl font-bold tabular-nums"
          style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-primary)' }}
        >
          {data.progress}<span className="text-2xl" style={{ color: 'var(--color-text-tertiary)' }}>%</span>
        </div>

        <p className="text-sm" style={{ fontFamily: 'var(--font-pretendard)', color: 'var(--color-text-secondary)' }}>
          {stageMeta.desc}
        </p>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--color-bg-elevated)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
            style={{
              width: `${data.progress}%`,
              background: `linear-gradient(90deg, var(--color-primary), #3b82f6)`,
              boxShadow: '0 0 12px rgba(0,53,218,0.4)',
            }}
          >
            {/* Shimmer sweep */}
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              animation: 'shimmer 2s ease-in-out infinite',
            }} />
          </div>
        </div>

        {/* Stage dots */}
        <div className="flex justify-between mt-3 px-1">
          {STAGE_ORDER.slice(0, -1).map((s, i) => {
            const meta = STAGE_META[s];
            const isActive = i === currentStageIdx;
            const isDone = i < currentStageIdx;
            return (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className="relative flex items-center justify-center">
                  <div
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{
                      background: isDone || isActive ? 'var(--color-primary)' : 'var(--color-bg-hover)',
                      boxShadow: isActive ? '0 0 8px var(--color-primary-glow)' : 'none',
                      transform: isActive ? 'scale(1.5)' : 'scale(1)',
                    }}
                  />
                  {isActive && (
                    <div className="absolute w-2 h-2 rounded-full animate-ping" style={{
                      background: 'var(--color-primary)',
                      opacity: 0.4,
                    }} />
                  )}
                </div>
                <span
                  className="text-[9px] font-medium transition-colors hidden md:block"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    color: isDone || isActive ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)',
                  }}
                >
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live log */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: '#ef4444', opacity: 0.6 }} />
            <div className="w-2 h-2 rounded-full" style={{ background: '#eab308', opacity: 0.6 }} />
            <div className="w-2 h-2 rounded-full" style={{ background: '#10b981', opacity: 0.6 }} />
          </div>
          <div className="flex-1 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-success)' }} />
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}
            >
              Audit Log
            </span>
          </div>
          <div className="w-12" />
        </div>

        {/* Log entries */}
        <div className="p-4 max-h-48 overflow-y-auto">
          <div className="space-y-1">
            {logs.map((log, i) => (
              <div
                key={log.id}
                className="flex gap-2 text-xs leading-5"
                style={{
                  opacity: i === logs.length - 1 ? 1 : 0.5,
                  animation: i === logs.length - 1 ? 'fade-in-up 0.3s ease-out' : undefined,
                }}
              >
                <span
                  className="shrink-0 tabular-nums"
                  style={{ fontFamily: 'var(--font-geist-mono, monospace)', color: 'var(--color-text-tertiary)', fontSize: '10px', lineHeight: '20px' }}
                >
                  {new Date(log.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span style={{ fontFamily: 'var(--font-pretendard)', color: 'var(--color-text-secondary)' }}>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>

          {/* Thinking indicator */}
          {data.stage !== 'done' && data.stage !== 'error' && logs.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <span className="shrink-0 tabular-nums" style={{
                fontFamily: 'var(--font-geist-mono, monospace)', fontSize: '10px', lineHeight: '20px', color: 'var(--color-text-tertiary)',
              }}>
                {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full" style={{
                    background: 'var(--color-text-tertiary)',
                    animation: `thinking-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {logs.length === 0 && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full" style={{
                    background: 'var(--color-text-tertiary)',
                    animation: `thinking-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
              <span>감사 시작 대기 중...</span>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {data.error && (
        <div
          className="rounded-xl p-4 text-sm"
          style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.15)',
            color: '#f87171',
            fontFamily: 'var(--font-pretendard)',
          }}
        >
          {data.error}
        </div>
      )}
    </div>
  );
}
