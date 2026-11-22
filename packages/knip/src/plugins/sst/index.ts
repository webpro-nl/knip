import { argsFromPositional } from '../../binaries/util.ts';
import type { Args } from '../../types/args.ts';
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

const args: Args = {
  boolean: ['print-logs', 'script'],
  config: ['config'],
  fromArgs: (parsed, args) => {
    if (!wrappers.has(parsed._[0])) return [];
    const command = argsFromPositional(parsed, args, 1);
    return parsed._[0] === 'bind' || parsed._[0] === 'env' ? command.join(' ') : command;
  },
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
