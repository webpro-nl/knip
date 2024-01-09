import { fencedCodeBlockMatcher, importMatcher } from './compilers.js';
import type { HasDependency } from './types.js';

const condition = (hasDependency: HasDependency) => hasDependency('astro');

const compiler = (text: string) => [...text.replace(fencedCodeBlockMatcher, '').matchAll(importMatcher)].join('\n');

export default { condition, compiler };
