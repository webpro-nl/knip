import { spawningArgs } from '../../binaries/util.ts';
import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toModule } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { NycConfig } from './types.ts';

// https://www.npmx.dev/package/nyc

const title = 'nyc';

const enablers = ['nyc'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.nycrc', '.nycrc.{json,yml,yaml}', 'nyc.config.{js,cjs,mjs}', 'package.json'];

const resolveConfig: ResolveConfig<NycConfig> = config => {
  const extend = config?.extends ?? [];
  const requires = config?.require ?? [];
  return [extend, requires].flat().map(id => toModule(id));
};

const commands = new Set(['check-coverage', 'instrument', 'merge', 'report']);

const args: Args = {
  boolean: [
    'all',
    'auto-wrap',
    'babel-cache',
    'cache',
    'check-coverage',
    'clean',
    'compact',
    'complete-copy',
    'delete',
    'eager',
    'es-modules',
    'exclude-after-remap',
    'exclude-node-modules',
    'exit-on-error',
    'hook-require',
    'hook-run-in-context',
    'hook-run-in-this-context',
    'in-place',
    'instrument',
    'per-file',
    'preserve-comments',
    'produce-source-map',
    'show-process-tree',
    'silent',
    'skip-empty',
    'skip-full',
    'source-map',
    'use-spawn-wrap',
  ],
  alias: { all: ['a'], cache: ['c'], silent: ['s'] },
  fromArgs: (parsed, args) => (commands.has(parsed._[0]) ? [] : spawningArgs(parsed, args)),
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  args,
};

export default plugin;
