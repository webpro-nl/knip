import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { _glob } from '../../util/glob.js';
import { type Input, toDependency, toEntry } from '../../util/input.js';
import { extname } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import type { MochaConfig } from './types.js';

// https://mochajs.org/#configuring-mocha-nodejs

const title = 'Mocha';

const enablers = ['mocha'];

const isEnabled: IsPluginEnabled = async ({ cwd, dependencies }) => {
  return hasDependency(dependencies, enablers) || (await _glob({ cwd, patterns: config })).length > 0;
};

const config = ['.mocharc.{js,cjs,json,jsonc,yml,yaml}', 'package.json'];

const entry = ['**/test/*.{js,cjs,mjs}'];

const resolveConfig: ResolveConfig<MochaConfig> = localConfig => {
  const entryPatterns = localConfig.spec ? [localConfig.spec].flat() : entry;
  const require = localConfig.require ? [localConfig.require].flat() : [];

  const inputs: Input[] = [];
  inputs.push(toDependency('mocha'));
  inputs.push(...entryPatterns.map(id => toEntry(id)));
  inputs.push(...require.map(id => (extname(id) ? toEntry(id) : toDependency(id))));
  return inputs;
};

const args = {
  nodeImportArgs: true,
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveConfig,
  args,
} satisfies Plugin;
