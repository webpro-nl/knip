import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { getInputFromAST } from './resolveFromAST.ts';

// https://rollupjs.org/guide/en/#configuration-files

const title = 'Rollup';

const enablers = ['rollup'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['rollup.config.{js,cjs,mjs,ts}'];

const args: Args = {
  alias: { plugin: ['p'] },
  // minimist has an issue with dots like in `--watch.onEnd` so we remap it
  args: (args: string[]) => args.map(arg => (arg.startsWith('--watch.onEnd') ? `--_exec${arg.slice(13)}` : arg)),
  fromArgs: ['_exec'],
  resolve: ['plugin', 'configPlugin'],
};

const resolveFromAST: ResolveFromAST = program => {
  const inputs = getInputFromAST(program);
  return [...inputs].map(id => toProductionEntry(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  args,
  resolveFromAST,
};

export default plugin;
