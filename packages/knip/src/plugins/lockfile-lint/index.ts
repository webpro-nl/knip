import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { toCosmiconfig } from '../../util/plugin-config.js';
import { hasDependency } from '../../util/plugin.js';

// https://github.com/lirantal/lockfile-lint/blob/main/packages/lockfile-lint/README.md

const title = 'lockfile-lint';

const enablers = ['lockfile-lint'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json', ...toCosmiconfig('lockfile-lint', { additionalExtensions: ['toml'] })];

export default {
  title,
  enablers,
  isEnabled,
  config,
} satisfies Plugin;
