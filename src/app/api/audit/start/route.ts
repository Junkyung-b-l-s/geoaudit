import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { setAudit } from '@/lib/audit-store';
import { runAudit } from '@/lib/audit-engine';
import type { AuditState } from '@/types/audit';

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
];

const BLOCKED_HOSTNAMES = ['localhost', '[::1]'];

// Hard ceiling on pages per audit. Override via env (MAX_PAGES_CAP) to tune for
// the deploy's memory/time budget without a code change.
//
// Default 2000 (~400MB of page HTML held in memory while aggregate checks run).
// The deploy has 8GB/replica, so 5000 (~1GB) is also safe and can be raised
// later. If you do raise it, also set NODE_OPTIONS=--max-old-space-size (e.g.
// 6144): Node self-caps its heap near 2GB otherwise and would OOM before using
// the available RAM. Beyond ~5000 the real limit is crawl time (single-threaded
// checks, ~5 pages/s) and surviving redeploys, which needs the streaming /
// persistence refactor rather than a bigger number here.
const MAX_PAGES_CAP = Math.max(1, Number(process.env.MAX_PAGES_CAP) || 2000);

function isPrivateHost(hostname: string): boolean {
  if (BLOCKED_HOSTNAMES.includes(hostname)) return true;
  return PRIVATE_IP_PATTERNS.some((p) => p.test(hostname));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, maxPages: rawMaxPages = 50, maxDepth: rawMaxDepth = 3 } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    if (isPrivateHost(parsedUrl.hostname)) {
      return NextResponse.json({ error: 'Internal/private URLs are not allowed' }, { status: 400 });
    }

    const maxPages = Math.min(Math.max(1, Number(rawMaxPages) || 50), MAX_PAGES_CAP);
    const maxDepth = Math.min(Math.max(1, Number(rawMaxDepth) || 3), 5);

    const auditId = nanoid(12);
    const config = { url: parsedUrl.href, maxPages, maxDepth };

    const state: AuditState = {
      id: auditId,
      config,
      stage: 'init',
      progress: 0,
      message: '감사 시작...',
      createdAt: Date.now(),
    };

    setAudit(state);

    // Run audit in background (don't await)
    runAudit(auditId, config, () => {});

    return NextResponse.json({ auditId, url: parsedUrl.href });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
