import { NextResponse } from 'next/server';
import { getServerHistory, clearServerHistory, removeServerHistoryEntry } from '@/lib/audit-store';

export async function GET() {
  return NextResponse.json(getServerHistory());
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const auditId = searchParams.get('auditId');
  if (auditId) {
    removeServerHistoryEntry(auditId);
    return NextResponse.json({ ok: true });
  }
  clearServerHistory();
  return NextResponse.json({ ok: true });
}
