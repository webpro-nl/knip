import { ESLint } from 'eslint';
import { compact } from '../../util/array.js';
import { _firstGlob } from '../../util/glob.js';
import load from '../../util/loader.js';
import { getPackageName } from '../../util/modules.js';
import { timerify } from '../../util/performance.js';
import { resolvePluginPackageName, customResolvePluginPackageNames, getDependenciesFromSettings } from './helpers.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { ESLintConfig } from './types.js';

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => dependencies.has('eslint');

// Current: https://eslint.org/docs/latest/user-guide/configuring/configuration-files
// The only way to reliably resolve legacy configuration is through ESLint itself
// This is also required when something like @rushstack/eslint-patch/modern-module-resolution is used
export const CONFIG_FILE_PATTERNS = ['.eslintrc', '.eslintrc.{js,json}', 'package.json'];

// New: https://eslint.org/docs/latest/user-guide/configuring/configuration-files-new
// We can handle eslint.config.js just like other source code (as dependencies are imported)
export const ENTRY_FILE_PATTERNS = ['eslint.config.js'];

const findESLintDependencies: GenericPluginCallback = async (configFilePath, { cwd, manifest, workspaceConfig }) => {
  if (configFilePath.endsWith('package.json') && !manifest.eslintConfig) return [];

  // Load the configuration to find `extends` (for dependencies) and `overrides` (for calculateConfigForFile samples)
  const config: ESLintConfig = configFilePath.endsWith('package.json')
    ? manifest.eslintConfig
    : await load(configFilePath);

  // Unfortunately we need to resolve root `extends` manually
  const rootExtends = config?.extends ? [config.extends].flat().map(customResolvePluginPackageNames) : [];

  // Find a sample file for each root + overrides config (to feed calculateConfigForFile)
  const patterns = [workspaceConfig.entryFiles, ...(config?.overrides?.map(overrides => overrides.files) ?? [])];
  const samples = await Promise.all(patterns.map(patterns => _firstGlob({ patterns, cwd })));
  const sampleFilePaths = samples
    .filter((filePath): filePath is string | Buffer => typeof filePath !== 'undefined')
    .map(String);

  // Provided with the samples, we can delegate the rest to ESLint
  const engine = new ESLint({ cwd, overrideConfigFile: configFilePath, useEslintrc: false });

  const calculateConfigForFile = async (sampleFile: string): Promise<ESLintConfig> =>
    await engine.calculateConfigForFile(sampleFile);

  const dependencies = await Promise.all(sampleFilePaths.map(calculateConfigForFile)).then(configs =>
    configs.flatMap(config => {
      if (!config) return [];
      const plugins = config.plugins?.map(resolvePluginPackageName) ?? [];
      const parsers = config.parser ? [config.parser] : [];
      const extraParsers = config.parserOptions?.babelOptions?.presets ?? [];
      const settings = config.settings ? getDependenciesFromSettings(config.settings) : [];
      return [...parsers, ...extraParsers, ...plugins, ...settings].map(getPackageName);
    })
  );

  return compact([...rootExtends, ...dependencies.flat()]);
};

export const findDependencies = timerify(findESLintDependencies);
