import { basename, dirname } from '../util/path.ts';
import type { CompilerSync, HasDependency } from './types.ts';

// https://stylus-lang.com/docs/import.html

const condition = (hasDependency: HasDependency) => hasDependency('stylus');

const importMatcher = /@(?:import|require)\s+['"]([^'"]+)['"]/g;

const isAlias = (s: string) =>
  (s.charCodeAt(0) === 64 && s.charCodeAt(1) === 47) || s.charCodeAt(0) === 126 || s.charCodeAt(0) === 35;

const isScopedPackage = (s: string) => s.charCodeAt(0) === 64 && s.charCodeAt(1) !== 47;
const isTildePackage = (s: string) => s.charCodeAt(0) === 126 && s.charCodeAt(1) !== 47;

const candidates = (specifier: string): string[] => {
  const spec = specifier.startsWith('.') || isAlias(specifier) ? specifier : `./${specifier}`;
  const name = basename(spec);
  const dir = dirname(spec);
  if (/\.(styl|stylus|css)$/.test(name)) return [`${dir}/${name}`];
  return [`${dir}/${name}.styl`, `${dir}/${name}/index.styl`];
};

export const compiler: CompilerSync = text => {
  const out: string[] = [];
  let i = 0;
  for (const match of text.matchAll(importMatcher)) {
    let spec = match[1];
    if (!spec || spec.includes('*')) continue;
    let isBare = isScopedPackage(spec);
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
