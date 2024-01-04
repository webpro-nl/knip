import { fencedCodeBlockMatcher, importMatcher } from './compilers.js';
import type { HasDependency } from './types.js';

/** @public */
export const condition = (hasDependency: HasDependency) => hasDependency('astro');
/** @public */
export const compiler = (text: string) =>
  [...text.replace(fencedCodeBlockMatcher, '').matchAll(importMatcher)].join('\n');
