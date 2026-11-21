import { argsFromPositional } from '../../binaries/util.ts';
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
    const command = argsFromPositional(parsed, args, 1);
    return parsed._[0] === 'bind' || parsed._[0] === 'env' ? command.join(' ') : command;
  },
  resolveInputs: (parsed, { args, cwd }) => {
    const index = wrappers.has(parsed._[0]) ? parsed.positionalIndices?.[1] : undefined;
    const { config } = index === undefined ? parsed : parseArgs(args.slice(0, index), options);
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
