import { frontmatterMatcher, importMatcher } from './compilers.js';
import type { HasDependency } from './types.js';

const condition = (hasDependency: HasDependency) => hasDependency('astro');

const compiler = (text: string) => {
  const frontmatterMatch = frontmatterMatcher.exec(text);
  if (frontmatterMatch) return [...frontmatterMatch[1].matchAll(importMatcher)].join('\n');
  return '';
};

export default { condition, compiler };
