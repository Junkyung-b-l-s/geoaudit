import * as cheerio from 'cheerio';
import type { ParsedPage } from '@/types/check';
import { USER_AGENT } from './user-agent';

const TIMEOUT_MS = 15_000;

function detectCharset(contentType: string, htmlBytes: Uint8Array): string {
  // 1. Content-Type header
  const ctMatch = contentType.match(/charset=([^\s;]+)/i);
  if (ctMatch) return normalizeCharset(ctMatch[1]);

  // 2. Check first 2048 bytes for meta charset (before full decode)
  const head = new TextDecoder('ascii', { fatal: false }).decode(htmlBytes.slice(0, 2048));
  const metaCharset = head.match(/<meta[^>]+charset=["']?([^"'\s;>]+)/i);
  if (metaCharset) return normalizeCharset(metaCharset[1]);

  const httpEquiv = head.match(/<meta[^>]+content=["'][^"']*charset=([^"'\s;]+)/i);
  if (httpEquiv) return normalizeCharset(httpEquiv[1]);

  return 'utf-8';
}

function normalizeCharset(cs: string): string {
  const lower = cs.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (lower === 'euckr' || lower === 'xeuckr') return 'euc-kr';
  if (lower === 'shiftjis' || lower === 'xsjis') return 'shift_jis';
  if (lower === 'gb2312' || lower === 'gbk') return 'gbk';
  if (lower === 'big5') return 'big5';
  if (lower === 'iso88591') return 'iso-8859-1';
  if (lower.startsWith('utf8') || lower === 'utf8') return 'utf-8';
  return cs.toLowerCase();
}

export async function fetchPage(url: string): Promise<ParsedPage> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
      redirect: 'follow',
    });

    const arrayBuffer = await res.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const responseTime = Date.now() - start;

    const contentType = res.headers.get('content-type') || '';
    const charset = detectCharset(contentType, bytes);
    const html = new TextDecoder(charset, { fatal: false }).decode(bytes);

    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      url: res.url,
      html,
      statusCode: res.status,
      headers,
      responseTime,
    };
  } finally {
    clearTimeout(timer);
  }
}

export function parseHtml(html: string) {
  return cheerio.load(html);
}
