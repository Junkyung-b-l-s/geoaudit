'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UrlInputForm() {
  const [url, setUrl] = useState('');
  const [maxPages, setMaxPages] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/audit/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, maxPages }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/audit/${data.auditId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className="rounded-2xl p-5 md:p-6"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* URL Input */}
        <div className="mb-4">
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-3.5 rounded-lg text-base font-medium outline-none transition-all"
            style={{
              fontFamily: 'var(--font-inter)',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-border-active)';
              e.target.style.boxShadow = '0 0 0 3px rgba(0,53,218,0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--color-border)';
              e.target.style.boxShadow = 'none';
            }}
            required
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3">
          <select
            id="maxPages"
            value={maxPages}
            onChange={(e) => setMaxPages(Number(e.target.value))}
            className="shrink-0 px-3 py-3 rounded-lg text-sm outline-none transition-all cursor-pointer"
            style={{
              fontFamily: 'var(--font-inter)',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <option value={10}>10 페이지</option>
            <option value={30}>30 페이지</option>
            <option value={50}>50 페이지</option>
            <option value={100}>100 페이지</option>
            <option value={200}>200 페이지</option>
            <option value={500}>500 페이지</option>
            <option value={1000}>1000 페이지</option>
            <option value={2000}>2000 페이지</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{
              fontFamily: 'var(--font-inter)',
              background: loading ? 'var(--color-text-tertiary)' : 'var(--color-primary)',
              boxShadow: loading ? 'none' : '0 0 20px rgba(0,53,218,0.25)',
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                시작 중...
              </>
            ) : (
              <>
                <span>진단 시작</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
          입력한 URL의 내부 링크를 자동으로 따라가며 세부 페이지를 탐색합니다.
        </p>

        {error && (
          <div
            className="mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </form>
  );
}
