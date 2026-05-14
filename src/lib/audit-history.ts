export interface AuditHistoryEntry {
  auditId: string;
  url: string;
  overallScore: number;
  geoScore: number;
  seoScore: number;
  totalPages: number;
  createdAt: string;
}

const STORAGE_KEY = 'geo-audit-history';
const MAX_ENTRIES = 30;

export function getHistory(): AuditHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(entry: AuditHistoryEntry) {
  if (typeof window === 'undefined') return;
  try {
    const history = getHistory().filter((h) => h.auditId !== entry.auditId);
    history.unshift(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_ENTRIES)));
  } catch { /* quota exceeded */ }
}

export function removeFromHistory(auditId: string) {
  if (typeof window === 'undefined') return;
  try {
    const history = getHistory().filter((h) => h.auditId !== auditId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch { /* ignore */ }
}
