import type { EnablerPatterns } from '#p/types/config.js';
import type { IsPluginEnabled, Plugin } from '#p/types/plugins.js';
import { hasDependency, toCosmiconfig } from '#p/util/plugin.js';

// https://github.com/lirantal/lockfile-lint/blob/main/packages/lockfile-lint/README.md

const title = 'lockfile-lint';

const enablers: EnablerPatterns = ['lockfile-lint'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json', ...toCosmiconfig('lockfile-lint', { additionalExtensions: ['toml'] })];

export default {
  title,
  enablers,
  isEnabled,
  config,
} satisfies Plugin;
