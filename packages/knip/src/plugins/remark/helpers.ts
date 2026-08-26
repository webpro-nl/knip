import { type Input, toDeferResolve, toDependency } from '../../util/input.ts';
import type { Manifest } from '../../util/package-json.ts';
import { isInternal } from '../../util/path.ts';

const getCandidates = (prefix: string, identifier: string): string[] => {
  if (isInternal(identifier)) return [identifier];

  if (identifier.startsWith('@')) {
    const [scope, name, ...rest] = identifier.split('/');
    if (rest.length > 0) return [identifier];
    if (scope) {
      if (!name) return [[scope, prefix].join('/')];
      if (name.startsWith(prefix)) return [identifier];
      return [[scope, prefix + name].join('/'), identifier];
    }
  }

  const [name, ...rest] = identifier.split('/');
  if (rest.length > 0) return [identifier];
  if (name.startsWith(prefix)) return [identifier];
  return [prefix + name, name];
};

const getDeclaredDependencies = (manifest: Manifest) =>
  new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ]);

const pickCandidate = (prefix: string, identifier: string, manifest: Manifest) => {
  const candidates = getCandidates(prefix, identifier);
  if (candidates.length === 1 || isInternal(candidates[0])) return candidates[0];

  const dependencies = getDeclaredDependencies(manifest);
  return candidates.find(candidate => dependencies.has(candidate)) ?? candidates[0];
};

// Resolve plugins for https://github.com/wooorm/load-plugin
export const resolveLoadPluginStylePluginName = (prefix: string, identifier: string, manifest: Manifest): Input => {
  // https://github.com/wooorm/load-plugin/blob/4a1b7231e20f64be52625ff3469bbf111dda5949/lib/index.js#L104
  prefix = prefix + (prefix.at(-1) === '-' ? '' : '-');

  const candidate = pickCandidate(prefix, identifier, manifest);

  return isInternal(candidate) ? toDeferResolve(candidate) : toDependency(candidate);
};
