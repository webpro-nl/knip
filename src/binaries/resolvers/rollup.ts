import parseArgs from 'minimist';
import { compact } from '../../util/array.js';
import { stripQuotes } from '../../util/string.js';
import { toBinary, tryResolveSpecifiers } from '../util.js';
import type { Resolver } from '../types.js';

export const resolve: Resolver = (binary, args, { cwd, fromArgs }) => {
  // minimist throws when `--watch` is followed by other dotted `--watch.*` arguments
  const safeArgs = args.filter(arg => arg !== '--watch');
  const parsed = parseArgs(safeArgs, { alias: { plugin: 'p' } });
  const watchers = parsed.watch ? fromArgs(Object.values<string>(parsed.watch).map(value => stripQuotes(value))) : [];
  const plugins = parsed.plugin ? tryResolveSpecifiers(cwd, [parsed.plugin].flat()) : [];
  const configPlugins = parsed.configPlugin ? tryResolveSpecifiers(cwd, [parsed.configPlugin].flat()) : [];
  return compact([toBinary(binary), ...watchers, ...plugins, ...configPlugins]);
};
