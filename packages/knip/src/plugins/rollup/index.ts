import type { Args } from '../../types/args.js';
import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://rollupjs.org/guide/en/#configuration-files

const title = 'Rollup';

const enablers = ['rollup'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['rollup.config.{js,cjs,mjs,ts}'];

const args: Args = {
  alias: { plugin: ['p'] },
  // minimist has an issue with dots like in `watch.onEnd` so we remap it
  args: (args: string[]) => args.map(arg => (arg.startsWith('--watch.onEnd') ? `--_exec${arg.slice(13)}` : arg)),
  fromArgs: ['_exec'],
  resolve: ['plugin', 'configPlugin'],
};

export default {
  title,
  enablers,
  isEnabled,
  entry,
  args,
} satisfies Plugin;
