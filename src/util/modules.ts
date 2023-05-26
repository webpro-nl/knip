import { _glob } from './glob.js';
import { getStringValues } from './object.js';
import { toPosix } from './path.js';
import type { PackageJson } from '@npmcli/package-json';

export const getPackageNameFromModuleSpecifier = (moduleSpecifier: string) => {
  if (!isMaybePackageName(moduleSpecifier)) return;
  const parts = moduleSpecifier.split('/').slice(0, 2);
  return moduleSpecifier.startsWith('@') ? parts.join('/') : parts[0];
};

export const getPackageNameFromFilePath = (value: string) => {
  const match = toPosix(value).match(/(?<=node_modules\/)(@[^/]+\/[^/]+|[^/]+)/g);
  if (match) return match[match.length - 1];
  return value;
};

export const isMaybePackageName = (specifier: string) => /^@?[a-z0-9]/.test(specifier);

export const isDefinitelyTyped = (packageName: string) => packageName.startsWith('@types/');

export const getDefinitelyTypedFor = (packageName: string) => {
  if (isDefinitelyTyped(packageName)) return packageName;
  if (packageName.startsWith('@')) return '@types/' + packageName.slice(1).replace('/', '__');
  return '@types/' + packageName;
};

export const getPackageFromDefinitelyTyped = (typedDependency: string) => {
  if (typedDependency.includes('__')) {
    const [scope, packageName] = typedDependency.split('__');
    return `@${scope}/${packageName}`;
  }
  return typedDependency;
};

export const getEntryPathFromManifest = (cwd: string, dir: string, manifest: PackageJson) => {
  const { main, bin, exports } = manifest;

  const entryPaths: Set<string> = new Set();

  if (typeof main === 'string') entryPaths.add(main);

  if (bin) {
    if (typeof bin === 'string') entryPaths.add(bin);
    if (typeof bin === 'object') Object.values(bin).forEach(bin => entryPaths.add(bin));
  }

  if (exports) {
    if (typeof exports === 'string') {
      entryPaths.add(exports);
    } else {
      getStringValues(exports).forEach(item => entryPaths.add(item));
    }
  }

  // Glob, as we only want files that exist, and also we don't want "dist" files, which should be .gitignore'd
  return _glob({ cwd, workingDir: dir, patterns: Array.from(entryPaths) });
};
