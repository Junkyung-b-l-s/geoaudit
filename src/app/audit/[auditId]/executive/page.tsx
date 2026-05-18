'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { AuditReport, CategoryScore } from '@/types/audit';

function scoreColor(score: number): string {
  if (score >= 90) return '#10b981';
  if (score >= 70) return '#3b82f6';
  if (score >= 50) return '#eab308';
  return '#ef4444';
}

function scoreLabel(score: number): string {
  if (score >= 90) return '우수';
  if (score >= 70) return '양호';
  if (score >= 50) return '보통';
  if (score >= 30) return '미흡';
  return '심각';
}

function ScoreGauge({ score, size = 160, label }: { score: number; size?: number; label: string }) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = scoreColor(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-bg-elevated)" strokeWidth="8" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-inter)', color }}>{score}</span>
          <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-inter)', color }}>{scoreLabel(score)}</span>
        </div>
      </div>
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>
        {label}
      </span>
    </div>
  );
}

function StatCard({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="rounded-xl p-5 text-center" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
      <div className="text-2xl font-bold tabular-nums mb-1" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-primary)' }}>{value}</div>
      <div className="text-xs font-medium" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-secondary)' }}>{label}</div>
      {sub && <div className="text-[10px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>{sub}</div>}
    </div>
  );
}

