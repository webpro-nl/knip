import { DEFAULT_EXTENSIONS } from '../constants.js';
import { _syncGlob } from './glob.js';
import { extname, resolve } from './path.js';

export const isGlobPattern = (specifier: string): boolean => {
  // micromatch supports (a|b) patterns, so we check for that too.
  return /[*?[\]{}()]/.test(specifier);
};

export const resolveGlobImport = (
  specifier: string,
  baseDir: string,
  extensions: string[] = DEFAULT_EXTENSIONS
): string[] => {
  try {
    // Convert regex-like groups to glob braces for explicit consistency: (js|ts) → {js,ts}
    const pattern = specifier.replace(/\(([^|()]+(?:\|[^|()]+)+)\)/g, (_, group) => `{${group.replace(/\|/g, ',')}}`);
    const files = _syncGlob({
      cwd: baseDir,
      patterns: [pattern],
    });

    return files.filter(file => extensions.includes(extname(file))).map(file => resolve(baseDir, file));
  } catch {
    return [];
  }
};

export const regexToGlob = (regex: RegExp): string => {
  const source = regex.source;

  if (source === '.*' || source === '^.*$') return '**/*';

  let glob = source
    // Remove start/end anchors: ^pattern$ → pattern
    .replace(/^\^|\$$/g, '')
    // Unescape slashes: \/ → /
    .replace(/\\\//g, '/')
    // Convert character sets to wildcards: [a-z]{2} → *
    .replace(/\[\^?[^\]]+\](\{[^}]+\}|[+*?])?/g, '*')
    // Convert optional groups to wildcards: (pattern)? → *
    .replace(/\([^)]*\)\?/g, '*')
    // Convert .* and .+ to wildcards (use **/* for ./.* patterns that cross directories)
    .replace(/\.[*+]/g, (match, offset, string) => {
      const beforeMatch = string.slice(0, offset);
      const afterMatch = string.slice(offset + match.length);
      return beforeMatch === './' && afterMatch.includes('.') ? '**/*' : '*';
    })
    // Convert alternations to braces: (a|b) → {a,b}
    .replace(/\(([^|()]+(?:\|[^|()]+)+)\)/g, (_, group) => `{${group.replace(/\|/g, ',')}}`)
    // Unescape dots: \. → .
    .replace(/\\\./g, '.');

  // Prepend * for extension-only patterns: .js → *.js
  if (glob.startsWith('.') && !glob.includes('/')) glob = `*${glob}`;

  // Handle ./ prefix removal
  if (glob.startsWith('./')) {
    glob = glob.slice(2);
  }

  return glob;
};

export const requireContextToGlob = (directory: string, useSubdirectories: boolean, regex: RegExp): string => {
  const dir = directory.replace(/\/+$/, '');
  const filePattern = regexToGlob(regex);
  const sub = useSubdirectories ? '**/' : '';
  return `${dir}/${sub}${filePattern}`;
};
