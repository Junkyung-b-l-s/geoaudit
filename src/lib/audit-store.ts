import type { AuditState, AuditReport } from '@/types/audit';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const store = new Map<string, AuditState>();
const TTL_MS = 60 * 60 * 1000; // 1 hour

const REPORTS_DIR = join(process.cwd(), '.reports');

function ensureReportsDir() {
  if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });
}

export function getAudit(id: string): AuditState | undefined {
  return store.get(id);
}

export function getSavedReport(id: string): AuditReport | null {
  try {
    const filePath = join(REPORTS_DIR, `${id}.json`);
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, 'utf-8'));
    }
  } catch { /* corrupt or missing */ }
  return null;
}

export function saveReport(report: AuditReport): void {
  try {
    ensureReportsDir();
    writeFileSync(join(REPORTS_DIR, `${report.auditId}.json`), JSON.stringify(report), 'utf-8');
  } catch { /* best effort */ }
}

export function setAudit(state: AuditState): void {
  store.set(state.id, state);
}

export function updateAudit(id: string, update: Partial<AuditState>): void {
  const existing = store.get(id);
  if (existing) {
    Object.assign(existing, update);
    if (update.report) {
      saveReport(update.report);
    }
  }
}

// Cleanup expired audits periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, state] of store) {
    if (now - state.createdAt > TTL_MS) {
      store.delete(id);
    }
  }
}, 5 * 60 * 1000);
