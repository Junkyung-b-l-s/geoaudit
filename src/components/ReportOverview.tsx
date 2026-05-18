'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AuditReport, CategoryScore } from '@/types/audit';
import type { CheckResult, LighthouseData, CruxMetric, CheckLayer } from '@/types/check';

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

function ScoreRing({ score, size = 100, label, sublabel }: { score: number; size?: number; label?: string; sublabel?: string }) {
  const strokeW = size > 100 ? 6 : 4;
  const r = (size - strokeW * 2) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = scoreColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-bg-elevated)" strokeWidth={strokeW} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-bold tabular-nums" style={{ fontFamily: 'var(--font-inter)', color, fontSize: size > 100 ? '2rem' : '1.25rem', lineHeight: 1 }}>{score}</span>
          {size > 100 && <span className="text-[11px] font-semibold mt-0.5" style={{ fontFamily: 'var(--font-inter)', color }}>{scoreLabel(score)}</span>}
        </div>
      </div>
      {label && (
        <div className="text-center">
          <span className="block text-[10px] font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>{label}</span>
          {sublabel && <span className="block text-[9px] mt-0.5" style={{ fontFamily: 'var(--font-inter)', color }}>{sublabel}</span>}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: CheckResult['status'] }) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    pass: { bg: 'rgba(16,185,129,0.1)', text: '#10b981', label: 'PASS' },
    fail: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', label: 'FAIL' },
    warning: { bg: 'rgba(234,179,8,0.1)', text: '#eab308', label: 'WARN' },
    info: { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6', label: 'INFO' },
    na: { bg: 'var(--color-bg-elevated)', text: 'var(--color-text-tertiary)', label: 'N/A' },
  };
  const c = cfg[status] || cfg.na;
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ fontFamily: 'var(--font-inter)', background: c.bg, color: c.text }}>{c.label}</span>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const colors: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: 'var(--color-text-tertiary)' };
  return <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ background: colors[severity] || colors.medium }} />;
}

/* ── Section heading with layer badge ── */
function SectionHeading({ title, layer, desc }: { title: string; layer: 'seo' | 'geo'; desc: string }) {
  const layerStyle = layer === 'geo'
    ? { color: 'var(--color-primary)', bg: 'rgba(0,53,218,0.08)', border: '1px solid rgba(0,53,218,0.15)' }
    : { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-primary)' }}>{title}</h2>
        <span className="text-[9px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5"
          style={{ fontFamily: 'var(--font-inter)', color: layerStyle.color, background: layerStyle.bg, border: layerStyle.border }}>
          {layer === 'geo' ? 'GEO Layer' : 'SEO Base'}
        </span>
      </div>
      <p className="text-xs" style={{ fontFamily: 'var(--font-pretendard)', color: 'var(--color-text-tertiary)' }}>{desc}</p>
    </div>
  );
}

/* ── Strip leading number from category name (e.g. "1. 성능 점검" → "성능 점검") ── */
function stripCatNumber(name: string): string {
  return name.replace(/^\d+\.\s*/, '');
}

