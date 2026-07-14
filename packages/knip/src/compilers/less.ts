import { isScopedPackage, isTildePackage, splitSpec } from './shared.ts';
import type { CompilerSync } from './types.ts';

// https://lesscss.org/features/#import-atrules-feature

const dependencies = ['less'];

// Capture optional `(option)` and the path from either `"..."` / `'...'` or `url(...)`.
const importMatcher =
  /"(?:\\(?:\r\n|[\s\S]|$)|[^"\\\r\n\f])*(?:"|[\r\n\f]|$)|'(?:\\(?:\r\n|[\s\S]|$)|[^'\\\r\n\f])*(?:'|[\r\n\f]|$)|\/\*[\s\S]*?(?:\*\/|$)|@import\s+(?:\([^)]*\)\s+)?(?:url\(\s*['"]?([^'")\s]+)['"]?\s*\)|['"]([^'"]+)['"])/g;

const isExternalUrl = (s: string) => s.startsWith('//') || s.startsWith('http://') || s.startsWith('https://');

const candidates = (specifier: string): string[] => {
  const { dir, name } = splitSpec(specifier);
  if (name.endsWith('.less') || name.endsWith('.css')) return [`${dir}/${name}`];
  return [`${dir}/${name}.less`];
};

export const compiler: CompilerSync = text => {
  if (!text.includes('@import')) return '';
  const out: string[] = [];
  let i = 0;
  let match: RegExpExecArray | null;
  importMatcher.lastIndex = 0;
  while ((match = importMatcher.exec(text))) {
    let spec = match[1] ?? match[2];
    if (!spec || isExternalUrl(spec)) continue;
    let isBare = isScopedPackage(spec);
    if (isTildePackage(spec)) {
      spec = spec.slice(1);
      isBare = true;
    }
    if (isBare) {
      out.push(`import _$${i++} from '${spec}';`);
    } else {
      for (const s of candidates(spec)) out.push(`import _$${i++} from '${s}';`);
    }
  }
  return out.join('\n');
};

export default { dependencies, compiler };
