import { compact } from '../../util/array.js';
import { resolvePluginPackageName, getDependenciesFromSettings } from './helpers.js';
import type { ESLintConfig } from './types.js';

type Options = { cwd: string };

export const fallback = async (configFilePath: string, { cwd }: Options) => {
  // No try/catch, since this plugin is only enabled when eslint itself was found in package.json
  const { ESLint } = await import('eslint');

  const engine = new ESLint({ cwd, overrideConfigFile: configFilePath, useEslintrc: false });

  const jsConfig: ESLintConfig = await engine.calculateConfigForFile('__placeholder__.js');
  const tsConfig: ESLintConfig = await engine.calculateConfigForFile('__placeholder__.ts');
  const tsxConfig: ESLintConfig = await engine.calculateConfigForFile('__placeholder__.tsx');

  const dependencies = [jsConfig, tsConfig, tsxConfig].map(config => {
    if (!config) return [];
    const plugins = config.plugins?.map(resolvePluginPackageName) ?? [];
    const parsers = config.parser ? [config.parser] : [];
    const extraParsers = config.parserOptions?.babelOptions?.presets ?? [];
    const settings = config.settings ? getDependenciesFromSettings(config.settings) : [];
    return [...parsers, ...extraParsers, ...plugins, ...settings];
  });

  return compact(dependencies.flat());
};
