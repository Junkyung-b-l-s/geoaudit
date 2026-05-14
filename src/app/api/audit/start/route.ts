import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { setAudit } from '@/lib/audit-store';
import { runAudit } from '@/lib/audit-engine';
import type { AuditState } from '@/types/audit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, maxPages = 50, maxDepth = 3 } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

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
