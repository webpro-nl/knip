import { isScopedPackage, isTildePackage, splitSpec } from './shared.ts';
import type { CompilerSync, HasDependency } from './types.ts';

// https://lesscss.org/features/#import-atrules-feature

const condition = (hasDependency: HasDependency) => hasDependency('less');

// Capture optional `(option)` and the path from either `"..."` / `'...'` or `url(...)`.
const importMatcher = /@import\s+(?:\([^)]*\)\s+)?(?:url\(\s*['"]?([^'")\s]+)['"]?\s*\)|['"]([^'"]+)['"])/g;

const isExternalUrl = (s: string) => /^(?:https?:)?\/\//.test(s);

const candidates = (specifier: string): string[] => {
  const { dir, name } = splitSpec(specifier);
  if (/\.(less|css)$/.test(name)) return [`${dir}/${name}`];
  return [`${dir}/${name}.less`];
};

export const compiler: CompilerSync = text => {
  const out: string[] = [];
  let i = 0;
  for (const match of text.matchAll(importMatcher)) {
    let spec = match[1] ?? match[2];
    if (!spec || isExternalUrl(spec)) continue;
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
