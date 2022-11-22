import { compact } from '../../util/array.js';
import type { ESLintConfig } from './types.js';

const getImportPluginDependencies = (settings: Record<string, unknown>) => {
  const knownKeys = ['typescript'];
  if (Array.isArray(settings)) return [];
  return Object.keys(settings)
    .filter(key => key !== 'node') // eslint-import-resolver-node is a direct dep of eslint-plugin-import
    .map(key => (knownKeys.includes(key) ? `eslint-import-resolver-${key}` : key));
};

// Super custom: find dependencies of specific ESLint plugins through settings
export const getDependenciesFromSettings = (settings: ESLintConfig['settings'] = {}) => {
  return compact(
    Object.entries(settings).reduce((packageNames, [settingKey, settings]) => {
      if (/^import\/(parsers|resolvers)?/.test(settingKey)) {
        return [...packageNames, ...getImportPluginDependencies(settings)];
      }
      return packageNames;
    }, [] as string[])
  );
};
