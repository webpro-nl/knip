import parseArgs from 'minimist';
import { tryResolveFilePath } from '../util.js';
import type { Resolver } from '../types.js';

const commands = ['add', 'create', 'init', 'install', 'link', 'pm', 'remove', 'run', 'update'];

export const resolve: Resolver = (_binary, args, { manifestScriptNames, cwd, fromArgs }) => {
  const parsed = parseArgs(args);
  const [command, script] = parsed._;
  if (command === 'run' && manifestScriptNames.has(script)) return [];
  if (commands.includes(command)) return [];
  const filePath = command === 'run' ? script : command;
  const specifier = tryResolveFilePath(cwd, filePath);
  if (specifier) return [specifier];
  return fromArgs(args);
};
