import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://www.npmjs.com/package/playwright-test

const title = 'playwright-test';

const enablers = ['playwright-test'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const args = {
  binaries: ['playwright-test'],
  positional: true,
  args: (args: string[]) => args.filter(arg => arg !== 'install' && arg !== 'test'),
  config: true,
};

export default {
  title,
  enablers,
  isEnabled,
  args,
} satisfies Plugin;
