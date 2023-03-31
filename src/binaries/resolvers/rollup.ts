import parseArgs from 'minimist';
import { toBinary, tryResolveFilePaths } from '../util.js';
import type { Resolver } from '../types.js';

export const resolve: Resolver = (binary, args, { cwd, fromArgs }) => {
  // minimist throws when `--watch` is followed by other dotted `--watch.*` arguments
  const safeArgs = args.filter(arg => arg !== '--watch');
  const parsed = parseArgs(safeArgs, { alias: { plugin: 'p' } });
  const watchers = parsed.watch ? fromArgs(Object.values(parsed.watch)) : [];
  const plugins = parsed.plugin ? tryResolveFilePaths(cwd, [parsed.plugin].flat()) : [];
  const configPlugins = parsed.configPlugin ? tryResolveFilePaths(cwd, [parsed.configPlugin].flat()) : [];
  return [toBinary(binary), ...watchers, ...plugins, ...configPlugins];
};
