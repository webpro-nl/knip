import { compact } from '../../util/array.js';
import { getPackageNameFromModuleSpecifier } from '../../util/modules.js';
import { isInternal, dirname, toAbsolute } from '../../util/path.js';
import { load } from '../../util/plugin.js';
import { _resolve } from '../../util/require.js';
import { fallback } from './fallback.js';
import type { ESLintConfig, OverrideConfig } from './types.js';
import type { PackageJson } from 'type-fest';

type Manifest = PackageJson & { eslintConfig?: ESLintConfig };

const getDependencies = (config: ESLintConfig | OverrideConfig) => {
  const extendsSpecifiers = config.extends ? [config.extends].flat().map(resolveExtendsSpecifier) : [];
  const plugins = config.plugins ? config.plugins.map(resolvePluginPackageName) : [];
  const parser = config.parser;
  const extraParsers = config.parserOptions?.babelOptions?.presets ?? [];
  const settings = config.settings ? getDependenciesFromSettings(config.settings) : [];
  const overrides: string[] = config.overrides ? [config.overrides].flat().flatMap(getDependencies) : [];
  return compact([...extendsSpecifiers, ...plugins, parser, ...extraParsers, ...settings, ...overrides]);
};

type GetDependenciesDeep = (
  configFilePath: string,
  dependencies: Set<string>,
  options: { cwd: string; manifest: Manifest }
) => Promise<Set<string>>;

export const getDependenciesDeep: GetDependenciesDeep = async (configFilePath, dependencies = new Set(), options) => {
  const addAll = (deps: string[] | Set<string>) => deps.forEach(dependency => dependencies.add(dependency));

  const config = configFilePath.endsWith('package.json')
    ? options.manifest.eslintConfig
    : /(\.(jsonc?|ya?ml)|rc)$/.test(configFilePath)
    ? await load(configFilePath)
    : await fallback(configFilePath);

  if (config) {
    if (config.extends) {
      for (const extend of [config.extends].flat()) {
        if (isInternal(extend)) {
          const filePath = toAbsolute(extend, dirname(configFilePath));
          const extendConfigFilePath = _resolve(filePath);
          dependencies.add(extendConfigFilePath);
          addAll(await getDependenciesDeep(extendConfigFilePath, dependencies, options));
        }
      }
    }

    addAll(getDependencies(config));
  }

  return dependencies;
};

const resolvePackageName = (namespace: 'eslint-plugin' | 'eslint-config', pluginName: string) => {
  return pluginName.includes(namespace + '-') || pluginName.endsWith(`/${namespace}`)
    ? pluginName
    : pluginName.startsWith('@')
    ? pluginName.includes('/')
      ? pluginName.replace(/\//, `/${namespace}-`)
      : `${pluginName}/${namespace}`
    : `${namespace}-${pluginName}`;
};

const resolvePluginPackageName = (pluginName: string) => resolvePackageName('eslint-plugin', pluginName);

// TODO Understand how this should actually work, eg:
// plugin:@typescript-eslint/recommended → @typescript-eslint/eslint-plugin
// plugin:@next/next/core-web-vitals → @next/eslint-plugin-next
const resolveExtendsSpecifier = (specifier: string) => {
  if (isInternal(specifier)) return;
  if (/\/eslint-(config|plugin)/.test(specifier)) return specifier;
  const strippedSpecifier = specifier
    .replace(/(^plugin:|:.+$)/, '')
    .replace(/\/(eslint-)?(recommended.*|strict|all)$/, '');
  if (/eslint-(config|plugin)-/.test(strippedSpecifier)) return strippedSpecifier;
  const pluginName = getPackageNameFromModuleSpecifier(strippedSpecifier);
  if (pluginName === 'eslint') return;
  return resolvePackageName(specifier.startsWith('plugin:') ? 'eslint-plugin' : 'eslint-config', pluginName);
};

// Super custom: find dependencies of specific ESLint plugins through settings
const getDependenciesFromSettings = (settings: ESLintConfig['settings'] = {}) => {
  return compact(
    Object.entries(settings).flatMap(([settingKey, settings]) => {
      if (settingKey === 'import/resolver') {
        return (typeof settings === 'string' ? [settings] : Object.keys(settings))
          .filter(key => key !== 'node')
          .map(key => `eslint-import-resolver-${key}`);
      }
      if (settingKey === 'import/parsers') {
        return typeof settings === 'string' ? [settings] : Object.keys(settings);
      }
    })
  );
};
