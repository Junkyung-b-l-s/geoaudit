'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getHistory, removeFromHistory, type AuditHistoryEntry } from '@/lib/audit-history';

export default function AuditHistory() {
  const [entries, setEntries] = useState<AuditHistoryEntry[]>([]);

  useEffect(() => {
    const local = getHistory();
    setEntries(local);
    fetch('/api/history')
      .then((r) => r.json())
      .then((server: AuditHistoryEntry[]) => {
        const merged = [...local];
        const ids = new Set(merged.map((e) => e.auditId));
        for (const s of server) {
          if (!ids.has(s.auditId)) merged.push(s);
        }
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setEntries(merged);
      })
      .catch(() => {});
  }, []);

  if (entries.length === 0) return null;

  const handleRemove = (auditId: string) => {
    removeFromHistory(auditId);
    setEntries(getHistory());
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-12">
      <h3
        className="text-xs font-semibold uppercase tracking-wider mb-3"
        style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}
      >
        이전 진단 기록
      </h3>

      <div className="space-y-2">
        {entries.map((e) => {
          const host = (() => { try { return new URL(e.url).hostname; } catch { return e.url; } })();
          const date = new Date(e.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

          return (
            <div
              key={e.auditId}
              className="group flex items-center gap-3 rounded-lg px-4 py-3 transition-colors"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
              <Link href={`/audit/${e.auditId}`} className="flex-1 flex items-center gap-3 min-w-0">
                {/* Score */}
                <span
                  className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold tabular-nums"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    color: e.overallScore >= 70 ? '#10b981' : e.overallScore >= 40 ? '#eab308' : '#ef4444',
                    background: e.overallScore >= 70 ? 'rgba(16,185,129,0.1)' : e.overallScore >= 40 ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
                  }}
                >
                  {e.overallScore}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-primary)' }}>
                    {host}
                  </p>
                  <p className="text-[10px]" style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-text-tertiary)' }}>
                    {date} · {e.totalPages}p · GEO {e.geoScore} · SEO {e.seoScore}
                  </p>
                </div>
              </Link>

              {/* Remove */}
              <button
                onClick={() => handleRemove(e.auditId)}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded cursor-pointer"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
