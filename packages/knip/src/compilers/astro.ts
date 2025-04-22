import { fencedCodeBlockMatcher, importMatcher } from './compilers.js';
import type { HasDependency } from './types.js';

const condition = (hasDependency: HasDependency) => hasDependency('astro');

const taggedTemplateMatcher = /\w+(?:\.\w+)*`[\s\S]*?`/g;

const compiler = (text: string) => {
  const cleanedText = text.replace(fencedCodeBlockMatcher, '').replace(taggedTemplateMatcher, '""');

  return [...cleanedText.matchAll(importMatcher)].join('\n');
};

export default { condition, compiler };
