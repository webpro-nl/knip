import { basename, dirname } from '../util/path.ts';
import type { CompilerSync, HasDependency } from './types.ts';

const condition = (hasDependency: HasDependency) =>
  hasDependency('sass') || hasDependency('sass-embedded') || hasDependency('node-sass');

const importMatcher = /@(?:use|import|forward)\s+['"](pkg:)?([^'"]+)['"]/g;

const isAlias = (s: string) =>
  (s.charCodeAt(0) === 64 && s.charCodeAt(1) === 47) || s.charCodeAt(0) === 126 || s.charCodeAt(0) === 35;

const candidates = (specifier: string): string[] => {
  const spec = specifier.startsWith('.') || isAlias(specifier) ? specifier : `./${specifier}`;
  const name = basename(spec);
  const dir = dirname(spec);
  const base = name.endsWith('.scss') || name.endsWith('.sass') ? name : `${name}.scss`;
  const plain = `${dir}/${base}`;
  return name.startsWith('_') ? [plain] : [plain, `${dir}/_${base}`];
};

const compiler: CompilerSync = text => {
  const out: string[] = [];
  let i = 0;
  for (const match of text.matchAll(importMatcher)) {
    const spec = match[2];
    if (!spec || spec.startsWith('sass:')) continue;
    const specs = match[1] ? [spec] : candidates(spec);
    for (const s of specs) out.push(`import _$${i++} from '${s}';`);
  }
  return out.join('\n');
};

export default { condition, compiler };
