import { NextResponse } from 'next/server';
import { getServerHistory, clearServerHistory } from '@/lib/audit-store';

export async function GET() {
  return NextResponse.json(getServerHistory());
}

export async function DELETE() {
  clearServerHistory();
  return NextResponse.json({ ok: true });
}
