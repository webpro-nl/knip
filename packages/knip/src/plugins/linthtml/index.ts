import { basename, isInternal } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { PluginConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://linthtml.vercel.app/

export const NAME = 'LintHTML';

export const PACKAGE_JSON_PATH = 'linthtmlConfig';

/** @public */
export const ENABLERS = ['@linthtml/linthtml'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = [
  '.linthtmlrc',
  '.linthtmlrc.json',
  '.linthtmlrc.yml',
  '.linthtmlrc.{js,cjs}',
  'package.json',
];

const findPluginDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest } = options;

  const localConfig: PluginConfig | undefined =
    basename(configFilePath) === 'package.json' ? manifest.linthtmlConfig : await load(configFilePath);

  if (!localConfig) return [];

  const extensions = [localConfig.extends ?? []]
    .flat()
    .map(extension => (isInternal(extension) ? toEntryPattern(extension) : extension));
  const plugins = [localConfig.plugins ?? []]
    .flat()
    .map(plugin => (isInternal(plugin) ? toEntryPattern(plugin) : plugin));

  return [...extensions, ...plugins];
};

export const findDependencies = timerify(findPluginDependencies);
