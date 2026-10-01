import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import type { Input } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { Entry, LintStagedConfig } from './types.ts';

// https://github.com/okonet/lint-staged

const title = 'lint-staged';

const enablers = ['lint-staged'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = [
  'package.{json,yaml,yml}',
  '.lintstagedrc',
  '.lintstagedrc.{json,yaml,yml,mjs,mts,js,ts,cjs,cts}',
  'lint-staged.config.{mjs,mts,js,ts,cjs,cts}',
];

const resolveEntry = async (value: Entry): Promise<string[]> => {
  if (Array.isArray(value)) return (await Promise.all(value.map(resolveEntry))).flat();
  if (typeof value === 'function') return [await value([])].flat().filter(item => typeof item === 'string');
  return typeof value === 'string' ? [value] : [];
};

const resolveConfig: ResolveConfig<LintStagedConfig> = async (config, options) => {
  if (options.isProduction) return [];

  const cfg = typeof config === 'function' ? await config([]) : config;

  if (!cfg) return [];

  const inputs = new Set<Input>();

  for (const [key, entry] of Object.entries(cfg)) {
    // Skip non-glob keys (comments, metadata, etc.)
    if (key.startsWith('_')) continue;

    const scripts = await resolveEntry(entry);
    for (const id of options.getInputsFromScripts(scripts)) inputs.add(id);
  }

  return Array.from(inputs);
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
