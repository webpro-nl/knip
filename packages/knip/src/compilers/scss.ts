import { ensureRelative, isScopedPackage, isTildePackage, splitSpec } from './shared.ts';
import type { CompilerSync } from './types.ts';
import { hasUrlScheme } from '../util/url.ts';

// https://sass-lang.com/documentation/at-rules/

const dependencies = ['sass', 'sass-embedded', 'node-sass'];

const dependencyMatcher =
  /"(?:\\(?:\r\n|[\s\S]|$)|[^"\\\r\n\f])*(?:"|[\r\n\f]|$)|'(?:\\(?:\r\n|[\s\S]|$)|[^'\\\r\n\f])*(?:'|[\r\n\f]|$)|\/\*[\s\S]*?(?:\*\/|$)|\/\/[^\r\n]*(?:[\r\n]|$)|@(?:use|import|forward)\s+['"](pkg:)?([^'"]+)['"]|url\(\s*(?:["']([^"']*)["']|([^'")\s]+))\s*\)/g;

const getUrlSpecifier = (url: string): string | undefined => {
  if (
    !url ||
    url.startsWith('//') ||
    url.startsWith('/') ||
    url.startsWith('#') ||
    hasUrlScheme(url) ||
    url.includes('$') ||
    url.includes('#{')
  )
    return;
  let end = url.length;
  const queryIndex = url.indexOf('?');
  if (queryIndex !== -1) end = queryIndex;
  const fragmentIndex = url.indexOf('#');
  if (fragmentIndex !== -1 && fragmentIndex < end) end = fragmentIndex;
  const path = url.slice(0, end);
  return path ? ensureRelative(path) : undefined;
};

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
  if (!text.includes('@use') && !text.includes('@import') && !text.includes('@forward') && !text.includes('url('))
    return '';
  const out: string[] = [];
  let i = 0;
  let match: RegExpExecArray | null;
  dependencyMatcher.lastIndex = 0;
  while ((match = dependencyMatcher.exec(text))) {
    const url = match[3] ?? match[4];
    if (url !== undefined) {
      const spec = getUrlSpecifier(url);
      if (spec) out.push(`import _$${i++} from '${spec}';`);
      continue;
    }
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
