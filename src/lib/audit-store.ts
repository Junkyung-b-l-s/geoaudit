import type { AuditState, AuditReport } from '@/types/audit';
import type { AuditHistoryEntry } from '@/lib/audit-history';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

const store = new Map<string, AuditState>();
const TTL_MS = 60 * 60 * 1000; // 1 hour

const REPORTS_DIR = process.env.REPORTS_DIR || join(process.cwd(), '.reports');
const HISTORY_FILE = join(REPORTS_DIR, '_history.json');
const MAX_HISTORY = 100;

function ensureReportsDir() {
  if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });
}

export function getServerHistory(): AuditHistoryEntry[] {
  try {
    if (existsSync(HISTORY_FILE)) {
      return JSON.parse(readFileSync(HISTORY_FILE, 'utf-8'));
    }
  } catch { /* corrupt */ }
  return [];
}

function saveHistoryEntry(report: AuditReport): void {
  try {
    ensureReportsDir();
    const history = getServerHistory().filter((h) => h.auditId !== report.auditId);
    const geoCategories = ['crawling-indexing', 'content-structure', 'authority'];
    const seoCategories = ['metadata', 'performance', 'site-structure'];
    const geoScore = Math.round(
      report.categories.filter((c) => geoCategories.includes(c.id)).reduce((s, c) => s + c.score, 0) /
      Math.max(report.categories.filter((c) => geoCategories.includes(c.id)).length, 1)
    );
    const seoScore = Math.round(
      report.categories.filter((c) => seoCategories.includes(c.id)).reduce((s, c) => s + c.score, 0) /
      Math.max(report.categories.filter((c) => seoCategories.includes(c.id)).length, 1)
    );
    history.unshift({
      auditId: report.auditId,
      url: report.url,
      overallScore: report.overallScore,
      geoScore,
      seoScore,
      totalPages: report.totalPages,
      createdAt: report.createdAt,
    });
    writeFileSync(HISTORY_FILE, JSON.stringify(history.slice(0, MAX_HISTORY)), 'utf-8');
  } catch { /* best effort */ }
}

export function clearServerHistory(): void {
  try {
    ensureReportsDir();
    writeFileSync(HISTORY_FILE, '[]', 'utf-8');
    // Also remove all report JSON files
    for (const file of readdirSync(REPORTS_DIR)) {
      if (file.endsWith('.json') && file !== '_history.json') {
        try { unlinkSync(join(REPORTS_DIR, file)); } catch { /* ignore */ }
      }
    }
  } catch { /* best effort */ }
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
      saveHistoryEntry(update.report);
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
