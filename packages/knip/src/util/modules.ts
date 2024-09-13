import { isBuiltin } from 'node:module';
import { DT_SCOPE } from '../constants.js';
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

// Strip `?search` and other proprietary directives from the specifier (e.g. https://webpack.js.org/concepts/loaders/)
const matchDirectives = /^([?!|-]+)?([^!?:]+).*/;
export const sanitizeSpecifier = (specifier: string) => {
  if (isBuiltin(specifier)) return specifier;
  if (isAbsolute(specifier)) return specifier;
  if (specifier.startsWith('virtual:')) return specifier;
  return specifier.replace(matchDirectives, '$2');
};
