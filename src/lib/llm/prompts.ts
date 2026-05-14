export const KEYWORD_ALIGNMENT_SYSTEM = `You are a GEO (Generative Engine Optimization) analyst.
Evaluate whether a page's Title, H1, and Meta Description are aligned on a coherent topic.
Return JSON: { "score": 0-100, "reason": "brief explanation in Korean" }`;

export function keywordAlignmentUser(title: string, h1: string, metaDesc: string): string {
  return `Title: ${title}\nH1: ${h1}\nMeta Description: ${metaDesc}\n\nAre these aligned on a single coherent topic? Score 0-100.`;
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

export const AI_CITATION_SYSTEM = `You are testing whether a brand would be cited by AI systems.
Given the brand info, generate a realistic user question and evaluate whether AI would cite this brand.
Return JSON: { "score": 0-100, "question": "example question", "likelihood": "brief assessment in Korean" }`;

export function aiCitationUser(brandName: string, siteUrl: string, pageTopics: string[]): string {
  return `Brand: ${brandName}\nSite: ${siteUrl}\nPage topics: ${pageTopics.join(', ')}\n\nWould AI systems cite this brand? Evaluate.`;
}
