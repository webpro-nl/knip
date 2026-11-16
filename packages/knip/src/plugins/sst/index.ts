import { argsFrom } from '../../binaries/util.ts';
import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { toConfig } from '../../util/input.ts';
import parseArgs from '../../util/parse-args.ts';
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

const options = { boolean: ['print-logs', 'script'], string: ['config'] };

const args: Args = {
  ...options,
  fromArgs: (parsed, args) => {
    if (!wrappers.has(parsed._[0])) return [];
    const command = parsed._[1] ? argsFrom(args, parsed._[1]) : (parsed['--'] ?? []);
    return command.length === 1 ? command[0].split(' ') : command;
  },
  resolveInputs: (parsed, { args, cwd }) => {
    const command = wrappers.has(parsed._[0]) && parsed._[1] ? argsFrom(args, parsed._[1]) : [];
    const { config } = command.length > 0 ? parseArgs(args.slice(0, -command.length), options) : parsed;
    return config ? [toConfig('sst', config, { dir: cwd })] : [];
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
