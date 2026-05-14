import { NextResponse } from 'next/server';
import { getAudit, getSavedReport } from '@/lib/audit-store';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await params;
  const audit = getAudit(auditId);

  if (audit) {
    if (audit.stage !== 'done' || !audit.report) {
      return NextResponse.json({ error: 'Audit not complete', stage: audit.stage }, { status: 202 });
    }
    return NextResponse.json(audit.report);
  }

  const saved = getSavedReport(auditId);
  if (saved) {
    return NextResponse.json(saved);
  }

  return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
}
