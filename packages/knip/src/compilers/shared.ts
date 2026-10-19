import { basename, dirname } from '../util/path.ts';
import { hasUrlScheme } from '../util/url.ts';

// Alias-prefix characters used in CSS-preprocessor `@import`/`@use`/`@require`
// specifiers (Vite/webpack conventions):
//   - `@/` path alias (distinct from `@scope/pkg` scoped packages)
//   - `~`  webpack-style alias
//   - `#`  subpath import alias
const isAlias = (s: string) =>
  (s.charCodeAt(0) === 64 && s.charCodeAt(1) === 47) || s.charCodeAt(0) === 126 || s.charCodeAt(0) === 35;

export const isScopedPackage = (s: string) => s.charCodeAt(0) === 64 && s.charCodeAt(1) !== 47;

export const isTildePackage = (s: string) => s.charCodeAt(0) === 126 && s.charCodeAt(1) !== 47;

export const getUrlSpecifier = (url: string): string | undefined => {
  if (
    !url ||
    url.startsWith('//') ||
    url.startsWith('/') ||
    url.startsWith('#') ||
    hasUrlScheme(url) ||
    url.includes('$') ||
    url.includes('#{') ||
    url.includes('(')
  )
    return;
  let end = url.length;
  const queryIndex = url.indexOf('?');
  if (queryIndex !== -1) end = queryIndex;
  const fragmentIndex = url.indexOf('#');
  if (fragmentIndex !== -1 && fragmentIndex < end) end = fragmentIndex;
  const path = url.slice(0, end);
  if (!path) return;
  return isScopedPackage(path) ? path : ensureRelative(path);
};

// Treat a bare specifier as relative-to-current-dir by prefixing `./`, unless
// it is already relative (`./`, `../`) or aliased.
const ensureRelative = (spec: string) => (spec.startsWith('.') || isAlias(spec) ? spec : `./${spec}`);

// Normalize a specifier to relative-or-alias form and split into dir/name for
// per-preprocessor candidate-file generation.
export const splitSpec = (specifier: string): { dir: string; name: string } => {
  const spec = ensureRelative(specifier);
  return { dir: dirname(spec), name: basename(spec) };
};
