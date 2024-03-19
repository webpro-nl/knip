import { hasDependency } from '#p/util/plugin.js';
import { toEntryPattern } from '#p/util/protocols.js';
import type { IsPluginEnabled, ResolveConfig, ResolveEntryPaths } from '#p/types/plugins.js';
import type { MochaConfig } from './types.js';

// https://mochajs.org/#configuring-mocha-nodejs

const title = 'Mocha';

const enablers = ['mocha'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.mocharc.{js,cjs,json,jsonc,yml,yaml}', 'package.json'];

const entry = ['**/test/*.{js,cjs,mjs}'];

const resolveEntryPaths: ResolveEntryPaths<MochaConfig> = localConfig => {
  const entryPatterns = localConfig.spec ? [localConfig.spec].flat() : [];
  return [...entryPatterns].map(toEntryPattern);
};

const resolveConfig: ResolveConfig<MochaConfig> = localConfig => {
  const require = localConfig.require ? [localConfig.require].flat() : [];
  return [...require].map(toEntryPattern);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveConfig,
  resolveEntryPaths,
} as const;
