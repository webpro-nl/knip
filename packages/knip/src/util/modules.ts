import { isBuiltin } from 'node:module';
import { DT_SCOPE } from '../constants.js';
import type { PackageJson } from '../types/package-json.js';
import { _glob } from './glob.js';
import { getStringValues } from './object.js';
import { isAbsolute, toPosix } from './path.js';

export const getPackageNameFromModuleSpecifier = (moduleSpecifier: string) => {
  if (!isStartsLikePackageName(moduleSpecifier)) return;
  const parts = moduleSpecifier.split('/').slice(0, 2);
  return moduleSpecifier.startsWith('@') ? parts.join('/') : parts[0];
};

const lastPackageNameMatch = /(?<=node_modules\/)(@[^/]+\/[^/]+|[^/]+)/g;
export const getPackageNameFromFilePath = (value: string) => {
  const match = toPosix(value).match(lastPackageNameMatch);
  if (match) return match[match.length - 1];
  return value;
};

const packageNameMatch = /.*\/node_modules\/(.+)/;
export const normalizeSpecifierFromFilePath = (value: string) => {
  const match = toPosix(value).match(packageNameMatch);
  if (match) return match[match.length - 1];
  return value;
};

export const isStartsLikePackageName = (specifier: string) => /^@?[a-z0-9]/.test(specifier);

export const isDefinitelyTyped = (packageName: string) => packageName.startsWith(`${DT_SCOPE}/`);

export const getDefinitelyTypedFor = (packageName: string) => {
  if (isDefinitelyTyped(packageName)) return packageName;
  if (packageName.startsWith('@')) return [DT_SCOPE, packageName.slice(1).replace('/', '__')].join('/');
  return [DT_SCOPE, packageName].join('/');
};

export const getPackageFromDefinitelyTyped = (typedDependency: string) => {
  if (typedDependency.includes('__')) {
    const [scope, packageName] = typedDependency.split('__');
    return `@${scope}/${packageName}`;
  }
  return typedDependency;
};

export const getEntryPathFromManifest = (
  manifest: PackageJson,
  sharedGlobOptions: { cwd: string; workingDir: string; gitignore: boolean; ignore: string[] }
) => {
  const { main, bin, exports, types, typings } = manifest;

  const entryPaths = new Set<string>();

  if (typeof main === 'string') entryPaths.add(main);

  if (bin) {
    if (typeof bin === 'string') entryPaths.add(bin);
    if (typeof bin === 'object') for (const id of Object.values(bin)) entryPaths.add(id);
  }

  if (exports) {
    for (const item of getStringValues(exports)) entryPaths.add(item);
  }

  if (typeof types === 'string') entryPaths.add(types);
  if (typeof typings === 'string') entryPaths.add(typings);

  // Use glob, as we only want source files that:
  // - exist
  // - are not (generated) files that are .gitignore'd
  // - do not match configured `ignore` patterns
  return _glob({ ...sharedGlobOptions, patterns: Array.from(entryPaths) });
};

// Strip `?search` and other proprietary directives from the specifier (e.g. https://webpack.js.org/concepts/loaders/)
const matchDirectives = /^([?!|-]+)?([^!?:]+).*/;
export const sanitizeSpecifier = (specifier: string) => {
  if (isBuiltin(specifier)) return specifier;
  if (isAbsolute(specifier)) return specifier;
  if (specifier.startsWith('virtual:')) return specifier;
  return specifier.replace(matchDirectives, '$2');
};
