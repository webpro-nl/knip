import { basename, dirname } from '../util/path.ts';
import type { CompilerSync, HasDependency } from './types.ts';

const condition = (hasDependency: HasDependency) =>
  hasDependency('sass') || hasDependency('sass-embedded') || hasDependency('node-sass');

const importMatcher = /@(?:use|import|forward)\s+['"](pkg:)?([^'"]+)['"]/g;

const isAlias = (s: string) =>
  (s.charCodeAt(0) === 64 && s.charCodeAt(1) === 47) || s.charCodeAt(0) === 126 || s.charCodeAt(0) === 35;

const isScopedPackage = (s: string) => s.charCodeAt(0) === 64 && s.charCodeAt(1) !== 47;
const isTildePackage = (s: string) => s.charCodeAt(0) === 126 && s.charCodeAt(1) !== 47;

const candidates = (specifier: string): string[] => {
  const spec = specifier.startsWith('.') || isAlias(specifier) ? specifier : `./${specifier}`;
  const name = basename(spec);
  const dir = dirname(spec);
  const hasExt = name.endsWith('.scss') || name.endsWith('.sass');
  const bases = hasExt ? [name] : [`${name}.scss`, `${name}.sass`];
  const out: string[] = [];
  for (const base of bases) {
    out.push(`${dir}/${base}`);
    if (!name.startsWith('_')) out.push(`${dir}/_${base}`);
  }
  return out;
};

const compiler: CompilerSync = text => {
  const out: string[] = [];
  let i = 0;
  for (const match of text.matchAll(importMatcher)) {
    let spec = match[2];
    if (!spec || spec.startsWith('sass:')) continue;
    let isBare = Boolean(match[1]) || isScopedPackage(spec);
    if (isTildePackage(spec)) {
      spec = spec.slice(1);
      isBare = true;
    }
    const specs = isBare ? [spec] : candidates(spec);
    for (const s of specs) out.push(`import _$${i++} from '${s}';`);
  }
  return out.join('\n');
};

export default { condition, compiler };
