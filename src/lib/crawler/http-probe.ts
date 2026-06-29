import { USER_AGENT } from './user-agent';

export type ProbeReason = 'ok' | 'not_found' | 'method_not_allowed' | 'client_error' | 'server_error' | 'timeout' | 'network';

export interface ProbeResult {
  ok: boolean;
  alive: boolean;
  status: number;
  reason: ProbeReason;
  finalUrl?: string;
  contentType?: string;
}

export interface ProbeOptions {
  timeoutMs?: number;
  userAgent?: string;
  redirect?: 'follow' | 'manual' | 'error';
}

const DEFAULTS = {
  timeoutMs: 5000,
  userAgent: USER_AGENT,
  redirect: 'follow' as const,
};

export async function probeUrl(url: string, opts: ProbeOptions = {}): Promise<ProbeResult> {
  const { timeoutMs, userAgent, redirect } = { ...DEFAULTS, ...opts };
  const headers = { 'User-Agent': userAgent };

  // 1) HEAD
  const head = await tryFetch(url, { method: 'HEAD', headers, redirect, signal: AbortSignal.timeout(timeoutMs) });

  if (head.kind === 'response') {
    const s = head.res.status;
    // HEAD가 막힌 경우만 GET 폴백 — 200~399, 4xx(404, 410 등 명확한 실패)는 그대로 신뢰
    if (s !== 405 && s !== 501) {
      return classify(s, head.res.url, head.res.headers.get('content-type') || undefined);
    }
  } else if (head.kind === 'error' && head.reason !== 'timeout' && head.reason !== 'network') {
    // unknown error도 GET 폴백
  } else if (head.kind === 'error' && head.reason === 'network') {
    // network error는 GET으로도 안 될 가능성 높지만 한 번 더 시도
  }

  // 2) GET fallback (Range로 바디 최소화)
  const get = await tryFetch(url, {
    method: 'GET',
    headers: { ...headers, Range: 'bytes=0-0' },
    redirect,
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (get.kind === 'response') {
    return classify(get.res.status, get.res.url, get.res.headers.get('content-type') || undefined);
  }

  return {
    ok: false,
    alive: false,
    status: 0,
    reason: get.reason,
  };
}

function classify(status: number, finalUrl?: string, contentType?: string): ProbeResult {
  if (status >= 200 && status < 400) {
    return { ok: true, alive: true, status, reason: 'ok', finalUrl, contentType };
  }
  if (status === 404 || status === 410) {
    return { ok: false, alive: false, status, reason: 'not_found', finalUrl, contentType };
  }
  if (status === 405 || status === 501) {
    return { ok: false, alive: true, status, reason: 'method_not_allowed', finalUrl, contentType };
  }
  if (status >= 500) {
    return { ok: false, alive: true, status, reason: 'server_error', finalUrl, contentType };
  }
  return { ok: false, alive: false, status, reason: 'client_error', finalUrl, contentType };
}

type FetchOutcome =
  | { kind: 'response'; res: Response }
  | { kind: 'error'; reason: ProbeReason };

async function tryFetch(url: string, init: RequestInit): Promise<FetchOutcome> {
  try {
    const res = await fetch(url, init);
    return { kind: 'response', res };
  } catch (e: unknown) {
    const reason: ProbeReason = isAbortError(e) ? 'timeout' : 'network';
    return { kind: 'error', reason };
  }
}

function isAbortError(e: unknown): boolean {
  return typeof e === 'object' && e !== null && 'name' in e && (e as { name: string }).name === 'AbortError';
}
