import { performanceCheckers } from './performance';
import { contentStructureCheckers } from './content-structure';
import { metadataCheckers } from './metadata';
import { crawlingCheckers } from './crawling-indexing';
import { siteStructureCheckers } from './site-structure';
import { authorityCheckers } from './authority';
import type { CheckerDefinition } from './types';

export const allCheckers: CheckerDefinition[] = [
  ...performanceCheckers,
  ...contentStructureCheckers,
  ...metadataCheckers,
  ...crawlingCheckers,
  ...siteStructureCheckers,
  ...authorityCheckers,
];

export const siteCheckers = allCheckers.filter((c) => c.scope === 'site');
export const pageCheckers = allCheckers.filter((c) => c.scope === 'page');
export const aggregateCheckers = allCheckers.filter((c) => c.scope === 'aggregate');
