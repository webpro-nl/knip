import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toEntry } from '../../util/input.js';
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
  return [...entryPatterns, ...require].map(id => toEntry(id));
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