function CategoryBar({ cat, index }: { cat: CategoryScore; index?: number }) {
  const color = scoreColor(cat.score);
  const pass = cat.items.filter((i) => i.status === 'pass').length;
  const total = cat.items.length;
  const displayName = cat.name.replace(/^\d+\.\s*/, '');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-primary)' }}>{index != null ? `${index}. ` : ''}{displayName}</span>
        <span className="text-sm font-bold tabular-nums" style={{ fontFamily: 'var(--font-inter)', color }}>{cat.score}점</span>
      </div>
      <div className="w-full h-2 rounded-full" style={{ background: 'var(--color-bg-elevated)' }}>
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${cat.score}%`, background: color }} />
      </div>
      <div className="flex justify-between">
        <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>{pass}/{total} 항목 통과</span>
        {cat.insight && (
          <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>{scoreLabel(cat.score)}</span>
        )}
      </div>
    </div>
  );
}

export default function ExecutiveReport() {
  const params = useParams();
  const auditId = params.auditId as string;
  const [report, setReport] = useState<AuditReport | null>(null);

  const fetchReport = useCallback(async () => {
    const res = await fetch(`/api/report/${auditId}`);
    if (res.status === 200) setReport(await res.json());
  }, [auditId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  if (!report) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="animate-spin w-5 h-5" style={{ color: 'var(--color-primary)' }} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span style={{ color: 'var(--color-text-secondary)' }}>리포트를 불러오고 있어요...</span>
        </div>
      </div>
    );
  }

  const categories = report.categories ?? [];
  const strategies = report.strategies ?? [];
  const seoCats = categories.filter((c) => ['performance', 'metadata', 'structure'].includes(c.id));
  const geoCats = categories.filter((c) => ['content', 'crawling', 'authority'].includes(c.id));
  const avg = (cats: CategoryScore[]) => cats.length ? Math.round(cats.reduce((s, c) => s + c.score, 0) / cats.length) : 0;
  const seoScore = avg(seoCats);
  const geoScore = avg(geoCats);

  const allItems = categories.flatMap((c) => c.items);
  const passCount = allItems.filter((i) => i.status === 'pass').length;
  const failCount = allItems.filter((i) => i.status === 'fail').length;
  const criticalFails = allItems.filter((i) => i.status === 'fail' && i.severity === 'critical');
  const overallScore = report.overallScore ?? 0;
  const totalPages = report.totalPages ?? 0;

  const host = (() => { try { return new URL(report.url).hostname; } catch { return report.url; } })();

  return (
    <div className="py-12 px-4">
      <div className="w-full max-w-3xl mx-auto space-y-12">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between print:hidden">
          <Link href={`/audit/${auditId}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            기술 상세 보기
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
            style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            PDF 저장
          </button>
        </div>

        {/* ── Header ── */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-primary)', background: 'rgba(0,53,218,0.08)', border: '1px solid rgba(0,53,218,0.15)' }}>
            Executive Summary
          </div>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
            {host}
          </h1>
          <p className="text-sm" style={{ fontFamily: 'var(--font-pretendard)', color: 'var(--color-text-secondary)' }}>
            Technical GEO 진단 결과 · {new Date(report.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* ── Score overview ── */}
        <div className="rounded-2xl p-8" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <div className="flex flex-col md:flex-row items-center justify-center gap-10">
            <ScoreGauge score={overallScore} size={160} label="종합 점수" />
            <div className="flex gap-8">
              <ScoreGauge score={seoScore} size={100} label="SEO 기반" />
              <ScoreGauge score={geoScore} size={100} label="GEO 최적화" />
            </div>
          </div>
        </div>

        {/* ── Key numbers ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard value={`${totalPages}`} label="분석 페이지" />
          <StatCard value={`${passCount}/${allItems.length}`} label="통과 항목" sub={allItems.length > 0 ? `${Math.round(passCount / allItems.length * 100)}% 통과율` : '0% 통과율'} />
          <StatCard value={`${failCount}`} label="미충족 항목" sub={criticalFails.length > 0 ? `Critical ${criticalFails.length}개` : 'Critical 없음'} />
          <StatCard
            value={report.lighthouseData ? `${report.lighthouseData.performanceScore}` : '-'}
            label="PSI 성능 점수"
            sub={report.lighthouseData?.crux?.overallCategory === 'FAST' ? 'CrUX 통과' : report.lighthouseData?.crux ? 'CrUX 미달' : undefined}
          />
        </div>

        {/* ── Executive Summary ── */}
        <div className="rounded-xl p-6 space-y-4" style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
        }}>
          <h2 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-primary)' }}>
            Executive Summary
          </h2>
          <div className="space-y-3 text-[15px] leading-8" style={{ fontFamily: 'var(--font-pretendard)', color: 'var(--color-text-secondary)' }}>
            <p className="text-xs leading-relaxed" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>
              AI 모델은 학습 데이터에 포함된 콘텐츠를 반복적으로 재학습합니다. GEO/SEO가 일찍 준비된 사이트일수록 더 많은 학습 사이클에 포함되어, 인용 빈도와 정확도가 복리로 증가합니다.
            </p>
            {overallScore >= 80 ? (<>
              <p>
                <strong style={{ color: 'var(--color-text-primary)' }}>{host}</strong>는 SEO 기반({seoScore}점)과 GEO 최적화({geoScore}점)가 고르게 갖춰져 있습니다. 전체 {allItems.length}개 항목 중 {passCount}개({allItems.length > 0 ? Math.round(passCount / allItems.length * 100) : 0}%)가 기준을 충족하고 있어, AI 학습 데이터에 양질의 브랜드 콘텐츠가 이미 축적되고 있을 가능성이 높습니다.
              </p>
              <p>
                이 상태를 유지하면 AI 인용 빈도가 시간이 지날수록 자연스럽게 늘어납니다. 나머지 {failCount}개 항목을 추가 개선하면 노출 범위를 더 넓힐 수 있습니다.
              </p>
            </>) : overallScore >= 50 ? (<>
              <p>
                <strong style={{ color: 'var(--color-text-primary)' }}>{host}</strong>는 기본적인 SEO 기반({seoScore}점)은 갖추고 있으나, AI 모델이 콘텐츠를 정확히 이해하고 인용하기 위한 <strong style={{ color: 'var(--color-text-primary)' }}>GEO 최적화({geoScore}점)에 개선 여지</strong>가 있습니다.
              </p>
              <p>
                GEO 준비가 늦어질수록 AI 학습 사이클에서 누락되는 기간이 길어지고, 그만큼 인용 데이터의 축적이 지연됩니다. {failCount}개 미충족 항목 중 핵심 전략 항목을 우선 개선하면 AI 인용 정확도와 노출 빈도를 효과적으로 높일 수 있습니다.
              </p>
            </>) : (<>
              <p>
                <strong style={{ color: 'var(--color-text-primary)' }}>{host}</strong>는 SEO 기반({seoScore}점)과 GEO 최적화({geoScore}점) 모두 기준 대비 낮은 수준입니다. 현재 AI 모델의 학습 데이터에 이 사이트의 콘텐츠가 충분히 반영되지 않고 있으며, 준비가 늦어질수록 경쟁사와의 인용 데이터 격차가 누적됩니다.
              </p>
              <p>
                전체 {allItems.length}개 항목 중 {failCount}개가 미충족, 이 중 <strong style={{ color: 'var(--color-text-primary)' }}>{criticalFails.length}개가 Critical 등급</strong>입니다. 아래 우선 조치 사항을 참고하여 단계적으로 개선하고, 빠르게 AI 학습 사이클에 포함되도록 하는 것을 권장합니다.
              </p>
            </>)}
          </div>
        </div>

        {/* ── Category breakdown ── */}
        <div className="rounded-xl p-6" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <h2 className="text-sm font-semibold mb-6" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-primary)' }}>
            영역별 진단 결과
          </h2>
          <div className="space-y-6">
            {[...seoCats, ...geoCats].map((cat, i) => (
              <div key={cat.id}>
                <CategoryBar cat={cat} index={i + 1} />
                {cat.insight && (
                  <p className="mt-2 text-xs leading-relaxed pl-1" style={{ fontFamily: 'var(--font-pretendard)', color: 'var(--color-text-tertiary)' }}>
                    {cat.insight.summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Top priorities ── */}
        {strategies.length > 0 && (
          <div className="rounded-xl p-6" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-sm font-semibold mb-5" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-primary)' }}>
              우선 조치 사항
            </h2>
            <div className="space-y-4">
              {strategies.slice(0, 4).map((s, i) => (
                  <div key={s.id} className="flex gap-4">
                    <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)', background: 'var(--color-bg-elevated)' }}>
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold mb-1" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-primary)' }}>
                        {s.name}
                      </h3>
                      <p className="text-xs leading-relaxed" style={{ fontFamily: 'var(--font-pretendard)', color: 'var(--color-text-secondary)' }}>
                        {s.rationale}
                      </p>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Top 5: Urgency × Impact ── */}
        {(() => {
          const failed = allItems.filter((i) => i.status === 'fail' || i.status === 'warning');
          if (failed.length === 0) return null;

          const severityWeight: Record<string, number> = { critical: 3, high: 2, medium: 1 };
          const impactScore = (item: typeof failed[0]) => severityWeight[item.severity] ?? 1;
          const compositeScore = (item: typeof failed[0]) => impactScore(item) * (100 - item.score);
          const top5 = [...failed].sort((a, b) => compositeScore(b) - compositeScore(a)).slice(0, 5);
          const severityLabel = (s: string) => s === 'critical' ? 'Critical' : s === 'high' ? 'High' : 'Medium';
          const severityColor = (s: string) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : '#eab308';

          return (
          <div className="rounded-xl p-6" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-sm font-semibold mb-1" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-primary)' }}>
              핵심 개선 항목 Top 5
            </h2>
            <p className="text-[10px] mb-5" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>
              시급도(심각도) × 중요도(점수 개선 여지) 기준 우선 조치 항목
            </p>
            <div className="space-y-3">
              {top5.map((item, i) => (
                <div key={item.id} className="flex items-start gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                    style={{ fontFamily: 'var(--font-inter)', color: severityColor(item.severity), background: `${severityColor(item.severity)}15` }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold truncate" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-primary)' }}>{item.title}</span>
                      <span className="shrink-0 text-[9px] font-semibold rounded-full px-1.5 py-0.5"
                        style={{ fontFamily: 'var(--font-inter)', color: severityColor(item.severity), background: `${severityColor(item.severity)}15` }}>
                        {severityLabel(item.severity)}
                      </span>
                      <span className="shrink-0 text-[9px] font-bold tabular-nums rounded-full px-1.5 py-0.5"
                        style={{ fontFamily: 'var(--font-inter)', color: scoreColor(item.score), background: `${scoreColor(item.score)}15` }}>
                        {item.score}점
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ fontFamily: 'var(--font-pretendard)', color: 'var(--color-text-tertiary)' }}>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          );
        })()}

        {/* ── Footer ── */}
        <div className="pt-8 pb-8 space-y-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-center gap-3">
            <img src="/images/BOIDA_logo_black.png" alt="BOIDA" className="h-6 w-auto object-contain" />
            <span className="h-4 w-px" style={{ background: 'var(--color-border)' }} />
            <img src="/images/designovel.png" alt="Designovel" className="h-5 w-auto object-contain" />
          </div>
          <p className="text-center text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>
            Powered by Designovel
          </p>
        </div>
      </div>
    </div>
  );
}
