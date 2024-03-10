import { isInternal } from '#p/util/path.js';
import { hasDependency } from '#p/util/plugin.js';
import { toEntryPattern } from '#p/util/protocols.js';
import type { ResolveConfig, IsPluginEnabled } from '#p/types/plugins.js';
import type { PluginConfig } from './types.js';

// https://linthtml.vercel.app/

const title = 'LintHTML';

const packageJsonPath = 'linthtmlConfig';

const enablers = ['@linthtml/linthtml'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.linthtmlrc', '.linthtmlrc.json', '.linthtmlrc.yml', '.linthtmlrc.{js,cjs}', 'package.json'];

const resolveConfig: ResolveConfig<PluginConfig> = config => {
  const extensions = [config.extends ?? []]
    .flat()
    .map(extension => (isInternal(extension) ? toEntryPattern(extension) : extension));
  const plugins = [config.plugins ?? []].flat().map(plugin => (isInternal(plugin) ? toEntryPattern(plugin) : plugin));

  return [...extensions, ...plugins];
};

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
} as const;
