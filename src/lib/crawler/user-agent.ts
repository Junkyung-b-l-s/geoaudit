// Shared User-Agent for all crawler/probe requests.
//
// Some sites sit behind a WAF/CDN that silently drops (no response, just a
// connection timeout) any request whose User-Agent contains bot-like tokens
// such as "bot", "crawler", or "curl" — e.g. news.samsung.com. Presenting a
// standard browser UA keeps the audit reachable. Keep this defined in one
// place so the value can't drift across files and reintroduce the block.
export const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
