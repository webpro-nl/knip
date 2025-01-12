import { isBuiltin } from 'node:module';
import { DT_SCOPE, PROTOCOL_VIRTUAL } from '../constants.js';
import { isAbsolute, isInNodeModules, toPosix } from './path.js';

export const getPackageNameFromModuleSpecifier = (moduleSpecifier: string) => {
  if (!isStartsLikePackageName(moduleSpecifier)) return;
  const parts = moduleSpecifier.split('/').slice(0, 2);
  return moduleSpecifier.startsWith('@') ? parts.join('/') : parts[0];
};

const lastPackageNameMatch = /(?<=node_modules\/)(@[^/]+\/[^/]+|[^/]+)/g;
export const getPackageNameFromFilePath = (value: string) => {
  if (value.includes('node_modules/.bin/')) return extractBinary(value);
  const match = toPosix(value).match(lastPackageNameMatch);
  if (match) return match[match.length - 1];
  return value;
};

export const getPackageNameFromSpecifier = (specifier: string) =>
  isInNodeModules(specifier) ? getPackageNameFromFilePath(specifier) : getPackageNameFromModuleSpecifier(specifier);

export const isStartsLikePackageName = (specifier: string) => /^(@[a-z0-9._]|[a-z0-9])/i.test(specifier);

export const stripVersionFromSpecifier = (specifier: string) => specifier.replace(/(\S+)@.*/, '$1');

const stripNodeModulesFromPath = (command: string) => command.replace(/(?:\.{0,2}\/)*node_modules\//, '');

export const extractBinary = (command: string) =>
  stripVersionFromSpecifier(
    stripNodeModulesFromPath(command)
      .replace(/^(\.bin\/)/, '')
      .replace(/\$\(npm bin\)\/(\w+)/, '$1') // Removed in npm v9
  );

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
  if (specifier.startsWith(PROTOCOL_VIRTUAL)) return specifier;
  return specifier.replace(matchDirectives, '$2');
};
