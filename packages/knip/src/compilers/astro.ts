import { fencedCodeBlockMatcher, importMatcher } from './compilers.js';
import type { HasDependency } from './types.js';

export const condition = (hasDependency: HasDependency) => hasDependency('astro');
export const compiler = (text: string) =>
  [...text.replace(fencedCodeBlockMatcher, '').matchAll(importMatcher)].join('\n');