/* ── Category card with insight ── */
function CategoryCard({ cat, index, psiData }: { cat: CategoryScore; index: number; psiData?: LighthouseData }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-primary)' }}>
          {index}. {stripCatNumber(cat.name)}
        </h3>
        <span className="text-lg font-bold tabular-nums" style={{ fontFamily: 'var(--font-inter)', color: scoreColor(cat.score) }}>{cat.score}</span>
      </div>

      {psiData && (
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)' }}>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
            {[
              { label: 'FCP', value: (psiData.fcp / 1000).toFixed(1), unit: '초' },
              { label: 'LCP', value: (psiData.lcp / 1000).toFixed(1), unit: '초' },
              { label: 'TBT', value: `${Math.round(psiData.tbt)}`, unit: 'ms' },
              { label: 'CLS', value: psiData.cls.toFixed(3), unit: '' },
              { label: 'SI', value: (psiData.si / 1000).toFixed(1), unit: '초' },
              { label: 'TTI', value: (psiData.tti / 1000).toFixed(1), unit: '초' },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <span className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>{m.label}</span>
                <span className="text-sm font-bold tabular-nums" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-primary)' }}>
                  {m.value}<span className="text-xs font-normal" style={{ color: 'var(--color-text-tertiary)' }}>{m.unit}</span>
                </span>
              </div>
            ))}
          </div>

          {psiData.crux && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>
                  실제 사용자 데이터 (CrUX, 최근 28일)
                </span>
                {psiData.crux.overallCategory && (
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold" style={{
                    fontFamily: 'var(--font-inter)',
                    background: psiData.crux.overallCategory === 'FAST' ? 'rgba(16,185,129,0.1)' : 'rgba(234,179,8,0.1)',
                    color: psiData.crux.overallCategory === 'FAST' ? '#10b981' : '#eab308',
                  }}>코어 웹 바이탈 {psiData.crux.overallCategory === 'FAST' ? '통과' : '미달'}</span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <CruxBadge metric={psiData.crux.lcp} label="LCP" unit="s" />
                <CruxBadge metric={psiData.crux.inp} label="INP" unit="ms" />
                <CruxBadge metric={psiData.crux.cls} label="CLS" unit="cls" />
                <CruxBadge metric={psiData.crux.fcp} label="FCP" unit="s" />
                <CruxBadge metric={psiData.crux.ttfb} label="TTFB" unit="ms" />
              </div>
            </div>
          )}

          {psiData.diagnostics.length > 0 && (
            <details className="group mt-4">
              <summary className="flex items-center gap-2 cursor-pointer text-xs font-semibold" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>
                <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                진단 항목 {psiData.diagnostics.length}개
              </summary>
              <div className="mt-3 space-y-1.5">
                {psiData.diagnostics.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'var(--color-bg)' }}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: d.score === 0 ? '#ef4444' : '#eab308' }} />
                    <span className="text-xs flex-1" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-secondary)' }}>{d.title}</span>
                    {d.savings && <span className="text-[9px] font-medium shrink-0 rounded-full px-1.5 py-0.5" style={{ background: 'rgba(234,179,8,0.1)', color: '#eab308' }}>{d.savings}</span>}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        {cat.insight && (
          <div className="md:w-1/2 p-5 flex flex-col gap-3" style={{ borderRight: '1px solid var(--color-border)' }}>
            <p className="text-sm leading-relaxed" style={{ fontFamily: 'var(--font-pretendard)', color: 'var(--color-text-secondary)' }}>{cat.insight.summary}</p>
            {cat.insight.suggestions.length > 0 && (
              <div className="space-y-2 mt-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>제안</span>
                {cat.insight.suggestions.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full" style={{ background: 'var(--color-primary)' }} />
                    <p className="text-xs leading-relaxed" style={{ fontFamily: 'var(--font-pretendard)', color: 'var(--color-text-secondary)' }}>{s}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className={`${cat.insight ? 'md:w-1/2' : 'w-full'} p-5 space-y-2`}>
          {cat.items.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <StatusBadge status={item.status} />
              <span className="text-xs truncate flex-1" style={{ fontFamily: 'var(--font-pretendard)', color: 'var(--color-text-secondary)' }}>{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── CrUX badge ── */
function CruxBadge({ metric, label, unit }: { metric?: CruxMetric; label: string; unit: string }) {
  if (!metric) return null;
  const colors: Record<string, { bg: string; text: string }> = {
    FAST: { bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
    AVERAGE: { bg: 'rgba(234,179,8,0.1)', text: '#eab308' },
    SLOW: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
    NONE: { bg: 'var(--color-bg-elevated)', text: 'var(--color-text-tertiary)' },
  };
  const c = colors[metric.category] || colors.NONE;
  const value = unit === 's' ? (metric.p75 / 1000).toFixed(1) : unit === 'cls' ? (metric.p75 / 100).toFixed(3) : `${metric.p75}`;
  const displayUnit = unit === 'cls' ? '' : unit === 's' ? '초' : unit;

  return (
    <div className="rounded-lg p-3 flex flex-col gap-1" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold tabular-nums" style={{ fontFamily: 'var(--font-inter)', color: c.text }}>{value}</span>
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{displayUnit}</span>
      </div>
      <span className="inline-flex self-start items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
        style={{ fontFamily: 'var(--font-inter)', background: c.bg, color: c.text }}>
        {metric.category === 'FAST' ? '양호' : metric.category === 'AVERAGE' ? '개선필요' : metric.category === 'SLOW' ? '나쁨' : '-'}
      </span>
    </div>
  );
}

/* ── PSI sub-section ── */
function PsiCard({ data }: { data: LighthouseData }) {
  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
      {/* PSI Scores */}
      <div className="flex flex-wrap gap-4 mb-5">
        {[
          { label: '성능', score: data.performanceScore },
          { label: '접근성', score: data.accessibilityScore },
          { label: 'SEO', score: data.seoScore },
          { label: '권장사항', score: data.bestPracticesScore },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold tabular-nums"
              style={{ fontFamily: 'var(--font-inter)', color: scoreColor(s.score), background: `${scoreColor(s.score)}15` }}>{s.score}</span>
            <span className="text-xs font-medium" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-secondary)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Lab metrics */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
        {[
          { label: 'FCP', value: (data.fcp / 1000).toFixed(1), unit: '초' },
          { label: 'LCP', value: (data.lcp / 1000).toFixed(1), unit: '초' },
          { label: 'TBT', value: `${Math.round(data.tbt)}`, unit: 'ms' },
          { label: 'CLS', value: data.cls.toFixed(3), unit: '' },
          { label: 'SI', value: (data.si / 1000).toFixed(1), unit: '초' },
          { label: 'TTI', value: (data.tti / 1000).toFixed(1), unit: '초' },
        ].map((m) => (
          <div key={m.label} className="text-center">
            <span className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>{m.label}</span>
            <span className="text-sm font-bold tabular-nums" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-primary)' }}>
              {m.value}<span className="text-xs font-normal" style={{ color: 'var(--color-text-tertiary)' }}>{m.unit}</span>
            </span>
          </div>
        ))}
      </div>

      {/* CrUX */}
      {data.crux && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>
              실제 사용자 데이터 (CrUX, 최근 28일)
            </span>
            {data.crux.overallCategory && (
              <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold" style={{
                fontFamily: 'var(--font-inter)',
                background: data.crux.overallCategory === 'FAST' ? 'rgba(16,185,129,0.1)' : 'rgba(234,179,8,0.1)',
                color: data.crux.overallCategory === 'FAST' ? '#10b981' : '#eab308',
              }}>코어 웹 바이탈 {data.crux.overallCategory === 'FAST' ? '통과' : '미달'}</span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <CruxBadge metric={data.crux.lcp} label="LCP" unit="s" />
            <CruxBadge metric={data.crux.inp} label="INP" unit="ms" />
            <CruxBadge metric={data.crux.cls} label="CLS" unit="cls" />
            <CruxBadge metric={data.crux.fcp} label="FCP" unit="s" />
            <CruxBadge metric={data.crux.ttfb} label="TTFB" unit="ms" />
          </div>
        </div>
      )}

      {/* Diagnostics */}
      {data.diagnostics.length > 0 && (
        <details className="group mt-5">
          <summary className="flex items-center gap-2 cursor-pointer text-xs font-semibold" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>
            <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            진단 항목 {data.diagnostics.length}개
          </summary>
          <div className="mt-3 space-y-1.5">
            {data.diagnostics.map((d) => (
              <div key={d.id} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'var(--color-bg-elevated)' }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: d.score === 0 ? '#ef4444' : '#eab308' }} />
                <span className="text-xs flex-1" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-secondary)' }}>{d.title}</span>
                {d.savings && <span className="text-[9px] font-medium shrink-0 rounded-full px-1.5 py-0.5" style={{ background: 'rgba(234,179,8,0.1)', color: '#eab308' }}>{d.savings}</span>}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

/* ── Strategy card ── */
function getStrategyDomains(relatedChecks: string[]): ('SEO' | 'GEO')[] {
  const seoIds = new Set(['1', '3', '5']);
  const geoIds = new Set(['2', '4', '6']);
  let hasSeo = false;
  let hasGeo = false;
  for (const id of relatedChecks) {
    const cat = id.split('.')[0];
    if (seoIds.has(cat)) hasSeo = true;
    if (geoIds.has(cat)) hasGeo = true;
  }
  const domains: ('SEO' | 'GEO')[] = [];
  if (hasGeo) domains.push('GEO');
  if (hasSeo) domains.push('SEO');
  return domains.length ? domains : ['GEO'];
}

function StrategyCard({ s, index }: { s: AuditReport['strategies'][0]; index: number }) {
  const ps: Record<string, { dot: string; border: string; bg: string }> = {
    critical: { dot: '#ef4444', border: 'rgba(239,68,68,0.2)', bg: 'rgba(239,68,68,0.03)' },
    high: { dot: '#f97316', border: 'rgba(249,115,22,0.15)', bg: 'rgba(249,115,22,0.02)' },
    medium: { dot: 'var(--color-primary)', border: 'var(--color-border)', bg: 'var(--color-bg-card)' },
  };
  const p = ps[s.priority] || ps.medium;
  const domains = getStrategyDomains(s.relatedChecks);

  return (
    <div className="rounded-xl p-5 flex flex-col gap-3" style={{ background: p.bg, border: `1px solid ${p.border}` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-bold tabular-nums shrink-0" style={{ fontFamily: 'var(--font-inter)', color: p.dot }}>{String(index).padStart(2, '0')}</span>
          <h3 className="text-sm font-semibold leading-snug" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-primary)' }}>{s.name}</h3>
          {domains.length === 2 ? (
            <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide shrink-0"
              style={{ fontFamily: 'var(--font-inter)', color: '#8b5cf6', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>SEO+GEO</span>
          ) : (
            <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide shrink-0"
              style={{
                fontFamily: 'var(--font-inter)',
                color: domains[0] === 'GEO' ? '#0035DA' : '#10b981',
                background: domains[0] === 'GEO' ? 'rgba(0,53,218,0.08)' : 'rgba(16,185,129,0.08)',
                border: `1px solid ${domains[0] === 'GEO' ? 'rgba(0,53,218,0.15)' : 'rgba(16,185,129,0.15)'}`,
              }}>{domains[0]}</span>
          )}
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase"
          style={{ fontFamily: 'var(--font-inter)', color: p.dot, background: `${p.dot}15` }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.dot }} />{s.priority}
        </span>
      </div>
      <div className="space-y-1">
        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>근거</span>
        <p className="text-xs leading-relaxed" style={{ fontFamily: 'var(--font-pretendard)', color: 'var(--color-text-secondary)' }}>{s.rationale}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>방식</span>
        <p className="text-xs leading-relaxed" style={{ fontFamily: 'var(--font-pretendard)', color: 'var(--color-text-secondary)' }}>{s.method}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Main Report
   ══════════════════════════════════════════ */

const SEO_CATS = new Set(['performance', 'metadata', 'structure']);
const GEO_CATS = new Set(['content', 'crawling', 'authority']);

type LayerFilter = 'all' | 'seo' | 'geo' | 'both';

const LAYER_FILTERS: { value: LayerFilter; label: string; color: string; bg: string; border: string }[] = [
  { value: 'all', label: '전체', color: 'var(--color-text-primary)', bg: 'var(--color-bg-elevated)', border: 'var(--color-border)' },
  { value: 'seo', label: 'SEO', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
  { value: 'geo', label: 'GEO', color: '#0035DA', bg: 'rgba(0,53,218,0.08)', border: 'rgba(0,53,218,0.2)' },
  { value: 'both', label: 'SEO+GEO', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' },
];

export default function ReportOverview({ report }: { report: AuditReport }) {
  const sortByName = (a: CategoryScore, b: CategoryScore) => a.name.localeCompare(b.name, 'ko');
  const seoCats = report.categories.filter((c) => SEO_CATS.has(c.id)).sort(sortByName);
  const geoCats = report.categories.filter((c) => GEO_CATS.has(c.id)).sort(sortByName);
  const sortedCategories = [...seoCats, ...geoCats];

  const avg = (cats: CategoryScore[]) => cats.length ? Math.round(cats.reduce((s, c) => s + c.score, 0) / cats.length) : 0;
  const seoScore = avg(seoCats);
  const geoScore = avg(geoCats);

  const [layerFilter, setLayerFilter] = useState<LayerFilter>('all');
  const [strategyFilter, setStrategyFilter] = useState<LayerFilter>('all');

  const allItems = report.categories.flatMap((c) => c.items);
  const passCount = allItems.filter((i) => i.status === 'pass').length;
  const failCount = allItems.filter((i) => i.status === 'fail').length;
  const warnCount = allItems.filter((i) => i.status === 'warning').length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-10">

      {/* ── Header ── */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-primary)', background: 'rgba(0,53,218,0.08)', border: '1px solid rgba(0,53,218,0.15)' }}>
          Technical GEO Report
        </div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-primary)' }}>{report.url}</h1>
        <p className="text-xs" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>
          {new Date(report.createdAt).toLocaleString('ko-KR')} · {report.totalPages}개 페이지 · {report.totalChecks}개 항목
        </p>
        <Link href={`/audit/${report.auditId}/executive`}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors mt-2"
          style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-primary)', background: 'rgba(0,53,218,0.08)', border: '1px solid rgba(0,53,218,0.15)' }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          경영진 리포트 보기
        </Link>
      </div>

      {/* ── Score Hero ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        {/* Scores row */}
        <div className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-10">
            <ScoreRing score={report.overallScore} size={140} label="종합 점수" />
            <div className="flex gap-8">
              <ScoreRing score={seoScore} size={90} label="SEO 기반" sublabel={scoreLabel(seoScore)} />
              <ScoreRing score={geoScore} size={90} label="GEO 최적화" sublabel={scoreLabel(geoScore)} />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 flex flex-col gap-3">
            <div className="flex items-center justify-center gap-2 text-xs" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>
              <span className="font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{report.totalPages}</span>
              <span>페이지 분석</span>
              <span style={{ color: 'var(--color-border)' }}>·</span>
              <span className="font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{allItems.length}</span>
              <span>항목 진단</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(16,185,129,0.05)' }}>
                <div className="text-lg font-bold tabular-nums" style={{ fontFamily: 'var(--font-inter)', color: '#10b981' }}>{passCount}</div>
                <div className="text-[10px] font-medium mt-0.5" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>통과</div>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(239,68,68,0.04)' }}>
                <div className="text-lg font-bold tabular-nums" style={{ fontFamily: 'var(--font-inter)', color: '#ef4444' }}>{failCount}</div>
                <div className="text-[10px] font-medium mt-0.5" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>미충족</div>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(234,179,8,0.05)' }}>
                <div className="text-lg font-bold tabular-nums" style={{ fontFamily: 'var(--font-inter)', color: '#eab308' }}>{warnCount}</div>
                <div className="text-[10px] font-medium mt-0.5" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>주의</div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary analysis */}
        <div className="px-8 py-6" style={{
          borderTop: '1px solid var(--color-border)',
          background: report.overallScore < 50
            ? 'linear-gradient(135deg, rgba(239,68,68,0.03) 0%, rgba(249,115,22,0.02) 100%)'
            : report.overallScore < 80
            ? 'linear-gradient(135deg, rgba(234,179,8,0.03) 0%, rgba(0,53,218,0.02) 100%)'
            : 'linear-gradient(135deg, rgba(16,185,129,0.03) 0%, rgba(0,53,218,0.02) 100%)',
        }}>
          <div className="flex items-center gap-2 mb-3">
            {report.overallScore < 50 && <span className="w-2 h-2 rounded-full bg-[#ef4444]" />}
            {report.overallScore >= 50 && report.overallScore < 80 && <span className="w-2 h-2 rounded-full bg-[#eab308]" />}
            {report.overallScore >= 80 && <span className="w-2 h-2 rounded-full bg-[#10b981]" />}
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>
              진단 요약
            </span>
          </div>
          <div className="space-y-2 text-sm leading-7" style={{ fontFamily: 'var(--font-pretendard)', color: 'var(--color-text-secondary)' }}>
            <p className="text-xs leading-relaxed mb-3" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>
              AI 모델은 학습 데이터에 포함된 콘텐츠를 반복적으로 재학습합니다. 일찍 준비된 사이트일수록 더 많은 학습 사이클에 포함되어 인용 빈도가 복리로 증가합니다.
            </p>
            {report.overallScore >= 80 ? (<>
              <p>
                SEO 기반({seoScore}점)과 GEO 최적화({geoScore}점)가 고르게 갖춰져 있어, AI 모델이 브랜드 정보를 정확히 인용할 수 있는 기술 환경이 마련되어 있습니다.
                이미 AI 학습 데이터에 양질의 콘텐츠가 축적되고 있을 가능성이 높으며, 이 상태를 유지하면 인용 빈도가 시간이 지날수록 자연스럽게 늘어납니다.
              </p>
              <p>
                전체 {allItems.length}개 항목 중 <strong style={{ color: 'var(--color-text-primary)' }}>{passCount}개({Math.round(passCount / allItems.length * 100)}%)</strong>가 기준을 충족합니다.
                나머지 {failCount}개 항목을 추가 개선하면 AI 검색 노출 범위를 더 넓힐 수 있습니다.
              </p>
            </>) : report.overallScore >= 50 ? (<>
              <p>
                SEO 기반({seoScore}점)은 갖추고 있으나, AI 모델이 콘텐츠를 정확히 이해하고 인용하기 위한 <strong style={{ color: '#eab308' }}>GEO 최적화({geoScore}점)에 개선 여지</strong>가 있습니다.
                GEO 준비가 늦어질수록 AI 학습 사이클에서 누락되는 기간이 길어지고, 그만큼 인용 데이터의 축적이 지연됩니다.
              </p>
              <p>
                {failCount}개 미충족 항목 중 핵심 전략에 해당하는 항목을 우선 개선하면, AI 모델의 <strong style={{ color: 'var(--color-text-primary)' }}>브랜드 인용 정확도와 노출 빈도를 높일 수 있습니다</strong>.
                {geoScore < seoScore ? ' 구조화 데이터, AI 크롤러 접근성, 콘텐츠 구조화' : ' 메타데이터 품질, 페이지 성능, 사이트 구조'} 영역을 우선 검토해 보세요.
              </p>
            </>) : (<>
              <p>
                SEO 기반({seoScore}점)과 GEO 최적화({geoScore}점) 모두 기준 대비 낮은 수준입니다.
                현재 AI 모델의 학습 데이터에 이 사이트의 콘텐츠가 충분히 반영되지 않고 있으며, 준비가 늦어질수록 경쟁사와의 인용 데이터 격차가 누적됩니다.
              </p>
              <p>
                전체 {allItems.length}개 항목 중 <strong style={{ color: 'var(--color-text-primary)' }}>{failCount}개가 미충족</strong>, {warnCount}개가 주의 상태입니다.
                아래 핵심 전략의 <strong style={{ color: 'var(--color-text-primary)' }}>Critical·High 우선순위 항목부터 단계적으로 개선</strong>하여 빠르게 AI 학습 사이클에 포함되도록 하는 것을 권장합니다.
              </p>
            </>)}
          </div>
        </div>
      </div>

      {/* ── Analyzed URLs ── */}
      <details className="group rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <summary className="flex items-center justify-between px-5 py-4 cursor-pointer" style={{ fontFamily: 'var(--font-inter)' }}>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>분석 대상 URL</span>
            <span className="text-[10px] font-medium rounded-full px-2 py-0.5" style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-tertiary)' }}>{report.pageScores.length}개</span>
          </div>
          <svg className="w-4 h-4 transition-transform group-open:rotate-180" style={{ color: 'var(--color-text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="px-5 pb-4 space-y-1">
          {report.pageScores.map((ps, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'var(--color-bg-elevated)' }}>
              <span className="text-[10px] font-bold tabular-nums shrink-0" style={{ fontFamily: 'var(--font-inter)', color: scoreColor(ps.score) }}>{ps.score}</span>
              <a href={ps.url} target="_blank" rel="noopener noreferrer" className="text-xs truncate hover:underline" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-secondary)' }}>{ps.url}</a>
            </div>
          ))}
        </div>
      </details>

      {/* ══════════════════════════════════════
         LAYER 1: SEO 기반 진단
         ══════════════════════════════════════ */}
      <SectionHeading
        title="SEO 기반 진단"
        layer="seo"
        desc="AI 인용의 전제 조건 — 성능, 메타데이터, 사이트 구조가 충족되어야 GEO 최적화가 의미를 가집니다"
      />

      {/* SEO category cards */}
      {seoCats.map((cat, i) => (
        <CategoryCard
          key={cat.id}
          cat={cat}
          index={i + 1}
          psiData={cat.id === 'performance' ? report.lighthouseData : undefined}
        />
      ))}

      {/* ══════════════════════════════════════
         LAYER 2: GEO 최적화
         ══════════════════════════════════════ */}
      <SectionHeading
        title="GEO 최적화 진단"
        layer="geo"
        desc="SEO 기반 위에 AI 인용을 극대화하는 기술적 요소 — 구조화 데이터, AI 크롤러 접근, 콘텐츠 구조"
      />

      {/* GEO category cards */}
      {geoCats.map((cat, i) => <CategoryCard key={cat.id} cat={cat} index={i + 1} />)}

      {/* GEO Strategy cards */}
      {report.strategies && report.strategies.length > 0 && (() => {
        const filteredStrategies = strategyFilter === 'all'
          ? report.strategies
          : report.strategies.filter((s) => {
              const domains = getStrategyDomains(s.relatedChecks);
              if (strategyFilter === 'seo') return domains.includes('SEO');
              if (strategyFilter === 'geo') return domains.includes('GEO');
              return domains.includes('SEO') && domains.includes('GEO');
            });

        return (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-primary)' }}>핵심 전략</h3>
              <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-primary)', background: 'rgba(0,53,218,0.08)', border: '1px solid rgba(0,53,218,0.15)' }}>
                {filteredStrategies.length} strategies
              </span>
            </div>
            <div className="flex gap-1.5">
              {LAYER_FILTERS.map((f) => {
                const active = strategyFilter === f.value;
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setStrategyFilter(f.value)}
                    className="rounded-full px-3 py-1 text-[11px] font-semibold transition-all cursor-pointer"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      color: active ? f.color : 'var(--color-text-tertiary)',
                      background: active ? f.bg : 'transparent',
                      border: `1px solid ${active ? f.border : 'var(--color-border)'}`,
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStrategies.map((s) => <StrategyCard key={s.id} s={s} index={report.strategies.indexOf(s) + 1} />)}
          </div>
        </div>
        );
      })()}

      {/* ══════════════════════════════════════
         상세 결과 (전 항목)
         ══════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-primary)' }}>상세 결과</h2>
          <div className="flex gap-1.5">
            {LAYER_FILTERS.map((f) => {
              const active = layerFilter === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setLayerFilter(f.value)}
                  className="rounded-full px-3 py-1 text-[11px] font-semibold transition-all cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    color: active ? f.color : 'var(--color-text-tertiary)',
                    background: active ? f.bg : 'transparent',
                    border: `1px solid ${active ? f.border : 'var(--color-border)'}`,
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {sortedCategories.map((cat, catIdx) => {
          const filtered = layerFilter === 'all' ? cat.items : cat.items.filter((i) => i.layer === layerFilter);
          if (filtered.length === 0) return null;
          return (
          <details key={cat.id} className="group rounded-xl overflow-hidden"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer" style={{ fontFamily: 'var(--font-inter)' }}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{catIdx + 1}. {stripCatNumber(cat.name)}</span>
                {layerFilter !== 'all' && (
                  <span className="text-[10px] font-medium rounded-full px-1.5 py-0.5" style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-tertiary)' }}>
                    {filtered.length}/{cat.items.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold tabular-nums" style={{ color: scoreColor(cat.score) }}>{cat.score}점</span>
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" style={{ color: 'var(--color-text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>
            <div className="px-5 pb-5 space-y-3">
              {filtered.map((item) => (
                <div key={item.id} className="rounded-lg p-4" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <StatusBadge status={item.status} />
                    <SeverityDot severity={item.severity} />
                    <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-primary)' }}>{item.id} {item.title}</span>
                    {item.llmUsed && (
                      <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                        style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', fontFamily: 'var(--font-inter)' }}>AI</span>
                    )}
                    {item.layer && (
                      <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase"
                        style={{
                          fontFamily: 'var(--font-inter)',
                          color: item.layer === 'geo' ? '#0035DA' : item.layer === 'seo' ? '#10b981' : '#8b5cf6',
                          background: item.layer === 'geo' ? 'rgba(0,53,218,0.08)' : item.layer === 'seo' ? 'rgba(16,185,129,0.08)' : 'rgba(139,92,246,0.08)',
                        }}>
                        {item.layer === 'both' ? 'SEO+GEO' : item.layer.toUpperCase()}
                      </span>
                    )}
                    <span className="ml-auto text-xs font-bold tabular-nums" style={{ fontFamily: 'var(--font-inter)', color: scoreColor(item.score) }}>
                      {item.score}점
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ fontFamily: 'var(--font-pretendard)', color: 'var(--color-text-secondary)' }}>{item.description}</p>
                  {item.details && (
                    <div className="mt-2 rounded-lg p-3 overflow-x-auto" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {item.details.split(/[,\n]/).map((part, i) => {
                          const trimmed = part.trim();
                          if (!trimmed) return null;
                          const [key, ...rest] = trimmed.split(':');
                          const val = rest.join(':').trim();
                          if (val) {
                            return (
                              <div key={i} className="flex items-baseline gap-1.5">
                                <span className="text-[10px] font-semibold uppercase" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>{key.trim()}</span>
                                <span className="text-xs font-bold tabular-nums" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-secondary)' }}>{val}</span>
                              </div>
                            );
                          }
                          return <span key={i} className="text-xs" style={{ fontFamily: 'var(--font-geist-mono, monospace)', color: 'var(--color-text-tertiary)' }}>{trimmed}</span>;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </details>
          );
        })}
      </div>

      {/* Export */}
      <div className="flex justify-center gap-3 print:hidden">
        <a href={`/api/report/${report.auditId}`} target="_blank"
          className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
          style={{ fontFamily: 'var(--font-inter)', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          JSON Export
        </a>
      </div>

      {/* Footer */}
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
  );
}
