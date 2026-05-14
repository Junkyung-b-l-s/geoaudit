import { NextResponse } from 'next/server';
import { getServerHistory } from '@/lib/audit-store';

export async function GET() {
  return NextResponse.json(getServerHistory());
}
