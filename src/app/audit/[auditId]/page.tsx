'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import AuditProgress from '@/components/AuditProgress';
import ReportOverview from '@/components/ReportOverview';
import { saveToHistory } from '@/lib/audit-history';
import type { AuditReport } from '@/types/audit';

export default function AuditPage() {
  const params = useParams();
  const auditId = params.auditId as string;
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/report/${auditId}`);
      if (res.ok) {
        const data: AuditReport = await res.json();
        setReport(data);

        const geoCats = data.categories.filter((c) => ['content', 'crawling', 'authority'].includes(c.id));
        const seoCats = data.categories.filter((c) => ['performance', 'metadata', 'structure'].includes(c.id));
        const avg = (cats: typeof data.categories) => cats.length ? Math.round(cats.reduce((s, c) => s + c.score, 0) / cats.length) : 0;

        saveToHistory({
          auditId: data.auditId,
          url: data.url,
          overallScore: data.overallScore,
          geoScore: avg(geoCats),
          seoScore: avg(seoCats),
          totalPages: data.totalPages,
          createdAt: data.createdAt,
        });
        return true;
      }
    } catch { /* retry on next render */ }
    setLoading(false);
    return false;
  }, [auditId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleComplete = useCallback(() => {
    fetchReport();
  }, [fetchReport]);

  if (report) {
    return (
      <div className="py-10 px-6">
        <div className="flex justify-end mb-4 max-w-4xl mx-auto print:hidden">
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
        <ReportOverview report={report} />
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 relative">
      <AuditProgress auditId={auditId} onComplete={handleComplete} />

      {loading && (
        <div className="mt-6 flex items-center gap-2">
          <svg className="animate-spin w-4 h-4" style={{ color: 'var(--color-primary)' }} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>리포트 로딩 중...</span>
        </div>
      )}
    </div>
  );
}
