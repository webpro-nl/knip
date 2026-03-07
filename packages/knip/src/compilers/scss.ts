import { existsSync } from 'node:fs';
import { basename, dirname, join } from '../util/path.ts';
import type { CompilerSync, HasDependency } from './types.ts';

const condition = (hasDependency: HasDependency) =>
  hasDependency('sass') || hasDependency('sass-embedded') || hasDependency('node-sass');

const importMatcher = /@(?:use|import|forward)\s+['"](pkg:)?([^'"]+)['"]/g;

// Resolve _partials here to not soil the main resolver
const resolvePartial = (specifier: string, containingFile: string) => {
  const rel = specifier.startsWith('.') ? specifier : `./${specifier}`;
  const name = basename(rel);
  if (name.startsWith('_')) return rel;
  const dir = dirname(rel);
  const partial = name.endsWith('.scss') ? `_${name}` : `_${name}.scss`;
  if (existsSync(join(dirname(containingFile), dir, partial))) return `${dir}/_${name}`;
  return rel;
};

const compiler: CompilerSync = (text, filePath) =>
  [...text.matchAll(importMatcher)]
    .filter(match => match[2] && !match[2].startsWith('sass:'))
    .map((match, i) => `import _$${i} from '${match[1] ? match[2] : resolvePartial(match[2], filePath)}';`)
    .join('\n');

export default { condition, compiler };
