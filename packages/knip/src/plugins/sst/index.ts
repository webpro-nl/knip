import { spawningArgs } from '../../binaries/util.ts';
import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { resolveFromAST } from './resolveFromAST.ts';

// https://v2.sst.dev
// https://sst.dev/docs/
// https://sst.dev/docs/reference/cli/
// https://v2.sst.dev/packages/sst#sst-bind

const title = 'SST';

const enablers = ['sst'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['sst.config.ts'];

const wrappers = new Set(['bind', 'dev', 'env', 'shell']);

const args = {
  args: (args: string[]) => (wrappers.has(args[0]) ? args.slice(1).flatMap(arg => arg.split(' ')) : []),
  boolean: ['print-logs', 'script'],
  fromArgs: spawningArgs,
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveFromAST,
  args,
};

export default plugin;
