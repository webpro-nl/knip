import { compact } from '../../util/array.js';
import { getPackageName } from '../../util/modules.js';
import type { ESLintConfig } from './types.js';

export const resolvePluginPackageName = (pluginName: string) => {
  return pluginName.startsWith('@')
    ? pluginName.includes('/')
      ? pluginName
      : `${pluginName}/eslint-plugin`
    : `eslint-plugin-${pluginName}`;
};

export const customResolvePluginPackageNames = (extend: string) => {
  if (extend.includes('/node_modules/')) return getPackageName(extend);
  if (extend.startsWith('/') || extend.startsWith('.')) return;
  if (extend.includes(':')) {
    const pluginName = extend.replace(/^plugin:/, '').replace(/(\/|:).+$/, '');
    if (pluginName === 'eslint') return;
    return resolvePluginPackageName(pluginName);
  }
  // TODO Slippery territory, not sure what we have here
  return extend.includes('eslint') ? getPackageName(extend) : resolvePluginPackageName(extend);
};

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
