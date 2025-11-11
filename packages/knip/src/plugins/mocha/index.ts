import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { type Input, toDeferResolve, toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { MochaConfig } from './types.js';

// https://mochajs.org/#configuring-mocha-nodejs

const title = 'Mocha';

const enablers = ['mocha'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.mocharc.{js,cjs,json,jsonc,yml,yaml}', 'package.json'];

const entry = ['**/test/*.{js,cjs,mjs}'];

const resolveConfig: ResolveConfig<MochaConfig> = localConfig => {
  const entryPatterns = localConfig.spec ? [localConfig.spec].flat() : entry;
  const require = localConfig.require ? [localConfig.require].flat() : [];

  const inputs: Input[] = [];
  inputs.push(...entryPatterns.map(id => toEntry(id)));
  inputs.push(...require.map(id => toDeferResolve(id)));
  return inputs;
};

const args = {
  nodeImportArgs: true,
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveConfig,
  args,
};

export default plugin;
