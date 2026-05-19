export const KEYWORD_ALIGNMENT_SYSTEM = `You are a GEO (Generative Engine Optimization) analyst.
Evaluate whether each page's Title, H1, and Meta Description are aligned on a coherent topic.
Return JSON: { "results": [{ "url": "...", "score": 0-100, "reason": "brief explanation in Korean" }] }`;

export function keywordAlignmentBatchUser(pages: { url: string; title: string; h1: string; metaDesc: string }[]): string {
  return pages.map((p) =>
    `URL: ${p.url}\nTitle: ${p.title}\nH1: ${p.h1}\nMeta Description: ${p.metaDesc}`
  ).join('\n---\n') + '\n\nFor each page, score 0-100 how well Title/H1/Meta are aligned.';
}

export const META_QUALITY_SYSTEM = `You are a GEO analyst. Evaluate meta description quality.
For each page, check if the description accurately summarizes page content.
Return JSON: { "results": [{ "url": "...", "score": 0-100, "issue": "brief note in Korean" }] }`;

export function metaQualityUser(pages: { url: string; title: string; metaDesc: string; firstParagraph: string }[]): string {
  return pages.map((p) =>
    `URL: ${p.url}\nTitle: ${p.title}\nDescription: ${p.metaDesc}\nContent preview: ${p.firstParagraph}`
  ).join('\n---\n');
}

export const URL_STRUCTURE_SYSTEM = `You are a GEO analyst. Evaluate URL semantic clarity.
Check if URLs use meaningful paths that convey page content to AI crawlers.
Return JSON: { "score": 0-100, "issues": ["issue in Korean"], "good": ["good example"] }`;

export function urlStructureUser(urls: string[]): string {
  return `Evaluate these URLs for semantic clarity:\n${urls.join('\n')}`;
}

export interface SiteContext {
  confirmedGroup?: string;
  industry?: string;
  knownAliases?: string[];
}

export const AI_CITATION_SYSTEM = `You are testing whether a brand would be cited by AI systems.
Given the brand info, generate a realistic user question and evaluate whether AI would cite this brand.

FACTUALITY RULES (strict):
- Use ONLY the facts explicitly provided in the "Confirmed facts" section.
- Do NOT guess or infer the parent group, conglomerate, affiliate relationships, ownership, or industry if they are not listed in "Confirmed facts".
- If parent group/ownership is unknown, write "그룹 소속 확인되지 않음" instead of guessing.
- The "likelihood" field must not contain any company affiliation that is not in "Confirmed facts".
- Do not fabricate product lines, statistics, or partnerships.

Return JSON: { "score": 0-100, "question": "example question", "likelihood": "brief assessment in Korean" }`;

export function aiCitationUser(brandName: string, siteUrl: string, pageTopics: string[], siteContext?: SiteContext): string {
  const facts: string[] = [`Brand: ${brandName}`, `Site: ${siteUrl}`];
  if (siteContext?.confirmedGroup) facts.push(`Confirmed parent group: ${siteContext.confirmedGroup}`);
  if (siteContext?.industry) facts.push(`Confirmed industry: ${siteContext.industry}`);
  if (siteContext?.knownAliases?.length) facts.push(`Known aliases: ${siteContext.knownAliases.join(', ')}`);

  const factsSection = `Confirmed facts (use these and only these for affiliation/industry claims):\n${facts.join('\n')}`;
  const unknownSection = !siteContext?.confirmedGroup
    ? '\n\nNote: Parent group is NOT confirmed. Do not name any conglomerate or group affiliation.'
    : '';

  return `${factsSection}\n\nPage topics: ${pageTopics.join(', ')}${unknownSection}\n\nWould AI systems cite this brand? Evaluate.`;
}
