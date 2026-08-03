import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { collectPropertyValues } from '../../typescript/ast-helpers.ts';
import { toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://rollupjs.org/guide/en/#configuration-files

const title = 'Rollup';

const enablers = ['rollup'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['rollup.config.{js,cjs,mjs,ts}'];

const args: Args = {
  alias: { plugin: ['p'] },
  string: ['config'],
  config: ['config'],
  // minimist has an issue with dots like in `--watch.onEnd` so we remap it
  // a bare `--config` (no value) means the default config file, so drop it
  args: (args: string[]) =>
    args
      .filter(
        (arg, index) => !(arg === '--config' && (args[index + 1] === undefined || args[index + 1].startsWith('-')))
      )
      .map(arg => (arg.startsWith('--watch.onEnd') ? `--_exec${arg.slice(13)}` : arg)),
  fromArgs: ['_exec'],
  resolve: ['plugin', 'configPlugin'],
};

const resolveFromAST: ResolveFromAST = program =>
  Array.from(collectPropertyValues(program, 'input'), id => toProductionEntry(id));

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  args,
  resolveFromAST,
};

export default plugin;
