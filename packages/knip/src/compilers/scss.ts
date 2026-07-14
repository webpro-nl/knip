import { isScopedPackage, isTildePackage, splitSpec } from './shared.ts';
import type { CompilerSync } from './types.ts';

// https://sass-lang.com/documentation/at-rules/

const dependencies = ['sass', 'sass-embedded', 'node-sass'];

const importMatcher =
  /"(?:\\(?:\r\n|[\s\S]|$)|[^"\\\r\n\f])*(?:"|[\r\n\f]|$)|'(?:\\(?:\r\n|[\s\S]|$)|[^'\\\r\n\f])*(?:'|[\r\n\f]|$)|\/\*[\s\S]*?(?:\*\/|$)|@(?:use|import|forward)\s+['"](pkg:)?([^'"]+)['"]/g;

const candidates = (specifier: string): string[] => {
  const { dir, name } = splitSpec(specifier);
  const hasExt = name.endsWith('.scss') || name.endsWith('.sass');
  const bases = hasExt ? [name] : [`${name}.scss`, `${name}.sass`];
  const out: string[] = [];
  for (const base of bases) {
    out.push(`${dir}/${base}`);
    if (!name.startsWith('_')) out.push(`${dir}/_${base}`);
  }
  return out;
};

export const compiler: CompilerSync = text => {
  if (!text.includes('@use') && !text.includes('@import') && !text.includes('@forward')) return '';
  const out: string[] = [];
  let i = 0;
  let match: RegExpExecArray | null;
  importMatcher.lastIndex = 0;
  while ((match = importMatcher.exec(text))) {
    let spec = match[2];
    if (!spec || spec.startsWith('sass:')) continue;
    let isBare = Boolean(match[1]) || isScopedPackage(spec);
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
